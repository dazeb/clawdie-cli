#!/usr/bin/env node

import { Command } from 'commander';
import React from 'react';
import chalk from 'chalk';
import * as p from '@clack/prompts';
import gradient from 'gradient-string';
import boxen from 'boxen';
import ora from 'ora';
import { render } from 'ink';
import open from 'open';
import { setTimeout as sleep } from 'node:timers/promises';
import { loadConfig, saveConfig, clearConfig } from './config';
import { ClawdieAPI } from './api';
import { NexusDashboard } from './NexusDashboard';

const program = new Command();

const BRAND_COLOR = '#FFFFFF';
const SECONDARY_COLOR = '#666666';

const logoGradient = gradient(['#FFFFFF', '#444444', '#FFFFFF']);

const renderHeader = () => {
  const title = `
   █▀▀ █   ▄▀█ █   █ █ █▀▄ █ █▀▀
   █   █   █▀█ █▄▄ █▄█ █▄▀ █ █▀▀
    `;
  console.log(gradient(['#FFFFFF', '#888888', '#444444', '#888888', '#FFFFFF'])(title));
  console.log(chalk.hex(SECONDARY_COLOR)('  ───  AGENT INFRASTRUCTURE ORCHESTRATOR v1.0.0  ─── \n'));
};

program.name('clawdie').description('Clawdie Agent Management CLI').version('1.0.0');

// --- LOGIN COMMAND ---
program
  .command('login')
  .description('Authenticate with Clawdie API')
  .action(async () => {
    renderHeader();

    p.intro(chalk.bgWhite.black(' AUTHENTICATION '));

    const config = loadConfig();
    const loginFlow = await p.group(
      {
        email: () => p.text({ message: 'Email:', placeholder: 'user@example.com' }),
        password: () => p.password({ message: 'Password:' }),
      },
      {
        onCancel: () => {
          p.cancel('Authentication aborted.');
          process.exit(0);
        },
      }
    );

    const s = p.spinner();
    s.start('Connecting to Clawdie API...');

    try {
      const api = new ClawdieAPI(config);
      const { user, cookie } = await api.login(loginFlow.email, loginFlow.password);

      config.cookie = cookie;
      config.user = user;
      saveConfig(config);

      s.stop('✔ Authentication successful');

      p.note(
        chalk.white(`Welcome back, ${user.name || user.email}!\n`) +
        chalk.hex(SECONDARY_COLOR)(`User ID: ${user.id}`),
        'Identity'
      );

      p.outro(chalk.green('Ready to orchestrate.'));
    } catch (error) {
      s.stop(chalk.red('✗ Authentication failed'));
      p.note(
        chalk.red(error instanceof Error ? error.message : 'Unknown error'),
        'Error'
      );
      process.exit(1);
    }
  });

// --- LOGOUT COMMAND ---
program
  .command('logout')
  .description('Logout and clear authentication')
  .action(async () => {
    renderHeader();

    p.intro(chalk.bgWhite.black(' LOGOUT '));

    const config = loadConfig();

    if (!config.cookie) {
      p.note(chalk.yellow('Not logged in'), 'Status');
      p.outro(chalk.gray('No session to clear.'));
      return;
    }

    const s = p.spinner();
    s.start('Clearing session...');

    try {
      const api = new ClawdieAPI(config);
      await api.logout();
      clearConfig();
      s.stop('✔ Logged out');
      p.outro(chalk.green('Session cleared.'));
    } catch (error) {
      s.stop(chalk.red('✗ Logout failed'));
      p.note(chalk.red(error instanceof Error ? error.message : 'Unknown error'), 'Error');
      process.exit(1);
    }
  });

