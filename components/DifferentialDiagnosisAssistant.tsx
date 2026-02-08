
import React, { useState } from 'react';
import type { Patient, DifferentialDiagnosis } from '../types';
import { generateDifferentialDiagnoses } from '../services/geminiService';
import { Card } from './ui/Card';
import { LightBulbIcon } from './ui/icons';

interface DifferentialDiagnosisAssistantProps {
  patient: Patient;
}

const getConfidencePillColor = (confidence: 'High' | 'Medium' | 'Low') => {
    switch (confidence) {
        case 'High': return 'bg-red-100 text-red-800';
        case 'Medium': return 'bg-yellow-100 text-yellow-800';
        case 'Low': return 'bg-blue-100 text-blue-800';
        default: return 'bg-slate-100 text-slate-800';
    }
}

export const DifferentialDiagnosisAssistant: React.FC<DifferentialDiagnosisAssistantProps> = ({ patient }) => {
    const [symptoms, setSymptoms] = useState('');
    const [findings, setFindings] = useState('');
    const [history, setHistory] = useState('');

    const [diagnoses, setDiagnoses] = useState<DifferentialDiagnosis[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!symptoms.trim() && !findings.trim() && !history.trim()) {
            setError('Please provide at least one symptom, finding, or history detail.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setDiagnoses([]);
        try {
            const result = await generateDifferentialDiagnoses(patient, symptoms, findings, history);
            setDiagnoses(result);
        } catch (err) {
            setError('Failed to generate AI diagnoses. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card title="Differential Diagnosis Assistant" icon={<LightBulbIcon className="w-5 h-5" />}>
            <div className="space-y-4">
                <div>
                    <label htmlFor="history" className="block text-sm font-medium text-slate-700">Patient's Reported History</label>
                    <textarea
                        id="history"
                        rows={3}
                        value={history}
                        onChange={(e) => setHistory(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="e.g., Patient reports a 3-day history of progressive shortness of breath..."
                    />
                </div>
                 <div>
                    <label htmlFor="symptoms" className="block text-sm font-medium text-slate-700">Presenting Symptoms</label>
                    <textarea
                        id="symptoms"
                        rows={3}
                        value={symptoms}
                        onChange={(e) => setSymptoms(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="e.g., Chest pain, cough, fever..."
                    />
                </div>
                 <div>
                    <label htmlFor="findings" className="block text-sm font-medium text-slate-700">Key Clinical Findings</label>
                    <textarea
                        id="findings"
                        rows={3}
                        value={findings}
                        onChange={(e) => setFindings(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="e.g., Wheezing on auscultation, elevated heart rate..."
                    />
                </div>
                <div>
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:bg-indigo-300"
                    >
                        {isLoading ? 'Analyzing...' : 'Generate Differential Diagnoses'}
                    </button>
                </div>
                {error && <p className="text-red-500 text-center text-sm">{error}</p>}
                {diagnoses.length > 0 && (
                    <div className="space-y-4 pt-4 border-t">
                        <h4 className="font-semibold text-slate-800">Potential Diagnoses:</h4>
                        {diagnoses.map((d, i) => (
                            <div key={i} className="p-3 bg-slate-50 rounded-lg text-sm">
                                <div className="flex justify-between items-start">
                                    <h5 className="font-semibold text-slate-800">{d.diagnosis}</h5>
                                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getConfidencePillColor(d.confidence)}`}>{d.confidence}</span>
                                </div>
                                <p className="mt-1 text-slate-600"><span className="font-semibold">Reasoning:</span> {d.reasoning}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Card>
    );
};