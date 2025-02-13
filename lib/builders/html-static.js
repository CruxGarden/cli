import { readFile, writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkHtml from "remark-html";
import remarkGfm from "remark-gfm";

const STYLES = `
body {
    font-family: system-ui, -apple-system, sans-serif;
    line-height: 1.6;
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    background: #f5f5f5;
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
a {
    color: #2563eb;
    text-decoration: none;
}
a:hover {
    text-decoration: underline;
}
a.visited {
    color: #6b7280;
}
`;

const SCRIPTS = `
// Track visited scenes
let visited = JSON.parse(localStorage.getItem('visited') || '[]');
let currentPath = window.location.pathname;

// Add current scene to visited
if (!visited.includes(currentPath)) {
    visited.push(currentPath);
    localStorage.setItem('visited', JSON.stringify(visited));
}

// Update UI to show visited scenes
document.querySelectorAll('a').forEach(link => {
    if (visited.includes(link.pathname)) {
        link.classList.add('visited');
    }
});

// Update path display
document.querySelector('.path').textContent = 
    decodeURIComponent(currentPath.replace('/scenes/', ''));
`;

export async function buildHtmlStatic(projectPath, outputPath) {
  try {
    // Read story config
    const storyConfig = JSON.parse(
      await readFile(join(projectPath, "story.json"), "utf8"),
    );

    // Create output directories
    await mkdir(outputPath, { recursive: true });
    await mkdir(join(outputPath, "styles"));
    await mkdir(join(outputPath, "scripts"));
    await mkdir(join(outputPath, "scenes"));

    // Write CSS and JS
    await writeFile(join(outputPath, "styles", "main.css"), STYLES);
    await writeFile(join(outputPath, "scripts", "story.js"), SCRIPTS);

    // Create landing page
    await createLandingPage(outputPath, storyConfig);

    // Process all scenes
    await processScenes(projectPath, outputPath, storyConfig);
  } catch (error) {
    console.error("Failed to build static site:", error);
    throw error;
  }
}

async function createLandingPage(outputPath, storyConfig) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${storyConfig.title}</title>
    <link rel="stylesheet" href="styles/main.css">
</head>
<body>
    <div class="story-container">
        <h1>${storyConfig.title}</h1>
        <p>by ${storyConfig.author}</p>
        <div class="choices">
            <a href="scenes/${storyConfig.start}">Begin the story</a>
        </div>
    </div>
</body>
</html>`;

  await writeFile(join(outputPath, "index.html"), html);
}

async function processScenes(projectPath, outputPath) {
  const scenesDir = join(projectPath, "scenes");
  await processDirectory(scenesDir, outputPath);
}

async function processDirectory(dir, outputPath, baseDir = "") {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = join(dir, entry.name);
    const relativePath = join(baseDir, entry.name);

    if (entry.isDirectory()) {
      const outDir = join(outputPath, "scenes", relativePath);
      await mkdir(outDir, { recursive: true });
      await processDirectory(sourcePath, outputPath, relativePath);
    } else if (entry.name.endsWith(".md")) {
      await convertScene(sourcePath, outputPath, relativePath);
    }
  }
}

async function convertScene(sourcePath, outputPath, relativePath) {
  // Read markdown content
  const markdown = await readFile(sourcePath, "utf8");

  // Convert to HTML
  const html = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkHtml)
    .process(markdown);

  // Calculate relative path to root for assets
  const depth = relativePath.split("/").length;
  const rootPath = "../".repeat(depth);

  // Create full HTML page
  const pageHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>StoryLink</title>
    <link rel="stylesheet" href="${rootPath}../styles/main.css">
</head>
<body>
    <div class="toolbar">
        <button class="back-button" onclick="history.back()">← Back</button>
        <div class="path"></div>
    </div>
    <div class="story-container">
        ${html}
    </div>
    <script src="${rootPath}../scripts/story.js"></script>
</body>
</html>`;

  // Write to output directory
  const outputFile = join(
    outputPath,
    "scenes",
    relativePath.replace(".md", ".html"),
  );
  await writeFile(outputFile, pageHtml);
}

async function readdir(dir, options) {
  try {
    return await readdir(dir, options);
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
    return [];
  }
}
