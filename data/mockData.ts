import type { Patient } from '../types';
import { RiskLevel } from '../types';

export const MOCK_PATIENTS: Patient[] = [
  {
    id: 'pat3',
    name: 'Surin',
    dob: '1949-03-12',
    gender: 'Male',
    clinicalNote: 'Patient with a history of lumbar fixation from L1 to L5, presenting with movement-related pain and tingling in the right lower limb. Clinical findings are consistent with right-sided lumbar radiculopathy, predominantly involving the L2, L3, and L4 nerve roots.',
    complaints: [
      { id: 'c3-1', text: 'Movement-related pain in right leg', date: '2024-05-10' },
      { id: 'c3-2', text: 'Tingling in right lower limb', date: '2024-05-12' }
    ],
    symptoms: [
      { id: 's3-1', name: 'Right Leg Pain', severity: 8, date: '2024-05-15' },
      { id: 's3-2', name: 'Muscle Weakness', severity: 6, date: '2024-05-15' }
    ],
    diagnoses: [
      { id: 'd3-1', condition: 'Lumbar Radiculopathy', date: '2024-05-18' }
    ],
    treatments: [
      { id: 't3-1', medication: 'Gabapentin', dosage: '300mg TID', startDate: '2024-05-20' }
    ],
    labResults: [
      { id: 'lr3-1', testName: 'CRP', value: 12.5, unit: 'mg/L', date: '2024-05-18', riskLevel: RiskLevel.High }
    ],
    imagingStudies: [
        { id: 'is3-1', type: 'MRI', date: '2024-05-16', reportSummary: 'Stable postoperative lumbar spine (L1-L5 fixation). Nerve root compression identified at L2-L4 levels on the right side.' },
    ],
    savedAiSummaries: [],
  },
  {
    id: 'pat1',
    name: 'John Doe',
    dob: '1985-05-20',
    gender: 'Male',
    chiefComplaint: 'Frequent fatigue and high blood sugar readings after meals.',
    complaints: [
      { id: 'c1-1', text: 'Frequent fatigue after meals', date: '2024-07-20' }
    ],
    symptoms: [
      { id: 's1-1', name: 'Fatigue', severity: 7, date: '2024-08-01' },
      { id: 's1-2', name: 'Thirst', severity: 4, date: '2024-08-05' }
    ],
    diagnoses: [
      { id: 'd1-1', condition: 'Hypertension', date: '2022-01-15' },
      { id: 'd1-2', condition: 'Type 2 Diabetes', date: '2021-11-10' },
    ],
    treatments: [
      { id: 't1-1', medication: 'Lisinopril', dosage: '10mg daily', startDate: '2022-01-15' },
      { id: 't1-2', medication: 'Metformin', dosage: '500mg twice daily', startDate: '2021-11-10' },
    ],
    labResults: [
      { id: 'lr1-1', testName: 'Glucose', value: 140, unit: 'mg/dL', date: '2023-08-10', riskLevel: RiskLevel.High },
      { id: 'lr1-2', testName: 'Glucose', value: 132, unit: 'mg/dL', date: '2024-02-15', riskLevel: RiskLevel.High },
      { id: 'lr1-3', testName: 'Glucose', value: 125, unit: 'mg/dL', date: '2024-07-20', riskLevel: RiskLevel.High },
    ],
    imagingStudies: [
        { id: 'is1-1', type: 'X-Ray', date: '2023-09-01', reportSummary: 'Chest X-ray shows clear lungs, no signs of pneumonia.' },
    ],
    savedAiSummaries: [],
  },
  {
    id: 'pat2',
    name: 'Jane Smith',
    dob: '1992-11-30',
    gender: 'Female',
    complaints: [],
    symptoms: [],
    diagnoses: [],
    treatments: [],
    labResults: [],
    savedAiSummaries: [],
  }
];