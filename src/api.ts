import https from 'https';
import http from 'http';
import { Config } from './config';

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface Agent {
  id: string;
  name: string;
  region: string;
  status: 'PENDING' | 'PROVISIONING' | 'DEPLOYING' | 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'ERROR' | 'STOPPED';
  coolifyUrl?: string;
  gatewayToken?: string;
  tailscaleMagicDnsUrl?: string;
  createdAt: string;
  updatedAt: string;
  subscription?: {
    status: string;
    currentPeriodEnd: string;
  };
}

export interface AgentMetrics {
  cpu: number;
  memory: number;
  uptime: number;
}

export interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

export interface CheckoutResponse {
  checkoutUrl: string;
  sessionId: string;
}

async function fetchApi<T>(
  apiUrl: string,
  endpoint: string,
  options: {
    method?: string;
    body?: any;
    cookie?: string;
  } = {},
  timeoutMs: number = 30000
): Promise<{ data?: T; setCookie?: string; error?: string }> {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, apiUrl);
    const isHttps = url.protocol === 'https:';

    const requestOptions: https.RequestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.cookie && { Cookie: options.cookie }),
      },
      timeout: timeoutMs,
    };

    const client = isHttps ? https : http;
    const req = client.request(url, requestOptions, (res: any) => {
      let body = '';

      res.on('data', (chunk: Buffer) => {
        body += chunk.toString();
      });

      res.on('end', () => {
        try {
          const setCookie = res.headers['set-cookie'];
          const data = body ? JSON.parse(body) : undefined;

          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(data?.error || `HTTP ${res.statusCode}`));
          } else {
            resolve({
              data,
              setCookie: Array.isArray(setCookie) ? setCookie[0] : setCookie,
            });
          }
        } catch (e) {
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

export class ClawdieAPI {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  updateCookie(cookie: string): void {
    this.config.cookie = cookie;
  }

  async login(email: string, password: string): Promise<{ user: User; cookie: string }> {
    const result = await fetchApi<{ user: User }>(
      this.config.apiUrl,
      '/api/auth/email/login',
      {
        method: 'POST',
        body: { email, password },
      }
    );

    if (!result.data || !result.setCookie) {
      throw new Error('Login failed: no response or cookie');
    }

    return {
      user: result.data.user,
      cookie: result.setCookie,
    };
  }

  async logout(): Promise<void> {
    await fetchApi(
      this.config.apiUrl,
      '/api/auth/logout',
      {
        method: 'POST',
        body: {},
        cookie: this.config.cookie,
      }
    );
  }

  async me(): Promise<User> {
    const result = await fetchApi<{ user: User }>(
      this.config.apiUrl,
      '/api/auth/me',
      { cookie: this.config.cookie }
    );

    if (!result.data) {
      throw new Error('Failed to fetch current user');
    }

    return result.data.user;
  }

  async listAgents(): Promise<Agent[]> {
    const result = await fetchApi<{ agents: Agent[] }>(
      this.config.apiUrl,
      '/api/agents',
      { cookie: this.config.cookie }
    );

    if (!result.data) {
      throw new Error('Failed to list agents');
    }

    return result.data.agents;
  }

  async getAgent(id: string): Promise<Agent> {
    const result = await fetchApi<{ agent: Agent }>(
      this.config.apiUrl,
      `/api/agents/${id}`,
      { cookie: this.config.cookie }
    );

    if (!result.data) {
      throw new Error(`Failed to get agent ${id}`);
    }

    return result.data.agent;
  }

  async restartAgent(id: string): Promise<void> {
    await fetchApi(
      this.config.apiUrl,
      `/api/agents/${id}/restart`,
      {
        method: 'POST',
        body: {},
        cookie: this.config.cookie,
      }
    );
  }

  async startAgent(id: string): Promise<void> {
    await fetchApi(
      this.config.apiUrl,
      `/api/agents/${id}/start`,
      {
        method: 'POST',
        body: {},
        cookie: this.config.cookie,
      }
    );
  }

  async stopAgent(id: string): Promise<void> {
    await fetchApi(
      this.config.apiUrl,
      `/api/agents/${id}/stop`,
      {
        method: 'POST',
        body: {},
        cookie: this.config.cookie,
      }
    );
  }

  async killAgent(id: string): Promise<void> {
    await fetchApi(
      this.config.apiUrl,
      `/api/agents/${id}/kill`,
      {
        method: 'POST',
        body: {},
        cookie: this.config.cookie,
      }
    );
  }

  async getAgentMetrics(id: string): Promise<AgentMetrics> {
    const result = await fetchApi<{ metrics: AgentMetrics }>(
      this.config.apiUrl,
      `/api/agents/${id}/metrics`,
      { cookie: this.config.cookie }
    );

    if (!result.data) {
      throw new Error(`Failed to get metrics for agent ${id}`);
    }

    return result.data.metrics;
  }

  async getAgentLogs(id: string): Promise<LogEntry[]> {
    const result = await fetchApi<{ logs: LogEntry[] }>(
      this.config.apiUrl,
      `/api/agents/${id}/logs`,
      { cookie: this.config.cookie }
    );

    if (!result.data) {
      throw new Error(`Failed to get logs for agent ${id}`);
    }

    return result.data.logs;
  }

  async createCheckout(
    telegramToken: string,
    region: 'eu' | 'us' = 'eu',
    plan: 'monthly' | 'yearly' = 'monthly'
  ): Promise<CheckoutResponse> {
    const result = await fetchApi<CheckoutResponse>(
      this.config.apiUrl,
      '/api/checkout',
      {
        method: 'POST',
        body: { telegramToken, region, plan },
        cookie: this.config.cookie,
      }
    );

    if (!result.data) {
      throw new Error('Checkout failed');
    }

    return result.data;
  }
}
