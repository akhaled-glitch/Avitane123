import React, { useState, useEffect } from 'react';
import type { Patient } from '../types';
import { generateMetricsSummary } from '../services/geminiService';
import { Card } from './ui/Card';
import { SparklesIcon, HeartIcon, ExclamationTriangleIcon, CheckCircleIcon } from './ui/icons';

interface MetricsOverviewProps {
  patient: Patient;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({ patient }) => {
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (patient.labResults.length > 0) {
      handleGenerate();
    }
  }, [patient.labResults]);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const result = await generateMetricsSummary(patient);
      setSummary(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (patient.labResults.length === 0) return null;

  return (
    <Card title="Health Stability Index" icon={<HeartIcon />} className="bg-gradient-to-br from-indigo-50 to-white">
      {isLoading ? (
        <div className="flex flex-col items-center py-12">
          <div className="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mb-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Computing stability trends...</p>
        </div>
      ) : summary ? (
        <div className="space-y-6 animate-in fade-in duration-700">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Stability Score</span>
              <span className={`text-5xl font-black tracking-tighter ${summary.stabilityScore > 70 ? 'text-emerald-600' : summary.stabilityScore > 40 ? 'text-amber-500' : 'text-rose-600'}`}>
                {summary.stabilityScore}%
              </span>
            </div>
            <div className="w-16 h-16 bg-white rounded-2xl shadow-inner border border-slate-50 flex items-center justify-center">
               <SparklesIcon className="w-8 h-8 text-indigo-400" />
            </div>
          </div>

          <div className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
             <p className="text-sm font-bold text-slate-700 leading-relaxed italic">"{summary.trendAnalysis}"</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
             {summary.topConcerns.map((concern: string, idx: number) => (
               <div key={idx} className="flex items-start gap-3 p-4 bg-rose-50 rounded-2xl border border-rose-100">
                 <ExclamationTriangleIcon className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                 <p className="text-xs font-bold text-rose-800">{concern}</p>
               </div>
             ))}
             <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
               <CheckCircleIcon className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
               <p className="text-xs font-bold text-emerald-800">{summary.improvementAdvice}</p>
             </div>
          </div>
        </div>
      ) : null}
    </Card>
  );
};