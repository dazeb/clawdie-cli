import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp, Static } from 'ink';
import chalk from 'chalk';
import gradient from 'gradient-string';
import { ClawdieAPI, Agent, AgentMetrics, LogEntry } from './api';
import { Config } from './config';

const BRAND_GRADIENT = gradient(['#FFFFFF', '#444444', '#FFFFFF']);

interface DashboardState {
  agents: Agent[];
  selectedAgentId?: string;
  metrics?: AgentMetrics;
  logs: LogEntry[];
  loading: boolean;
  error?: string;
}

export const NexusDashboard: React.FC<{ config: Config }> = ({ config }) => {
  const { exit } = useApp();
  const [activeTab, setActiveTab] = useState(0);
  const [state, setState] = useState<DashboardState>({
    agents: [],
    logs: [],
    loading: true,
  });

  const api = new ClawdieAPI(config);

  // Fetch data on mount and setup intervals
  useEffect(() => {
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
      } catch (error) {
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
  useEffect(() => {
    if (!state.selectedAgentId) return;

    const loadMetrics = async () => {
      try {
        const metrics = await api.getAgentMetrics(state.selectedAgentId!);
        setState(prev => ({ ...prev, metrics }));
      } catch (error) {
        // Silently fail for metrics
      }
    };

    loadMetrics();
    const metricsInterval = setInterval(loadMetrics, 5000);
    return () => clearInterval(metricsInterval);
  }, [state.selectedAgentId]);

  // Fetch logs for selected agent
  useEffect(() => {
    if (!state.selectedAgentId) return;

    const loadLogs = async () => {
      try {
        const logs = await api.getAgentLogs(state.selectedAgentId!);
        setState(prev => ({ ...prev, logs }));
      } catch (error) {
        // Silently fail for logs
      }
    };

    loadLogs();
    const logsInterval = setInterval(loadLogs, 3000);
    return () => clearInterval(logsInterval);
  }, [state.selectedAgentId]);

  useInput((input, key) => {
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

  const getStatusColor = (status: Agent['status']) => {
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

  const formatUptime = (createdAt: string): string => {
    const created = new Date(createdAt).getTime();
    const now = Date.now();
    const uptime = now - created;
    const days = Math.floor(uptime / (1000 * 60 * 60 * 24));
    const hours = Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h`;
  };

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      {/* Header */}
      <Box marginBottom={1} flexDirection="column">
        <Text>{BRAND_GRADIENT('C L A W D I E   N E X U S')}</Text>
        <Text dimColor>── Agent Infrastructure Orchestrator Dashboard v1.0.0 ──</Text>
      </Box>

      {/* Tabs */}
      <Box marginBottom={1}>
        <Box borderStyle="round" borderColor={activeTab === 0 ? 'white' : 'gray'} paddingX={1} marginRight={2}>
          <Text color={activeTab === 0 ? 'white' : 'gray'} bold={activeTab === 0}>
            [ 01: AGENTS ]
          </Text>
        </Box>
        <Box borderStyle="round" borderColor={activeTab === 1 ? 'white' : 'gray'} paddingX={1} marginRight={2}>
          <Text color={activeTab === 1 ? 'white' : 'gray'} bold={activeTab === 1}>
            [ 02: TELEMETRY ]
          </Text>
        </Box>
        <Box borderStyle="round" borderColor={activeTab === 2 ? 'white' : 'gray'} paddingX={1}>
          <Text color={activeTab === 2 ? 'white' : 'gray'} bold={activeTab === 2}>
            [ 03: LOGS ]
          </Text>
        </Box>
      </Box>

      {/* Main View Area */}
      <Box height={15} borderStyle="single" borderColor="white" padding={1} flexDirection="column">
        {state.error && (
          <Box flexDirection="column">
            <Text color="red">Error: {state.error}</Text>
          </Box>
        )}

        {state.loading && (
          <Box flexDirection="column">
            <Text color="cyan">Loading agents...</Text>
          </Box>
        )}

        {!state.loading && !state.error && activeTab === 0 && (
          <Box flexDirection="column">
            <Box justifyContent="space-between" marginBottom={1}>
              <Text bold underline>ID</Text>
              <Text bold underline>NAME</Text>
              <Text bold underline>REGION</Text>
              <Text bold underline>STATUS</Text>
              <Text bold underline>UPTIME</Text>
            </Box>
            {state.agents.slice(0, 10).map(agent => (
              <Box key={agent.id} justifyContent="space-between">
                <Text color={agent.id === state.selectedAgentId ? 'cyan' : 'white'}>
                  {agent.id.substring(0, 14).padEnd(15)}
                </Text>
                <Text>{agent.name.substring(0, 19).padEnd(20)}</Text>
                <Text>{agent.region.toUpperCase().padEnd(8)}</Text>
                <Text color={getStatusColor(agent.status)}>
                  {agent.status.padEnd(12)}
                </Text>
                <Text>{formatUptime(agent.createdAt).padEnd(10)}</Text>
              </Box>
            ))}
            {state.agents.length === 0 && <Text color="gray">No agents found</Text>}
          </Box>
        )}

        {!state.loading && !state.error && activeTab === 1 && (
          <Box flexDirection="column">
            <Text bold color="white">Telemetry - Selected Agent</Text>
            {state.selectedAgentId && state.metrics ? (
              <Box flexDirection="column" marginTop={1}>
                <Text>CPU:    {state.metrics.cpu.toFixed(1)}%</Text>
                <Text>Memory: {state.metrics.memory.toFixed(1)}%</Text>
                <Text>Uptime: {Math.floor(state.metrics.uptime / 3600)}h</Text>
              </Box>
            ) : (
              <Text color="gray">No metrics available</Text>
            )}
            <Box marginTop={2}>
              <Text color="gray" dimColor>Navigate agents with j/k to view their metrics</Text>
            </Box>
          </Box>
        )}

        {!state.loading && !state.error && activeTab === 2 && (
          <Box flexDirection="column">
            {state.logs.length > 0 ? (
              state.logs.slice(-10).map((log, i) => (
                <Box key={i}>
                  <Text color="gray">[{log.timestamp.substring(11, 19)}] </Text>
                  <Text
                    color={
                      log.type === 'error' ? 'red' :
                      log.type === 'success' ? 'green' :
                      log.type === 'warning' ? 'yellow' : 'white'
                    }
                  >
                    {log.message}
                  </Text>
                </Box>
              ))
            ) : (
              <Text color="gray">No logs available</Text>
            )}
          </Box>
        )}
      </Box>

      {/* Footer / Info */}
      <Box marginTop={1}>
        <Text dimColor>
          Press <Text color="white" bold>TAB</Text> for tabs • <Text color="white" bold>j</Text>/<Text color="white" bold>k</Text> to navigate • <Text color="red" bold>q</Text> to exit
        </Text>
      </Box>
    </Box>
  );
};