// --- DEPLOY COMMAND ---
program
  .command('deploy')
  .description('Deploy a new agent via checkout')
  .action(async () => {
    renderHeader();

    p.intro(chalk.bgWhite.black(' AGENT DEPLOYMENT '));

    const config = loadConfig();

    if (!config.cookie) {
      p.note(chalk.red('Not authenticated'), 'Error');
      p.outro(chalk.red('Please run: clawdie login'));
      process.exit(1);
    }

    const form = await p.group(
      {
        telegramToken: () => p.text({ message: 'Telegram Bot Token:', placeholder: '123456789:ABCDefGHijKlmnoPQRstUVwxyz' }),
        region: () => p.select({
          message: 'Deploy Region:',
          options: [
            { value: 'eu', label: 'EU (Europe)' },
            { value: 'us', label: 'US (United States)' },
          ],
        }),
        plan: () => p.select({
          message: 'Billing Plan:',
          options: [
            { value: 'monthly', label: 'Monthly' },
            { value: 'yearly', label: 'Yearly' },
          ],
        }),
      },
      {
        onCancel: () => {
          p.cancel('Deployment aborted.');
          process.exit(0);
        },
      }
    );

    const s = p.spinner();
    s.start('Creating checkout session...');

    try {
      const api = new ClawdieAPI(config);
      const checkout = await api.createCheckout(form.telegramToken, form.region as 'eu' | 'us', form.plan as 'monthly' | 'yearly');

      s.stop('✔ Checkout session created');

      p.note(
        chalk.white(`Opening payment page...\n`) +
        chalk.hex(SECONDARY_COLOR)(`Session ID: ${checkout.sessionId}`),
        'Checkout'
      );

      await sleep(1000);

      // Open browser
      try {
        await open(checkout.checkoutUrl);
        p.outro(chalk.green('Payment page opened in your browser.'));
      } catch (err) {
        p.note(
          chalk.white(`Checkout URL: ${chalk.cyan.underline(checkout.checkoutUrl)}`),
          'Manual Checkout'
        );
        p.outro(chalk.gray('Open the link above to complete payment.'));
      }
    } catch (error) {
      s.stop(chalk.red('✗ Deployment failed'));
      p.note(chalk.red(error instanceof Error ? error.message : 'Unknown error'), 'Error');
      process.exit(1);
    }
  });

// --- AGENTS COMMAND ---
program
  .command('agents')
  .alias('ls')
  .description('List all agents')
  .action(async () => {
    renderHeader();

    p.intro(chalk.bgWhite.black(' AGENTS '));

    const config = loadConfig();

    if (!config.cookie) {
      p.note(chalk.red('Not authenticated'), 'Error');
      p.outro(chalk.red('Please run: clawdie login'));
      process.exit(1);
    }

    const s = p.spinner();
    s.start('Fetching agents...');

    try {
      const api = new ClawdieAPI(config);
      const agents = await api.listAgents();

      s.stop(`✔ Found ${agents.length} agent(s)`);

      if (agents.length === 0) {
        p.note(chalk.yellow('No agents deployed yet'), 'Status');
        p.outro(chalk.gray('Run: clawdie deploy'));
        return;
      }

      console.log('\n');

      const headers = '  ' + 'ID'.padEnd(20) + 'NAME'.padEnd(25) + 'REGION'.padEnd(10) + 'STATUS'.padEnd(15) + 'UPTIME';
      console.log(chalk.bold.white(headers));
      console.log(chalk.gray('  ' + '─'.repeat(headers.length - 2)));

      agents.forEach(agent => {
        const createdTime = new Date(agent.createdAt).getTime();
        const uptime = Math.floor((Date.now() - createdTime) / (1000 * 60 * 60 * 24));
        const statusColor =
          agent.status === 'ONLINE' ? chalk.green :
          agent.status === 'OFFLINE' ? chalk.gray :
          agent.status === 'DEGRADED' ? chalk.yellow :
          agent.status === 'ERROR' ? chalk.red : chalk.cyan;

        console.log(
          '  ' +
          agent.id.substring(0, 19).padEnd(20) +
          agent.name.substring(0, 24).padEnd(25) +
          agent.region.toUpperCase().padEnd(10) +
          statusColor(agent.status).padEnd(15) +
          chalk.hex(SECONDARY_COLOR)(`${uptime}d`)
        );
      });

      console.log();
      p.outro(chalk.hex(SECONDARY_COLOR)(`Total: ${agents.length} agent(s)`));
    } catch (error) {
      s.stop(chalk.red('✗ Failed to fetch agents'));
      p.note(chalk.red(error instanceof Error ? error.message : 'Unknown error'), 'Error');
      process.exit(1);
    }
  });

