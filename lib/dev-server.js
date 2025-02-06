import express from 'express';
import { WebSocketServer } from 'ws';
import { readFile } from 'fs/promises';
import { join } from 'path';
import chokidar from 'chokidar';
import { analyzeStory } from './analyzer.js';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkHtml from 'remark-html';
import remarkGfm from 'remark-gfm';

const DEV_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>StoryLink Development</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            line-height: 1.6;
            margin: 0;
            display: grid;
            grid-template-columns: minmax(300px, 800px) 300px;
            min-height: 100vh;
        }
        #main {
            padding: 2rem;
            background: #f5f5f5;
        }
        #sidebar {
            background: #fff;
            border-left: 1px solid #eee;
            padding: 1rem;
            overflow-y: auto;
        }
        .story-container {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .path {
            font-size: 0.9rem;
            color: #666;
            margin-bottom: 1rem;
        }
        .toolbar {
            margin-bottom: 1rem;
            padding: 0.5rem;
            background: #fff;
            border-radius: 4px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .back-button {
            padding: 0.5rem 1rem;
            background: #f0f0f0;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        .back-button:hover {
            background: #e0e0e0;
        }
        #story a {
            color: #2563eb;
            text-decoration: none;
        }
        #story a:hover {
            text-decoration: underline;
        }
        #story a.visited {
            color: #6b7280;
        }
        .error {
            color: #dc2626;
            padding: 0.5rem;
            margin: 0.5rem 0;
            background: #fee2e2;
            border-radius: 4px;
        }
        #validation {
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid #eee;
        }
    </style>
</head>
<body>
    <div id="main">
        <div class="toolbar">
            <button class="back-button" onclick="history.back()">← Back</button>
            <div class="path"></div>
        </div>
        <div class="story-container" id="story"></div>
    </div>
    <div id="sidebar">
        <h3>Story Information</h3>
        <div id="info"></div>
        <div id="validation"></div>
    </div>
    <script>
        // Setup WebSocket
        const ws = new WebSocket('ws://' + location.host);
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'reload') {
                loadScene(window.currentScene);
                updateValidation(data.validation);
            }
        };

        // Track visited scenes
        let visited = new Set(JSON.parse(localStorage.getItem('visited') || '[]'));
        let currentScene = '';

        async function loadStoryInfo() {
            const response = await fetch('/story.json');
            const info = await response.json();
            document.getElementById('info').innerHTML = \`
                <p><strong>Title:</strong> \${info.title}</p>
                <p><strong>Author:</strong> \${info.author}</p>
                <p><strong>Version:</strong> \${info.version}</p>
            \`;
            return info;
        }

        async function loadScene(scenePath) {
            try {
                window.currentScene = scenePath;
                const response = await fetch('/scenes/' + scenePath);
                if (!response.ok) throw new Error('Scene not found');
                
                const markdown = await response.text();
                document.getElementById('story').innerHTML = markdown;

                // Update path display
                document.querySelector('.path').textContent = 
                    decodeURIComponent(scenePath);

                // Track visited
                visited.add(scenePath);
                localStorage.setItem('visited', JSON.stringify([...visited]));

                // Handle links
                document.querySelectorAll('#story a').forEach(link => {
                    const href = link.getAttribute('href');
                    if (href) {
                        if (visited.has(resolveScenePath(href))) {
                            link.classList.add('visited');
                        }
                        link.addEventListener('click', (e) => {
                            e.preventDefault();
                            const nextScene = resolveScenePath(href);
                            loadScene(nextScene);
                            history.pushState(
                                { scene: nextScene },
                                '',
                                '?scene=' + encodeURIComponent(nextScene)
                            );
                        });
                    }
                });

            } catch (error) {
                console.error('Failed to load scene:', error);
                document.getElementById('story').innerHTML = 
                    \`<p class="error">Error loading scene: \${error.message}</p>\`;
            }
        }

        function resolveScenePath(href) {
            if (href.startsWith('/')) return href.slice(1);
            if (href.startsWith('../')) {
                const parts = currentScene.split('/');
                parts.pop(); // Remove current file
                parts.pop(); // Go up one directory
                return parts.join('/') + '/' + href.slice(3);
            }
            return dirname(currentScene) + '/' + href;
        }

        function dirname(path) {
            return path.split('/').slice(0, -1).join('/');
        }

        function updateValidation(validation) {
            const container = document.getElementById('validation');
            if (validation.errors && validation.errors.length > 0) {
                container.innerHTML = \`
                    <h3>Validation Issues</h3>
                    \${validation.errors.map(error => \`
                        <p class="error">\${error}</p>
                    \`).join('')}
                \`;
            } else {
                container.innerHTML = '<p>✓ Story structure is valid</p>';
            }
        }

        // Handle browser navigation
        window.onpopstate = (event) => {
            if (event.state && event.state.scene) {
                loadScene(event.state.scene);
            }
        };

        // Initial load
        (async () => {
            const info = await loadStoryInfo();
            const urlParams = new URLSearchParams(window.location.search);
            const startScene = urlParams.get('scene') || info.start;
            loadScene(startScene);
        })();
    </script>
</body>
</html>`;

export async function startDevServer(port) {
    const app = express();

    // Add specific route for scenes before static middleware
    app.get('/scenes/*', async (req, res) => {
        try {
            const content = await readFile(join(process.cwd(), req.path), 'utf8');
            
            // Process markdown to HTML
            const html = await unified()
                .use(remarkParse)
                .use(remarkGfm)
                .use(remarkHtml)
                .process(content);
                
            res.send(String(html));
        } catch (error) {
            res.status(404).send(`Scene not found: ${error.message}`);
        }
    });

    // Serve static files (for everything else)
    app.use(express.static(process.cwd()));

    // Serve dev interface
    app.get('/', (req, res) => {
        res.send(DEV_HTML);
    });

    // Setup WebSocket for live reload
    const server = app.listen(port);
    const wss = new WebSocketServer({ server });

    // Watch for file changes
    const watcher = chokidar.watch(['scenes/**/*.md', 'story.json']);
    watcher.on('change', async (path) => {
        console.log(`File changed: ${path}`);
        
        // Validate story
        const validation = { errors: await analyzeStory('scenes') };

        // Notify clients
        wss.clients.forEach(client => {
            client.send(JSON.stringify({
                type: 'reload',
                path,
                validation
            }));
        });
    });

    return server;
}