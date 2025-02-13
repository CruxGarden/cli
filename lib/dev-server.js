import express from 'express';
import { WebSocketServer } from 'ws';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import chokidar from 'chokidar';
import { analyzeStory } from './analyzer.js';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkHtml from 'remark-html';
import remarkGfm from 'remark-gfm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function startDevServer(port) {
  const app = express();

  // Add specific route for scenes before static middleware
  app.get('/links/*', async (req, res) => {
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
      res.status(404).send(`Link not found - ${error.message}`);
    }
  });

  // Serve static files (for everything else)
  app.use(express.static(process.cwd()));

  // Serve dev interface
  app.get('/', async (_, res) => {
    try {
      const html = await readFile(
        join(__dirname, 'templates', 'dev-server.html'),
        'utf8',
      );
      res.send(html);
    } catch (error) {
      console.error(`Error reading template file - ${error.message}`);
      res.status(500).send('Server Error - unable to load the template file');
    }
  });

  // Setup WebSocket for live reload
  const server = app.listen(port);
  const wss = new WebSocketServer({ server });
  wss.on('connection', (ws) => {
    ws.on('error', (error) => {
      console.error(`WebSocket error - ${error.message}`);
    });
  });

  // Watch for file changes
  const watcher = chokidar.watch(['links/**/*.md', 'story.json']);
  watcher.on('change', async (path) => {
    console.log(`File changed - ${path}`);

    // Validate story
    const validation = { errors: await analyzeStory('links') };

    // Notify clients
    wss.clients.forEach((client) => {
      client.send(
        JSON.stringify({
          type: 'reload',
          path,
          validation,
        }),
      );
    });
  });

  return server;
}
