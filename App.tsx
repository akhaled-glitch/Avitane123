import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './services/supabaseClient';
import { MOCK_PATIENTS } from './data/mockData';
import type { Patient, UserRole } from './types';
import { PatientDetail } from './components/PatientDetail';
import { LabTrendChart } from './components/LabTrendChart';
import { DataEntryForm } from './components/DataEntryForm';
import { MetricsOverview } from './components/MetricsOverview';
import { MedicationInteractionsMetric } from './components/MedicationInteractionsMetric';
import { LoginScreen } from './components/LoginScreen';
import { 
  PlusIcon, 
  ChartBarIcon, 
  HeartIcon, 
  UserIcon, 
  SparklesIcon, 
  ClipboardDocumentCheckIcon, 
  ExclamationTriangleIcon, 
  BeakerIcon, 
  PillIcon,
  ChevronDownIcon,
  CheckCircleIcon
} from './components/ui/icons';
import { DifferentialDiagnosisAssistant } from './components/DifferentialDiagnosisAssistant';
import { LabReportAnalyzer } from './components/LabReportAnalyzer';
import { exportPatientLabsToCSV } from './utils/exportService';
import { POPULAR_DRUGS, commonLabTests } from './utils/labTestReference';

const getInitialPatients = (): Patient[] => {
  try {
    const savedPatients = localStorage.getItem('mediDashPatients');
    if (!savedPatients) return MOCK_PATIENTS;
    const parsedPatients = JSON.parse(savedPatients);
    return Array.isArray(parsedPatients) && parsedPatients.length > 0 ? parsedPatients : MOCK_PATIENTS;
  } catch (error) {
    return MOCK_PATIENTS;
  }
};

const getSavedCustomItems = (key: string, base: string[]): string[] => {
  try {
    const saved = localStorage.getItem(key);
    const custom = saved ? JSON.parse(saved) : [];
    return Array.from(new Set([...base, ...custom]));
  } catch {
    return base;
  }
};

type Tab = 'hub' | 'analytics' | 'clinical-ai' | 'settings';

