import React from 'react';
import { FFmpegState } from '../types';
import { Eye, Monitor, AlertCircle } from 'lucide-react';

interface PreviewProps {
  state: FFmpegState;
  metadata: any;
}

export const Preview: React.FC<PreviewProps> = ({ state, metadata }) => {
  const isScaling = state.videoFilters.includes('scale=');
  const isGrayscale = state.videoFilters.includes('gray');
  const isCropping = state.videoFilters.includes('crop=');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl overflow-hidden relative group">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
          <Eye className="w-4 h-4 text-blue-500" />
          SIMULATED PREVIEW
        </h3>
        {metadata && (
          <span className="text-[10px] font-mono text-slate-500">
            {metadata.streams?.find((s: any) => s.codec_type === 'video')?.width}x
            {metadata.streams?.find((s: any) => s.codec_type === 'video')?.height}
          </span>
        )}
      </div>

      <div className="aspect-video bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center relative overflow-hidden group/preview">
        {/* Placeholder visual based on state */}
        <div className={`w-full h-full flex items-center justify-center transition-all duration-500 ${isGrayscale ? 'grayscale' : ''}`}>
          <div className={`relative border-2 border-blue-500/20 flex items-center justify-center transition-all duration-500 ${isScaling ? 'w-2/3 h-2/3' : 'w-full h-full'}`}>
             <Monitor className={`w-12 h-12 text-slate-800 transition-all ${isScaling ? 'scale-75' : ''}`} />
             
             {isCropping && (
               <div className="absolute inset-4 border border-dashed border-amber-500/40 animate-pulse"></div>
             )}

             <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-center px-4">
                  {state.videoCodec === 'copy' ? 'STREAM COPY\nNO PREVIEW' : 'FILTER PIPELINE ACTIVE'}
                </p>
             </div>
          </div>
        </div>

        {/* Overlay info */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end opacity-0 group-hover/preview:opacity-100 transition-opacity">
           <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5">
              <p className="text-[9px] font-bold text-blue-400 uppercase tracking-tighter">Output Expectation</p>
              <p className="text-[8px] text-slate-400">{state.videoCodec} @ {state.videoBitrate || 'auto'}</p>
           </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {state.videoFilters.split(',').filter(f => f.trim()).map((filter, i) => (
          <div key={i} className="px-2 py-1 bg-slate-800 rounded border border-slate-700 text-[8px] font-mono text-slate-400 whitespace-nowrap">
            {filter.split('=')[0]}
          </div>
        ))}
      </div>
      
      {!metadata && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center p-8 text-center">
          <div className="flex flex-col items-center gap-2">
            <AlertCircle className="w-5 h-5 text-slate-600" />
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Select an input file to enable preview simulation</p>
          </div>
        </div>
      )}
    </div>
  );
};
