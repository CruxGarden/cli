#!/usr/bin/env node
import { program } from 'commander';
import {
  startStack,
  stopStack,
  restartStack,
  statusStack,
  logsStack,
  cleanStack,
  connectDb,
  connectRedis,
} from '../lib/commands.js';

program
  .name('crux')
  .description('Crux Garden CLI - Local API Development Environment')
  .version('0.1.0');

program
  .command('start')
  .description('Start the Crux Garden API stack (postgres, redis, api)')
  .option('--db-only', 'Start only database services (postgres, redis)')
  .action(startStack);

program
  .command('stop')
  .description('Stop the Crux Garden API stack')
  .action(stopStack);

program
  .command('restart')
  .description('Restart the Crux Garden API stack')
  .action(restartStack);

program
  .command('status')
  .description('Show status of running services')
  .action(statusStack);

program
  .command('logs')
  .description('Show logs from the API service')
  .option('-f, --follow', 'Follow log output')
  .action(logsStack);

program
  .command('clean')
  .description('Stop and remove all containers, volumes, and images')
  .action(cleanStack);

program
  .command('db:connect')
  .description('Connect to the PostgreSQL database')
  .action(connectDb);

program
  .command('redis:connect')
  .description('Connect to Redis')
  .action(connectRedis);

program.parse();