// --- STATUS COMMAND ---
program
  .command('status [id]')
  .description('View agent status and metrics')
  .action(async (agentId?: string) => {
    renderHeader();

    p.intro(chalk.bgWhite.black(' STATUS '));

    const config = loadConfig();

    if (!config.cookie) {
      p.note(chalk.red('Not authenticated'), 'Error');
      p.outro(chalk.red('Please run: clawdie login'));
      process.exit(1);
    }

    const api = new ClawdieAPI(config);

    const s = p.spinner();
    s.start('Fetching agents...');

    try {
      const agents = await api.listAgents();

      if (!agentId) {
        s.stop(`✔ Fetched ${agents.length} agent(s)`);

        if (agents.length === 0) {
          p.note(chalk.yellow('No agents deployed'), 'Status');
          return;
        }

        console.log('\n');

        agents.forEach(agent => {
          const statusColor =
            agent.status === 'ONLINE' ? chalk.green :
            agent.status === 'OFFLINE' ? chalk.gray :
            agent.status === 'DEGRADED' ? chalk.yellow :
            agent.status === 'ERROR' ? chalk.red : chalk.cyan;

          console.log(chalk.bold(agent.name));
          console.log('  ID:     ' + chalk.cyan(agent.id));
          console.log('  Status: ' + statusColor(agent.status));
          console.log('  Region: ' + chalk.white(agent.region));
          if (agent.coolifyUrl) console.log('  Coolify: ' + chalk.underline(agent.coolifyUrl));
          console.log();
        });

        p.outro(chalk.hex(SECONDARY_COLOR)('Status check complete.'));
        return;
      }

      s.start(`Fetching agent ${agentId}...`);

      const agent = await api.getAgent(agentId);
      const metrics = await api.getAgentMetrics(agentId);

      s.stop('✔ Status retrieved');

      const statusColor =
        agent.status === 'ONLINE' ? chalk.green :
        agent.status === 'OFFLINE' ? chalk.gray :
        agent.status === 'DEGRADED' ? chalk.yellow :
        agent.status === 'ERROR' ? chalk.red : chalk.cyan;

      console.log(
        boxen(
          chalk.bold(agent.name) + '\n\n' +
          chalk.white('ID:       ') + chalk.cyan(agent.id) + '\n' +
          chalk.white('Status:   ') + statusColor(agent.status) + '\n' +
          chalk.white('Region:   ') + chalk.white(agent.region) + '\n' +
          chalk.white('Created:  ') + chalk.hex(SECONDARY_COLOR)(new Date(agent.createdAt).toLocaleDateString()) + '\n\n' +
          chalk.bold('Metrics:') + '\n' +
          chalk.white('  CPU:    ') + chalk.cyan(metrics.cpu.toFixed(1) + '%') + '\n' +
          chalk.white('  Memory: ') + chalk.cyan(metrics.memory.toFixed(1) + '%') + '\n' +
          chalk.white('  Uptime: ') + chalk.cyan(Math.floor(metrics.uptime / 3600) + ' hours'),
          {
            padding: 1,
            margin: 1,
            borderStyle: 'double',
            borderColor: 'white',
            title: ' AGENT STATUS ',
            titleAlignment: 'center',
          }
        )
      );

      p.outro(chalk.hex(SECONDARY_COLOR)('All systems nominal.'));
    } catch (error) {
      s.stop(chalk.red('✗ Status check failed'));
      p.note(chalk.red(error instanceof Error ? error.message : 'Unknown error'), 'Error');
      process.exit(1);
    }
  });

// --- RESTART COMMAND ---
program
  .command('restart <id>')
  .description('Restart an agent')
  .action(async (agentId: string) => {
    renderHeader();

    p.intro(chalk.bgWhite.black(' RESTART '));

    const config = loadConfig();

    if (!config.cookie) {
      p.note(chalk.red('Not authenticated'), 'Error');
      p.outro(chalk.red('Please run: clawdie login'));
      process.exit(1);
    }

    const s = p.spinner();
    s.start(`Restarting agent ${agentId}...`);

    try {
      const api = new ClawdieAPI(config);
      await api.restartAgent(agentId);
      s.stop('✔ Agent restarted');
      p.outro(chalk.green('Agent is restarting.'));
    } catch (error) {
      s.stop(chalk.red('✗ Restart failed'));
      p.note(chalk.red(error instanceof Error ? error.message : 'Unknown error'), 'Error');
      process.exit(1);
    }
  });

