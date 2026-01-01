import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import Database from "better-sqlite3";
const __filename$1 = fileURLToPath(import.meta.url);
const __dirname$1 = path.dirname(__filename$1);
let mainWindow = null;
let db = null;
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: "#020617",
    webPreferences: {
      preload: path.join(__dirname$1, "preload.mjs"),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname$1, "../dist/index.html"));
  }
}
function initDb() {
  const dbPath = path.join(app.getPath("userData"), "ffmpeg_architect.db");
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
  `);
}
app.whenReady().then(() => {
  initDb();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
ipcMain.handle("execute-ffmpeg", async (event, args) => {
  return new Promise((resolve) => {
    const ffmpeg = spawn("ffmpeg", args);
    let stderr = "";
    ffmpeg.stderr.on("data", (data) => {
      const output = data.toString();
      stderr += output;
      mainWindow == null ? void 0 : mainWindow.webContents.send("ffmpeg-progress", output);
    });
    ffmpeg.on("close", (code) => {
      const status = code === 0 ? "success" : "failed";
      try {
        db.prepare("INSERT INTO history (command, status, stderr) VALUES (?, ?, ?)").run(`ffmpeg ${args.join(" ")}`, status, stderr);
      } catch (e) {
        console.error("DB Error:", e);
      }
      resolve({ code, stderr });
    });
  });
});
ipcMain.handle("get-metadata", async (event, filePath) => {
  return new Promise((resolve) => {
    const ffprobe = spawn("ffprobe", [
      "-v",
      "quiet",
      "-print_format",
      "json",
      "-show_format",
      "-show_streams",
      filePath
    ]);
    let output = "";
    ffprobe.stdout.on("data", (data) => output += data.toString());
    ffprobe.on("close", (code) => {
      try {
        resolve(code === 0 ? JSON.parse(output) : null);
      } catch (e) {
        resolve(null);
      }
    });
  });
});
ipcMain.handle("get-encoders", async () => {
  return new Promise((resolve) => {
    const ffmpeg = spawn("ffmpeg", ["-encoders"]);
    let output = "";
    ffmpeg.stdout.on("data", (data) => output += data.toString());
    ffmpeg.on("close", () => resolve(output));
  });
});
ipcMain.handle("db-get-history", () => {
  return db.prepare("SELECT * FROM history ORDER BY timestamp DESC LIMIT 50").all();
});
ipcMain.handle("db-save-preset", (event, { name, config }) => {
  return db.prepare("INSERT INTO presets (name, config_json) VALUES (?, ?)").run(name, JSON.stringify(config));
});
ipcMain.handle("db-get-presets", () => {
  return db.prepare("SELECT * FROM presets").all();
});
