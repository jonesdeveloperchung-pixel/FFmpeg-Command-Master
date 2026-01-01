import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let db: any = null;

function createWindow() {
  const preloadPath = path.resolve(__dirname, 'preload.mjs');
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: '#020617',
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

// Database Initialization
function initDb() {
  const dbPath = path.join(app.getPath('userData'), 'ffmpeg_architect.db');
  db = new Database(dbPath);
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      command TEXT NOT NULL,
      status TEXT,
      stderr TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS presets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      config_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  const stmt = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  stmt.run('ffmpegPath', 'ffmpeg');
  stmt.run('ffprobePath', 'ffprobe');
  stmt.run('ollamaServers', 'http://127.0.0.1:11434'); // Default local
}

function getSetting(key: string) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : null;
}

app.whenReady().then(() => {
  initDb();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// File Dialogs
ipcMain.handle('open-file-dialog', async (event, multiple = false) => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: multiple ? ['openFile', 'multiSelections'] : ['openFile']
  });
  return result.filePaths;
});

ipcMain.handle('open-save-dialog', async () => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    properties: ['showOverwriteConfirmation']
  });
  return result.filePath;
});

// FFmpeg Execution IPC
ipcMain.handle('execute-ffmpeg', async (event, args: string[]) => {
  const ffmpegPath = getSetting('ffmpegPath') || 'ffmpeg';
  return new Promise((resolve) => {
    const ffmpeg = spawn(ffmpegPath, args);
    let stderr = '';

    ffmpeg.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      mainWindow?.webContents.send('ffmpeg-progress', output);
    });

    ffmpeg.on('close', (code) => {
      const status = code === 0 ? 'success' : 'failed';
      try {
        db.prepare('INSERT INTO history (command, status, stderr) VALUES (?, ?, ?)')
          .run(`ffmpeg ${args.join(' ')}`, status, stderr);
      } catch (e) {
        console.error("DB Error:", e);
      }
      resolve({ code, stderr });
    });
  });
});

ipcMain.handle('get-ffmpeg-version', async () => {
  const ffmpegPath = getSetting('ffmpegPath') || 'ffmpeg';
  return new Promise((resolve) => {
    try {
      const ffmpeg = spawn(ffmpegPath, ['-version']);
      let output = '';
      ffmpeg.stdout.on('data', (data) => output += data.toString());
      ffmpeg.on('close', () => {
        const match = output.match(/ffmpeg version ([^\s,]+)/);
        resolve(match ? match[1] : 'Unknown Version');
      });
      ffmpeg.on('error', () => resolve('FFmpeg not found'));
    } catch (e) {
      resolve('Error');
    }
  });
});

ipcMain.handle('get-metadata', async (event, filePath: string) => {
  const ffprobePath = getSetting('ffprobePath') || 'ffprobe';
  return new Promise((resolve) => {
    const ffprobe = spawn(ffprobePath, [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      filePath
    ]);
    let output = '';
    ffprobe.stdout.on('data', (data) => output += data.toString());
    ffprobe.on('close', (code) => {
      try {
        resolve(code === 0 ? JSON.parse(output) : null);
      } catch (e) {
        resolve(null);
      }
    });
  });
});

ipcMain.handle('get-encoders', async () => {
  const ffmpegPath = getSetting('ffmpegPath') || 'ffmpeg';
  return new Promise((resolve) => {
    const ffmpeg = spawn(ffmpegPath, ['-encoders']);
    let output = '';
    ffmpeg.stdout.on('data', (data) => output += data.toString());
    ffmpeg.on('close', () => {
      const encoders = {
        nvenc: output.includes('nvenc'),
        qsv: output.includes('qsv'),
        amf: output.includes('amf'),
        vaapi: output.includes('vaapi'),
        videotoolbox: output.includes('videotoolbox')
      };
      resolve(encoders);
    });
  });
});

// Settings IPC
ipcMain.handle('get-settings', () => {
  return db.prepare('SELECT * FROM settings').all();
});

ipcMain.handle('update-setting', (event, { key, value }) => {
  return db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
});

// Database IPC
ipcMain.handle('db-get-history', () => {
  return db.prepare('SELECT * FROM history ORDER BY timestamp DESC LIMIT 50').all();
});

ipcMain.handle('db-save-preset', (event, { name, config }) => {
  return db.prepare('INSERT INTO presets (name, config_json) VALUES (?, ?)')
    .run(name, JSON.stringify(config));
});

ipcMain.handle('db-get-presets', () => {
  return db.prepare('SELECT * FROM presets').all();
});

// Ollama Proxy (Main Process side to avoid CORS)
ipcMain.handle('ollama-request', async (event, { url, method, body }) => {
  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await response.json();
    return { ok: response.ok, data };
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
});