import React, { useState, useRef } from 'react';
import type { Patient, Diagnosis, LabResult, ImagingStudy, Treatment, Symptom, Complaint } from '../types';
import { RiskLevel } from '../types';
import { XIcon, StethoscopeIcon, ChevronDownIcon, PlusIcon, BeakerIcon, PillIcon, CameraIcon, SparklesIcon, CheckCircleIcon, HeartIcon, ClockIcon, ClipboardDocumentCheckIcon } from './ui/icons';
import { commonLabTests, commonDiagnoses, COMMON_COMPLAINTS, calculateRiskLevel } from '../utils/labTestReference';
import { extractLabsFromDocument, extractMedicationsFromDocument, generateImagingReportFromDocument, analyzeImagingImage, classifyDocument, normalizeDrugName } from '../services/geminiService';
import { AddLabsModal } from './AddLabsModal';
import { ReviewScannedLabsModal } from './ReviewScannedLabsModal';
import { ReviewScannedTreatmentsModal } from './ReviewScannedTreatmentsModal';

interface DataEntryFormProps {
  onSave: (patient: Patient) => void;
  onClose: () => void;
  patientToEdit?: Patient | null;
  availableDrugs: string[];
  availableLabs: string[];
}

export const DataEntryForm: React.FC<DataEntryFormProps> = ({ 
  onSave, 
  onClose, 
  patientToEdit, 
  availableDrugs,
  availableLabs 
}) => {
  const [patientData, setPatientData] = useState<Patient>(() => {
    if (patientToEdit) {
      const editData = JSON.parse(JSON.stringify(patientToEdit));
      return {
        ...editData,
        complaints: editData.complaints || [],
        diagnoses: editData.diagnoses || [],
        labResults: editData.labResults || [],
        treatments: editData.treatments || [],
        imagingStudies: editData.imagingStudies || [],
      };
    }
    return {
      id: `pat${Date.now()}`,
      name: '',
      dob: '',
      gender: 'Other',
      clinicalNote: '',
      complaints: [],
      symptoms: [],
      diagnoses: [],
      labResults: [],
      treatments: [],
      imagingStudies: [],
    };
  });

  const [isAddLabsOpen, setIsAddLabsOpen] = useState(false);
  const [isReviewLabsOpen, setIsReviewLabsOpen] = useState(false);
  const [isReviewTreatmentsOpen, setIsReviewTreatmentsOpen] = useState(false);
  
  const [scannedLabs, setScannedLabs] = useState<Omit<LabResult, 'id' | 'riskLevel'>[]>([]);
  const [scannedTreatments, setScannedTreatments] = useState<Omit<Treatment, 'id'>[]>([]);
  
  const [isSmartScanning, setIsSmartScanning] = useState(false);
  const [isSectionScanning, setIsSectionScanning] = useState<Record<string, boolean>>({});
  const [isNormalizingMeds, setIsNormalizingMeds] = useState<Record<string, boolean>>({});
  const [isAnalyzingImage, setIsAnalyzingImage] = useState<Record<string, boolean>>({});

  const imagingFileInputRef = useRef<HTMLInputElement>(null);
  const quickImagingInputRef = useRef<HTMLInputElement>(null);
  const smartFileInputRef = useRef<HTMLInputElement>(null);
  const labFileInputRef = useRef<HTMLInputElement>(null);
  const medFileInputRef = useRef<HTMLInputElement>(null);
  const currentImagingIdRef = useRef<string | null>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSmartFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsSmartScanning(true);
    try {
      const base64 = await fileToBase64(file);
      const category = await classifyDocument(base64);
      
      if (category === 'LAB') {
        const extracted = await extractLabsFromDocument(base64);
        setScannedLabs(extracted);
        setIsReviewLabsOpen(true);
      } else if (category === 'PRESCRIPTION') {
        const extracted = await extractMedicationsFromDocument(base64);
        setScannedTreatments(extracted);
        setIsReviewTreatmentsOpen(true);
      } else if (category === 'IMAGING') {
        const id = `img-${Date.now()}`;
        const analysis = await generateImagingReportFromDocument(base64);
        setPatientData(prev => ({
          ...prev,
          imagingStudies: [...(prev.imagingStudies || []), { 
            id, type: 'X-Ray', 
            date: new Date().toISOString().split('T')[0], 
            reportSummary: analysis, 
            imageUrl: base64 
          }]
        }));
      }
    } catch (err) {
      alert("Smart scan failed.");
    } finally {
      setIsSmartScanning(false);
      if (smartFileInputRef.current) smartFileInputRef.current.value = '';
    }
  };

  const handleSectionScan = async (e: React.ChangeEvent<HTMLInputElement>, type: 'LAB' | 'PRESCRIPTION') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsSectionScanning(prev => ({ ...prev, [type]: true }));
    try {
      const base64 = await fileToBase64(file);
      if (type === 'LAB') {
        const extracted = await extractLabsFromDocument(base64);
        setScannedLabs(extracted);
        setIsReviewLabsOpen(true);
      } else {
        const extracted = await extractMedicationsFromDocument(base64);
        setScannedTreatments(extracted);
        setIsReviewTreatmentsOpen(true);
      }
    } catch (err) {
      alert("Extraction failed.");
    } finally {
      setIsSectionScanning(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleQuickImagingScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsSmartScanning(true);
    try {
      const base64 = await fileToBase64(file);
      const id = `img-${Date.now()}`;
      const analysis = await analyzeImagingImage(base64);
      setPatientData(prev => ({
        ...prev,
        imagingStudies: [...(prev.imagingStudies || []), { 
          id, type: 'X-Ray', 
          date: new Date().toISOString().split('T')[0], 
          reportSummary: analysis, 
          imageUrl: base64 
        }]
      }));
    } catch (err) {
      alert("Vision AI failed.");
    } finally {
      setIsSmartScanning(false);
      if (quickImagingInputRef.current) quickImagingInputRef.current.value = '';
    }
  };

  const addItem = (listKey: keyof Patient, emptyItem: any) => {
    const currentList = (patientData[listKey] as any[]) || [];
    setPatientData({ 
      ...patientData, 
      [listKey]: [...currentList, { ...emptyItem, id: `${listKey}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` }] 
    });
  };

  const removeItem = (listKey: keyof Patient, id: string) => {
    const currentList = (patientData[listKey] as any[]) || [];
    setPatientData({ 
      ...patientData, 
      [listKey]: currentList.filter(item => item.id !== id) 
    });
  };

  const updateListItem = (listKey: keyof Patient, id: string, field: string, value: any) => {
    const currentList = (patientData[listKey] as any[]) || [];
    const list = [...currentList];
    const index = list.findIndex(item => item.id === id);
    if (index > -1) {
      list[index] = { ...list[index], [field]: value };
      
      // FIX: Recalculate Lab Risk level on change
      if (listKey === 'labResults' && (field === 'testName' || field === 'value')) {
          const lab = list[index];
          list[index].riskLevel = calculateRiskLevel(lab.testName, Number(lab.value));
      }
    }
    setPatientData({ ...patientData, [listKey]: list });
  };

  const handleNormalizeMed = async (id: string, name: string) => {
    if (!name.trim()) return;
    setIsNormalizingMeds(prev => ({ ...prev, [id]: true }));
    try {
      const normalized = await normalizeDrugName(name);
      const fullName = normalized.brand && normalized.generic 
        ? `${normalized.brand} (${normalized.generic})`
        : normalized.brand || normalized.generic;
      if (fullName) updateListItem('treatments', id, 'medication', fullName);
    } catch (err) {
      console.error("Normalization failed", err);
    } finally {
      setIsNormalizingMeds(prev => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <datalist id="diagnosis-list">{commonDiagnoses.map(d => <option key={d} value={d} />)}</datalist>
      <datalist id="complaint-list">{COMMON_COMPLAINTS.map(c => <option key={c} value={c} />)}</datalist>
      <datalist id="drug-list">{availableDrugs.map(drug => <option key={drug} value={drug} />)}</datalist>
      <datalist id="lab-list">{availableLabs.map(test => <option key={test} value={test} />)}</datalist>

      <div className="bg-white w-full max-w-md h-[92vh] sm:h-auto sm:max-h-[85vh] rounded-t-[4rem] sm:rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-500">
        
        {/* Hidden File Inputs */}
        <input type="file" ref={smartFileInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleSmartFileChange} />
        <input type="file" ref={labFileInputRef} className="hidden" accept="image/*,application/pdf" onChange={(e) => handleSectionScan(e, 'LAB')} />
        <input type="file" ref={medFileInputRef} className="hidden" accept="image/*,application/pdf" onChange={(e) => handleSectionScan(e, 'PRESCRIPTION')} />
        <input type="file" ref={quickImagingInputRef} className="hidden" accept="image/*" onChange={handleQuickImagingScan} />

        <div className="px-10 pt-10 pb-6 flex justify-between items-center bg-white sticky top-0 z-10 border-b border-slate-50">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Clinical Records</h2>
            <p className="text-[10px] text-indigo-600 font-black uppercase tracking-[0.2em]">Record Management Portal</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={() => smartFileInputRef.current?.click()}
              className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-indigo-200 animate-pulse active:scale-90 transition-all"
              title="Global Smart Scan"
            >
              {isSmartScanning ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <SparklesIcon className="w-6 h-6" />}
            </button>
            <button onClick={onClose} className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
              <XIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSave(patientData); }} className="flex-1 overflow-y-auto px-10 pb-40 space-y-12 hide-scrollbar pt-8">
          
          <section className="space-y-6">
            <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Personal Identification</h3>
            <div className="space-y-5">
              <input type="text" value={patientData.name} onChange={(e) => setPatientData({...patientData, name: e.target.value})} placeholder="Full Name" className="w-full bg-slate-50 border-2 border-transparent rounded-[1.5rem] px-6 py-5 font-bold text-slate-800 focus:bg-white focus:border-indigo-100 transition-all outline-none" />
              <div className="grid grid-cols-2 gap-4">
                <input type="date" value={patientData.dob} onChange={(e) => setPatientData({...patientData, dob: e.target.value})} className="w-full bg-slate-50 border-2 border-transparent rounded-[1.5rem] px-6 py-5 font-bold text-slate-800 focus:bg-white focus:border-indigo-100 transition-all outline-none" />
                <select value={patientData.gender} onChange={(e) => setPatientData({...patientData, gender: e.target.value as any})} className="w-full bg-slate-50 border-2 border-transparent rounded-[1.5rem] px-6 py-5 appearance-none font-bold text-slate-800 focus:bg-white focus:border-indigo-100 transition-all outline-none">
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
            </div>
          </section>

          {/* Complaints Section */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <StethoscopeIcon className="w-3 h-3" /> Complaints
              </h3>
              <button type="button" onClick={() => addItem('complaints', { text: '', date: new Date().toISOString().split('T')[0] })} className="text-indigo-600 text-[10px] font-black uppercase flex items-center bg-indigo-50 px-4 py-2 rounded-full tracking-widest hover:bg-indigo-100">
                <PlusIcon className="w-4 h-4 mr-1" /> Add Manual
              </button>
            </div>
            <div className="space-y-4">
              {(patientData.complaints || []).map((c) => (
                <div key={c.id} className="p-6 bg-slate-50 rounded-[2rem] relative border-2 border-transparent hover:border-indigo-50 transition-all">
                  <button type="button" onClick={() => removeItem('complaints', c.id)} className="absolute -top-2 -right-2 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg"><XIcon className="w-4 h-4"/></button>
                  <div className="space-y-3">
                    <input list="complaint-list" type="text" value={c.text} onChange={(e) => updateListItem('complaints', c.id, 'text', e.target.value)} placeholder="Condition / Symptom" className="w-full bg-white border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 shadow-sm outline-none" />
                    <input type="date" value={c.date} onChange={(e) => updateListItem('complaints', c.id, 'date', e.target.value)} className="w-full bg-white border-none rounded-2xl px-5 py-4 text-[10px] font-black text-slate-400 shadow-sm outline-none uppercase" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Diagnosis Section */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ClipboardDocumentCheckIcon className="w-3 h-3" /> Diagnoses
              </h3>
              <button type="button" onClick={() => addItem('diagnoses', { condition: '', date: new Date().toISOString().split('T')[0] })} className="text-emerald-600 text-[10px] font-black uppercase flex items-center bg-emerald-50 px-4 py-2 rounded-full tracking-widest hover:bg-emerald-100">
                <PlusIcon className="w-4 h-4 mr-1" /> Add Manual
              </button>
            </div>
            <div className="space-y-4">
              {(patientData.diagnoses || []).map((d) => (
                <div key={d.id} className="p-6 bg-slate-50 rounded-[2rem] relative border-2 border-transparent hover:border-indigo-50 transition-all">
                  <button type="button" onClick={() => removeItem('diagnoses', d.id)} className="absolute -top-2 -right-2 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg"><XIcon className="w-4 h-4"/></button>
                  <div className="space-y-3">
                    <input list="diagnosis-list" type="text" value={d.condition} onChange={(e) => updateListItem('diagnoses', d.id, 'condition', e.target.value)} placeholder="Medical Condition" className="w-full bg-white border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 shadow-sm outline-none" />
                    <input type="date" value={d.date} onChange={(e) => updateListItem('diagnoses', d.id, 'date', e.target.value)} className="w-full bg-white border-none rounded-2xl px-5 py-4 text-[10px] font-black text-slate-400 shadow-sm outline-none uppercase" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Radiology Portal with Vision AI */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <CameraIcon className="w-3 h-3" /> Radiology
              </h3>
              <button type="button" onClick={() => quickImagingInputRef.current?.click()} className="text-indigo-600 text-[10px] font-black uppercase flex items-center bg-indigo-50 px-4 py-2 rounded-full tracking-widest hover:bg-indigo-100">
                <SparklesIcon className="w-4 h-4 mr-1" /> Vision AI Scan
              </button>
            </div>
            <div className="space-y-6">
              {(patientData.imagingStudies || []).map((img) => (
                <div key={img.id} className="p-6 bg-slate-50 rounded-[2.5rem] relative border-2 border-transparent hover:border-indigo-50 transition-all">
                  <button type="button" onClick={() => removeItem('imagingStudies', img.id)} className="absolute -top-2 -right-2 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg z-20"><XIcon className="w-4 h-4"/></button>
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-white rounded-2xl shrink-0 overflow-hidden border border-slate-200">
                      {img.imageUrl ? <img src={img.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><CameraIcon className="w-6 h-6" /></div>}
                    </div>
                    <textarea value={img.reportSummary} onChange={(e) => updateListItem('imagingStudies', img.id, 'reportSummary', e.target.value)} placeholder="Findings / AI Summary" className="flex-1 bg-white border-none rounded-2xl px-5 py-4 text-xs font-bold text-slate-800 shadow-sm outline-none min-h-[80px]" />
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => addItem('imagingStudies', { type: 'X-Ray', date: new Date().toISOString().split('T')[0], reportSummary: '', imageUrl: '' })} className="w-full py-6 border-4 border-dashed border-slate-100 rounded-[2.5rem] text-slate-300 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-indigo-400 transition-all">+ Manual Entry</button>
            </div>
          </section>

          {/* Labs with AI Extraction */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <BeakerIcon className="w-3 h-3" /> Labs
              </h3>
              <div className="flex gap-2">
                <button type="button" onClick={() => labFileInputRef.current?.click()} className="text-indigo-600 text-[10px] font-black uppercase flex items-center bg-indigo-50 px-4 py-2 rounded-full tracking-widest hover:bg-indigo-100">
                  {isSectionScanning.LAB ? <div className="w-3 h-3 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mr-2" /> : <SparklesIcon className="w-4 h-4 mr-2" />}
                  AI Scan
                </button>
                <button type="button" onClick={() => setIsAddLabsOpen(true)} className="text-slate-500 text-[10px] font-black uppercase bg-slate-100 px-4 py-2 rounded-full tracking-widest hover:bg-slate-200">Manual</button>
              </div>
            </div>
            <div className="space-y-4">
              {(patientData.labResults || []).map((lab) => (
                <div key={lab.id} className="p-6 bg-slate-50 rounded-[2rem] relative border-2 border-transparent hover:border-indigo-50 transition-all">
                  <button type="button" onClick={() => removeItem('labResults', lab.id)} className="absolute -top-2 -right-2 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg"><XIcon className="w-4 h-4"/></button>
                  <div className="space-y-3">
                    <input list="lab-list" type="text" value={lab.testName} onChange={(e) => updateListItem('labResults', lab.id, 'testName', e.target.value)} placeholder="Test Name" className="w-full bg-white border-none rounded-2xl px-5 py-4 text-sm font-black text-slate-800 shadow-sm outline-none" />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="number" value={lab.value} onChange={(e) => updateListItem('labResults', lab.id, 'value', Number(e.target.value))} className="w-full bg-white border-none rounded-2xl px-5 py-4 text-sm font-black shadow-sm outline-none" placeholder="Value" />
                      <input type="text" value={lab.unit} onChange={(e) => updateListItem('labResults', lab.id, 'unit', e.target.value)} placeholder="Unit" className="w-full bg-white border-none rounded-2xl px-5 py-4 text-sm font-black text-slate-800 shadow-sm outline-none" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Medications with Normalization & Extraction */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <PillIcon className="w-3 h-3" /> Protocol
              </h3>
              <div className="flex gap-2">
                <button type="button" onClick={() => medFileInputRef.current?.click()} className="text-indigo-600 text-[10px] font-black uppercase flex items-center bg-indigo-50 px-4 py-2 rounded-full tracking-widest hover:bg-indigo-100">
                  {isSectionScanning.PRESCRIPTION ? <div className="w-3 h-3 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mr-2" /> : <SparklesIcon className="w-4 h-4 mr-2" />}
                  AI Scan
                </button>
                <button type="button" onClick={() => addItem('treatments', { medication: '', dosage: '', startDate: new Date().toISOString().split('T')[0] })} className="text-slate-500 text-[10px] font-black uppercase bg-slate-100 px-4 py-2 rounded-full tracking-widest hover:bg-slate-200">Manual</button>
              </div>
            </div>
            <div className="space-y-4">
              {(patientData.treatments || []).map((t) => (
                <div key={t.id} className="p-6 bg-slate-50 rounded-[2rem] relative border-2 border-transparent hover:border-indigo-50 transition-all">
                  <button type="button" onClick={() => removeItem('treatments', t.id)} className="absolute -top-2 -right-2 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg"><XIcon className="w-4 h-4"/></button>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input list="drug-list" type="text" value={t.medication} onChange={(e) => updateListItem('treatments', t.id, 'medication', e.target.value)} placeholder="Medicine Name" className="flex-1 bg-white border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 shadow-sm outline-none" />
                      <button type="button" onClick={() => handleNormalizeMed(t.id, t.medication)} className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm hover:bg-indigo-100 transition-all">
                         {isNormalizingMeds[t.id] ? <div className="w-4 h-4 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" value={t.dosage} onChange={(e) => updateListItem('treatments', t.id, 'dosage', e.target.value)} placeholder="Dosage" className="w-full bg-white border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 shadow-sm outline-none" />
                      <input type="date" value={t.startDate} onChange={(e) => updateListItem('treatments', t.id, 'startDate', e.target.value)} className="w-full bg-white border-none rounded-2xl px-5 py-4 text-xs font-bold text-slate-400 shadow-sm outline-none" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </form>

        <div className="absolute bottom-0 left-0 right-0 p-10 bg-gradient-to-t from-white via-white to-transparent">
          <button onClick={() => onSave(patientData)} className="w-full bg-indigo-600 text-white font-black py-6 rounded-[2.5rem] shadow-[0_20px_40px_-10px_rgba(79,70,229,0.3)] transition-all active:scale-95 text-xs uppercase tracking-widest">
            Save Record
          </button>
        </div>
      </div>

      <AddLabsModal isOpen={isAddLabsOpen} onClose={() => setIsAddLabsOpen(false)} onAdd={(names) => {
          const newLabs = names.map(n => {
              const ref = commonLabTests.find(r => r.name === n);
              return { 
                id: `l-${Date.now()}-${Math.random()}`, 
                testName: n, 
                value: 0, 
                unit: ref?.standardUnit || '', 
                date: new Date().toISOString().split('T')[0], 
                riskLevel: calculateRiskLevel(n, 0) 
              };
          });
          setPatientData({...patientData, labResults: [...(patientData.labResults || []), ...newLabs]});
      }} />
      <ReviewScannedLabsModal isOpen={isReviewLabsOpen} onClose={() => setIsReviewLabsOpen(false)} onAddLabs={(labs) => setPatientData(prev => ({ ...prev, labResults: [...prev.labResults, ...labs.map(l => ({...l, id: `l-${Date.now()}-${Math.random()}`, riskLevel: calculateRiskLevel(l.testName, l.value) }))] }))} initialLabs={scannedLabs} />
      <ReviewScannedTreatmentsModal isOpen={isReviewTreatmentsOpen} onClose={() => setIsReviewTreatmentsOpen(false)} onAddTreatments={(meds) => setPatientData(prev => ({ ...prev, treatments: [...prev.treatments, ...meds.map(m => ({...m, id: `t-${Date.now()}-${Math.random()}`}))] }))} initialTreatments={scannedTreatments} />
    </div>
  );
};