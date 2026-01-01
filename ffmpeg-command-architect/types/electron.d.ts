export interface IElectronAPI {
  executeFFmpeg: (args: string[]) => Promise<{ code: number; stderr: string }>;
  openFileDialog: (multiple?: boolean) => Promise<string[]>;
  openSaveDialog: () => Promise<string>;
  getFFmpegVersion: () => Promise<string>;
  getMetadata: (path: string) => Promise<any>;
  getEncoders: () => Promise<any>;
  getHistory: () => Promise<any[]>;
  savePreset: (name: string, config: any) => Promise<any>;
  getPresets: () => Promise<any[]>;
  getSettings: () => Promise<any[]>;
  updateSetting: (key: string, value: string) => Promise<any>;
  ollamaRequest: (options: { url: string, method: string, body?: any }) => Promise<{ ok: boolean, data?: any, error?: string }>;
  onFFmpegProgress: (callback: (data: string) => void) => void;
}

declare global {
  interface Window {
    electron: IElectronAPI;
  }
}