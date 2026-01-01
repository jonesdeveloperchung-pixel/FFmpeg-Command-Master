import { AIAdvice, FFmpegState } from '../types';

const API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY || (process as any).env?.GEMINI_API_KEY;

export const geminiService = {
  async getFFmpegAdvice(prompt: string, currentState: FFmpegState): Promise<AIAdvice> {
    if (!API_KEY) {
      console.error("Missing Gemini API Key");
      return {
        command: "ffmpeg -i input.mp4 output.mp4",
        explanation: "API Key is missing. Please check your .env.local file.",
        keyCategories: ["Error"]
      };
    }

    const systemPrompt = `
      You are the "FFmpeg Command Architect", a world-class expert in media processing.
      The user wants to perform a task. Your goal is to provide the perfect FFmpeg command and explain why.

      CURRENT STATE:
      ${JSON.stringify(currentState, null, 2)}

      RULES:
      1. Always return a valid JSON object.
      2. The JSON should have these fields:
         - command: The full FFmpeg string.
         - explanation: A concise explanation of what the flags do (in Traditional Chinese if requested or appropriate).
         - keyCategories: Array of categories like "Video", "Filter", "Speed".
         - suggestedState: (Optional) A partial FFmpegState object that can be merged into the current state to reflect your suggestions in the UI.
      3. Prefer modern codecs (H.264/H.265) unless otherwise specified.
      4. Use array-style thinking for paths, but return a string for the 'command' field.
      5. Language: Use Traditional Chinese (zh-TW) for the explanation.

      EXAMPLE OUTPUT:
      {
        "command": "ffmpeg -i input.mp4 -vf scale=1280:720 -c:v libx264 -crf 23 output.mp4",
        "explanation": "使用 scale 濾鏡將解析度調整為 720p，並使用 libx264 編碼器以 CRF 23 維持良好品質。",
        "keyCategories": ["Scaling", "Encoding"],
        "suggestedState": {
          "videoFilters": "scale=1280:720",
          "videoCodec": "libx264"
        }
      }
    `;

      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: systemPrompt + "\n\nUser Request: " + prompt
              }]
            }],
            generationConfig: {
              response_mime_type: "application/json"
            }
          })
        });

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (text) {
          return JSON.parse(text) as AIAdvice;
        } else {
          throw new Error("Empty response from Gemini");
        }
      } catch (error) {
        console.error("AI Service Error:", error);
        return {
          command: "ffmpeg -i input.mp4 output.mp4",
          explanation: "無法連線至 AI 服務。請稍後再試。",
          keyCategories: ["Error"]
        };
      }
    }
};