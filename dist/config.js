"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureConfigDir = ensureConfigDir;
exports.loadConfig = loadConfig;
exports.saveConfig = saveConfig;
exports.clearConfig = clearConfig;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const CONFIG_DIR = path_1.default.join(os_1.default.homedir(), '.clawdie');
const CONFIG_FILE = path_1.default.join(CONFIG_DIR, 'config.json');
const DEFAULT_CONFIG = {
    apiUrl: process.env.CLAWDIE_API_URL || 'https://api.clawdie.ai'
};
function ensureConfigDir() {
    if (!fs_1.default.existsSync(CONFIG_DIR)) {
        fs_1.default.mkdirSync(CONFIG_DIR, { recursive: true });
    }
}
function loadConfig() {
    ensureConfigDir();
    if (!fs_1.default.existsSync(CONFIG_FILE)) {
        return { ...DEFAULT_CONFIG };
    }
    try {
        const data = fs_1.default.readFileSync(CONFIG_FILE, 'utf-8');
        const parsed = JSON.parse(data);
        return { ...DEFAULT_CONFIG, ...parsed };
    }
    catch (error) {
        console.warn('Failed to parse config file, using defaults');
        return { ...DEFAULT_CONFIG };
    }
}
function saveConfig(config) {
    ensureConfigDir();
    try {
        fs_1.default.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    }
    catch (error) {
        throw new Error(`Failed to save config: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
function clearConfig() {
    if (fs_1.default.existsSync(CONFIG_FILE)) {
        fs_1.default.unlinkSync(CONFIG_FILE);
    }
}
