# FFmpeg UI/UX Design Specification

## 1. Design Philosophy
The goal is to transform the complex FFmpeg CLI into a professional, intuitive, and educational GUI.  
- **Visual over Syntax:** Replace cryptic flags with meaningful labels, sliders, toggles, and dropdowns.  
- **Guided Experience:**  
  - **Simple Mode:** Minimal controls, smart defaults, and contextual tooltips for beginners.  
  - **Professional Mode:** Full access to advanced parameters, grouped logically with inline documentation.  
- **AI-First:** Integrate Gemini AI (cloud) and Ollama (local default) to handle natural language requests for complex media transformations.  
- **Governance & Traceability:** Every transformation is traceable, with a changelog and rollback-ready presets. Every execution is logged in SQLite for auditability.
- **Educational Overlay:** Inline “Why this matters” tooltips explaining FFmpeg concepts (e.g., CRF, GOP size) to turn the tool into a learning platform.
- **System Intelligence:** Automatic detection of hardware acceleration (NVENC, QSV, AMF) to optimize encoding performance based on the user's GPU.
- **Environment Management:** Dedicated settings to manage FFmpeg binary paths and verify tool versions (e.g., v7.0.1).
- **Localization Priority:** Default language is **Traditional Chinese (Taiwan)**, with **English** as a secondary option for international contributors.  

---

## 2. Visual Design
- **Theme:** "Night Owl" (Slate 950 background) for focus and reduced eye strain.  
- **Color Palette:**  
  - Background: `#020617` (Slate 950)  
  - Surface: `#0f172a` (Slate 900) with subtle borders (`#1e293b`)  
  - Primary Accent: `#3b82f6` (Blue 500) for buttons and active states  
  - Success/Terminal: `#4ade80` (Green 400) for generated command text  
  - Warning/Error: `#f87171` (Red 400) for invalid inputs or failed executions  
- **Components:**  
  - Rounded corners (12px–16px) for modern feel  
  - Backdrop blur on sticky elements (Header, Footer)  
  - Lucide Icons for visual cues (e.g., play, stop, file, wand for AI)  
  - **Accessibility:** WCAG-compliant contrast ratios, keyboard navigation, ARIA labels  
  - **Localization:** All UI strings default to Traditional Chinese (Taiwan), with toggle for English fallback.  

---

## 3. Layout Structure
- **Global Header:**  
  - Branding/logo  
  - Global Mode Toggle (Simple/Pro)  
  - Language Toggle (Traditional Chinese ↔ English)  
  - Quick-access “Docs” and “Feedback” buttons  
- **Main View (2-Column Grid):**  
  - **Left (Config):** Scrollable grouped sections with collapsible panels:  
    - IO Settings (Input/Output paths, drag-and-drop file zone)  
    - Batch Queue Panel: Manage multiple files for sequential or parallel processing with shared settings.
    - Video (Codec, Bitrate, Resolution, Filters, Hardware Acceleration toggle)  
    - Audio (Codec, Bitrate, Channels, Normalize option)  
    - Timing & Metadata (SS, T, TO, custom metadata injection)  
  - **Right (Utility):**  
    - **AI Architect:** Natural language prompt box with history and “Apply to Config” button  
    - **Presets/Tips:** Quick-access “recipes” (e.g., “YouTube export”, “GIF loop”, “Podcast audio”)  
    - **Preview Panel:** Thumbnail or waveform preview for validation before execution  
- **Sticky Footer:**  
  - Live Command Preview (syntax-highlighted FFmpeg string, copyable)  
  - Action Buttons: Copy, Reset, Execute, Save Preset  
  - Execution Status: Progress bar + logs  

---

## 4. Interaction Features
- **Real-time Synchronization:** Every UI change reflects in the command string instantly.  
- **Smart Defaults:** Intelligent auto-filling of output paths based on input file name and format.  
- **AI Feedback Loop:** AI-generated commands can be “Applied” directly to UI controls, ensuring transparency.  
- **Validation Layer & Compatibility Matrix:** Inline error detection (e.g., preventing incompatible codec/container combos like H.264 in a WAV container).  
- **Undo/Redo:** Versioned history of changes for rollback safety.  
- **Onboarding Guides:** Step-by-step walkthrough for first-time users, with tooltips and sample presets.  
- **Localization Awareness:** Tooltips and documentation default to Traditional Chinese, with English fallback.  

