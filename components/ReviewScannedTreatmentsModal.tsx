import React, { useState, useEffect } from 'react';
import type { Treatment } from '../types';
import { XIcon } from './ui/icons';

type ReviewableTreatment = Omit<Treatment, 'id'> & { isSelected: boolean };

interface ReviewScannedTreatmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTreatments: (meds: Omit<Treatment, 'id'>[]) => void;
  initialTreatments: Omit<Treatment, 'id'>[];
}

export const ReviewScannedTreatmentsModal: React.FC<ReviewScannedTreatmentsModalProps> = ({ isOpen, onClose, onAddTreatments, initialTreatments }) => {
  const [reviewedMeds, setReviewedMeds] = useState<ReviewableTreatment[]>([]);

  useEffect(() => {
    if (initialTreatments) {
      setReviewedMeds(initialTreatments.map(med => ({ ...med, isSelected: true })));
    }
  }, [initialTreatments]);

  if (!isOpen) return null;

  const handleMedChange = (index: number, field: keyof Omit<Treatment, 'id'>, value: string) => {
    const updated = [...reviewedMeds];
    updated[index] = { ...updated[index], [field]: value };
    setReviewedMeds(updated);
  };

  const handleSelectionChange = (index: number) => {
    const updated = [...reviewedMeds];
    updated[index].isSelected = !updated[index].isSelected;
    setReviewedMeds(updated);
  };

  const handleAddClick = () => {
    const medsToAdd = reviewedMeds.filter(m => m.isSelected).map(({ isSelected, ...rest }) => rest);
    onAddTreatments(medsToAdd);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex justify-center items-start pt-10" onClick={onClose}>
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col m-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">Review Scanned Medications</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 transition-colors">
            <XIcon className="w-6 h-6 text-slate-600" />
          </button>
        </div>
        <div className="overflow-y-auto p-6 space-y-4">
          <p className="text-sm text-slate-500">AI has detected the following medications. Please verify the dosage and start date before adding them to your profile.</p>
          <div className="space-y-3">
            {reviewedMeds.map((med, index) => (
              <div key={index} className={`p-4 rounded-2xl border transition-colors ${med.isSelected ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-100 bg-slate-50'}`}>
                <div className="flex items-start gap-3">
                  <input type="checkbox" checked={med.isSelected} onChange={() => handleSelectionChange(index)} className="mt-1 h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  <div className="flex-1 space-y-3">
                    <input type="text" value={med.medication} onChange={e => handleMedChange(index, 'medication', e.target.value)} className="w-full bg-white border-none rounded-xl px-4 py-2 text-sm font-bold text-slate-800 shadow-sm" placeholder="Medicine Name" />
                    <div className="grid grid-cols-2 gap-2">
                       <input type="text" value={med.dosage} onChange={e => handleMedChange(index, 'dosage', e.target.value)} className="w-full bg-white border-none rounded-xl px-4 py-2 text-xs text-slate-600 shadow-sm" placeholder="Dosage" />
                       <input type="date" value={med.startDate} onChange={e => handleMedChange(index, 'startDate', e.target.value)} className="w-full bg-white border-none rounded-xl px-4 py-2 text-xs text-slate-600 shadow-sm" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-6 bg-slate-50 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 text-sm font-bold text-slate-400 uppercase tracking-widest">Cancel</button>
          <button onClick={handleAddClick} disabled={reviewedMeds.filter(m=>m.isSelected).length === 0} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 disabled:opacity-50 transition-all">
            Confirm & Add
          </button>
        </div>
      </div>
    </div>
  );
};
