import { readFile, readdir } from 'fs/promises';
import { join, dirname, relative } from 'path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { visit } from 'unist-util-visit';

const DO_LINK_CHECK = false;

export async function analyzeStory(scenesDir) {
  const errors = [];
  const scenes = new Map();
  const links = new Map();

  try {
    // Get all markdown files
    const files = await getMarkdownFiles(scenesDir);

    // Parse each file
    for (const file of files) {
      const content = await readFile(file, 'utf8');
      const ast = await unified()
        .use(remarkParse)
        .use(remarkGfm)
        .parse(content);

      // Find all links
      visit(ast, 'link', (node) => {
        const source = file;
        const target = join(dirname(file), node.url);
        if (!links.has(source)) {
          links.set(source, []);
        }
        links.get(source).push({
          text: node.children[0].value,
          target,
        });
      });

      scenes.set(file, true);
    }

    // Validate links
    for (const [source, fileLinks] of links) {
      for (const link of fileLinks) {
        const relativePath = relative(scenesDir, link.target);
        if (!scenes.has(link.target) && !link.target.includes('[END]')) {
          errors.push(
            `Broken link in ${relative(scenesDir, source)}: ` +
              `'${link.text}' -> ${relativePath}`,
          );
        }
      }
    }

    // Check for scenes without links
    if (DO_LINK_CHECK) {
      for (const scene of scenes.keys()) {
        if (!links.has(scene)) {
          const relativePath = relative(scenesDir, scene);
          if (!relativePath.includes('index.md')) {
            errors.push(`Scene has no choices: ${relativePath}`);
          }
        }
      }
    }

    return errors;
  } catch (error) {
    console.error('Analysis failed:', error);
    return [`Analysis failed: ${error.message}`];
  }
}

async function getMarkdownFiles(dir) {
  const files = [];

  async function scan(directory) {
    const entries = await readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        await scan(path);
      } else if (entry.name.endsWith('.md')) {
        files.push(path);
      }
    }
  }

  await scan(dir);
  return files;
}
