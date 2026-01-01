
import React from 'react';
import { FolderOpen } from 'lucide-react';

interface InputProps {
  value: string | number;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: string;
  suffix?: string;
  onBrowse?: () => void;
}

const Input: React.FC<InputProps> = ({ value, onChange, placeholder, type = "text", suffix, onBrowse }) => {
  return (
    <div className="relative group">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-slate-950/50 border border-slate-800 rounded-xl py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-slate-200 placeholder:text-slate-700 group-hover:border-slate-700 ${onBrowse ? 'pl-4 pr-12' : 'px-4'}`}
      />
      {suffix && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-600 pointer-events-none uppercase tracking-widest">
          {suffix}
        </span>
      )}
      {onBrowse && (
        <button
          onClick={onBrowse}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-slate-900 hover:bg-blue-600/20 text-slate-500 hover:text-blue-400 rounded-lg transition-all"
        >
          <FolderOpen className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Input;
