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
exports.NexusDashboard = void 0;
const react_1 = __importStar(require("react"));
const ink_1 = require("ink");
const gradient_string_1 = __importDefault(require("gradient-string"));
const api_1 = require("./api");
const BRAND_GRADIENT = (0, gradient_string_1.default)(['#FFFFFF', '#444444', '#FFFFFF']);
const NexusDashboard = ({ config }) => {
    const { exit } = (0, ink_1.useApp)();
    const [activeTab, setActiveTab] = (0, react_1.useState)(0);
    const [state, setState] = (0, react_1.useState)({
        agents: [],
        logs: [],
        loading: true,
    });
    const api = new api_1.ClawdieAPI(config);
    // Fetch data on mount and setup intervals
    (0, react_1.useEffect)(() => {
        const loadData = async () => {
            try {
                setState(prev => ({ ...prev, loading: true, error: undefined }));
                const agents = await api.listAgents();
                setState(prev => ({
                    ...prev,
                    agents,
                    selectedAgentId: agents[0]?.id,
                    loading: false,
                }));
            }
            catch (error) {
                setState(prev => ({
                    ...prev,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    loading: false,
                }));
            }
        };
        loadData();
        // Refresh agents every 5 seconds
        const agentInterval = setInterval(loadData, 5000);
        return () => clearInterval(agentInterval);
    }, []);
    // Fetch metrics for selected agent
    (0, react_1.useEffect)(() => {
        if (!state.selectedAgentId)
            return;
        const loadMetrics = async () => {
            try {
                const metrics = await api.getAgentMetrics(state.selectedAgentId);
                setState(prev => ({ ...prev, metrics }));
            }
            catch (error) {
                // Silently fail for metrics
            }
        };
        loadMetrics();
        const metricsInterval = setInterval(loadMetrics, 5000);
        return () => clearInterval(metricsInterval);
    }, [state.selectedAgentId]);
    // Fetch logs for selected agent
    (0, react_1.useEffect)(() => {
        if (!state.selectedAgentId)
            return;
        const loadLogs = async () => {
            try {
                const logs = await api.getAgentLogs(state.selectedAgentId);
                setState(prev => ({ ...prev, logs }));
            }
            catch (error) {
                // Silently fail for logs
            }
        };
        loadLogs();
        const logsInterval = setInterval(loadLogs, 3000);
        return () => clearInterval(logsInterval);
    }, [state.selectedAgentId]);
    (0, ink_1.useInput)((input, key) => {
        if (key.tab) {
            setActiveTab(prev => (prev + 1) % 3);
        }
        if (input === 'q' || input === 'Q') {
            exit();
        }
        if (input === 'j' && state.agents.length > 0) {
            const currentIdx = state.agents.findIndex(a => a.id === state.selectedAgentId);
            if (currentIdx < state.agents.length - 1) {
                setState(prev => ({
                    ...prev,
                    selectedAgentId: prev.agents[currentIdx + 1].id,
                }));
            }
        }
        if (input === 'k' && state.agents.length > 0) {
            const currentIdx = state.agents.findIndex(a => a.id === state.selectedAgentId);
            if (currentIdx > 0) {
                setState(prev => ({
                    ...prev,
                    selectedAgentId: prev.agents[currentIdx - 1].id,
                }));
            }
        }
    });
    const getStatusColor = (status) => {
        switch (status) {
            case 'ONLINE':
                return 'green';
            case 'OFFLINE':
                return 'gray';
            case 'DEGRADED':
                return 'yellow';
            case 'ERROR':
                return 'red';
            case 'PENDING':
            case 'PROVISIONING':
            case 'DEPLOYING':
                return 'cyan';
            case 'STOPPED':
                return 'gray';
            default:
                return 'white';
        }
    };
    const formatUptime = (createdAt) => {
        const created = new Date(createdAt).getTime();
        const now = Date.now();
        const uptime = now - created;
        const days = Math.floor(uptime / (1000 * 60 * 60 * 24));
        const hours = Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        return `${days}d ${hours}h`;
    };
    return (react_1.default.createElement(ink_1.Box, { flexDirection: "column", paddingX: 2, paddingY: 1 },
        react_1.default.createElement(ink_1.Box, { marginBottom: 1, flexDirection: "column" },
            react_1.default.createElement(ink_1.Text, null, BRAND_GRADIENT('C L A W D I E   N E X U S')),
            react_1.default.createElement(ink_1.Text, { dimColor: true }, "\u2500\u2500 Agent Infrastructure Orchestrator Dashboard v1.0.0 \u2500\u2500")),
        react_1.default.createElement(ink_1.Box, { marginBottom: 1 },
            react_1.default.createElement(ink_1.Box, { borderStyle: "round", borderColor: activeTab === 0 ? 'white' : 'gray', paddingX: 1, marginRight: 2 },
                react_1.default.createElement(ink_1.Text, { color: activeTab === 0 ? 'white' : 'gray', bold: activeTab === 0 }, "[ 01: AGENTS ]")),
            react_1.default.createElement(ink_1.Box, { borderStyle: "round", borderColor: activeTab === 1 ? 'white' : 'gray', paddingX: 1, marginRight: 2 },
                react_1.default.createElement(ink_1.Text, { color: activeTab === 1 ? 'white' : 'gray', bold: activeTab === 1 }, "[ 02: TELEMETRY ]")),
            react_1.default.createElement(ink_1.Box, { borderStyle: "round", borderColor: activeTab === 2 ? 'white' : 'gray', paddingX: 1 },
                react_1.default.createElement(ink_1.Text, { color: activeTab === 2 ? 'white' : 'gray', bold: activeTab === 2 }, "[ 03: LOGS ]"))),
        react_1.default.createElement(ink_1.Box, { height: 15, borderStyle: "single", borderColor: "white", padding: 1, flexDirection: "column" },
            state.error && (react_1.default.createElement(ink_1.Box, { flexDirection: "column" },
                react_1.default.createElement(ink_1.Text, { color: "red" },
                    "Error: ",
                    state.error))),
            state.loading && (react_1.default.createElement(ink_1.Box, { flexDirection: "column" },
                react_1.default.createElement(ink_1.Text, { color: "cyan" }, "Loading agents..."))),
            !state.loading && !state.error && activeTab === 0 && (react_1.default.createElement(ink_1.Box, { flexDirection: "column" },
                react_1.default.createElement(ink_1.Box, { justifyContent: "space-between", marginBottom: 1 },
                    react_1.default.createElement(ink_1.Text, { bold: true, underline: true }, "ID"),
                    react_1.default.createElement(ink_1.Text, { bold: true, underline: true }, "NAME"),
                    react_1.default.createElement(ink_1.Text, { bold: true, underline: true }, "REGION"),
                    react_1.default.createElement(ink_1.Text, { bold: true, underline: true }, "STATUS"),
                    react_1.default.createElement(ink_1.Text, { bold: true, underline: true }, "UPTIME")),
                state.agents.slice(0, 10).map(agent => (react_1.default.createElement(ink_1.Box, { key: agent.id, justifyContent: "space-between" },
                    react_1.default.createElement(ink_1.Text, { color: agent.id === state.selectedAgentId ? 'cyan' : 'white' }, agent.id.substring(0, 14).padEnd(15)),
                    react_1.default.createElement(ink_1.Text, null, agent.name.substring(0, 19).padEnd(20)),
                    react_1.default.createElement(ink_1.Text, null, agent.region.toUpperCase().padEnd(8)),
                    react_1.default.createElement(ink_1.Text, { color: getStatusColor(agent.status) }, agent.status.padEnd(12)),
                    react_1.default.createElement(ink_1.Text, null, formatUptime(agent.createdAt).padEnd(10))))),
                state.agents.length === 0 && react_1.default.createElement(ink_1.Text, { color: "gray" }, "No agents found"))),
            !state.loading && !state.error && activeTab === 1 && (react_1.default.createElement(ink_1.Box, { flexDirection: "column" },
                react_1.default.createElement(ink_1.Text, { bold: true, color: "white" }, "Telemetry - Selected Agent"),
                state.selectedAgentId && state.metrics ? (react_1.default.createElement(ink_1.Box, { flexDirection: "column", marginTop: 1 },
                    react_1.default.createElement(ink_1.Text, null,
                        "CPU:    ",
                        state.metrics.cpu.toFixed(1),
                        "%"),
                    react_1.default.createElement(ink_1.Text, null,
                        "Memory: ",
                        state.metrics.memory.toFixed(1),
                        "%"),
                    react_1.default.createElement(ink_1.Text, null,
                        "Uptime: ",
                        Math.floor(state.metrics.uptime / 3600),
                        "h"))) : (react_1.default.createElement(ink_1.Text, { color: "gray" }, "No metrics available")),
                react_1.default.createElement(ink_1.Box, { marginTop: 2 },
                    react_1.default.createElement(ink_1.Text, { color: "gray", dimColor: true }, "Navigate agents with j/k to view their metrics")))),
            !state.loading && !state.error && activeTab === 2 && (react_1.default.createElement(ink_1.Box, { flexDirection: "column" }, state.logs.length > 0 ? (state.logs.slice(-10).map((log, i) => (react_1.default.createElement(ink_1.Box, { key: i },
                react_1.default.createElement(ink_1.Text, { color: "gray" },
                    "[",
                    log.timestamp.substring(11, 19),
                    "] "),
                react_1.default.createElement(ink_1.Text, { color: log.type === 'error' ? 'red' :
                        log.type === 'success' ? 'green' :
                            log.type === 'warning' ? 'yellow' : 'white' }, log.message))))) : (react_1.default.createElement(ink_1.Text, { color: "gray" }, "No logs available"))))),
        react_1.default.createElement(ink_1.Box, { marginTop: 1 },
            react_1.default.createElement(ink_1.Text, { dimColor: true },
                "Press ",
                react_1.default.createElement(ink_1.Text, { color: "white", bold: true }, "TAB"),
                " for tabs \u2022 ",
                react_1.default.createElement(ink_1.Text, { color: "white", bold: true }, "j"),
                "/",
                react_1.default.createElement(ink_1.Text, { color: "white", bold: true }, "k"),
                " to navigate \u2022 ",
                react_1.default.createElement(ink_1.Text, { color: "red", bold: true }, "q"),
                " to exit"))));
};
exports.NexusDashboard = NexusDashboard;
