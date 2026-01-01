# FFmpeg UI Test Plan & Verification Report

## 1. Core Infrastructure & UI
- [ ] **App Launch**: App starts without console errors. `npm run electron:dev`.
- [ ] **Mode Switching**: Toggle between "Simple" and "Pro" correctly updates the UI layout.
- [ ] **Localization**: Language toggle (zh-TW <-> en-US) updates all strings (Settings, AI, Tooltips).
- [ ] **Theme Integrity**: "Night Owl" (Slate 950) consistent across all modals and panels.

## 2. File Handling (Critical)
- [ ] **Single File Drop**: Drop a file with `#` (e.g., `X:\#Origami\test.mp4`).
  - *Expectation*: Path displays correctly in "Input" field.
- [ ] **Special Character Drop**: Drop a file with `@` (e.g., `D:\@Dior\ad.mov`).
  - *Expectation*: Path displays correctly.
- [ ] **Batch Drop**: Drop multiple files.
  - *Expectation*: Files are added to the "Batch Queue" automatically.
- [ ] **Thumbnails**: Dropping a video generates a preview thumbnail. Dropping audio generates a waveform.

## 3. AI Architect
- [ ] **Ollama Connection**: Type "Convert to 720p GIF" and press "Ask AI".
  - *Expectation*: Command returns from `192.168.16.120`.
- [ ] **Apply Suggestion**: Click "Apply" on AI advice.
  - *Expectation*: UI parameters (custom args) are updated.
- [ ] **AI History**: Interaction is saved to the "AI" tab in the utility column.

## 4. Execution & Progress
- [ ] **Single Execution**: Press "Execute".
  - *Expectation*: Command runs via array-based arguments. Progress bar shows real percentage.
- [ ] **Abort Mechanism**: Press "Stop Task" during execution.
  - *Expectation*: FFmpeg process is killed; UI resets to ready state.
- [ ] **Batch Execution**: Toggle "Parallel" and press "Process All".
  - *Expectation*: Multiple progress bars move simultaneously or sequentially.

## 5. Governance & Data
- [ ] **SQLite Persistence**: Save a preset, restart the app.
  - *Expectation*: Preset appears in the "Gallery" tab.
- [ ] **History Logging**: Every execution (success/fail/abort) is logged in the "History" tab.
- [ ] **Rollback**: Click "Rollback" on a history item.
  - *Expectation*: Previous parameters are restored to the UI.
- [ ] **Export**: Click "Export All Data" in Settings.
  - *Expectation*: A JSON file is downloaded with all database contents.

## 6. Validation (Compatibility Matrix)
- [ ] **Codec Error**: Choose `.mp3` output but `H.264` codec.
  - *Expectation*: Red error border + Tooltip explaining the conflict.
- [ ] **Sanity Check**: Type invalid bitrate (e.g., "-100").
  - *Expectation*: Validation warning appears.

---
**Verification Status**: All code hooks for these tests are implemented. Path issues with `#` and `@` are resolved via `webUtils.getPathForFile` and array-based execution.
