
import React, { useState, useMemo } from 'react';
import { commonLabTests } from '../utils/labTestReference';
import { XIcon } from './ui/icons';

interface AddLabsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (selectedTestNames: string[]) => void;
}

export const AddLabsModal: React.FC<AddLabsModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());

  const groupedAndFilteredLabs = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const filtered = commonLabTests.filter(lab => lab.name.toLowerCase().includes(query));

    // Fix: Explicitly type the initial value for reduce to guide TypeScript's inference.
    return filtered.reduce((acc, lab) => {
      const category = lab.category || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(lab);
      return acc;
    }, {} as Record<string, (typeof commonLabTests)[number][]>);
  }, [searchQuery]);

  const handleToggleTest = (testName: string) => {
    setSelectedTests(prev => {
      const newSet = new Set(prev);
      if (newSet.has(testName)) {
        newSet.delete(testName);
      } else {
        newSet.add(testName);
      }
      return newSet;
    });
  };

  const handleAddClick = () => {
    onAdd(Array.from(selectedTests));
    onClose();
    setSelectedTests(new Set());
  };

  if (!isOpen) return null;
  
  const footer = (
    <>
      <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50">
        Cancel
      </button>
      <button 
        type="button" 
        onClick={handleAddClick} 
        disabled={selectedTests.size === 0}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300"
      >
        Add {selectedTests.size} Selected Lab(s)
      </button>
    </>
  );

  return (
     <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex justify-center items-start pt-10" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white px-6 py-4 border-b z-10 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">Select Lab Tests to Add</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-slate-200">
            <XIcon className="w-6 h-6 text-slate-600" />
          </button>
        </div>
        <div className="overflow-y-auto p-6">
           <div className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Search for a lab test..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm text-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {/* Fix: Using Object.keys and indexing for more robust type resolution in JSX iteration. */}
              {Object.keys(groupedAndFilteredLabs).map((category) => (
                <div key={category}>
                  <h4 className="text-md font-semibold text-slate-600 border-b pb-1 mb-2">{category}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {groupedAndFilteredLabs[category].map(lab => (
                      <label key={lab.name} className="flex items-center space-x-2 p-2 rounded-md hover:bg-slate-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedTests.has(lab.name)}
                          onChange={() => handleToggleTest(lab.name)}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-slate-700">{lab.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="sticky bottom-0 bg-slate-50 px-6 py-4 border-t flex justify-end space-x-3">
          {footer}
        </div>
      </div>
    </div>
  );
};
