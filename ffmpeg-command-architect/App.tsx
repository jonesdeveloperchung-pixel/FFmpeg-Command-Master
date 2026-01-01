import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Settings2,
  Video,
  Music,
  Clock,
  Zap,
  Sparkles,
  Copy,
  Check,
  ChevronRight,
  Info,
  Trash2,
  FileVideo,
  ExternalLink,
  Cpu,
  Languages,
  LayoutGrid,
  History,
  Save,
  Wand2,
  Undo2,
  Redo2,
  Monitor,
  Maximize,
  Crop,
  Film,
  ShieldAlert,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { Card, FormField } from './components/UI';
import Input from './components/Input';
import Select from './components/Select';
import { Preview } from './components/Preview';
import { useFFmpeg } from './hooks/useFFmpeg';
import zhTW from './locales/zh-TW/translation.json';
import enUS from './locales/en-US/translation.json';

// FAIL-SAFE: Error Boundary Component
export class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-3xl p-8 shadow-2xl animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-xl font-black text-white mb-2">發生非預期錯誤</h1>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              應用程式遇到了無法恢復的 UI 錯誤。這通常是元件定義缺失導致的。
            </p>
            <div className="bg-black/40 p-4 rounded-xl mb-6 text-left">
              <code className="text-[10px] font-mono text-red-400 break-all">
                {this.state.error?.toString()}
              </code>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              重新整理介面
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const App: React.FC = () => {
  const {
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
    updateAppSetting,
    fetchOllamaModels,
    undo,
    redo,
    canUndo,
    canRedo,
    loadPreset
  } = useFFmpeg();

  const [copied, setCopied] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showAiSettings, setShowAiSettings] = useState(false);
  const [showAppSettings, setShowAppSettings] = useState(false);

  const handleSavePreset = async () => {
    const name = window.prompt(state.language === 'zh-TW' ? '請輸入預設集名稱' : 'Enter preset name');
    if (name) {
      await saveCurrentAsPreset(name);
    }
  };

  const handleBrowseInput = async () => {
    if (window.electron) {
      const paths = await window.electron.openFileDialog(true);
      if (paths && paths.length > 0) {
        updateState({ inputFiles: paths });
        // Auto-suggest output path based on first file
        if (paths[0] && !state.outputFile) {
          const suggested = paths[0].replace(/(\.[\w\d]+)$/, '_output$1');
          updateState({ outputFile: suggested });
        }
      }
    }
  };

  const handleBrowseOutput = async () => {
    if (window.electron) {
      const path = await window.electron.openSaveDialog();
      if (path) {
        updateState({ outputFile: path });
      }
    }
  };

  // Simple i18n helper
  const t = (key: string, params?: any) => {
    const keys = key.split('.');
    let result: any = state.language === 'zh-TW' ? zhTW : enUS;
    for (const k of keys) {
      result = result?.[k];
    }
    if (params && typeof result === 'string') {
      Object.keys(params).forEach(p => {
        result = result.replace(`{{${p}}}`, params[p]);
      });
    }
    return result || key;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      {/* Settings Modal */}
      {showAppSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                <Settings2 className="w-6 h-6 text-blue-500" />
                {t('advanced.appSettings')}
              </h2>
              <button onClick={() => setShowAppSettings(false)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                <Trash2 className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="space-y-6">
              <FormField label={t('advanced.ffmpegPath')}>
                <Input 
                  value={settings.find(s => s.key === 'ffmpegPath')?.value || 'ffmpeg'} 
                  onChange={(val) => updateAppSetting('ffmpegPath', val)}
                />
              </FormField>
              <FormField label={t('advanced.ffprobePath')}>
                <Input 
                  value={settings.find(s => s.key === 'ffprobePath')?.value || 'ffprobe'} 
                  onChange={(val) => updateAppSetting('ffprobePath', val)}
                />
              </FormField>

              <FormField label={t('ai.ollamaServer')} description="逗號分隔多個位址 (例如: http://192.168.16.120:11434, http://localhost:11434)">
                <Input 
                  value={ollamaServers.join(', ')} 
                  onChange={(val) => updateAppSetting('ollamaServers', val)}
                  placeholder="http://192.168.16.120:11434"
                />
              </FormField>
              
              <div className="pt-6 border-t border-slate-800">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-4">{t('video.detectedEncoders')}</p>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(availableEncoders).map(([key, available]) => (
                    <div key={key} className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 ${available ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-slate-950/50 border-slate-800 text-slate-600'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${available ? 'bg-green-500' : 'bg-slate-700'}`}></div>
                      <span className="text-[10px] font-bold uppercase tracking-widest">{key}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowAppSettings(false)}
              className="w-full mt-10 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-blue-600/20"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50 px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative p-2.5 bg-slate-900 rounded-xl border border-slate-700/50">
                <Terminal className="w-6 h-6 text-blue-500" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                {t('common.appName')}
                <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 text-[10px] font-bold border border-blue-500/20 uppercase">Pro v2</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                Engine: FFmpeg {ffmpegVersion}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Toggle */}
            <div className="flex p-1 bg-slate-900/50 border border-slate-800 rounded-xl">
              <button
                onClick={() => updateState({ language: 'zh-TW' })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${state.language === 'zh-TW' ? 'bg-slate-800 text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
              >
                中
              </button>
              <button
                onClick={() => updateState({ language: 'en-US' })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${state.language === 'en-US' ? 'bg-slate-800 text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
              >
                EN
              </button>
            </div>

            <div className="flex p-1 bg-slate-900/50 border border-slate-800 rounded-xl">
              <button
                onClick={undo}
                disabled={!canUndo}
                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 disabled:opacity-30 disabled:hover:text-slate-500 transition-all"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 disabled:opacity-30 disabled:hover:text-slate-500 transition-all"
              >
                <Redo2 className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`p-2.5 rounded-xl border transition-all ${
                showHistory ? 'bg-blue-600/10 border-blue-500/50 text-blue-400' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              <History className="w-5 h-5" />
            </button>

            <button
              onClick={() => setShowAppSettings(!showAppSettings)}
              className="p-2.5 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-500 hover:text-blue-400 transition-all"
            >
              <Settings2 className="w-5 h-5" />
            </button>

            <button
              onClick={handleSavePreset}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-all"
            >
              <Save className="w-4 h-4" />
              {t('common.savePreset')}
            </button>

            {/* Mode Toggle */}
            <div className="flex p-1 bg-slate-900/50 border border-slate-800 rounded-xl">
              <button
                onClick={() => updateState({ mode: 'simple' })}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${state.mode === 'simple' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Zap className="w-3.5 h-3.5" />
                {t('common.simpleMode')}
              </button>
              <button
                onClick={() => updateState({ mode: 'professional' })}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${state.mode === 'professional' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Settings2 className="w-3.5 h-3.5" />
                {t('common.proMode')}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Configuration */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* IO Panel */}
          <Card title={t('io.title')} icon={<FileVideo className="w-5 h-5" />}>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label={t('io.inputPath')} description="支援多個檔案。輸入路徑需包含檔名。">
                  <div className="space-y-2">
                    {state.inputFiles.map((file, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input 
                          value={file} 
                          onChange={(val) => {
                            const newFiles = [...state.inputFiles];
                            newFiles[idx] = val;
                            updateState({ inputFiles: newFiles });
                          }}
                          placeholder={t('io.placeholderInput')}
                          onBrowse={idx === 0 ? handleBrowseInput : undefined}
                        />
                        {state.inputFiles.length > 1 && (
                          <button 
                            onClick={() => updateState({ inputFiles: state.inputFiles.filter((_, i) => i !== idx) })}
                            className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button 
                      onClick={() => updateState({ inputFiles: [...state.inputFiles, ''] })}
                      className="text-[10px] font-bold text-blue-500 hover:text-blue-400 uppercase tracking-widest flex items-center gap-1 mt-1"
                    >
                      {t('io.addBatch')}
                    </button>
                  </div>
                </FormField>
                <FormField label={t('io.outputPath')} description="FFmpeg 將在這裡寫入處理後的檔案。">
                  <Input 
                    value={state.outputFile} 
                    onChange={(val) => updateState({ outputFile: val })}
                    placeholder={t('io.placeholderOutput')}
                    onBrowse={handleBrowseOutput}
                  />
                </FormField>
              </div>

              {state.inputFiles.length > 1 && (
                <div className="flex items-center gap-3 p-3 bg-blue-600/5 border border-blue-500/10 rounded-xl">
                  <div className="p-1.5 bg-blue-500/10 rounded-lg">
                    <LayoutGrid className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-300">{t('io.batchActive')}</p>
                    <p className="text-[10px] text-slate-500">{t('io.batchDesc', { count: state.inputFiles.length })}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{t('io.parallel')}</span>
                    <input 
                      type="checkbox"
                      checked={state.parallel}
                      onChange={(e) => updateState({ parallel: e.target.checked })}
                      className="w-4 h-4 rounded-md border-slate-700 bg-slate-900 text-blue-600"
                    />
                  </div>
                </div>
              )}
            </div>
            
            {state.mode === 'professional' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <FormField label={t('io.format')}> 
                  <Select 
                    value={state.format}
                    onChange={(val) => updateState({ format: val })}
                    options={[
                      { value: '', label: 'Auto Detect' },
                      { value: 'mp4', label: 'MP4' },
                      { value: 'mkv', label: 'MKV' },
                      { value: 'webm', label: 'WebM' },
                      { value: 'gif', label: 'GIF' }
                    ]}
                  />
                </FormField>
                <FormField label={t('io.overwrite')}> 
                  <Select 
                    value={state.overwrite || ''}
                    onChange={(val) => updateState({ overwrite: val as any || null })}
                    options={[
                      { value: 'y', label: t('io.overwriteYes') },
                      { value: 'n', label: t('io.overwriteNo') },
                      { value: '', label: t('io.overwriteAsk') }
                    ]}
                  />
                </FormField>
                <FormField label="Hardware Accel" description="使用 GPU 加速。">
                  <Select 
                    value={state.hardwareAccel}
                    onChange={(val) => updateState({ hardwareAccel: val })}
                    options={[
                      { value: 'auto', label: 'Auto Detect' },
                      { value: 'nvenc', label: 'NVIDIA (NVENC)' },
                      { value: 'qsv', label: 'Intel (QSV)' },
                      { value: 'amf', label: 'AMD (AMF)' },
                      { value: 'none', label: 'Software Only' }
                    ]}
                  />
                </FormField>
              </div>
            )}
          </Card>

          {metadata && (
            <div className="bg-blue-600/5 border border-blue-500/10 rounded-2xl p-4 animate-in fade-in duration-500">
              <div className="flex items-center gap-4 text-[10px] font-mono">
                <div className="flex flex-col">
                  <span className="text-slate-500 uppercase">Format</span>
                  <span className="text-blue-400 font-bold">{metadata.format?.format_long_name?.split(',')[0]}</span>
                </div>
                <div className="w-px h-8 bg-slate-800"></div>
                <div className="flex flex-col">
                  <span className="text-slate-500 uppercase">Duration</span>
                  <span className="text-blue-400 font-bold">{Math.round(metadata.format?.duration || 0)}s</span>
                </div>
                <div className="w-px h-8 bg-slate-800"></div>
                <div className="flex flex-col">
                  <span className="text-slate-500 uppercase">Size</span>
                  <span className="text-blue-400 font-bold">{(metadata.format?.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                {metadata.streams?.find((s: any) => s.codec_type === 'video') && (
                  <>
                    <div className="w-px h-8 bg-slate-800"></div>
                    <div className="flex flex-col">
                      <span className="text-slate-500 uppercase">Video</span>
                      <span className="text-blue-400 font-bold">
                        {metadata.streams.find((s: any) => s.codec_type === 'video').width}x
                        {metadata.streams.find((s: any) => s.codec_type === 'video').height} 
                        ({metadata.streams.find((s: any) => s.codec_type === 'video').codec_name})
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Video Card */}
            <Card 
              title={t('video.title')} 
              icon={<Video className="w-5 h-5" />}
              badge={state.disableVideo ? 'VN' : undefined}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/50">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="disableVideo"
                    checked={state.disableVideo}
                    onChange={(e) => updateState({ disableVideo: e.target.checked })}
                    className="w-4 h-4 rounded-md border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500/50"
                  />
                  <label htmlFor="disableVideo" className="text-xs font-bold text-slate-400 uppercase tracking-widest cursor-pointer select-none">
                    {t('video.disable')}
                  </label>
                </div>
                <div className="flex gap-1.5">
                  {availableEncoders.nvenc && <span className="text-[8px] font-black bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded border border-green-500/20">NVENC</span>}
                  {availableEncoders.qsv && <span className="text-[8px] font-black bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded border border-blue-500/20">QSV</span>}
                </div>
              </div>

              <div className={`space-y-4 transition-all duration-300 ${state.disableVideo ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
                <FormField label={t('video.codec')}> 
                  <Select 
                    value={state.videoCodec}
                    onChange={(val) => updateState({ videoCodec: val })}
                    options={[
                      { value: 'libx264', label: 'H.264 (libx264)' },
                      { value: 'libx265', label: 'H.265 (libx265)' },
                      { value: 'libvpx-vp9', label: 'VP9' },
                      { value: 'copy', label: 'Stream Copy' },
                      { value: 'libaom-av1', label: 'AV1' }
                    ]}
                  />
                </FormField>
                {state.mode === 'professional' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField label={t('video.bitrate')}> 
                        <Input 
                          value={state.videoBitrate} 
                          onChange={(val) => updateState({ videoBitrate: val })}
                          placeholder="e.g. 5M"
                        />
                      </FormField>
                      <FormField label={t('video.fps')}> 
                        <Input 
                          value={state.frameRate} 
                          onChange={(val) => updateState({ frameRate: val })}
                          placeholder="e.g. 60"
                        />
                      </FormField>
                    </div>
                    <FormField label={t('video.filters')}> 
                      <Input 
                        value={state.videoFilters} 
                        onChange={(val) => updateState({ videoFilters: val })}
                        placeholder="scale=1280:-1"
                      />
                      <div className="flex flex-wrap gap-2 mt-2">
                        <button 
                          onClick={() => updateState({ videoFilters: 'scale=1280:720' })}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[9px] font-bold text-slate-400 rounded border border-slate-700 transition-all flex items-center gap-1"
                        >
                          <Monitor className="w-3 h-3" /> 720p
                        </button>
                        <button 
                          onClick={() => updateState({ videoFilters: 'scale=1920:1080' })}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[9px] font-bold text-slate-400 rounded border border-slate-700 transition-all flex items-center gap-1"
                        >
                          <Maximize className="w-3 h-3" /> 1080p
                        </button>
                        <button 
                          onClick={() => updateState({ videoFilters: "crop=in_w:in_w*9/16" })}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[9px] font-bold text-slate-400 rounded border border-slate-700 transition-all flex items-center gap-1"
                        >
                          <Crop className="w-3 h-3" /> 16:9 Crop
                        </button>
                        <button 
                          onClick={() => updateState({ videoFilters: 'format=gray' })}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[9px] font-bold text-slate-400 rounded border border-slate-700 transition-all flex items-center gap-1"
                        >
                          <Film className="w-3 h-3" /> B&W
                        </button>
                      </div>
                    </FormField>
                  </>
                )}
              </div>
            </Card>

            {/* Audio Card */}
            <Card 
              title={t('audio.title')} 
              icon={<Music className="w-5 h-5" />}
              badge={state.disableAudio ? 'AN' : undefined}
            >
              <div className="flex items-center gap-3 pb-2 border-b border-slate-800/50">
                <input 
                  type="checkbox" 
                  id="disableAudio"
                  checked={state.disableAudio}
                  onChange={(e) => updateState({ disableAudio: e.target.checked })}
                  className="w-4 h-4 rounded-md border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500/50"
                />
                <label htmlFor="disableAudio" className="text-xs font-bold text-slate-400 uppercase tracking-widest cursor-pointer select-none">
                  {t('audio.disable')}
                </label>
              </div>

              <div className={`space-y-4 transition-all duration-300 ${state.disableAudio ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
                <FormField label={t('audio.codec')}> 
                  <Select 
                    value={state.audioCodec}
                    onChange={(val) => updateState({ audioCodec: val })}
                    options={[
                      { value: 'aac', label: 'AAC' },
                      { value: 'libmp3lame', label: 'MP3' },
                      { value: 'libopus', label: 'Opus' },
                      { value: 'copy', label: 'Stream Copy' }
                    ]}
                  />
                </FormField>
                {state.mode === 'professional' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField label={t('audio.bitrate')}> 
                        <Input 
                          value={state.audioBitrate} 
                          onChange={(val) => updateState({ audioBitrate: val })}
                          placeholder="192k"
                        />
                      </FormField>
                      <FormField label={t('audio.sampleRate')}> 
                        <Input 
                          value={state.sampleRate} 
                          onChange={(val) => updateState({ sampleRate: val })}
                          placeholder="44100"
                        />
                      </FormField>
                    </div>
                    <FormField label={t('audio.filters')}> 
                      <Input 
                        value={state.audioFilters} 
                        onChange={(val) => updateState({ audioFilters: val })}
                        placeholder="loudnorm,volume=1.2"
                      />
                    </FormField>
                  </>
                )}
              </div>
            </Card>
          </div>

          {state.mode === 'professional' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Timing */}
              <Card title={t('timing.title')} icon={<Clock className="w-5 h-5" />}>
                <div className="grid grid-cols-1 gap-4">
                  <FormField label={t('timing.start')}> 
                    <Input 
                      value={state.startTime} 
                      onChange={(val) => updateState({ startTime: val })}
                      placeholder="HH:MM:SS"
                    />
                  </FormField>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label={t('timing.duration')}> 
                      <Input 
                        value={state.duration} 
                        onChange={(val) => updateState({ duration: val })}
                        placeholder="Seconds"
                      />
                    </FormField>
                    <FormField label={t('timing.end')}> 
                      <Input 
                        value={state.stopTime} 
                        onChange={(val) => updateState({ stopTime: val })}
                        placeholder="HH:MM:SS"
                      />
                    </FormField>
                  </div>
                </div>
              </Card>

              {/* Advanced */}
              <Card title={t('advanced.title')} icon={<Cpu className="w-5 h-5" />}>
                <FormField label={t('advanced.logLevel')}> 
                  <Select 
                    value={state.logLevel}
                    onChange={(val) => updateState({ logLevel: val as any })}
                    options={[
                      { value: 'quiet', label: 'Quiet' },
                      { value: 'error', label: 'Error' },
                      { value: 'warning', label: 'Warning' },
                      { value: 'info', label: 'Info' },
                      { value: 'debug', label: 'Debug' }
                    ]}
                  />
                </FormField>
                <FormField label={t('advanced.customArgs')} description={t('advanced.customArgsDesc')}> 
                  <Input 
                    value={state.customArgs} 
                    onChange={(val) => updateState({ customArgs: val })}
                    placeholder="-threads 4 -map 0"
                  />
                </FormField>
              </Card>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: AI & Utilities */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* PREVIEW PANEL */}
          <Preview state={state} metadata={metadata} />

          {/* AI ARCHITECT */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-xl">
                    <Sparkles className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-black text-white tracking-tight">{t('ai.title')}</h3>
                </div>
                <button 
                  onClick={() => setShowAiSettings(!showAiSettings)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-blue-400 transition-all"
                >
                  <Settings2 className="w-4 h-4" />
                </button>
              </div>

              {showAiSettings && (
                <div className="mb-6 p-4 bg-slate-950/50 border border-slate-800 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2">
                  <FormField label={t('ai.aiSource')}>
                    <div className="flex p-1 bg-slate-900/50 border border-slate-800 rounded-xl">
                      <button
                        onClick={() => {
                          updateState({ aiSource: 'gemini' });
                          updateAppSetting('aiSource', 'gemini');
                        }}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${state.aiSource === 'gemini' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}
                      >
                        Gemini
                      </button>
                      <button
                        onClick={() => {
                          updateState({ aiSource: 'ollama' });
                          updateAppSetting('aiSource', 'ollama');
                        }}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${state.aiSource === 'ollama' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}
                      >
                        Ollama
                      </button>
                    </div>
                  </FormField>

                  {state.aiSource === 'ollama' && (
                    <>
                      <FormField label={t('ai.ollamaServer')}>
                        <Select 
                          value={state.ollamaServer}
                          onChange={(val) => {
                            updateState({ ollamaServer: val });
                            updateAppSetting('ollamaServer', val);
                          }}
                          options={ollamaServers.map(s => ({ value: s, label: s }))}
                        />
                      </FormField>
                      <FormField label={t('ai.model')}>
                        <Select 
                          value={state.ollamaModel}
                          onChange={(val) => {
                            updateState({ ollamaModel: val });
                            updateAppSetting('ollamaModel', val);
                          }}
                          options={ollamaModels.map(m => ({ value: m.name, label: m.name }))}
                        />
                      </FormField>
                    </>
                  )}
                </div>
              )}
              
              <div className="space-y-4">
                <div className="relative">
                  <textarea
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none h-32"
                    placeholder={t('ai.placeholder')}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                  />
                  <div className="absolute bottom-3 right-3">
                    <button
                      onClick={() => askAI(aiPrompt)}
                      disabled={aiLoading || !aiPrompt.trim()}
                      className="p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white rounded-xl transition-all shadow-lg shadow-blue-600/20 group/btn"
                    >
                      {aiLoading ? (
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <Wand2 className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" />
                      )}
                    </button>
                  </div>
                </div>

                {aiAdvice && (
                  <div className="bg-slate-950/50 border border-blue-500/20 rounded-2xl p-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">{t('ai.suggested')}</span>
                      <button onClick={() => setAiAdvice(null)} className="text-slate-600 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    <div className="bg-black/40 p-3 rounded-xl border border-white/5 mb-4 group/cmd relative">
                      <code className="block text-[11px] font-mono text-blue-300 break-all leading-relaxed">
                        {aiAdvice.command}
                      </code>
                    </div>

                    <div className="space-y-3 mb-5">
                      <div className="flex items-start gap-2">
                        <Info className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-slate-400 leading-relaxed italic">
                          {aiAdvice.explanation}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {aiAdvice.keyCategories.map(cat => (
                          <span key={cat} className="px-2 py-0.5 bg-blue-500/5 text-blue-400/70 text-[9px] rounded-md uppercase font-black tracking-widest border border-blue-500/10">
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => applyAIAdvice(false)}
                        className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 border border-slate-700/50 transition-all"
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        {t('common.apply')}
                      </button>
                      <button 
                        onClick={() => applyAIAdvice(true)}
                        className="py-2.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 border border-blue-500/20 transition-all"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        {t('ai.override')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* PRESETS GALLERY */}
          <Card title={t('common.presetsGallery')} icon={<Save className="w-5 h-5" />}>
            {presets.length === 0 ? (
              <p className="text-xs text-slate-600 italic py-4 text-center">No presets saved yet.</p>
            ) : (
              <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1">
                {presets.map(p => (
                  <div key={p.id} className="group flex items-center justify-between p-3 bg-slate-950/50 border border-slate-800 rounded-xl hover:border-blue-500/30 transition-all">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-300 truncate">{p.name}</p>
                      <p className="text-[9px] text-slate-600 font-mono">{new Date(p.created_at).toLocaleDateString()}</p>
                    </div>
                    <button 
                      onClick={() => loadPreset(p)}
                      className="p-2 bg-slate-900 hover:bg-blue-600/20 text-slate-500 hover:text-blue-400 rounded-lg transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* HISTORY LOG */}
          <Card title={t('common.executionHistory')} icon={<History className="w-5 h-5" />}>
             {history.length === 0 ? (
              <p className="text-xs text-slate-600 italic py-4 text-center">No history available.</p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {history.map(h => (
                  <div key={h.id} className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl relative overflow-hidden group">
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${h.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${h.status === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {h.status}
                      </span>
                      <span className="text-[9px] text-slate-600 font-mono">{new Date(h.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <code className="block text-[10px] font-mono text-slate-400 truncate mb-1">
                      {h.command}
                    </code>
                    {h.status === 'failed' && h.stderr && (
                      <p className="text-[9px] text-red-400/70 italic line-clamp-1">{h.stderr}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* QUICK TIPS & PRESETS */}
          <Card title={t('tips.title')} icon={<Info className="w-5 h-5" />}>
            <ul className="space-y-4">
              {[1, 2, 3].map(i => (
                <li key={i} className="flex gap-3 group cursor-default">
                  <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center text-[10px] font-bold text-blue-500 flex-shrink-0 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                    {i}
                  </div>
                  <span className="text-xs text-slate-400 leading-relaxed group-hover:text-slate-200 transition-colors">
                    {t(`tips.tip${i}`)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-6 pt-6 border-t border-slate-800/50 flex items-center justify-between">
              <a 
                href="https://ffmpeg.org/documentation.html" 
                target="_blank" 
                rel="noreferrer"
                className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-400 flex items-center gap-1.5 transition-colors"
              >
                {t('common.docs')} <ExternalLink className="w-3 h-3" />
              </a>
              <div className="flex gap-2">
                <button className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors">
                  <History className="w-4 h-4" />
                </button>
                <button className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors">
                  <Save className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>

        </div>
      </main>

      {/* FOOTER PREVIEW */}
      <footer className="fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-2xl border-t border-slate-800/50 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] z-50">
        <div className="max-w-[1600px] mx-auto px-6 py-5 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 w-full min-w-0">
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${isExecuting ? 'bg-orange-500 animate-ping' : (state.aiOverride ? 'bg-purple-500' : 'bg-green-500')} ${!isExecuting && 'animate-pulse'}`}></div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    {isExecuting ? t('common.running') : (state.aiOverride ? t('ai.overrideActive') : t('ai.generated'))}
                  </span>
                </div>
                {progress && (
                  <span className="text-[10px] font-mono text-blue-400">
                    {progress.time} @ {progress.fps}fps {progress.speed}
                  </span>
                )}
              </div>
              {state.aiOverride && !isExecuting && (
                <button 
                  onClick={() => updateState({ aiOverride: false })}
                  className="text-[10px] font-bold text-blue-500 hover:underline"
                >
                  {t('common.backToManual')}
                </button>
              )}
            </div>
            
            {/* Progress Bar Container */}
            <div className="relative group">
              <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 relative group flex items-center transition-all hover:border-slate-700 shadow-inner overflow-hidden">
                {/* Progress Fill */}
                {isExecuting && (
                  <div 
                    className="absolute inset-y-0 left-0 bg-blue-600/10 border-r border-blue-500/30 transition-all duration-500 ease-out"
                    style={{ width: `${progress?.percent || 0}%` }}
                  ></div>
                )}
                
                <code className="relative z-10 font-mono text-xs text-green-400 break-all pr-14 block w-full leading-relaxed overflow-hidden whitespace-nowrap overflow-ellipsis">
                  {generatedCommand}
                </code>
                <div className="absolute right-2 flex gap-1 z-20">
                  <button 
                    onClick={handleCopy}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 transition-all hover:scale-105 active:scale-95"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              {/* Thin Progress Bar below */}
              {isExecuting && (
                <div className="absolute -bottom-1 left-4 right-4 h-0.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${progress?.percent || 0}%` }}
                  ></div>
                </div>
              )}
            </div>
            
            {lastError && (
              <p className="mt-2 text-[10px] text-red-400 font-medium px-1 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                {t('common.error')}: {lastError.slice(0, 100)}...
              </p>
            )}

            {warnings.length > 0 && !isExecuting && (
              <div className="mt-2 space-y-1">
                {warnings.map((w, i) => (
                  <p key={i} className="text-[9px] text-amber-400 font-medium px-1 flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5" />
                    {w}
                  </p>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <button 
              onClick={reset}
              disabled={isExecuting}
              className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-slate-400 font-bold rounded-2xl flex items-center gap-2 transition-all border border-slate-800 hover:text-red-400"
            >
              <Trash2 className="w-4 h-4" />
              {t('common.reset')}
            </button>
            <button 
              className={`flex-1 md:flex-none px-10 py-3.5 ${isExecuting ? 'bg-slate-800' : 'bg-blue-600 hover:bg-blue-500'} text-white font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-600/20 active:translate-y-0.5 active:shadow-none`}
              onClick={execute}
              disabled={isExecuting}
            >
              {isExecuting ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <Zap className="w-4 h-4 fill-white" />
              )}
              {isExecuting ? t('common.running') : t('common.execute')}
            </button>
          </div>
        </div>
      </footer>
      
      {/* Spacer for sticky footer */}
      <div className="h-32"></div>
    </div>
  );
}

export default App;