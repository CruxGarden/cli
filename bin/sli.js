#!/usr/bin/env node
import { program } from 'commander';
import {
  createStory,
  createLink,
  devServer,
  buildStory,
  validateStory,
} from '../lib/commands.js';

program
  .name('sli')
  .description('Storylink CLI - Interactive Story Development Tool')
  .version('0.1.0');

program
  .command('new')
  .argument('<name>', 'Story name')
  .description('Create a new story')
  .option('-t, --template <template>', 'Story template', 'basic')
  .action(createStory);

program
  .command('link')
  .description('Link management')
  .argument('<name>', 'Link name')
  .option('-p, --parent <parent>', 'Parent link/sequence')
  .action(createLink);

program
  .command('dev')
  .description('Start development server')
  .option('-p, --port <port>', 'Port number', '3000')
  .action(devServer);

program
  .command('build')
  .description('Build story for distribution')
  .option(
    '-f, --format <format>',
    'Output format (html-single, html-static)',
    'html-static',
  )
  .option('-o, --out <directory>', 'Output directory', 'dist')
  .action(buildStory);

program
  .command('check')
  .description('Validate story structure')
  .action(validateStory);

program.parse();
