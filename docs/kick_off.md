# 📑 FFmpeg UI/UX Kickoff Specifications

## 1. Functional Specifications
- **Feature Scope Matrix**
  - Supported Codecs: H.264 (libx264), H.265 (libx265), VP9, AV1, AAC, MP3, FLAC, Opus
  - Filters: scale, crop, fps, overlay, audio normalize (loudnorm), volume adjust
  - Hardware Acceleration: NVENC (NVIDIA), QSV (Intel), AMF (AMD) - Auto-detected via `ffmpeg -encoders`
  - Containers: MP4, MKV, WebM, MOV, GIF, MP3, WAV
  - Batch Processing: Queue system for processing multiple files sequentially or in parallel.
  - Environment Management: UI for configuring the `ffmpeg` and `ffprobe` executable paths.
- **Preset Library Definition**
  - JSON schema: `{ name: string, description: string, parameters: Record<string, any>, tags: string[], version: string }`
  - Example: `"YouTube Export" → { codec: "h264", bitrate: "8M", audio: "aac", format: "mp4" }`
- **AI Architect Flow**
  - Local default: Ollama (Endpoint: `http://192.168.16.90:11434`, Model: `llama3` or `mistral`)
  - Cloud fallback: Gemini (Model: `gemini-1.5-flash`)
  - Decision matrix:  
    - Quick/local tasks → Ollama (Privacy prioritized)
    - Complex transformations / Filter graphs → Gemini (Advanced reasoning)
    - Offline mode → Ollama only (Graceful fallback if IP unreachable)
- **Command Execution Rules**
  - Validate before execution: Check if input path exists and output path is writable.
  - Log command string + timestamp + result in SQLite.
  - Rollback: If execution fails, provide a "Revert to Last Working Config" button.
- **Error Handling**
  - Inline validation: Red border on invalid inputs (e.g., negative bitrate).
  - Retry prompt: "Ollama is unreachable. Switch to Gemini?"
  - FFmpeg stderr parsing: Map common errors (e.g., "Invalid data found") to user-friendly messages.

---

## 2. UX Specifications
- **User Journeys**
  - Beginner: Drag file → choose preset (e.g., "Small File Size") → Click "Execute"
  - Pro: Open "Professional Mode" → Manually set CRF/Presets → Add custom filters → Click "Execute"
- **Wireframes & Mockups**
  - Low‑fidelity: 2-column layout (Left: Configuration Panels, Right: AI/Preview)
  - High‑fidelity: Tailwind Slate-950 theme, Lucide-react icons, Monospace terminal output
- **Accessibility Standards**
  - WCAG 2.1 AA compliance (Contrast check for Green-400 on Slate-950)
  - Keyboard navigation: `Tab` to cycle controls, `Cmd/Ctrl + Enter` to start execution
- **Localization Flow**
  - i18n framework: `react-i18next`
  - Bundles: `zh-TW.json` (Default), `en-US.json`
- **Onboarding Guides**
  - "Interactive Overlay": Highlights the "AI Architect" for new users.

---

## 3. Data & Storage Specifications
- **SQLite Schema (Table Definitions)**
  ```sql
  CREATE TABLE presets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    config_json TEXT NOT NULL, -- Stringified FFmpegState
    is_system_preset INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    command TEXT NOT NULL,
    status TEXT CHECK(status IN ('success', 'failed', 'running')),
    stderr TEXT,
    output_path TEXT,
    execution_time_ms INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE preferences (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE ai_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prompt TEXT NOT NULL,
    response_command TEXT,
    explanation TEXT,
    source TEXT, -- 'ollama' or 'gemini'
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  ```
- **Migration Strategy**
  - Use `knex` or similar for versioned schema migrations.
- **Backup & Restore**
  - "Export All Data" button generates a `.zip` containing the `database.sqlite` and a `settings.json`.

---

## 4. Governance & QA Specifications
- **Traceability Matrix**
  - AI Command Generation → User Approval → Execution Log → File Result.
- **Testing Plan**
  - Unit tests: `services/geminiService.ts`, `services/commandBuilder.ts`
  - Integration tests: `ffmpeg-cli` wrapper mock tests.
- **Contributor Workflow**
  - Pre-commit hooks: `npm run lint && npm run type-check`
- **Rollback Guides**
  - `git revert` instructions for breaking changes.

---

## 5. Deployment & Performance Specifications
- **Packaging Targets**
  - Electron for Win32 (Initial Target)
- **Performance Benchmarks**
  - UI Responsiveness: Input changes update the command preview in < 50ms.
  - Startup: App visible in < 1.5s.
- **Offline Mode**
  - Local SQLite and Ollama proxy ensure 100% functionality without internet.
  - Development: `vite.config.ts` configured with `proxy` to handle CORS for remote Ollama servers (e.g., `192.168.16.90`).

---

## 6. Visual & Interaction Assets
- **Design Tokens**
  - `primary`: `blue-500`, `bg`: `slate-950`, `surface`: `slate-900`, `text`: `slate-200`
- **Localization Example (zh-TW)**
  ```json
  {
    "ui": {
      "simple_mode": "簡易模式",
      "professional_mode": "進階模式",
      "execute": "開始執行",
      "copy_command": "複製指令",
      "input_file": "輸入檔案",
      "output_file": "輸出檔案"
    },
    "ai": {
      "placeholder": "請問你想如何處理媒體檔案？例如：將影片縮小到 720p 供 Line 傳送",
      "ask_button": "詢問 AI 建築師"
    }
  }
  ```
- **Preview Panel Specs**
  - Video: FFprobe-driven thumbnail extraction (1st frame).
  - Audio: Dynamic peak meter during execution (if possible via stderr parsing).

---