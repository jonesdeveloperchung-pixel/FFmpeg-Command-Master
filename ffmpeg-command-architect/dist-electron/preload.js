import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("electron", {
  executeFFmpeg: (args) => ipcRenderer.invoke("execute-ffmpeg", args),
  getMetadata: (path) => ipcRenderer.invoke("get-metadata", path),
  getEncoders: () => ipcRenderer.invoke("get-encoders"),
  getHistory: () => ipcRenderer.invoke("db-get-history"),
  savePreset: (name, config) => ipcRenderer.invoke("db-save-preset", { name, config }),
  getPresets: () => ipcRenderer.invoke("db-get-presets"),
  onFFmpegProgress: (callback) => ipcRenderer.on("ffmpeg-progress", (_event, data) => callback(data))
});
