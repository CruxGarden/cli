import { mkdir, writeFile, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import ora from 'ora';
import { buildHtmlSingle } from './builders/html-single.js';
import { buildHtmlStatic } from './builders/html-static.js';
import { startDevServer } from './dev-server.js';
import { analyzeStory } from './analyzer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function createStory(name, _) {
  const spinner = ora('Creating new story...').start();

  try {
    // Create project structure
    await mkdir(name, { recursive: true });
    await mkdir(join(name, 'links'), { recursive: true });

    // Create story.json
    const config = {
      title: name.replace(/-/g, ' '),
      author: process.env.USER || 'Anonymous',
      version: '1.0.0',
      start: 'opening/index.md',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    };

    await writeFile(join(name, 'story.json'), JSON.stringify(config, null, 2));

    // Create initial link
    const openingDir = join(name, 'links', 'opening');
    await mkdir(openingDir, { recursive: true });

    const linkContent = await readFile(join(__dirname, 'templates', 'beginning.md'), 'utf8');
    await writeFile(join(openingDir, 'index.md'), linkContent);

    spinner.succeed(chalk.green(`Story created - ${name}`));
    console.log(`\nNext:`);
    console.log(chalk.cyan(`  cd ${name}`));
    console.log(chalk.cyan('  sli dev'));
  } catch (error) {
    spinner.fail(chalk.red('Failed to create story'));
    console.error(error);
    process.exit(1);
  }
}

export async function createLink(name, _) {
  const spinner = ora('Creating new link...').start();

  try {
    const linkPath = join('links', name);
    await mkdir(dirname(linkPath), { recursive: true });

    let linkContent = await readFile(join(__dirname, 'templates', 'link.md'), 'utf8');
    linkContent = `# ${name.split('/').pop().replace(/-/g, ' ')}${linkContent}`;

    await writeFile(linkPath + '.md', linkContent);
    spinner.succeed(chalk.green('Link created'));
  } catch (error) {
    spinner.fail(chalk.red('Failed to create link'));
    console.error(error);
    process.exit(1);
  }
}

export async function devServer(options) {
  const spinner = ora('Storylink Dev Server loading...').start();

  try {
    const port = options.port || 3000;
    await startDevServer(port);
    spinner.succeed(
      chalk.green(`Storylink Dev Server running at http://localhost:${port}`),
    );
  } catch (error) {
    spinner.fail(chalk.red('Failed to start server'));
    console.error(error);
    process.exit(1);
  }
}

export async function buildStory(options) {
  const spinner = ora('Building story').start();

  try {
    const format = options.format || 'html-static';
    const outputDir = options.out || 'dist';

    // Ensure output directory exists
    await mkdir(outputDir, { recursive: true });

    switch (format) {
      case 'html-single':
        await buildHtmlSingle(process.cwd(), join(outputDir, 'index.html'));
        break;

      case 'html-static':
        await buildHtmlStatic(process.cwd(), outputDir);
        break;

      default:
        throw new Error(`Unsupported format - ${format}`);
    }

    spinner.succeed(chalk.green(`Built story in ${format} format`));
    console.log(`\nOutput available in: ${outputDir}/`);

    if (format === 'html-static') {
      console.log('\nTo view: open dist/index.html in your browser');
      console.log('To deploy: upload the dist directory to any web host');
    } else if (format === 'html-single') {
      console.log('\nTo view: open dist/index.html in your browser');
      console.log(
        'Note - This is a single HTML file containing your entire story',
      );
    }
  } catch (error) {
    spinner.fail(chalk.red('Failed to build story'));
    console.error(error);
    process.exit(1);
  }
}

export async function validateStory() {
  const spinner = ora('Analyzing story structure').start();

  try {
    const errors = await analyzeStory('links');

    if (errors.length === 0) {
      spinner.succeed(chalk.green('Story structure is valid'));
    } else {
      spinner.fail(chalk.red('Found story structure issues:'));
      errors.forEach((error) => {
        console.log(chalk.yellow(`- ${error}`));
      });
      process.exit(1);
    }
  } catch (error) {
    spinner.fail(chalk.red('Failed to analyze story'));
    console.error(error);
    process.exit(1);
  }
}
