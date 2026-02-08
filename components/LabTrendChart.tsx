
import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { Patient, LabResult } from '../types';
import { Card } from './ui/Card';
// Added BeakerIcon to imports to fix the error on line 61
import { ChartBarIcon, ClockIcon, ExclamationTriangleIcon, ChevronDownIcon, CheckCircleIcon, BeakerIcon } from './ui/icons';
import { commonLabTests } from '../utils/labTestReference';

interface LabTrendChartProps {
  patient: Patient;
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-5 rounded-[1.5rem] shadow-2xl border border-white/10 backdrop-blur-xl">
          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">{label}</p>
          <div className="flex items-baseline space-x-2">
            <p className="text-2xl font-black tracking-tighter">{payload[0].value}</p>
            <span className="text-[10px] font-bold text-slate-400 uppercase">{data.unit}</span>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center space-x-2">
             <div className={`w-2 h-2 rounded-full ${data.riskLevel === 'High' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
               {data.riskLevel} Risk Threshold
             </span>
          </div>
        </div>
      );
    }
    return null;
};

export const LabTrendChart: React.FC<LabTrendChartProps> = ({ patient }) => {
  const availableTests = useMemo(() => {
    const testNames = new Set(patient.labResults.map(r => r.testName));
    return Array.from(testNames);
  }, [patient.labResults]);

  const [selectedTest, setSelectedTest] = useState<string>(availableTests[0] || '');

  const sortedResults = useMemo(() => {
    return (patient.labResults || [])
      .filter(r => r.testName === selectedTest)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [patient.labResults, selectedTest]);

  const chartData = useMemo(() => {
    return sortedResults.map(r => ({ ...r, dateLabel: new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) }));
  }, [sortedResults]);

  const testReference = useMemo(() => {
    return commonLabTests.find(t => t.name === selectedTest);
  }, [selectedTest]);

  if (availableTests.length === 0) {
    return (
        <Card title="Lab Analytics Studio" icon={<ChartBarIcon />}>
            <div className="py-24 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mx-auto mb-6">
                <BeakerIcon className="w-8 h-8" />
              </div>
              <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No lab metrics available for analysis.</p>
            </div>
        </Card>
    );
  }

  return (
    <div className="space-y-10">
      <Card title="Biomarker Trend Analysis" icon={<ChartBarIcon />} subtitle={`Data Stream: ${selectedTest}`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-4 space-y-8">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Metric Selector</label>
              <div className="relative">
                <select
                  value={selectedTest}
                  onChange={(e) => setSelectedTest(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-[1.5rem] px-6 py-5 text-slate-800 appearance-none focus:ring-4 focus:ring-indigo-100 transition-all font-black pr-12 text-sm"
                >
                  {availableTests.map(test => <option key={test} value={test}>{test}</option>)}
                </select>
                <ChevronDownIcon className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {testReference && (
              <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Optimal Reference Range</span>
                <div className="mt-4 flex items-baseline space-x-3">
                  <p className="text-3xl font-black text-slate-900 tracking-tighter">
                    {testReference.normalRange.min} — {testReference.normalRange.max}
                  </p>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{testReference.standardUnit}</span>
                </div>
                <div className="mt-8 flex items-center space-x-2 p-4 bg-white rounded-2xl border border-slate-100">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Clinically Validated Range</span>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-8 h-[400px]">
            {chartData.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="dateLabel" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} 
                    dy={15} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} 
                    dx={-10}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  {testReference && (
                    <ReferenceLine y={testReference.normalRange.max} stroke="#f43f5e" strokeDasharray="3 3" strokeWidth={1} label={{ value: 'High', position: 'insideRight', fill: '#f43f5e', fontSize: 8, fontWeight: 900 }} />
                  )}
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#4f46e5" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                    dot={{ r: 6, fill: '#4f46e5', strokeWidth: 4, stroke: '#fff' }}
                    activeDot={{ r: 10, strokeWidth: 0, fill: '#4f46e5' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-100">
                 <ClockIcon className="w-12 h-12 text-slate-200 mb-4" />
                 <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Insufficient Data Points for Trend Graph</p>
              </div>
            )}
          </div>
        </div>
      </Card>
      
      {/* Historical Logs List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {chartData.slice().reverse().map((entry, idx) => (
          <div key={entry.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="flex justify-between items-start mb-6">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {new Date(entry.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${
                entry.riskLevel === 'High' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
              }`}>
                {entry.riskLevel}
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <p className="text-4xl font-black text-slate-900 tracking-tighter">{entry.value}</p>
              <span className="text-sm font-bold text-slate-300 uppercase">{entry.unit}</span>
            </div>
            {entry.riskLevel === 'High' && (
              <div className="mt-8 flex items-start space-x-3 p-4 bg-rose-50 rounded-2xl border border-rose-100">
                <ExclamationTriangleIcon className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-rose-800 font-black leading-relaxed">
                  Metric exceeds clinical safety threshold. Review medication efficacy and lifestyle factors.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
