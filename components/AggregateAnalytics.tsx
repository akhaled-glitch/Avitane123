
import React, { useState, useMemo } from 'react';
import type { Patient } from '../types';
import { Card } from './ui/Card';
import { ChartBarIcon } from './ui/icons';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface AggregateAnalyticsProps {
  patients: Patient[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const AggregateAnalytics: React.FC<AggregateAnalyticsProps> = ({ patients }) => {
  const [diseaseQuery, setDiseaseQuery] = useState('');
  const [foundPatients, setFoundPatients] = useState<string[] | null>(null);

  const handleSearchCases = () => {
    if (!diseaseQuery.trim()) {
      setFoundPatients(null);
      return;
    }
    const matchingPatients = patients
      .filter(p => 
        p.diagnoses.some(d => d.condition.toLowerCase().includes(diseaseQuery.toLowerCase()))
      )
      .map(p => p.name);
    setFoundPatients(matchingPatients);
  };

  const diagnosisDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    patients.forEach(p => {
      p.diagnoses.forEach(d => {
        counts[d.condition] = (counts[d.condition] || 0) + 1;
      });
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [patients]);
  
  return (
    <Card title="Aggregate Analytics" icon={<ChartBarIcon className="w-5 h-5"/>}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h4 className="font-semibold text-slate-700 mb-2">Search Patients by Disease</h4>
          <div className="flex space-x-2">
            <input
              type="text"
              value={diseaseQuery}
              onChange={(e) => setDiseaseQuery(e.target.value)}
              placeholder="Enter disease name"
              className="flex-grow block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            <button
              onClick={handleSearchCases}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
            >
              Search
            </button>
          </div>
          {foundPatients !== null && (
            <div className="mt-4 p-3 bg-indigo-50 rounded-md">
              {foundPatients.length > 0 ? (
                <>
                  <p>Found <strong>{foundPatients.length}</strong> patient(s) with a diagnosis related to "<strong>{diseaseQuery}</strong>":</p>
                  <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                    {foundPatients.map((name, index) => <li key={index}>{name}</li>)}
                  </ul>
                </>
              ) : (
                <p>No patients found with a diagnosis related to "<strong>{diseaseQuery}</strong>".</p>
              )}
            </div>
          )}
        </div>

        <div>
            <h4 className="font-semibold text-slate-700 mb-2">Diagnosis Distribution</h4>
            {diagnosisDistribution.length > 0 ? (
                <div style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie
                                data={diagnosisDistribution}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {diagnosisDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <p className="text-center text-slate-500 mt-8">No diagnosis data available.</p>
            )}
        </div>
      </div>
    </Card>
  );
};