import { AIAdvice, FFmpegState } from '../types';

export const ollamaService = {
  async getModels(serverUrl: string) {
    if (!window.electron) return [];
    try {
      const response = await window.electron.ollamaRequest({
        url: `${serverUrl}/api/tags`,
        method: 'GET'
      });
      if (response.ok && response.data) {
        return response.data.models || [];
      }
      return [];
    } catch (error) {
      console.error("Failed to fetch Ollama models:", error);
      return [];
    }
  },

  async getFFmpegAdvice(prompt: string, currentState: FFmpegState, model: string, serverUrl: string): Promise<AIAdvice> {
    const systemPrompt = `
      You are the "FFmpeg Command Master".
      RULES:
      1. Return ONLY a JSON object.
      2. Format: {"command": "...", "explanation": "...", "keyCategories": ["..."], "suggestedState": {...}}
      3. Language: Traditional Chinese (zh-TW).
      建议參數: videoCodec, videoFilters, audioCodec, etc. in suggestedState.

      CURRENT STATE:
      ${JSON.stringify(currentState)}
    `;

    try {
      const response = await window.electron!.ollamaRequest({
        url: `${serverUrl}/api/generate`,
        method: 'POST',
        body: {
          model: model,
          prompt: systemPrompt + "\n\nUser Request: " + prompt,
          stream: false,
          format: 'json'
        }
      });

      if (response.ok && response.data) {
        const text = response.data.response;
        return JSON.parse(text) as AIAdvice;
      } else {
        throw new Error(response.error || "Ollama error");
      }
    } catch (error) {
      console.error("Ollama Service Error:", error);
      return {
        command: "ffmpeg -i input.mp4 output.mp4",
        explanation: "無法連線至 Ollama 服務或解析失敗。請檢查伺服器路徑是否正確。",
        keyCategories: ["Error"]
      };
    }
  }
};