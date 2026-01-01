
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  executeFFmpeg: (args) => ipcRenderer.invoke('execute-ffmpeg', args),
  openFileDialog: (multiple) => ipcRenderer.invoke('open-file-dialog', multiple),
  openSaveDialog: () => ipcRenderer.invoke('open-save-dialog'),
  getFFmpegVersion: () => ipcRenderer.invoke('get-ffmpeg-version'),
  getMetadata: (path) => ipcRenderer.invoke('get-metadata', path),
  getEncoders: () => ipcRenderer.invoke('get-encoders'),
  getHistory: () => ipcRenderer.invoke('db-get-history'),
  savePreset: (name, config) => ipcRenderer.invoke('db-save-preset', { name, config }),
  getPresets: () => ipcRenderer.invoke('db-get-presets'),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSetting: (key, value) => ipcRenderer.invoke('update-setting', { key, value }),
  ollamaRequest: (options) => ipcRenderer.invoke('ollama-request', options),
  onFFmpegProgress: (callback) => 
    ipcRenderer.on('ffmpeg-progress', (_event, data) => callback(data)),
});
