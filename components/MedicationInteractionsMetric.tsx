import React, { useState, useEffect, useMemo } from 'react';
import type { Patient, DrugInteractionResult } from '../types';
import { analyzeDrugInteractions } from '../services/geminiService';
import { Card } from './ui/Card';
import { PillIcon, ExclamationTriangleIcon, CheckCircleIcon, SparklesIcon, ClockIcon } from './ui/icons';

interface MedicationInteractionsMetricProps {
  patient: Patient;
}

export const MedicationInteractionsMetric: React.FC<MedicationInteractionsMetricProps> = ({ patient }) => {
  const [result, setResult] = useState<DrugInteractionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (patient.treatments.length >= 2) {
      handleScan();
    } else {
      setResult(null);
    }
  }, [patient.treatments]);

  const handleScan = async () => {
    setIsLoading(true);
    try {
      const scanResult = await analyzeDrugInteractions(patient.treatments);
      setResult(scanResult);
    } catch (err) {
      console.error("Interaction scan failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  const severityCounts = useMemo(() => {
    if (!result) return { severe: 0, moderate: 0, mild: 0 };
    return {
      severe: result.interactions.filter(i => i.severity === 'Severe').length,
      moderate: result.interactions.filter(i => i.severity === 'Moderate').length,
      mild: result.interactions.filter(i => i.severity === 'Mild').length,
    };
  }, [result]);

  if (patient.treatments.length < 2) {
    return (
      <Card title="Medication Safety Scan" icon={<PillIcon />} subtitle="Interaction Checker">
        <div className="py-10 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
          <PillIcon className="w-10 h-10 text-slate-300 mx-auto mb-4" />
          <p className="text-sm font-bold text-slate-400 leading-relaxed px-6">
            Multiple medications required to perform a drug interaction scan.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Medication Safety Scan" icon={<PillIcon />} subtitle="Drugs.com Integrated Checker">
      {isLoading ? (
        <div className="flex flex-col items-center py-12">
          <div className="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mb-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Scanning for interactions...</p>
        </div>
      ) : result ? (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Safety Summary Header */}
          <div className="flex gap-3">
             <div className={`flex-1 p-5 rounded-[1.5rem] border-2 flex flex-col items-center justify-center ${severityCounts.severe > 0 ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                <span className="text-[9px] font-black uppercase tracking-widest mb-1">Safety Status</span>
                <span className="text-xs font-black uppercase">{severityCounts.severe > 0 ? 'Action Required' : 'Clinically Stable'}</span>
             </div>
             <div className="flex-1 p-5 rounded-[1.5rem] border-2 border-slate-50 bg-slate-50 flex flex-col items-center justify-center">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Warnings</span>
                <span className="text-xs font-black text-slate-800">{result.interactions.length}</span>
             </div>
          </div>

          {/* Interaction List */}
          <div className="space-y-4">
            {result.interactions.length > 0 ? (
              result.interactions.map((interaction, idx) => (
                <div key={idx} className="p-6 bg-white rounded-[2rem] border-2 border-slate-50 shadow-sm hover:border-indigo-100 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-wrap gap-2">
                      {interaction.involvedDrugs.map((drug, dIdx) => (
                        <span key={dIdx} className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-slate-100 text-slate-600 rounded-lg">{drug}</span>
                      ))}
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-full shadow-sm ${
                      interaction.severity === 'Severe' ? 'bg-rose-600 text-white' :
                      interaction.severity === 'Moderate' ? 'bg-amber-500 text-white' :
                      'bg-blue-500 text-white'
                    }`}>
                      {interaction.severity} Risk
                    </span>
                  </div>
                  
                  <p className="text-sm font-bold text-slate-700 leading-relaxed mb-4">"{interaction.description}"</p>
                  
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm">
                       <ClockIcon className="w-4 h-4 text-indigo-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Medical Action</p>
                      <p className="text-xs font-bold text-slate-800">{interaction.actionRequired}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-4 p-8 bg-emerald-50 rounded-[2rem] border border-emerald-100">
                <CheckCircleIcon className="w-10 h-10 text-emerald-500" />
                <div>
                   <p className="text-sm font-black text-emerald-800 uppercase tracking-tight">No Significant Interactions</p>
                   <p className="text-xs font-bold text-emerald-600 opacity-80">This specific combination of medications appears safe.</p>
                </div>
              </div>
            )}
          </div>

          <p className="text-[9px] font-medium text-slate-400 italic leading-relaxed px-2 text-center">
            {result.disclaimer}
          </p>
        </div>
      ) : null}
    </Card>
  );
};