// --- STOP COMMAND ---
program
  .command('stop <id>')
  .description('Stop an agent')
  .action(async (agentId: string) => {
    renderHeader();

    p.intro(chalk.bgWhite.black(' STOP '));

    const config = loadConfig();

    if (!config.cookie) {
      p.note(chalk.red('Not authenticated'), 'Error');
      p.outro(chalk.red('Please run: clawdie login'));
      process.exit(1);
    }

    const s = p.spinner();
    s.start(`Stopping agent ${agentId}...`);

    try {
      const api = new ClawdieAPI(config);
      await api.stopAgent(agentId);
      s.stop('✔ Agent stopped');
      p.outro(chalk.green('Agent has been stopped.'));
    } catch (error) {
      s.stop(chalk.red('✗ Stop failed'));
      p.note(chalk.red(error instanceof Error ? error.message : 'Unknown error'), 'Error');
      process.exit(1);
    }
  });

// --- LOGS COMMAND ---
program
  .command('logs <id>')
  .description('View agent logs')
  .option('--follow', 'Follow logs (poll every 3s)')
  .action(async (agentId: string, options: any) => {
    renderHeader();

    p.intro(chalk.bgWhite.black(' LOGS '));

    const config = loadConfig();

    if (!config.cookie) {
      p.note(chalk.red('Not authenticated'), 'Error');
      p.outro(chalk.red('Please run: clawdie login'));
      process.exit(1);
    }

    const api = new ClawdieAPI(config);

    const displayLogs = async () => {
      try {
        const logs = await api.getAgentLogs(agentId);

        console.clear();
        renderHeader();
        p.intro(chalk.bgWhite.black(' LOGS '));

        if (logs.length === 0) {
          console.log(chalk.gray('No logs available\n'));
          return;
        }

        logs.forEach(log => {
          const color =
            log.type === 'error' ? chalk.red :
            log.type === 'success' ? chalk.green :
            log.type === 'warning' ? chalk.yellow : chalk.white;

          console.log(chalk.gray(`[${log.timestamp}] `) + color(log.message));
        });

        console.log();
      } catch (error) {
        console.error(chalk.red('Error fetching logs:'), error instanceof Error ? error.message : 'Unknown error');
      }
    };

    if (options.follow) {
      console.log(chalk.cyan('Following logs (Ctrl+C to exit)...\n'));
      await displayLogs();

      const interval = setInterval(displayLogs, 3000);
      process.on('SIGINT', () => {
        clearInterval(interval);
        process.exit(0);
      });
    } else {
      const s = p.spinner();
      s.start(`Fetching logs for ${agentId}...`);

      try {
        const logs = await api.getAgentLogs(agentId);
        s.stop(`✔ Retrieved ${logs.length} log entries`);

        console.log();

        if (logs.length === 0) {
          console.log(chalk.gray('No logs available'));
        } else {
          logs.forEach(log => {
            const color =
              log.type === 'error' ? chalk.red :
              log.type === 'success' ? chalk.green :
              log.type === 'warning' ? chalk.yellow : chalk.white;

            console.log(chalk.gray(`[${log.timestamp}] `) + color(log.message));
          });
        }

        console.log();
        p.outro(chalk.hex(SECONDARY_COLOR)('Log retrieval complete.'));
      } catch (error) {
        s.stop(chalk.red('✗ Log retrieval failed'));
        p.note(chalk.red(error instanceof Error ? error.message : 'Unknown error'), 'Error');
        process.exit(1);
      }
    }
  });

// --- NEXUS DASHBOARD COMMAND ---
program
  .command('nexus')
  .description('Launch the interactive Clawdie Nexus Dashboard')
  .action(() => {
    const config = loadConfig();

    if (!config.cookie) {
      console.error(chalk.red('Not authenticated. Please run: clawdie login'));
      process.exit(1);
    }

    render(<NexusDashboard config={config} />);
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
