#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const react_1 = __importDefault(require("react"));
const chalk_1 = __importDefault(require("chalk"));
const p = __importStar(require("@clack/prompts"));
const gradient_string_1 = __importDefault(require("gradient-string"));
const boxen_1 = __importDefault(require("boxen"));
const ink_1 = require("ink");
const open_1 = __importDefault(require("open"));
const promises_1 = require("node:timers/promises");
const config_1 = require("./config");
const api_1 = require("./api");
const NexusDashboard_1 = require("./NexusDashboard");
const program = new commander_1.Command();
const BRAND_COLOR = '#FFFFFF';
const SECONDARY_COLOR = '#666666';
const logoGradient = (0, gradient_string_1.default)(['#FFFFFF', '#444444', '#FFFFFF']);
const renderHeader = () => {
    const title = `
   █▀▀ █   ▄▀█ █   █ █ █▀▄ █ █▀▀
   █   █   █▀█ █▄▄ █▄█ █▄▀ █ █▀▀
    `;
    console.log((0, gradient_string_1.default)(['#FFFFFF', '#888888', '#444444', '#888888', '#FFFFFF'])(title));
    console.log(chalk_1.default.hex(SECONDARY_COLOR)('  ───  AGENT INFRASTRUCTURE ORCHESTRATOR v1.0.0  ─── \n'));
};
program.name('clawdie').description('Clawdie Agent Management CLI').version('1.0.0');
// --- LOGIN COMMAND ---
program
    .command('login')
    .description('Authenticate with Clawdie API')
    .action(async () => {
    renderHeader();
    p.intro(chalk_1.default.bgWhite.black(' AUTHENTICATION '));
    const config = (0, config_1.loadConfig)();
    const loginFlow = await p.group({
        email: () => p.text({ message: 'Email:', placeholder: 'user@example.com' }),
        password: () => p.password({ message: 'Password:' }),
    }, {
        onCancel: () => {
            p.cancel('Authentication aborted.');
            process.exit(0);
        },
    });
    const s = p.spinner();
    s.start('Connecting to Clawdie API...');
    try {
        const api = new api_1.ClawdieAPI(config);
        const { user, cookie } = await api.login(loginFlow.email, loginFlow.password);
        config.cookie = cookie;
        config.user = user;
        (0, config_1.saveConfig)(config);
        s.stop('✔ Authentication successful');
        p.note(chalk_1.default.white(`Welcome back, ${user.name || user.email}!\n`) +
            chalk_1.default.hex(SECONDARY_COLOR)(`User ID: ${user.id}`), 'Identity');
        p.outro(chalk_1.default.green('Ready to orchestrate.'));
    }
    catch (error) {
        s.stop(chalk_1.default.red('✗ Authentication failed'));
        p.note(chalk_1.default.red(error instanceof Error ? error.message : 'Unknown error'), 'Error');
        process.exit(1);
    }
});
// --- LOGOUT COMMAND ---
program
    .command('logout')
    .description('Logout and clear authentication')
    .action(async () => {
    renderHeader();
    p.intro(chalk_1.default.bgWhite.black(' LOGOUT '));
    const config = (0, config_1.loadConfig)();
    if (!config.cookie) {
        p.note(chalk_1.default.yellow('Not logged in'), 'Status');
        p.outro(chalk_1.default.gray('No session to clear.'));
        return;
    }
    const s = p.spinner();
    s.start('Clearing session...');
    try {
        const api = new api_1.ClawdieAPI(config);
        await api.logout();
        (0, config_1.clearConfig)();
        s.stop('✔ Logged out');
        p.outro(chalk_1.default.green('Session cleared.'));
    }
    catch (error) {
        s.stop(chalk_1.default.red('✗ Logout failed'));
        p.note(chalk_1.default.red(error instanceof Error ? error.message : 'Unknown error'), 'Error');
        process.exit(1);
    }
});
// --- DEPLOY COMMAND ---
program
    .command('deploy')
    .description('Deploy a new agent via checkout')
    .action(async () => {
    renderHeader();
    p.intro(chalk_1.default.bgWhite.black(' AGENT DEPLOYMENT '));
    const config = (0, config_1.loadConfig)();
    if (!config.cookie) {
        p.note(chalk_1.default.red('Not authenticated'), 'Error');
        p.outro(chalk_1.default.red('Please run: clawdie login'));
        process.exit(1);
    }
    const form = await p.group({
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
    }, {
        onCancel: () => {
            p.cancel('Deployment aborted.');
            process.exit(0);
        },
    });
    const s = p.spinner();
    s.start('Creating checkout session...');
    try {
        const api = new api_1.ClawdieAPI(config);
        const checkout = await api.createCheckout(form.telegramToken, form.region, form.plan);
        s.stop('✔ Checkout session created');
        p.note(chalk_1.default.white(`Opening payment page...\n`) +
            chalk_1.default.hex(SECONDARY_COLOR)(`Session ID: ${checkout.sessionId}`), 'Checkout');
        await (0, promises_1.setTimeout)(1000);
        // Open browser
        try {
            await (0, open_1.default)(checkout.checkoutUrl);
            p.outro(chalk_1.default.green('Payment page opened in your browser.'));
        }
        catch (err) {
            p.note(chalk_1.default.white(`Checkout URL: ${chalk_1.default.cyan.underline(checkout.checkoutUrl)}`), 'Manual Checkout');
            p.outro(chalk_1.default.gray('Open the link above to complete payment.'));
        }
    }
    catch (error) {
        s.stop(chalk_1.default.red('✗ Deployment failed'));
        p.note(chalk_1.default.red(error instanceof Error ? error.message : 'Unknown error'), 'Error');
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
    p.intro(chalk_1.default.bgWhite.black(' AGENTS '));
    const config = (0, config_1.loadConfig)();
    if (!config.cookie) {
        p.note(chalk_1.default.red('Not authenticated'), 'Error');
        p.outro(chalk_1.default.red('Please run: clawdie login'));
        process.exit(1);
    }
    const s = p.spinner();
    s.start('Fetching agents...');
    try {
        const api = new api_1.ClawdieAPI(config);
        const agents = await api.listAgents();
        s.stop(`✔ Found ${agents.length} agent(s)`);
        if (agents.length === 0) {
            p.note(chalk_1.default.yellow('No agents deployed yet'), 'Status');
            p.outro(chalk_1.default.gray('Run: clawdie deploy'));
            return;
        }
        console.log('\n');
        const headers = '  ' + 'ID'.padEnd(20) + 'NAME'.padEnd(25) + 'REGION'.padEnd(10) + 'STATUS'.padEnd(15) + 'UPTIME';
        console.log(chalk_1.default.bold.white(headers));
        console.log(chalk_1.default.gray('  ' + '─'.repeat(headers.length - 2)));
        agents.forEach(agent => {
            const createdTime = new Date(agent.createdAt).getTime();
            const uptime = Math.floor((Date.now() - createdTime) / (1000 * 60 * 60 * 24));
            const statusColor = agent.status === 'ONLINE' ? chalk_1.default.green :
                agent.status === 'OFFLINE' ? chalk_1.default.gray :
                    agent.status === 'DEGRADED' ? chalk_1.default.yellow :
                        agent.status === 'ERROR' ? chalk_1.default.red : chalk_1.default.cyan;
            console.log('  ' +
                agent.id.substring(0, 19).padEnd(20) +
                agent.name.substring(0, 24).padEnd(25) +
                agent.region.toUpperCase().padEnd(10) +
                statusColor(agent.status).padEnd(15) +
                chalk_1.default.hex(SECONDARY_COLOR)(`${uptime}d`));
        });
        console.log();
        p.outro(chalk_1.default.hex(SECONDARY_COLOR)(`Total: ${agents.length} agent(s)`));
    }
    catch (error) {
        s.stop(chalk_1.default.red('✗ Failed to fetch agents'));
        p.note(chalk_1.default.red(error instanceof Error ? error.message : 'Unknown error'), 'Error');
        process.exit(1);
    }
});
// --- STATUS COMMAND ---
program
    .command('status [id]')
    .description('View agent status and metrics')
    .action(async (agentId) => {
    renderHeader();
    p.intro(chalk_1.default.bgWhite.black(' STATUS '));
    const config = (0, config_1.loadConfig)();
    if (!config.cookie) {
        p.note(chalk_1.default.red('Not authenticated'), 'Error');
        p.outro(chalk_1.default.red('Please run: clawdie login'));
        process.exit(1);
    }
    const api = new api_1.ClawdieAPI(config);
    const s = p.spinner();
    s.start('Fetching agents...');
    try {
        const agents = await api.listAgents();
        if (!agentId) {
            s.stop(`✔ Fetched ${agents.length} agent(s)`);
            if (agents.length === 0) {
                p.note(chalk_1.default.yellow('No agents deployed'), 'Status');
                return;
            }
            console.log('\n');
            agents.forEach(agent => {
                const statusColor = agent.status === 'ONLINE' ? chalk_1.default.green :
                    agent.status === 'OFFLINE' ? chalk_1.default.gray :
                        agent.status === 'DEGRADED' ? chalk_1.default.yellow :
                            agent.status === 'ERROR' ? chalk_1.default.red : chalk_1.default.cyan;
                console.log(chalk_1.default.bold(agent.name));
                console.log('  ID:     ' + chalk_1.default.cyan(agent.id));
                console.log('  Status: ' + statusColor(agent.status));
                console.log('  Region: ' + chalk_1.default.white(agent.region));
                if (agent.coolifyUrl)
                    console.log('  Coolify: ' + chalk_1.default.underline(agent.coolifyUrl));
                console.log();
            });
            p.outro(chalk_1.default.hex(SECONDARY_COLOR)('Status check complete.'));
            return;
        }
        s.start(`Fetching agent ${agentId}...`);
        const agent = await api.getAgent(agentId);
        const metrics = await api.getAgentMetrics(agentId);
        s.stop('✔ Status retrieved');
        const statusColor = agent.status === 'ONLINE' ? chalk_1.default.green :
            agent.status === 'OFFLINE' ? chalk_1.default.gray :
                agent.status === 'DEGRADED' ? chalk_1.default.yellow :
                    agent.status === 'ERROR' ? chalk_1.default.red : chalk_1.default.cyan;
        console.log((0, boxen_1.default)(chalk_1.default.bold(agent.name) + '\n\n' +
            chalk_1.default.white('ID:       ') + chalk_1.default.cyan(agent.id) + '\n' +
            chalk_1.default.white('Status:   ') + statusColor(agent.status) + '\n' +
            chalk_1.default.white('Region:   ') + chalk_1.default.white(agent.region) + '\n' +
            chalk_1.default.white('Created:  ') + chalk_1.default.hex(SECONDARY_COLOR)(new Date(agent.createdAt).toLocaleDateString()) + '\n\n' +
            chalk_1.default.bold('Metrics:') + '\n' +
            chalk_1.default.white('  CPU:    ') + chalk_1.default.cyan(metrics.cpu.toFixed(1) + '%') + '\n' +
            chalk_1.default.white('  Memory: ') + chalk_1.default.cyan(metrics.memory.toFixed(1) + '%') + '\n' +
            chalk_1.default.white('  Uptime: ') + chalk_1.default.cyan(Math.floor(metrics.uptime / 3600) + ' hours'), {
            padding: 1,
            margin: 1,
            borderStyle: 'double',
            borderColor: 'white',
            title: ' AGENT STATUS ',
            titleAlignment: 'center',
        }));
        p.outro(chalk_1.default.hex(SECONDARY_COLOR)('All systems nominal.'));
    }
    catch (error) {
        s.stop(chalk_1.default.red('✗ Status check failed'));
        p.note(chalk_1.default.red(error instanceof Error ? error.message : 'Unknown error'), 'Error');
        process.exit(1);
    }
});
// --- RESTART COMMAND ---
program
    .command('restart <id>')
    .description('Restart an agent')
    .action(async (agentId) => {
    renderHeader();
    p.intro(chalk_1.default.bgWhite.black(' RESTART '));
    const config = (0, config_1.loadConfig)();
    if (!config.cookie) {
        p.note(chalk_1.default.red('Not authenticated'), 'Error');
        p.outro(chalk_1.default.red('Please run: clawdie login'));
        process.exit(1);
    }
    const s = p.spinner();
    s.start(`Restarting agent ${agentId}...`);
    try {
        const api = new api_1.ClawdieAPI(config);
        await api.restartAgent(agentId);
        s.stop('✔ Agent restarted');
        p.outro(chalk_1.default.green('Agent is restarting.'));
    }
    catch (error) {
        s.stop(chalk_1.default.red('✗ Restart failed'));
        p.note(chalk_1.default.red(error instanceof Error ? error.message : 'Unknown error'), 'Error');
        process.exit(1);
    }
});
// --- STOP COMMAND ---
program
    .command('stop <id>')
    .description('Stop an agent')
    .action(async (agentId) => {
    renderHeader();
    p.intro(chalk_1.default.bgWhite.black(' STOP '));
    const config = (0, config_1.loadConfig)();
    if (!config.cookie) {
        p.note(chalk_1.default.red('Not authenticated'), 'Error');
        p.outro(chalk_1.default.red('Please run: clawdie login'));
        process.exit(1);
    }
    const s = p.spinner();
    s.start(`Stopping agent ${agentId}...`);
    try {
        const api = new api_1.ClawdieAPI(config);
        await api.stopAgent(agentId);
        s.stop('✔ Agent stopped');
        p.outro(chalk_1.default.green('Agent has been stopped.'));
    }
    catch (error) {
        s.stop(chalk_1.default.red('✗ Stop failed'));
        p.note(chalk_1.default.red(error instanceof Error ? error.message : 'Unknown error'), 'Error');
        process.exit(1);
    }
});
// --- LOGS COMMAND ---
program
    .command('logs <id>')
    .description('View agent logs')
    .option('--follow', 'Follow logs (poll every 3s)')
    .action(async (agentId, options) => {
    renderHeader();
    p.intro(chalk_1.default.bgWhite.black(' LOGS '));
    const config = (0, config_1.loadConfig)();
    if (!config.cookie) {
        p.note(chalk_1.default.red('Not authenticated'), 'Error');
        p.outro(chalk_1.default.red('Please run: clawdie login'));
        process.exit(1);
    }
    const api = new api_1.ClawdieAPI(config);
    const displayLogs = async () => {
        try {
            const logs = await api.getAgentLogs(agentId);
            console.clear();
            renderHeader();
            p.intro(chalk_1.default.bgWhite.black(' LOGS '));
            if (logs.length === 0) {
                console.log(chalk_1.default.gray('No logs available\n'));
                return;
            }
            logs.forEach(log => {
                const color = log.type === 'error' ? chalk_1.default.red :
                    log.type === 'success' ? chalk_1.default.green :
                        log.type === 'warning' ? chalk_1.default.yellow : chalk_1.default.white;
                console.log(chalk_1.default.gray(`[${log.timestamp}] `) + color(log.message));
            });
            console.log();
        }
        catch (error) {
            console.error(chalk_1.default.red('Error fetching logs:'), error instanceof Error ? error.message : 'Unknown error');
        }
    };
    if (options.follow) {
        console.log(chalk_1.default.cyan('Following logs (Ctrl+C to exit)...\n'));
        await displayLogs();
        const interval = setInterval(displayLogs, 3000);
        process.on('SIGINT', () => {
            clearInterval(interval);
            process.exit(0);
        });
    }
    else {
        const s = p.spinner();
        s.start(`Fetching logs for ${agentId}...`);
        try {
            const logs = await api.getAgentLogs(agentId);
            s.stop(`✔ Retrieved ${logs.length} log entries`);
            console.log();
            if (logs.length === 0) {
                console.log(chalk_1.default.gray('No logs available'));
            }
            else {
                logs.forEach(log => {
                    const color = log.type === 'error' ? chalk_1.default.red :
                        log.type === 'success' ? chalk_1.default.green :
                            log.type === 'warning' ? chalk_1.default.yellow : chalk_1.default.white;
                    console.log(chalk_1.default.gray(`[${log.timestamp}] `) + color(log.message));
                });
            }
            console.log();
            p.outro(chalk_1.default.hex(SECONDARY_COLOR)('Log retrieval complete.'));
        }
        catch (error) {
            s.stop(chalk_1.default.red('✗ Log retrieval failed'));
            p.note(chalk_1.default.red(error instanceof Error ? error.message : 'Unknown error'), 'Error');
            process.exit(1);
        }
    }
});
// --- NEXUS DASHBOARD COMMAND ---
program
    .command('nexus')
    .description('Launch the interactive Clawdie Nexus Dashboard')
    .action(() => {
    const config = (0, config_1.loadConfig)();
    if (!config.cookie) {
        console.error(chalk_1.default.red('Not authenticated. Please run: clawdie login'));
        process.exit(1);
    }
    (0, ink_1.render)(react_1.default.createElement(NexusDashboard_1.NexusDashboard, { config: config }));
});
program.parse(process.argv);
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
