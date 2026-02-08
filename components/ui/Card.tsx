import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: React.ReactNode;
  subtitle?: string;
}

export const Card: React.FC<CardProps> = ({ children, className, title, icon, subtitle }) => {
  return (
    <div className={`bg-white rounded-[2.5rem] border border-slate-200/50 shadow-sm p-10 transition-all duration-300 hover:shadow-xl hover:border-indigo-100/50 group ${className}`}>
      {title && (
        <div className="flex items-center justify-between mb-10">
            <div className="flex items-center space-x-4">
              {icon && (
                <div className="w-12 h-12 bg-slate-50 rounded-2xl text-slate-400 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors duration-500">
                  {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-6 h-6' })}
                </div>
              )}
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">{title}</h3>
                {subtitle && <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">{subtitle}</p>}
              </div>
            </div>
        </div>
      )}
      <div className="text-slate-600 leading-relaxed font-medium">
        {children}
      </div>
    </div>
  );
};