---

## 5. Technology Stack (Proposed)
- **Frontend:** React + TypeScript + Vite  
- **Styling:** Tailwind CSS + Headless UI for accessibility patterns  
- **Icons:** Lucide React  
- **LLM Integration:**  
  - **Local Default:** Ollama — runs locally for privacy, offline-first workflows, and contributor-friendly onboarding.  
  - **Cloud Option:** Google Gemini API — for advanced natural language media transformations and collaborative features.  
  - **Fallback Strategy:** If Ollama is unavailable, the system gracefully prompts users to switch to Gemini.  
  - **Traceability:** All AI-generated commands are logged with source attribution (local vs. cloud).  
- **Database:** SQLite as the default database for lightweight, portable, and governance-friendly storage of presets, logs, and user configurations.  
- **State Management:** Zustand or Redux Toolkit for predictable state handling  
- **Command Execution Layer:** Node.js backend wrapper for FFmpeg CLI with error handling and logging  
- **Testing:** Playwright + Jest for UI and integration tests  
- **Packaging:** Electron or Tauri for cross-platform desktop deployment  

---

## 6. Extensibility & Governance
- **Plugin System:** Allow contributors to add new presets or filters as modular plugins.  
- **Traceability:** Every executed command logged with timestamp, parameters, and success/failure state in SQLite.  
- **Rollback Safety:** Failed executions revert to last known good configuration.  
- **Contributor-Friendly Docs:** Inline schema definitions and onboarding guides for developers.  
- **Versioned Presets:** Export/import presets with JSON for sharing across teams.  

---

## 7. Accessibility & Internationalization
- **Keyboard Shortcuts:** For power users (e.g., Ctrl+Enter to execute).  
- **Localization:**  
  - Default language: **Traditional Chinese (Taiwan)**  
  - Secondary language: **English**  
  - i18n framework for seamless switching  
- **Screen Reader Support:** ARIA roles and semantic HTML for non-visual users.  
- **Font Scaling:** Adjustable text size for readability.  

---

## 8. Development Roadmap (Phases)

### Phase 1: Precision Core (Current Focus)
- **Timeline & Trimming UI:** Implement visual controls for `startTime`, `duration`, and `stopTime`.
- **Enhanced Metadata:** Deep integration of `ffprobe` JSON data into the UI.
- **Hardware Profile Sync:** Auto-detect and switch to GPU encoders (NVENC/QSV) on startup.

### Phase 2: User Experience & Resilience
- **Undo/Redo System:** Global state history for configuration changes.
- **Interactive Onboarding:** Step-by-step walkthrough for first-time users.
- **Advanced Validation:** Real-time cross-check of codec/container compatibility.

### Phase 3: Data & Governance
- **Full Data Portability:** Complete Export/Import of SQLite databases (Presets, History, Preferences).
- **Migration Engine:** Formalize database schema versioning.
- **Audit Logs:** Expanded execution logging with full stderr capture.

### Phase 4: Advanced Media Transformation
- **Waveform Preview:** Real-time audio waveform generation for precise trimming.
- **Filter Graph Builder:** Visual node-based or breadcrumb UI for complex filter chains.
- **Batch Optimization:** Parallel execution profiling and CPU limit controls.

### Phase 5: Ecosystem & Distribution

- **FFmpeg Auto-Downloader:** Helper to fetch and verify binary paths.

- **Plugin System:** Support for custom preset packs and filter modules.

- **Packaging:** Production-ready Electron builds for Windows/Mac/Linux.



---



## 9. 當前已知技術限制與挑戰

- **參數衝突：** AI 模式與手動模式的參數合併邏輯仍不夠穩定。

- **路徑轉義：** Windows Shell 對特殊字元（如 `@`）的處理在 `spawn` 中仍有邊界案例問題。

- **併發控制：** 批次執行時的資料庫寫入競爭（Race Condition）尚未完全解決。
