import React, { useState, useMemo } from 'react';
import type { Patient, LabAnalysisResult, BiomarkerAnalysis } from '../types';
import { analyzeFullLabPanel } from '../services/geminiService';
import { Card } from './ui/Card';
import { ClipboardDocumentCheckIcon, ExclamationTriangleIcon, ChevronDownIcon, ChevronUpIcon, ClockIcon, CheckCircleIcon } from './ui/icons';

interface LabReportAnalyzerProps {
  patient: Patient;
}

const getStatusPill = (status: 'Low' | 'Normal' | 'High' | 'N/A') => {
    const baseClasses = 'font-semibold px-2 py-0.5 rounded-full text-xs';
    switch (status) {
        case 'High': return <span className={`${baseClasses} text-red-700 bg-red-100`}>High</span>;
        case 'Low': return <span className={`${baseClasses} text-yellow-700 bg-yellow-100`}>Low</span>;
        case 'Normal': return <span className={`${baseClasses} text-green-700 bg-green-100`}>Normal</span>;
        default: return <span className={`${baseClasses} text-slate-600 bg-slate-100`}>N/A</span>;
    }
};

const getConcernInfo = (concern: 'Priority to Address' | 'Monitor' | 'Stable' | 'Optimal') => {
    switch (concern) {
        case 'Priority to Address': return {
            icon: <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />,
            text: <span className="font-semibold text-red-600">{concern}</span>,
            rowClass: 'bg-red-50/50',
        };
        case 'Monitor': return {
            icon: <ClockIcon className="w-5 h-5 text-yellow-500" />,
            text: <span className="font-semibold text-yellow-600">{concern}</span>,
            rowClass: 'bg-yellow-50/50',
        };
        case 'Optimal': return {
            icon: <CheckCircleIcon className="w-5 h-5 text-green-500" />,
            text: <span className="font-semibold text-green-600">{concern}</span>,
            rowClass: 'bg-green-50/50',
        };
        default: return {
            icon: null,
            text: <span className="text-slate-600">{concern}</span>,
            rowClass: '',
        };
    }
}

type SortableKeys = keyof BiomarkerAnalysis;
type SortConfig = { key: SortableKeys; direction: 'asc' | 'desc' } | null;

