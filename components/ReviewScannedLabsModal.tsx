import React, { useState, useEffect } from 'react';
import type { LabResult } from '../types';
import { RiskLevel } from '../types';
import { XIcon } from './ui/icons';
import { calculateRiskLevel } from '../utils/labTestReference';

type ReviewableLab = Omit<LabResult, 'id'> & { isSelected: boolean };

interface ReviewScannedLabsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLabs: (labs: Omit<LabResult, 'id'>[]) => void;
  initialLabs: Omit<LabResult, 'id' | 'riskLevel'>[];
}

export const ReviewScannedLabsModal: React.FC<ReviewScannedLabsModalProps> = ({ isOpen, onClose, onAddLabs, initialLabs }) => {
  const [reviewedLabs, setReviewedLabs] = useState<ReviewableLab[]>([]);

  useEffect(() => {
    if (initialLabs) {
      setReviewedLabs(
        initialLabs.map(lab => ({
          ...lab,
          riskLevel: calculateRiskLevel(lab.testName, Number(lab.value)),
          isSelected: true,
        }))
      );
    }
  }, [initialLabs]);

  if (!isOpen) return null;

  const handleLabChange = (index: number, field: keyof Omit<LabResult, 'id' | 'riskLevel'>, value: string | number) => {
    const updatedLabs = [...reviewedLabs];
    const labToUpdate = { ...updatedLabs[index], [field]: value };

    // Recalculate risk if value or testName changes
    if (field === 'value' || field === 'testName') {
      labToUpdate.riskLevel = calculateRiskLevel(labToUpdate.testName, Number(labToUpdate.value));
    }
    
    updatedLabs[index] = labToUpdate;
    setReviewedLabs(updatedLabs);
  };

  const handleSelectionChange = (index: number) => {
    const updatedLabs = [...reviewedLabs];
    updatedLabs[index].isSelected = !updatedLabs[index].isSelected;
    setReviewedLabs(updatedLabs);
  };

  const handleSelectAll = (select: boolean) => {
    setReviewedLabs(reviewedLabs.map(lab => ({...lab, isSelected: select})));
  };

  const handleAddClick = () => {
    const labsToAdd = reviewedLabs
      .filter(lab => lab.isSelected)
      .map(({ isSelected, ...rest }) => rest); // strip isSelected property
    onAddLabs(labsToAdd);
  };

  const allSelected = reviewedLabs.every(lab => lab.isSelected);
  const selectedCount = reviewedLabs.filter(lab => lab.isSelected).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex justify-center items-start pt-10" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white px-6 py-4 border-b z-10 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">Review Scanned Lab Results</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-slate-200">
            <XIcon className="w-6 h-6 text-slate-600" />
          </button>
        </div>
        <div className="overflow-y-auto p-6">
          <p className="text-sm text-slate-600 mb-4">AI has extracted the following lab results. Please review them for accuracy, make any necessary corrections, and select the ones you want to add to the patient's record.</p>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-100">
                    <tr>
                        <th scope="col" className="px-4 py-3">
                            <input type="checkbox" checked={allSelected} onChange={() => handleSelectAll(!allSelected)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"/>
                        </th>
                        <th scope="col" className="px-4 py-3 font-medium text-slate-600 text-left">Test Name</th>
                        <th scope="col" className="px-4 py-3 font-medium text-slate-600 text-left">Value</th>
                        <th scope="col" className="px-4 py-3 font-medium text-slate-600 text-left">Unit</th>
                        <th scope="col" className="px-4 py-3 font-medium text-slate-600 text-left">Date</th>
                        <th scope="col" className="px-4 py-3 font-medium text-slate-600 text-center">Risk</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                    {reviewedLabs.map((lab, index) => (
                        <tr key={index}>
                            <td className="px-4 py-2">
                                <input type="checkbox" checked={lab.isSelected} onChange={() => handleSelectionChange(index)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"/>
                            </td>
                            <td className="px-4 py-2"><input type="text" value={lab.testName} onChange={e => handleLabChange(index, 'testName', e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm text-sm p-1"/></td>
                            <td className="px-4 py-2"><input type="number" value={lab.value} onChange={e => handleLabChange(index, 'value', Number(e.target.value))} className="w-24 rounded-md border-gray-300 shadow-sm text-sm p-1"/></td>
                            <td className="px-4 py-2"><input type="text" value={lab.unit} onChange={e => handleLabChange(index, 'unit', e.target.value)} className="w-20 rounded-md border-gray-300 shadow-sm text-sm p-1"/></td>
                            <td className="px-4 py-2"><input type="date" value={lab.date} onChange={e => handleLabChange(index, 'date', e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm text-sm p-1"/></td>
                            <td className="px-4 py-2 text-center">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    lab.riskLevel === 'High' ? 'bg-red-100 text-red-800' :
                                    lab.riskLevel === 'Low' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                }`}>
                                    {lab.riskLevel}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
        </div>
        <div className="sticky bottom-0 bg-slate-50 px-6 py-4 border-t flex justify-end space-x-3">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50">
            Cancel
          </button>
          <button 
            type="button" 
            onClick={handleAddClick} 
            disabled={selectedCount === 0}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300"
          >
            Add {selectedCount} Selected Lab(s)
          </button>
        </div>
      </div>
    </div>
  );
};
