import { app as c, BrowserWindow as g, ipcMain as s, dialog as h } from "electron";
import E from "path";
import { fileURLToPath as S } from "url";
import { spawn as d } from "child_process";
import I from "better-sqlite3";
const v = S(import.meta.url), m = E.dirname(v);
let p = null, a = null;
function T() {
  const r = E.resolve(m, "preload.mjs");
  p = new g({
    width: 1280,
    height: 800,
    backgroundColor: "#020617",
    webPreferences: {
      preload: r,
      nodeIntegration: !1,
      contextIsolation: !0
    }
  }), process.env.VITE_DEV_SERVER_URL ? p.loadURL(process.env.VITE_DEV_SERVER_URL) : p.loadFile(E.join(m, "../dist/index.html"));
}
function w() {
  const r = E.join(c.getPath("userData"), "ffmpeg_architect.db");
  a = new I(r), a.exec(`
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
  const e = a.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)");
  e.run("ffmpegPath", "ffmpeg"), e.run("ffprobePath", "ffprobe"), e.run("ollamaServers", "http://127.0.0.1:11434");
}
function u(r) {
  const e = a.prepare("SELECT value FROM settings WHERE key = ?").get(r);
  return e ? e.value : null;
}
c.whenReady().then(() => {
  w(), T(), c.on("activate", () => {
    g.getAllWindows().length === 0 && T();
  });
});
c.on("window-all-closed", () => {
  process.platform !== "darwin" && c.quit();
});
s.handle("open-file-dialog", async (r, e = !1) => (await h.showOpenDialog(p, {
  properties: e ? ["openFile", "multiSelections"] : ["openFile"]
})).filePaths);
s.handle("open-save-dialog", async () => (await h.showSaveDialog(p, {
  properties: ["showOverwriteConfirmation"]
})).filePath);
s.handle("execute-ffmpeg", async (r, e) => {
  const n = u("ffmpegPath") || "ffmpeg";
  return new Promise((o) => {
    const t = d(n, e);
    let i = "";
    t.stderr.on("data", (l) => {
      const f = l.toString();
      i += f, p == null || p.webContents.send("ffmpeg-progress", f);
    }), t.on("close", (l) => {
      const f = l === 0 ? "success" : "failed";
      try {
        a.prepare("INSERT INTO history (command, status, stderr) VALUES (?, ?, ?)").run(`ffmpeg ${e.join(" ")}`, f, i);
      } catch (R) {
        console.error("DB Error:", R);
      }
      o({ code: l, stderr: i });
    });
  });
});
s.handle("get-ffmpeg-version", async () => {
  const r = u("ffmpegPath") || "ffmpeg";
  return new Promise((e) => {
    try {
      const n = d(r, ["-version"]);
      let o = "";
      n.stdout.on("data", (t) => o += t.toString()), n.on("close", () => {
        const t = o.match(/ffmpeg version ([^\s,]+)/);
        e(t ? t[1] : "Unknown Version");
      }), n.on("error", () => e("FFmpeg not found"));
    } catch {
      e("Error");
    }
  });
});
s.handle("get-metadata", async (r, e) => {
  const n = u("ffprobePath") || "ffprobe";
  return new Promise((o) => {
    const t = d(n, [
      "-v",
      "quiet",
      "-print_format",
      "json",
      "-show_format",
      "-show_streams",
      e
    ]);
    let i = "";
    t.stdout.on("data", (l) => i += l.toString()), t.on("close", (l) => {
      try {
        o(l === 0 ? JSON.parse(i) : null);
      } catch {
        o(null);
      }
    });
  });
});
s.handle("get-encoders", async () => {
  const r = u("ffmpegPath") || "ffmpeg";
  return new Promise((e) => {
    const n = d(r, ["-encoders"]);
    let o = "";
    n.stdout.on("data", (t) => o += t.toString()), n.on("close", () => {
      const t = {
        nvenc: o.includes("nvenc"),
        qsv: o.includes("qsv"),
        amf: o.includes("amf"),
        vaapi: o.includes("vaapi"),
        videotoolbox: o.includes("videotoolbox")
      };
      e(t);
    });
  });
});
s.handle("get-settings", () => a.prepare("SELECT * FROM settings").all());
s.handle("update-setting", (r, { key: e, value: n }) => a.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(e, n));
s.handle("db-get-history", () => a.prepare("SELECT * FROM history ORDER BY timestamp DESC LIMIT 50").all());
s.handle("db-save-preset", (r, { name: e, config: n }) => a.prepare("INSERT INTO presets (name, config_json) VALUES (?, ?)").run(e, JSON.stringify(n)));
s.handle("db-get-presets", () => a.prepare("SELECT * FROM presets").all());
s.handle("ollama-request", async (r, { url: e, method: n, body: o }) => {
  try {
    const t = await fetch(e, {
      method: n,
      headers: { "Content-Type": "application/json" },
      body: o ? JSON.stringify(o) : void 0
    }), i = await t.json();
    return { ok: t.ok, data: i };
  } catch (t) {
    return { ok: !1, error: t.message };
  }
});
