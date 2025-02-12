import { readFile, readdir, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkHtml from 'remark-html';
import remarkGfm from 'remark-gfm';

export async function buildHtmlSingle(projectPath, outputPath) {
    // Read story config
    const storyConfig = JSON.parse(
        await readFile(join(projectPath, 'story.json'), 'utf8')
    );

    // Get all scenes
    const scenes = {};
    await loadScenes(join(projectPath, 'scenes'), scenes);

    // Convert scenes to HTML
    const htmlScenes = {};
    for (const [path, content] of Object.entries(scenes)) {
        const html = await unified()
            .use(remarkParse)
            .use(remarkGfm)
            .use(remarkHtml)
            .process(content);
        htmlScenes[path] = String(html);
    }

    // Create the standalone HTML file
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${storyConfig.title}</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            background: #f5f5f5;
        }
        #story {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        #path {
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
        a {
            color: #2563eb;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="toolbar">
        <button class="back-button" onclick="history.back()">← Back</button>
        <div>
            <h1>${storyConfig.title}</h1>
            <p>by ${storyConfig.author}</p>
        </div>
    </div>
    
    <div id="path"></div>
    <div id="story"></div>

    <script>
    // Story data
    const scenes = ${JSON.stringify(htmlScenes)};
    const config = ${JSON.stringify(storyConfig)};
    
    // Track story state
    let currentScene = '';
    let visitedScenes = new Set();
    
    function loadScene(scenePath) {
    console.log('Loading scene:', scenePath);
    console.log('Current Scene:', currentScene);
    console.log('Available scenes:', Object.keys(scenes));
    console.log('Content for scene:', scenes[scenePath]);
        // Update current scene
        currentScene = scenePath;
        visitedScenes.add(scenePath);
        
        // Show scene content
        const content = scenes[scenePath];
        if (!content) {
            document.getElementById('story').innerHTML = 
                '<p style="color: red">Scene not found: ' + scenePath + '</p>';
            return;
        }
        
        document.getElementById('story').innerHTML = content;
        
        // Update path display
        document.getElementById('path').textContent = 
            decodeURIComponent(scenePath);
        
        // Handle links
        document.querySelectorAll('#story a').forEach(link => {
            const href = link.getAttribute('href');
            if (href) {
                if (visitedScenes.has(resolveScenePath(href))) {
                    link.style.color = '#6b7280';
                }
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const nextScene = resolveScenePath(href);
                    loadScene(nextScene);
                    // Add to browser history
                    history.pushState(
                        { scene: nextScene },
                        '',
                        '?scene=' + encodeURIComponent(nextScene)
                    );
                });
            }
        });
        
        // Scroll to top
        window.scrollTo(0, 0);
    }
    
function resolveScenePath(href) {
    console.log('Resolving href:', href);
    console.log('From current scene:', currentScene);
    
    // Remove the current directory prefix if it's already in the path
    const targetPath = href.replace(/^[^/]+\\//, '');
    console.log('Normalized path:', targetPath);
    
    return targetPath;
}
    
    function dirname(path) {
        return path.split('/').slice(0, -1).join('/');
    }
    
    // Handle browser navigation
    window.onpopstate = (event) => {
        if (event.state && event.state.scene) {
            loadScene(event.state.scene);
        }
    };
    
    // Initial load
    const urlParams = new URLSearchParams(window.location.search);
    const startScene = urlParams.get('scene') || config.start;
    loadScene(startScene);
    </script>
</body>
</html>`;

    // Write the output file
    await writeFile(outputPath, html);
}

async function loadScenes(dir, scenes, base = '') {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
        const path = join(dir, entry.name);
        const relativePath = join(base, entry.name);
        
        if (entry.isDirectory()) {
            await loadScenes(path, scenes, relativePath);
        } else if (entry.name.endsWith('.md')) {
            scenes[relativePath] = await readFile(path, 'utf8');
        }
    }
}