const AnalysisSection: React.FC<{
    system: string;
    biomarkers: BiomarkerAnalysis[];
    isOpen: boolean;
    onToggle: () => void;
}> = ({ system, biomarkers, isOpen, onToggle }) => {
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'concern', direction: 'desc' });

    const sortedBiomarkers = useMemo(() => {
        let sortableItems = [...biomarkers];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                // Custom sort for 'concern'
                if (sortConfig.key === 'concern') {
                    const concernOrder = { 'Priority to Address': 4, 'Monitor': 3, 'Stable': 2, 'Optimal': 1 };
                    const valA = concernOrder[a.concern] || 0;
                    const valB = concernOrder[b.concern] || 0;
                    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                    return 0;
                }
                
                // Default sort for other keys
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [biomarkers, sortConfig]);

    const requestSort = (key: SortableKeys) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const formatSystemName = (name: string) => {
        return name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
    }
    
    const tableHeaders: { key: SortableKeys, label: string, className?: string }[] = [
        { key: 'testName', label: 'Biomarker' },
        { key: 'value', label: 'Value', className: 'text-right' },
        { key: 'clinicalStatus', label: 'Clinical Status', className: 'text-center' },
        { key: 'functionalStatus', label: 'Functional Status', className: 'text-center' },
        { key: 'concern', label: 'Concern', className: 'text-left' },
        { key: 'interpretation', label: 'Interpretation', className: 'w-1/3' },
    ];

    return (
        <div className="border rounded-lg overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full flex justify-between items-center p-4 bg-slate-50 hover:bg-slate-100 focus:outline-none"
            >
                <h3 className="text-lg font-semibold text-slate-800">{formatSystemName(system)} Analysis</h3>
                {isOpen ? <ChevronUpIcon className="w-5 h-5 text-slate-600" /> : <ChevronDownIcon className="w-5 h-5 text-slate-600" />}
            </button>
            {isOpen && (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-100">
                            <tr>
                                {tableHeaders.map(({key, label, className}) => (
                                     <th key={key} scope="col" className={`px-4 py-3 font-medium text-slate-600 ${className || 'text-left'}`}>
                                        <button onClick={() => requestSort(key)} className="flex items-center space-x-1 group">
                                           <span>{label}</span>
                                           <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                {sortConfig?.key === key ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}
                                           </span>
                                        </button>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {sortedBiomarkers.map(biomarker => {
                                const concernInfo = getConcernInfo(biomarker.concern);
                                return (
                                    <tr key={biomarker.testName} className={`${concernInfo.rowClass}`}>
                                        <td className="px-4 py-3 font-medium text-slate-800">{biomarker.testName}</td>
                                        <td className="px-4 py-3 text-right">{biomarker.value} {biomarker.unit}</td>
                                        <td className="px-4 py-3 text-center">{getStatusPill(biomarker.clinicalStatus)}</td>
                                        <td className="px-4 py-3 text-center">{getStatusPill(biomarker.functionalStatus)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center space-x-2">
                                                {concernInfo.icon}
                                                {concernInfo.text}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">{biomarker.interpretation}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};


export const LabReportAnalyzer: React.FC<LabReportAnalyzerProps> = ({ patient }) => {
    const [analysisResult, setAnalysisResult] = useState<LabAnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

    const handleAnalyze = async () => {
        if (patient.labResults.length === 0) {
            setError('This patient has no lab results to analyze.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);

        try {
            const result = await analyzeFullLabPanel(patient);
            setAnalysisResult(result);
            // Default all sections to open
            const initialOpenState = Object.keys(result.analysisBySystem).reduce((acc, system) => {
                acc[system] = true;
                return acc;
            }, {} as Record<string, boolean>);
            setOpenSections(initialOpenState);

        } catch (err) {
            setError('Failed to generate AI lab analysis. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleSection = (system: string) => {
        setOpenSections(prev => ({ ...prev, [system]: !prev[system] }));
    };
    
    return (
        <Card title="Longevity Lab Analyzer" icon={<ClipboardDocumentCheckIcon className="w-5 h-5" />}>
            <div className="space-y-4">
                <p className="text-sm text-slate-600">
                    Get a deep analysis of the patient's full lab panel from a functional medicine and longevity perspective. This AI model will evaluate biomarkers against both clinical and optimal ranges to provide prioritized insights and actionable recommendations.
                </p>
                <div>
                    <button
                        onClick={handleAnalyze}
                        disabled={isLoading}
                        className="w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:bg-indigo-300"
                    >
                        {isLoading ? 'Analyzing Panel...' : 'Analyze Full Lab Panel with AI'}
                    </button>
                </div>
                {error && <p className="text-red-500 text-center text-sm">{error}</p>}
                {analysisResult && (
                    <div className="space-y-8 pt-4 border-t">
                        {/* Analysis by System */}
                        <div className="space-y-4">
                            {Object.entries(analysisResult.analysisBySystem).map(([system, biomarkers]) => (
                                <AnalysisSection
                                    key={system}
                                    system={system}
                                    biomarkers={biomarkers as BiomarkerAnalysis[]}
                                    isOpen={!!openSections[system]}
                                    onToggle={() => toggleSection(system)}
                                />
                            ))}
                        </div>

                        {/* Prioritized Insights */}
                        <div className="p-4 bg-indigo-50 rounded-lg">
                            <h3 className="text-lg font-semibold text-indigo-900 mb-2">Top 3 Prioritized Insights</h3>
                            <ul className="space-y-2 list-decimal list-inside text-indigo-800">
                                {analysisResult.prioritizedInsights.map((insight, i) => <li key={i}>{insight}</li>)}
                            </ul>
                        </div>
                        
                        {/* Recommendations */}
                         <div className="p-4 bg-green-50 rounded-lg">
                            <h3 className="text-lg font-semibold text-green-900 mb-2">Actionable Recommendations</h3>
                            <ul className="space-y-2 list-disc list-inside text-green-800">
                                {analysisResult.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                            </ul>
                        </div>

                        {/* Follow-up Tests */}
                         <div className="p-4 bg-yellow-50 rounded-lg">
                            <h3 className="text-lg font-semibold text-yellow-900 mb-2">Suggested Follow-Up Tests</h3>
                            <ul className="space-y-2 list-disc list-inside text-yellow-800">
                                {analysisResult.followUpTests.map((test, i) => <li key={i}>{test}</li>)}
                            </ul>
                        </div>

                         <p className="text-xs text-slate-400 mt-8 italic text-center">This report was generated by an AI assistant and requires clinical validation by a qualified healthcare professional.</p>

                    </div>
                )}
            </div>
        </Card>
    );
};