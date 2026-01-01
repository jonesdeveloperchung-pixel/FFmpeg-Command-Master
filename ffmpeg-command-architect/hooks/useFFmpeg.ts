import { useState, useMemo, useCallback, useEffect } from 'react';
import { FFmpegState, INITIAL_STATE, AIAdvice, Preset, HistoryItem } from '../types';
import { buildFFmpegCommand, FFmpegCommandBuilder } from '../services/commandBuilder';
import { geminiService } from '../services/geminiService';
import { ollamaService } from '../services/ollamaService';
import { parseFFmpegProgress, FFmpegProgress } from '../services/ffmpegParser';

export const useFFmpeg = () => {
  const [state, setState] = useState<FFmpegState>(INITIAL_STATE);
  const [historyStack, setHistoryStack] = useState<FFmpegState[]>([INITIAL_STATE]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // UI & AI State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<AIAdvice | null>(null);
  const [ollamaModels, setOllamaModels] = useState<any[]>([]);
  const [ollamaServers, setOllamaServers] = useState<string[]>(['http://127.0.0.1:11434']);
  
  // Data States
  const [presets, setPresets] = useState<Preset[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  // Execution State
  const [isExecuting, setIsExecuting] = useState(false);
  const [progress, setProgress] = useState<Partial<FFmpegProgress> | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [ffmpegVersion, setFfmpegVersion] = useState<string>('Loading...');
  const [settings, setSettings] = useState<any[]>([]);
  const [availableEncoders, setAvailableEncoders] = useState<any>({});

  const fetchPresets = useCallback(async () => {
    if (window.electron) {
      const data = await window.electron.getPresets();
      setPresets(data);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    if (window.electron) {
      const data = await window.electron.getHistory();
      setHistory(data);
    }
  }, []);

  const fetchOllamaModels = useCallback(async () => {
    if (!state.ollamaServer) return;
    const models = await ollamaService.getModels(state.ollamaServer);
    setOllamaModels(models);
  }, [state.ollamaServer]);

  const fetchFFmpegVersion = useCallback(async () => {
    if (window.electron) {
      const version = await window.electron.getFFmpegVersion();
      setFfmpegVersion(version);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    if (window.electron) {
      const data = await window.electron.getSettings();
      setSettings(data);
      
      const updates: Partial<FFmpegState> = {};
      const aiSource = data.find((s: any) => s.key === 'aiSource')?.value;
      const ollamaServer = data.find((s: any) => s.key === 'ollamaServer')?.value;
      const ollamaModel = data.find((s: any) => s.key === 'ollamaModel')?.value;
      const serversStr = data.find((s: any) => s.key === 'ollamaServers')?.value;
      
      if (aiSource) updates.aiSource = aiSource as any;
      if (ollamaServer) updates.ollamaServer = ollamaServer;
      if (ollamaModel) updates.ollamaModel = ollamaModel;
      if (serversStr) setOllamaServers(serversStr.split(',').map(s => s.trim()));
      
      if (Object.keys(updates).length > 0) {
        setState(prev => ({ ...prev, ...updates }));
      }
    }
  }, []);

  const updateAppSetting = async (key: string, value: string) => {
    if (window.electron) {
      await window.electron.updateSetting(key, value);
      await fetchSettings();
      if (key === 'ffmpegPath') {
        fetchFFmpegVersion();
        detectEncoders();
      }
    }
  };

  const detectEncoders = useCallback(async () => {
    if (window.electron) {
      const encoders = await window.electron.getEncoders();
      setAvailableEncoders(encoders);
    }
  }, []);

  const saveCurrentAsPreset = async (name: string) => {
    if (window.electron) {
      await window.electron.savePreset(name, state);
      await fetchPresets();
    }
  };

  useEffect(() => {
    fetchPresets();
    fetchHistory();
    fetchOllamaModels();
    fetchSettings();
    detectEncoders();
    fetchFFmpegVersion();
    
    if (window.electron) {
      window.electron.onFFmpegProgress((data) => {
        const p = parseFFmpegProgress(data);
        if (p) setProgress(prev => ({ ...prev, ...p }));
      });
    }
  }, [fetchPresets, fetchHistory, fetchOllamaModels, fetchFFmpegVersion, fetchSettings, detectEncoders]);

  const updateState = useCallback((updates: Partial<FFmpegState>) => {
    setState(prev => {
      const newState = { ...prev, ...updates };
      const newStack = historyStack.slice(0, historyIndex + 1);
      newStack.push(newState);
      setHistoryStack(newStack.length > 50 ? newStack.slice(1) : newStack);
      setHistoryIndex(newStack.length > 50 ? 49 : newStack.length - 1);
      return newState;
    });
  }, [historyStack, historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setState(historyStack[prevIndex]);
    }
  };

  const redo = () => {
    if (historyIndex < historyStack.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setState(historyStack[nextIndex]);
    }
  };

  const generatedCommand = useMemo(() => {
    return buildFFmpegCommand(state);
  }, [state]);

  useEffect(() => {
    const builder = new FFmpegCommandBuilder(state);
    setWarnings(builder.validate());
  }, [state]);

  const execute = async () => {
    if (!window.electron) {
      setLastError("Electron API not found. Please ensure you are running the app through Electron.");
      return;
    }

    setIsExecuting(true);
    setLastError(null);
    setProgress({ percent: 0 });

    try {
      if (state.inputFiles.length > 1) {
        let completed = 0;
        for (const file of state.inputFiles) {
          if (!file) continue;
          const batchState = { 
            ...state, 
            inputFiles: [file],
            outputFile: state.outputFile.replace(/(\.[\w\d]+)$/, `_${completed + 1}$1`)
          };
          const builder = new FFmpegCommandBuilder(batchState);
          const args = builder.buildArgs();
          const result = await window.electron.executeFFmpeg(args);
          if (result.code !== 0) {
            setLastError(`Batch failed at file ${completed + 1}: ${result.stderr}`);
            if (!state.parallel) break;
          }
          completed++;
          setProgress({ percent: Math.round((completed / state.inputFiles.length) * 100) });
        }
      } else {
        const builder = new FFmpegCommandBuilder(state);
        const args = builder.buildArgs();
        const result = await window.electron.executeFFmpeg(args);
        if (result.code !== 0) {
          setLastError(result.stderr);
        } else {
          setProgress({ percent: 100 });
        }
      }
    } catch (err) {
      setLastError(String(err));
    } finally {
      setIsExecuting(false);
      fetchHistory();
    }
  };

  const askAI = async (prompt: string) => {
    if (!prompt.trim()) return;
    setAiLoading(true);
    try {
      let advice;
      if (state.aiSource === 'gemini') {
        advice = await geminiService.getFFmpegAdvice(prompt, state);
      } else {
        advice = await ollamaService.getFFmpegAdvice(prompt, state, state.ollamaModel, state.ollamaServer);
      }
      setAiAdvice(advice);
    } catch (error) {
      console.error(error);
    } finally {
      setAiLoading(false);
    }
  };

  const applyAIAdvice = (fullOverride: boolean = false) => {
    if (!aiAdvice) return;

    if (fullOverride) {
      updateState({
        aiOverride: true,
        aiCommand: aiAdvice.command
      });
    } else if (aiAdvice.suggestedState) {
      updateState({
        ...aiAdvice.suggestedState,
        aiOverride: false
      });
    }
    setAiAdvice(null);
  };

  const reset = () => {
    setState(INITIAL_STATE);
    setAiAdvice(null);
  };

  const loadMetadata = useCallback(async (path: string) => {
    if (!window.electron || !path) return;
    try {
      const data = await window.electron.getMetadata(path);
      setMetadata(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (state.inputFiles[0]) {
      loadMetadata(state.inputFiles[0]);
    }
  }, [state.inputFiles[0], loadMetadata]);

  return {
    state,
    updateState,
    generatedCommand,
    aiLoading,
    aiAdvice,
    askAI,
    applyAIAdvice,
    setAiAdvice,
    reset,
    execute,
    isExecuting,
    progress,
    lastError,
    warnings,
    metadata,
    presets,
    history,
    ollamaModels,
    ollamaServers,
    settings,
    availableEncoders,
    ffmpegVersion,
    saveCurrentAsPreset,
    fetchPresets,
    fetchHistory,
    fetchOllamaModels,
    updateAppSetting,
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < historyStack.length - 1,
    loadPreset: (preset: Preset) => {
      try {
        const config = JSON.parse(preset.config_json);
        updateState(config);
      } catch (e) {
        console.error("Failed to load preset", e);
      }
    }
  };
};