function App() {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const [activeTab, setActiveTab] = useState<Tab>('hub');
  const [patients, setPatients] = useState<Patient[]>(getInitialPatients());
  
  const [drugList, setDrugList] = useState<string[]>(() => 
    getSavedCustomItems('mediDashCustomDrugs', POPULAR_DRUGS)
  );
  const [labList, setLabList] = useState<string[]>(() => 
    getSavedCustomItems('mediDashCustomLabs', commonLabTests.map(t => t.name))
  );

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [patientToEdit, setPatientToEdit] = useState<Patient | null>(null);
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);

  useEffect(() => {
    // Check for existing session
    const getSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        // Recover role from local storage if session exists
        const savedRole = localStorage.getItem('mediDashRole');
        if (session && savedRole) {
            setRole(savedRole as UserRole);
        }
        setIsInitializing(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        if (!session) {
            setRole(null);
            localStorage.removeItem('mediDashRole');
        }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (patients.length > 0 && !selectedPatient) {
      // If patient role, force select the first patient (demo mode)
      if (role === 'Patient') {
          setSelectedPatient(patients[1]); // Example: John Doe
      } else {
          setSelectedPatient(patients[0]);
      }
    }
  }, [patients, selectedPatient, role]);

  useEffect(() => {
    localStorage.setItem('mediDashPatients', JSON.stringify(patients));
  }, [patients]);

  const handleUpdatePatient = (patientToUpdate: Patient) => {
    const updatedPatients = patients.map(p => p.id === patientToUpdate.id ? patientToUpdate : p);
    setPatients(updatedPatients);
    if (selectedPatient?.id === patientToUpdate.id) {
        setSelectedPatient(patientToUpdate);
    }
  };

  const handleSavePatient = (patientToSave: Patient) => {
    const patientExists = patients.some(p => p.id === patientToSave.id);
    let updatedPatients: Patient[];
    if (patientExists) {
      updatedPatients = patients.map(p => p.id === patientToSave.id ? patientToSave : p);
    } else {
      updatedPatients = [patientToSave, ...patients];
    }
    setPatients(updatedPatients);
    setSelectedPatient(patientToSave);
    setIsFormOpen(false);
    setPatientToEdit(null);
  };

  const handleLoginSuccess = (selectedRole: UserRole) => {
      setRole(selectedRole);
      localStorage.setItem('mediDashRole', selectedRole);
      // Mock session set for demo mode if Supabase isn't configured, 
      // otherwise Supabase listener handles it.
      if (!session) {
          setSession({ user: { email: 'demo@example.com' } });
      }
  };

  const handleLogout = async () => {
      await supabase.auth.signOut();
      setSession(null);
      setRole(null);
      localStorage.removeItem('mediDashRole');
  };

  if (isInitializing) {
      return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest">Loading Studio...</div>;
  }

  if (!session || !role) {
      return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  const isProvider = role === 'Provider';
  const age = selectedPatient ? new Date().getFullYear() - new Date(selectedPatient.dob).getFullYear() : 0;
  const highRiskCount = selectedPatient?.labResults.filter(l => l.riskLevel === 'High').length || 0;

  return (
    <div className="bg-slate-50 min-h-screen flex text-slate-900 font-sans">
      {/* Sidebar - Desktop Only */}
      <aside className="hidden lg:flex w-72 bg-white border-r border-slate-200 flex-col sticky top-0 h-screen">
        <div className="p-8 border-b border-slate-100">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <span className="font-black text-slate-800 tracking-tight text-xl">MediDash</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block pl-1">
            Studio Professional
          </span>
        </div>

        <nav className="flex-1 p-6 space-y-2">
          <SidebarLink 
            icon={<HeartIcon />} 
            label="Patient Hub" 
            active={activeTab === 'hub'} 
            onClick={() => setActiveTab('hub')} 
          />
          <SidebarLink 
            icon={<ChartBarIcon />} 
            label="Data Analytics" 
            active={activeTab === 'analytics'} 
            onClick={() => setActiveTab('analytics')} 
          />
          {isProvider && (
            <SidebarLink 
              icon={<SparklesIcon />} 
              label="Clinical AI" 
              active={activeTab === 'clinical-ai'} 
              onClick={() => setActiveTab('clinical-ai')} 
            />
          )}
          <SidebarLink 
            icon={<UserIcon />} 
            label="Studio Settings" 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
          />
        </nav>

        <div className="p-6 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-rose-50 hover:text-rose-600 transition-all text-left group"
          >
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-rose-400">Signed In As</span>
              <span className="text-sm font-bold text-slate-800 group-hover:text-rose-600 transition-colors">{role}</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
              <UserIcon className="w-4 h-4 text-slate-400 group-hover:text-rose-400" />
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header / Context Bar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 lg:px-12 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative">
              <button 
                onClick={() => isProvider && setIsPatientDropdownOpen(!isPatientDropdownOpen)}
                disabled={!isProvider}
                className={`flex items-center space-x-3 text-left group ${!isProvider ? 'cursor-default' : ''}`}
              >
                <div className="w-12 h-12 rounded-[1.25rem] bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner group-hover:bg-indigo-100 transition-all">
                  <UserIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">
                      {selectedPatient?.name || 'Select Patient'}
                    </h1>
                    {isProvider && <ChevronDownIcon className="w-4 h-4 text-slate-400" />}
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                    {isProvider ? 'Patient Data Source' : 'My Health Record'} • {age}y • {selectedPatient?.gender}
                  </p>
                </div>
              </button>

              {isPatientDropdownOpen && isProvider && (
                <div className="absolute top-full left-0 mt-3 w-72 bg-white rounded-3xl shadow-2xl border border-slate-100 py-4 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="px-6 py-2 border-b border-slate-50 mb-2">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Select Patient</span>
                  </div>
                  {patients.map(p => (
                    <button 
                      key={p.id}
                      onClick={() => { setSelectedPatient(p); setIsPatientDropdownOpen(false); }}
                      className={`w-full text-left px-6 py-3 hover:bg-slate-50 transition-all flex items-center justify-between group ${selectedPatient?.id === p.id ? 'bg-indigo-50/50' : ''}`}
                    >
                      <div className="flex flex-col">
                        <span className={`text-sm font-bold ${selectedPatient?.id === p.id ? 'text-indigo-600' : 'text-slate-700'}`}>{p.name}</span>
                        <span className="text-[10px] text-slate-400">{new Date(p.dob).toLocaleDateString()}</span>
                      </div>
                      {selectedPatient?.id === p.id && <CheckCircleIcon className="w-4 h-4 text-indigo-500" />}
                    </button>
                  ))}
                  <div className="p-4 border-t border-slate-50 mt-2">
                    <button 
                      onClick={() => { setIsFormOpen(true); setIsPatientDropdownOpen(false); }}
                      className="w-full py-3 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                    >
                      + Register New Patient
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button 
                onClick={() => selectedPatient && exportPatientLabsToCSV(selectedPatient)}
                className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
              >
                Export Report
              </button>
              <button 
                onClick={() => { setPatientToEdit(null); setIsFormOpen(true); }}
                className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
              >
                {isProvider ? 'New Clinical Entry' : 'Self-Report Data'}
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-6 lg:p-12 pb-32">
          {selectedPatient ? (
            <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
              
              {/* Scorecard KPIs - Looker Studio Style */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard 
                  label="Health Stability" 
                  value={selectedPatient.labResults.length > 0 ? "84%" : "N/A"} 
                  sub="Computed by Vision AI" 
                  color="indigo" 
                />
                <KPICard 
                  label="Critical Alerts" 
                  value={highRiskCount.toString()} 
                  sub="Requires Immediate Review" 
                  color={highRiskCount > 0 ? "rose" : "slate"} 
                  icon={<ExclamationTriangleIcon />}
                />
                <KPICard 
                  label="Biomarkers Tracked" 
                  value={selectedPatient.labResults.length.toString()} 
                  sub="Total Archive Samples" 
                  color="emerald" 
                  icon={<BeakerIcon />}
                />
                <KPICard 
                  label="Active Meds" 
                  value={selectedPatient.treatments.length.toString()} 
                  sub="Current Clinical Protocol" 
                  color="amber" 
                  icon={<PillIcon />}
                />
              </div>

              {activeTab === 'hub' && (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                  <div className="xl:col-span-8 space-y-10">
                    <PatientDetail 
                      patient={selectedPatient} 
                      onEdit={(p) => { setPatientToEdit(p); setIsFormOpen(true); }} 
                      onUpdate={handleUpdatePatient}
                      role={role}
                    />
                  </div>
                  <div className="xl:col-span-4 space-y-10">
                    <MetricsOverview patient={selectedPatient} />
                    <MedicationInteractionsMetric patient={selectedPatient} />
                  </div>
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="grid grid-cols-1 lg:grid-cols-1 gap-10">
                  <LabTrendChart patient={selectedPatient} />
                </div>
              )}

              {activeTab === 'clinical-ai' && (
                isProvider ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-4">
                        <DifferentialDiagnosisAssistant patient={selectedPatient} />
                    </div>
                    <div className="lg:col-span-8">
                        <LabReportAnalyzer patient={selectedPatient} />
                    </div>
                    </div>
                ) : (
                    <div className="py-20 text-center">
                         <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-300 mx-auto mb-6">
                            <SparklesIcon className="w-8 h-8" />
                         </div>
                         <h3 className="text-lg font-black text-slate-900">Clinical Features Locked</h3>
                         <p className="text-slate-400 mt-2">AI Diagnosis features are available for Healthcare Providers only.</p>
                    </div>
                )
              )}

              {activeTab === 'settings' && (
                <div className="max-w-2xl mx-auto bg-white rounded-[3.5rem] p-12 shadow-sm border border-slate-100 text-center">
                  <div className="w-24 h-24 bg-indigo-50 rounded-[2.5rem] mx-auto mb-8 flex items-center justify-center text-indigo-600">
                    <UserIcon className="w-12 h-12" />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Studio Configuration</h2>
                  <p className="text-slate-400 mt-2 font-bold uppercase tracking-widest text-[11px]">Personalize your diagnostic environment</p>
                  
                  <div className="mt-12 space-y-4">
                    <button 
                      onClick={handleLogout}
                      className="w-full py-6 rounded-[2rem] bg-rose-50 text-rose-600 text-[11px] font-black uppercase tracking-[0.3em] shadow-lg transition-all hover:bg-rose-100 active:scale-95"
                    >
                      Sign Out
                    </button>
                    <p className="text-slate-400 text-[10px] italic">You are currently logged in as a {role}.</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-40 space-y-6">
              <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center text-slate-300">
                <ClipboardDocumentCheckIcon className="w-10 h-10" />
              </div>
              <p className="text-slate-300 font-black uppercase tracking-[0.5em] text-sm">Waiting for Data Selection</p>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Navigation */}
      <nav className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/10 px-6 py-3 w-[90%] max-w-md">
        <div className="flex justify-between items-center h-12">
          <MobileNavButton icon={<HeartIcon />} active={activeTab === 'hub'} onClick={() => setActiveTab('hub')} />
          <MobileNavButton icon={<ChartBarIcon />} active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
          {isProvider && <MobileNavButton icon={<SparklesIcon />} active={activeTab === 'clinical-ai'} onClick={() => setActiveTab('clinical-ai')} />}
          <MobileNavButton icon={<UserIcon />} active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </div>
      </nav>

      {isFormOpen && (
        <DataEntryForm 
          onSave={handleSavePatient} 
          onClose={() => { setIsFormOpen(false); setPatientToEdit(null); }} 
          patientToEdit={patientToEdit} 
          availableDrugs={drugList}
          availableLabs={labList}
        />
      )}
    </div>
  );
}

function SidebarLink({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick} 
      className={`w-full flex items-center space-x-4 px-6 py-5 rounded-[1.5rem] transition-all duration-300 group ${
        active 
          ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' 
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
      }`}
    >
      <div className={`transition-transform duration-500 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
        {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-6 h-6' })}
      </div>
      <span className={`text-[11px] font-black uppercase tracking-widest ${active ? 'text-white' : 'text-slate-500 group-hover:text-slate-800'}`}>
        {label}
      </span>
    </button>
  );
}

function MobileNavButton({ icon, active, onClick }: { icon: React.ReactNode, active: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all ${active ? 'text-indigo-400 bg-white/5' : 'text-slate-500'}`}>
      {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-7 h-7' })}
      {active && <div className="mt-1 w-1 h-1 bg-indigo-500 rounded-full" />}
    </button>
  );
}

function KPICard({ label, value, sub, color, icon }: { label: string, value: string, sub: string, color: string, icon?: React.ReactNode }) {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-600 text-white',
    rose: 'bg-rose-600 text-white',
    emerald: 'bg-emerald-600 text-white',
    amber: 'bg-amber-500 text-white',
    slate: 'bg-white text-slate-800 border-slate-200 border'
  };

  const textSecondaryMap: Record<string, string> = {
    indigo: 'text-indigo-100',
    rose: 'text-rose-100',
    emerald: 'text-emerald-100',
    amber: 'text-amber-50',
    slate: 'text-slate-400'
  };

  return (
    <div className={`${colorMap[color]} p-8 rounded-[2.5rem] shadow-sm flex flex-col justify-between h-48 group hover:-translate-y-1 transition-transform duration-500 relative overflow-hidden`}>
      {icon && <div className="absolute -right-4 -bottom-4 w-24 h-24 opacity-10 rotate-12 group-hover:scale-125 transition-transform duration-700">{icon}</div>}
      <div>
        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${textSecondaryMap[color]}`}>{label}</span>
        <p className="text-4xl font-black mt-2 tracking-tighter">{value}</p>
      </div>
      <p className={`text-[9px] font-bold uppercase tracking-widest mt-4 ${textSecondaryMap[color]} opacity-70`}>{sub}</p>
    </div>
  );
}

export default App;