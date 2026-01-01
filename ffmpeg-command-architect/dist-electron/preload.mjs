const { contextBridge: i, ipcRenderer: t } = require("electron");
i.exposeInMainWorld("electron", {
  executeFFmpeg: (e) => t.invoke("execute-ffmpeg", e),
  openFileDialog: (e) => t.invoke("open-file-dialog", e),
  openSaveDialog: () => t.invoke("open-save-dialog"),
  getFFmpegVersion: () => t.invoke("get-ffmpeg-version"),
  getMetadata: (e) => t.invoke("get-metadata", e),
  getEncoders: () => t.invoke("get-encoders"),
  getHistory: () => t.invoke("db-get-history"),
  savePreset: (e, o) => t.invoke("db-save-preset", { name: e, config: o }),
  getPresets: () => t.invoke("db-get-presets"),
  getSettings: () => t.invoke("get-settings"),
  updateSetting: (e, o) => t.invoke("update-setting", { key: e, value: o }),
  ollamaRequest: (e) => t.invoke("ollama-request", e),
  onFFmpegProgress: (e) => t.on("ffmpeg-progress", (o, n) => e(n))
});
