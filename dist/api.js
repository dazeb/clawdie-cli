"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClawdieAPI = void 0;
const https_1 = __importDefault(require("https"));
const http_1 = __importDefault(require("http"));
async function fetchApi(apiUrl, endpoint, options = {}, timeoutMs = 30000) {
    return new Promise((resolve, reject) => {
        const url = new URL(endpoint, apiUrl);
        const isHttps = url.protocol === 'https:';
        const requestOptions = {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(options.cookie && { Cookie: options.cookie }),
            },
            timeout: timeoutMs,
        };
        const client = isHttps ? https_1.default : http_1.default;
        const req = client.request(url, requestOptions, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk.toString();
            });
            res.on('end', () => {
                try {
                    const setCookie = res.headers['set-cookie'];
                    const data = body ? JSON.parse(body) : undefined;
                    if (res.statusCode && res.statusCode >= 400) {
                        reject(new Error(data?.error || `HTTP ${res.statusCode}`));
                    }
                    else {
                        resolve({
                            data,
                            setCookie: Array.isArray(setCookie) ? setCookie[0] : setCookie,
                        });
                    }
                }
                catch (e) {
                    reject(e);
                }
            });
        });
        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        if (options.body) {
            req.write(JSON.stringify(options.body));
        }
        req.end();
    });
}
class ClawdieAPI {
    constructor(config) {
        this.config = config;
    }
    updateCookie(cookie) {
        this.config.cookie = cookie;
    }
    async login(email, password) {
        const result = await fetchApi(this.config.apiUrl, '/api/auth/email/login', {
            method: 'POST',
            body: { email, password },
        });
        if (!result.data || !result.setCookie) {
            throw new Error('Login failed: no response or cookie');
        }
        return {
            user: result.data.user,
            cookie: result.setCookie,
        };
    }
    async logout() {
        await fetchApi(this.config.apiUrl, '/api/auth/logout', {
            method: 'POST',
            body: {},
            cookie: this.config.cookie,
        });
    }
    async me() {
        const result = await fetchApi(this.config.apiUrl, '/api/auth/me', { cookie: this.config.cookie });
        if (!result.data) {
            throw new Error('Failed to fetch current user');
        }
        return result.data.user;
    }
    async listAgents() {
        const result = await fetchApi(this.config.apiUrl, '/api/agents', { cookie: this.config.cookie });
        if (!result.data) {
            throw new Error('Failed to list agents');
        }
        return result.data.agents;
    }
    async getAgent(id) {
        const result = await fetchApi(this.config.apiUrl, `/api/agents/${id}`, { cookie: this.config.cookie });
        if (!result.data) {
            throw new Error(`Failed to get agent ${id}`);
        }
        return result.data.agent;
    }
    async restartAgent(id) {
        await fetchApi(this.config.apiUrl, `/api/agents/${id}/restart`, {
            method: 'POST',
            body: {},
            cookie: this.config.cookie,
        });
    }
    async startAgent(id) {
        await fetchApi(this.config.apiUrl, `/api/agents/${id}/start`, {
            method: 'POST',
            body: {},
            cookie: this.config.cookie,
        });
    }
    async stopAgent(id) {
        await fetchApi(this.config.apiUrl, `/api/agents/${id}/stop`, {
            method: 'POST',
            body: {},
            cookie: this.config.cookie,
        });
    }
    async killAgent(id) {
        await fetchApi(this.config.apiUrl, `/api/agents/${id}/kill`, {
            method: 'POST',
            body: {},
            cookie: this.config.cookie,
        });
    }
    async getAgentMetrics(id) {
        const result = await fetchApi(this.config.apiUrl, `/api/agents/${id}/metrics`, { cookie: this.config.cookie });
        if (!result.data) {
            throw new Error(`Failed to get metrics for agent ${id}`);
        }
        return result.data.metrics;
    }
    async getAgentLogs(id) {
        const result = await fetchApi(this.config.apiUrl, `/api/agents/${id}/logs`, { cookie: this.config.cookie });
        if (!result.data) {
            throw new Error(`Failed to get logs for agent ${id}`);
        }
        return result.data.logs;
    }
    async createCheckout(telegramToken, region = 'eu', plan = 'monthly') {
        const result = await fetchApi(this.config.apiUrl, '/api/checkout', {
            method: 'POST',
            body: { telegramToken, region, plan },
            cookie: this.config.cookie,
        });
        if (!result.data) {
            throw new Error('Checkout failed');
        }
        return result.data;
    }
}
exports.ClawdieAPI = ClawdieAPI;
