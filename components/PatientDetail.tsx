import React, { useState, useMemo, useEffect } from 'react';
import type { Patient, AISummary, RiskLevel, LabResult, UserRole, SavedAISummary, DrugInteractionResult } from '../types';
import { Card } from './ui/Card';
import { generatePatientSummary, analyzeDrugInteractions } from '../services/geminiService';
import { UserIcon, PillIcon, StethoscopeIcon, SparklesIcon, PencilIcon, ExclamationTriangleIcon, ChevronDownIcon, CameraIcon, PlusIcon, ClipboardDocumentCheckIcon, ClockIcon, BeakerIcon } from './ui/icons';

interface PatientDetailProps {
  patient: Patient;
  onEdit: (patient: Patient) => void;
  onUpdate: (patient: Patient) => void;
  role: UserRole;
}

const getRiskLevelColor = (level: RiskLevel) => {
    switch (level) {
      case 'High': return 'text-rose-600';
      case 'Normal': return 'text-emerald-600';
      case 'Low': return 'text-amber-600';
      default: return 'text-slate-500';
    }
};

const getRiskBgColor = (level: RiskLevel) => {
    switch (level) {
      case 'High': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'Normal': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Low': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
};

const getInteractionSeverityColor = (severity: string) => {
    switch (severity) {
        case 'Severe': return 'bg-rose-500 text-white';
        case 'Moderate': return 'bg-amber-500 text-white';
        case 'Mild': return 'bg-blue-500 text-white';
        default: return 'bg-slate-500 text-white';
    }
}

export const PatientDetail: React.FC<PatientDetailProps> = ({ patient, onEdit, onUpdate, role }) => {
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  
  const [interactionResult, setInteractionResult] = useState<DrugInteractionResult | null>(null);
  const [isLoadingInteractions, setIsLoadingInteractions] = useState(false);

  const isProvider = role === 'Provider';

  useEffect(() => {
    if ((patient.treatments || []).length >= 2) {
        checkInteractions();
    } else {
        setInteractionResult(null);
    }
  }, [patient.treatments]);

  const checkInteractions = async () => {
    setIsLoadingInteractions(true);
    try {
        const result = await analyzeDrugInteractions(patient.treatments || []);
        setInteractionResult(result);
    } catch (err) {
        console.error("Interaction check failed", err);
    } finally {
        setIsLoadingInteractions(false);
    }
  };

  const handleGenerateSummary = async () => {
    setIsLoadingSummary(true);
    try {
      const summary = await generatePatientSummary(patient);
      setAiSummary(summary);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const handleApplyAsAdminSummary = () => {
    if (!aiSummary) return;
    onUpdate({
      ...patient,
      clinicalNote: aiSummary.summary
    });
    setAiSummary(null);
    alert("Professional clinical summary updated in Hub.");
  };

  const highRiskLabs = useMemo(() => {
    return (patient.labResults || []).filter(r => r.riskLevel === 'High');
  }, [patient.labResults]);

  const concerningImaging = useMemo(() => {
    const keywords = ['mass', 'fracture', 'malignancy', 'hemorrhage', 'suspicious', 'urgent', 'abnormal', 'radiculopathy', 'compression', 'weakness'];
    return (patient.imagingStudies || []).filter(s => 
      keywords.some(k => s.reportSummary.toLowerCase().includes(k))
    );
  }, [patient.imagingStudies]);

  const recentMetrics = useMemo(() => {
    const latest = new Map<string, LabResult>();
    (patient.labResults || []).forEach(r => {
      const existing = latest.get(r.testName);
      if (!existing || new Date(r.date) > new Date(existing.date)) {
        latest.set(r.testName, r);
      }
    });
    return Array.from(latest.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);
  }, [patient.labResults]);

  const hubLabList = useMemo(() => {
    return [...(patient.labResults || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 4);
  }, [patient.labResults]);

  return (
    <div className="space-y-6">
      {/* Clinical Hub Summary */}
      <div className={`bg-white rounded-[3.5rem] p-9 shadow-xl border-2 transition-all relative overflow-hidden group ${patient.clinicalNote ? 'border-indigo-100' : 'border-dashed border-slate-200'}`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
        
        <div className="flex justify-between items-start mb-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <SparklesIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Clinical Hub Summary</h2>
              <p className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.2em]">Medical Professional Review</p>
            </div>
          </div>
          {isProvider && (
            <button onClick={handleGenerateSummary} disabled={isLoadingSummary} className="bg-indigo-50 text-indigo-600 p-3 rounded-2xl hover:bg-indigo-100 transition-all active:scale-95 disabled:opacity-50">
              {isLoadingSummary ? <div className="w-5 h-5 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" /> : <PlusIcon className="w-6 h-6" />}
            </button>
          )}
        </div>

        {patient.clinicalNote ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700 relative z-10">
            <p className="text-sm font-bold text-slate-700 leading-relaxed bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
              {patient.clinicalNote}
            </p>
          </div>
        ) : (
          <div className="py-10 text-center relative z-10">
            <p className="text-slate-400 font-bold text-sm">No clinical summary provided yet.</p>
          </div>
        )}

        {aiSummary && isProvider && (
          <div className="mt-8 p-8 bg-indigo-600 rounded-[2.5rem] text-white space-y-4 animate-in zoom-in-95 duration-300">
            <p className="text-xs font-bold leading-relaxed italic">"{aiSummary.summary}"</p>
            <div className="flex gap-3 pt-4">
              <button onClick={handleApplyAsAdminSummary} className="flex-1 bg-white text-indigo-600 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest shadow-xl">
                Set as Main Note
              </button>
              <button onClick={() => setAiSummary(null)} className="px-6 py-4 bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">
                Discard
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Medication Safety Alert */}
      {interactionResult && interactionResult.interactions.length > 0 && (
        <div className="bg-amber-600 rounded-[3rem] p-9 text-white shadow-2xl shadow-amber-200 animate-in slide-in-from-top-4 duration-500 relative overflow-hidden">
            <div className="flex items-center gap-5 mb-6">
                 <div className="w-14 h-14 bg-white/20 rounded-[1.5rem] flex items-center justify-center border border-white/30 shadow-inner">
                   <ExclamationTriangleIcon className="w-8 h-8 text-white" />
                 </div>
                 <div>
                   <h2 className="text-xl font-black uppercase tracking-tight">Safety Alert</h2>
                   <p className="text-[10px] font-black uppercase tracking-widest text-amber-100 opacity-80">Drug Interaction Checker</p>
                 </div>
            </div>
            <div className="space-y-4">
                {interactionResult.interactions.map((interaction, idx) => (
                    <div key={idx} className="bg-white/10 p-5 rounded-[1.5rem] border border-white/10">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex flex-wrap gap-2">
                                {interaction.involvedDrugs.map((drug, dIdx) => (
                                    <span key={dIdx} className="text-[9px] font-black uppercase bg-white/20 px-3 py-1 rounded-full">{drug}</span>
                                ))}
                            </div>
                            <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${getInteractionSeverityColor(interaction.severity)}`}>
                                {interaction.severity}
                            </span>
                        </div>
                        <p className="text-xs font-bold leading-relaxed">{interaction.description}</p>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* Laboratory Portal - Mirroring Medication UI */}
      <Card title="Laboratory Portal" icon={<BeakerIcon />} subtitle="Recent results archive">
        <div className="space-y-4">
          {hubLabList.length > 0 ? (
            hubLabList.map((lab) => (
              <div key={lab.id} className="bg-slate-50 rounded-[2.5rem] p-6 border-2 border-slate-100 flex justify-between items-center group hover:bg-white transition-all shadow-sm">
                <div className="flex flex-col">
                  <span className="font-black text-slate-900 text-sm tracking-tight">{lab.testName}</span>
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 flex items-center gap-1.5">
                    <ClockIcon className="w-3 h-3" />
                    {new Date(lab.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-800">{lab.value}</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase ml-1">{lab.unit}</span>
                  </div>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${getRiskBgColor(lab.riskLevel)}`}>
                    <div className={`w-2 h-2 rounded-full ${lab.riskLevel === 'High' ? 'bg-rose-500 animate-pulse' : lab.riskLevel === 'Low' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem]">
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest">No lab results found</p>
            </div>
          )}
          <button onClick={() => onEdit(patient)} className="w-full py-4 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline transition-all">
            Manage Laboratory Records
          </button>
        </div>
      </Card>

      {/* Metrics/Lab Scroller - Quick Glance */}
      <div className="flex space-x-4 overflow-x-auto pb-6 hide-scrollbar -mx-6 px-6 pt-2">
        {recentMetrics.map((metric) => {
          const isHigh = metric.riskLevel === 'High';
          return (
            <div key={metric.id} className={`min-w-[180px] p-8 rounded-[3.5rem] shadow-sm border-2 flex-shrink-0 transition-all hover:-translate-y-2 hover:shadow-xl relative overflow-hidden group ${isHigh ? 'bg-rose-50 border-rose-200 shadow-rose-100' : 'bg-white border-slate-50'}`}>
              <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${isHigh ? 'text-rose-500' : 'text-slate-400'}`}>{metric.testName}</p>
              <div className="flex items-baseline gap-1">
                <p className={`text-3xl font-black tracking-tighter ${isHigh ? 'text-rose-700' : 'text-slate-900'}`}>{metric.value}</p>
                <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest">{metric.unit}</span>
              </div>
              <div className={`text-[10px] font-black mt-5 flex items-center uppercase tracking-widest ${getRiskLevelColor(metric.riskLevel)}`}>
                <div className={`w-2.5 h-2.5 rounded-full mr-3 ${isHigh ? 'bg-rose-500 animate-ping' : 'bg-current'}`}></div>
                {metric.riskLevel}
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-6">
        <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em] px-4">Imaging & Diagnostics</h3>
        
        <Card title="Radiology Portal" icon={<CameraIcon />} subtitle={`${(patient.imagingStudies || []).length} studies archived`}>
          <div className="space-y-5">
            {(patient.imagingStudies || []).length > 0 ? (
              (patient.imagingStudies || []).slice().reverse().map(study => {
                 const isHighRisk = study.reportSummary.toLowerCase().match(/mass|fracture|malignancy|hemorrhage|urgent|abnormal|suspicious|radiculopathy|compression|weakness/);
                 return (
                  <div key={study.id} className={`p-7 rounded-[3rem] border-2 shadow-sm transition-all group ${isHighRisk ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100 hover:bg-white hover:border-indigo-100'}`}>
                    <div className="flex justify-between items-center mb-5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black px-5 py-2 rounded-full border shadow-sm uppercase tracking-widest ${isHighRisk ? 'bg-white text-rose-600 border-rose-200' : 'bg-white text-slate-800 border-slate-200'}`}>{study.type}</span>
                        {study.imageUrl && <span className="bg-indigo-600 text-white text-[8px] font-black uppercase px-2 py-1 rounded-lg">Vision AI</span>}
                      </div>
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{new Date(study.date).toLocaleDateString()}</p>
                    </div>

                    <div className="flex gap-4">
                      {study.imageUrl && (
                        <div className="w-16 h-16 shrink-0 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                          <img src={study.imageUrl} className="w-full h-full object-cover" alt="Scan photo" />
                        </div>
                      )}
                      <p className={`text-[13px] font-bold leading-relaxed flex-1 ${isHighRisk ? 'text-rose-900' : 'text-slate-700'}`}>
                        "{study.reportSummary || 'Findings pending review.'}"
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <button onClick={() => onEdit(patient)} className="w-full py-12 bg-slate-50 border-4 border-dashed border-slate-200 rounded-[3rem] text-[11px] font-black text-slate-300 uppercase tracking-[0.3em] hover:bg-white hover:text-indigo-400 transition-all">
                + Scan New Image/Report
              </button>
            )}
          </div>
        </Card>

        <Card title="Active Medications" icon={<PillIcon />} subtitle="Current protocol">
          <div className="space-y-4">
            {(patient.treatments || []).map(t => (
              <div key={t.id} className="bg-slate-50 rounded-[2.5rem] p-6 border-2 border-slate-100 flex justify-between items-center group hover:bg-white transition-all shadow-sm">
                <div>
                  <p className="font-black text-slate-900 text-sm tracking-tight">{t.medication}</p>
                  <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest mt-1.5 flex items-center gap-2">
                     <ClockIcon className="w-3 h-3" />
                     {new Date(t.startDate).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-[10px] font-black bg-white px-5 py-2.5 rounded-2xl text-indigo-600 shadow-sm border border-indigo-50 uppercase tracking-widest">{t.dosage}</span>
              </div>
            ))}
            <button onClick={() => onEdit(patient)} className="w-full py-4 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline transition-all">
              Manage Prescriptions
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};