import { mkdir, writeFile, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { buildHtmlSingle } from './builders/html-single.js';
import { buildHtmlStatic } from './builders/html-static.js';
import { startDevServer } from './dev-server.js';
import { analyzeStory } from './analyzer.js';

export async function createStory(name, options) {
    const spinner = ora('Creating new story').start();
    
    try {
        // Create project structure
        await mkdir(name);
        await mkdir(join(name, 'links'));

        // Create story.json
        const config = {
            title: name.replace(/-/g, ' '),
            author: process.env.USER || 'Anonymous',
            version: '1.0.0',
            start: 'opening/index.md',
            created: new Date().toISOString(),
            updated: new Date().toISOString()
        };

        await writeFile(
            join(name, 'story.json'),
            JSON.stringify(config, null, 2)
        );

        // Create initial scene
        const openingDir = join(name, 'links', 'opening');
        await mkdir(openingDir);

        const sceneContent = `# The Beginning

Your story begins here.

- [Look around](examine.md)
- [Move forward](next.md)
`;

        await writeFile(join(openingDir, 'index.md'), sceneContent);

        spinner.succeed(chalk.green('Created new story'));
        console.log(`\nNext steps:`);
        console.log(chalk.cyan(`  cd ${name}`));
        console.log(chalk.cyan('  sli dev'));

    } catch (error) {
        spinner.fail(chalk.red('Failed to create story'));
        console.error(error);
        process.exit(1);
    }
}

export async function createScene(name, options) {
    const spinner = ora('Creating new scene').start();

    try {
        const scenePath = join('links', name);
        await mkdir(dirname(scenePath), { recursive: true });

        const sceneContent = `# ${name.split('/').pop().replace(/-/g, ' ')}

A new scene unfolds.

- [Continue](next.md)
- [Go back](../index.md)
`;

        await writeFile(scenePath + '.md', sceneContent);
        spinner.succeed(chalk.green('Created new scene'));

    } catch (error) {
        spinner.fail(chalk.red('Failed to create scene'));
        console.error(error);
        process.exit(1);
    }
}

export async function devServer(options) {
    const spinner = ora('Starting development server').start();
    
    try {
        const port = options.port || 3000;
        await startDevServer(port);
        spinner.succeed(chalk.green(`Development server running at http://localhost:${port}`));
    } catch (error) {
        spinner.fail(chalk.red('Failed to start development server'));
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
                await buildHtmlSingle(
                    process.cwd(),
                    join(outputDir, 'index.html')
                );
                break;

            case 'html-static':
                await buildHtmlStatic(
                    process.cwd(),
                    outputDir
                );
                break;

            default:
                throw new Error(`Unsupported format: ${format}`);
        }

        spinner.succeed(chalk.green(`Built story in ${format} format`));
        console.log(`\nOutput available in: ${outputDir}/`);
        
        if (format === 'html-static') {
            console.log('\nTo view: open dist/index.html in your browser');
            console.log('To deploy: upload the dist directory to any web host');
        } else if (format === 'html-single') {
            console.log('\nTo view: open dist/index.html in your browser');
            console.log('Note: This is a single HTML file containing your entire story');
        }

    } catch (error) {
        spinner.fail(chalk.red('Failed to build story'));
        console.error(error);
        process.exit(1);
    }
}

export async function checkStory() {
    const spinner = ora('Checking story structure').start();

    try {
        const errors = await analyzeStory('links');
        
        if (errors.length === 0) {
            spinner.succeed(chalk.green('Story structure is valid'));
        } else {
            spinner.fail(chalk.red('Found story structure issues:'));
            errors.forEach(error => {
                console.log(chalk.yellow(`- ${error}`));
            });
            process.exit(1);
        }

    } catch (error) {
        spinner.fail(chalk.red('Failed to check story'));
        console.error(error);
        process.exit(1);
    }
}