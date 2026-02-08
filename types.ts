export enum RiskLevel {
  Low = 'Low',
  Normal = 'Normal',
  High = 'High',
}

export type UserRole = 'Provider' | 'Patient';

export interface LabResult {
  id: string;
  testName: string;
  value: number;
  unit: string;
  date: string; // ISO string format
  riskLevel: RiskLevel;
  interpretation?: string; 
  referenceRangeMin?: number;
  referenceRangeMax?: number;
}

export interface Diagnosis {
  id: string;
  condition: string;
  date: string; // ISO string format
}

export interface Symptom {
  id: string;
  name: string;
  severity: number; // 1-10
  date: string; // ISO string
}

export interface Complaint {
  id: string;
  text: string;
  date: string; // ISO string
}

export interface Treatment {
  id: string;
  medication: string;
  dosage: string;
  startDate: string; // ISO string format
  endDate?: string; // ISO string format
}

export interface DrugInteraction {
  involvedDrugs: string[];
  severity: 'Mild' | 'Moderate' | 'Severe' | 'None';
  description: string;
  actionRequired: string;
}

export interface DrugInteractionResult {
  interactions: DrugInteraction[];
  disclaimer: string;
}

export interface ImagingStudy {
  id: string;
  type: 'MRI' | 'Ultrasound' | 'X-Ray' | 'CT Scan' | 'Other';
  date: string; // ISO string format
  reportSummary: string;
  patientComplaint?: string;
  imageUrl?: string;
}

export interface AISummary {
    summary: string;
    risks: string[];
    recommendations: string[];
}

export interface SavedAISummary {
  id: string;
  dateGenerated: string; // ISO string
  summaryData: AISummary;
}

export interface Patient {
  id: string;
  name: string;
  dob: string; // ISO string format
  gender: 'Male' | 'Female' | 'Other';
  chiefComplaint?: string; 
  clinicalNote?: string; // NEW: Summary from the admin (Provider)
  complaints: Complaint[];
  symptoms: Symptom[];
  labResults: LabResult[];
  diagnoses: Diagnosis[];
  treatments: Treatment[];
  imagingStudies?: ImagingStudy[];
  savedAiSummaries?: SavedAISummary[];
}

export interface DifferentialDiagnosis {
  diagnosis: string;
  reasoning: string;
  confidence: 'High' | 'Medium' | 'Low';
}

export interface AIClinicalOutlook {
  cause: string;
  prognosis: string;
  recommendations: string[];
}

export interface LabAnalysisResult {
  analysisBySystem: Record<string, BiomarkerAnalysis[]>;
  prioritizedInsights: string[];
  recommendations: string[];
  followUpTests: string[];
}

export interface BiomarkerAnalysis {
  testName: string;
  unit: string;
  value: number;
  clinicalStatus: 'Low' | 'Normal' | 'High';
  functionalStatus: 'Low' | 'Normal' | 'High' | 'N/A';
  interpretation: string;
  concern: 'Priority to Address' | 'Monitor' | 'Stable' | 'Optimal';
}

export interface AIWellnessPlan {
  diet: {
    recommendation: string;
    reasoning: string;
  }[];
  exercise: {
    type: string;
    recommendation: string;
    frequency: string;
    duration: string;
  }[];
  stressManagement: {
    technique: string;
    description: string;
  }[];
  otherRecommendations: string[];
}