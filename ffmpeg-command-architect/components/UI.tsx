
import React from 'react';

interface CardProps {
  title: string;
  icon?: React.ReactNode;
  badge?: string;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ title, icon, badge, children, className = '' }) => {
  return (
    <div className={`bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-xl hover:border-slate-700 transition-colors ${className}`}>
      <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          {icon && <div className="text-blue-500">{icon}</div>}
          <h3 className="font-bold text-slate-200 tracking-tight">{title}</h3>
        </div>
        {badge && (
          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded uppercase tracking-wider border border-blue-500/20">
            {badge}
          </span>
        )}
      </div>
      <div className="p-5 space-y-4">
        {children}
      </div>
    </div>
  );
};

interface FormFieldProps {
  label: string;
  description?: string;
  children: React.ReactNode;
  error?: string;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({ label, description, children, error, className = '' }) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex justify-between items-center px-1">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</label>
        {description && (
          <div className="group relative">
            <div className="w-4 h-4 rounded-full border border-slate-600 flex items-center justify-center text-[10px] text-slate-500 cursor-help group-hover:border-blue-500 group-hover:text-blue-400 transition-colors">?</div>
            <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-800 border border-slate-700 rounded-lg text-[10px] text-slate-300 shadow-2xl invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all z-50">
              {description}
            </div>
          </div>
        )}
      </div>
      {children}
      {error && <p className="text-[10px] text-red-400 font-medium px-1">{error}</p>}
    </div>
  );
};
