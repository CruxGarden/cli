#!/usr/bin/env node
import { program } from 'commander';
import chalk from 'chalk';
import { createStory, createScene, devServer, buildStory, checkStory } from '../lib/commands.js';

program
  .name('sli')
  .description('StoryLink - Interactive Story Development Tool')
  .version('0.1.0');

program
  .command('new')
  .argument('<name>', 'Story name')
  .description('Create a new story')
  .option('-t, --template <template>', 'Story template', 'basic')
  .action(createStory);

program
  .command('scene')
  .description('Scene management')
  .argument('<name>', 'Scene name')
  .option('-p, --parent <parent>', 'Parent scene/sequence')
  .action(createScene);

program
  .command('dev')
  .description('Start development server')
  .option('-p, --port <port>', 'Port number', '3000')
  .action(devServer);

program
  .command('build')
  .description('Build story for distribution')
  .option('-f, --format <format>', 'Output format (html-single, html-static)', 'html-static')
  .option('-o, --out <directory>', 'Output directory', 'dist')
  .action(buildStory);

program
  .command('check')
  .description('Validate story structure')
  .action(checkStory);

program.parse();