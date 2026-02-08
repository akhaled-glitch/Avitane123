import { RiskLevel } from '../types';

export interface LabTestReference {
    name: string;
    unit: string;
    category: 'CBC' | 'Metabolic Panel' | 'Lipid Panel' | 'Liver Function' | 'Nutritional' | 'Hormonal' | 'Cardiac & Vascular' | 'Kidney Function' | 'Inflammation & Immune' | 'Bone & Muscle' | 'Electrolytes' | 'Other';
    normalRange: {
        min: number;
        max: number;
    };
    standardUnit: string;
}

// Conversion factors for common lab units
export const UNIT_CONVERSIONS: Record<string, Record<string, number>> = {
    'Glucose': {
        'mmol/L': 18.0182, // to mg/dL
        'mg/dL': 1
    },
    'Total Cholesterol': {
        'mmol/L': 38.67, // to mg/dL
        'mg/dL': 1
    },
    'HDL-C': {
        'mmol/L': 38.67, // to mg/dL
        'mg/dL': 1
    },
    'LDL-C': {
        'mmol/L': 38.67, // to mg/dL
        'mg/dL': 1
    },
    'Triglycerides': {
        'mmol/L': 88.57, // to mg/dL
        'mg/dL': 1
    },
    'Creatinine': {
        'µmol/L': 0.0113, // to mg/dL
        'mg/dL': 1
    },
    'Uric Acid': {
        'µmol/L': 0.0168, // to mg/dL
        'mg/dL': 1
    }
};

/**
 * Standard Adult Reference Ranges based on Medscape / eMedicine
 * Source: https://emedicine.medscape.com/article/2172316-overview
 */
export const commonLabTests: LabTestReference[] = [
    // 1. Complete Blood Count (CBC)
    { name: 'WBC', category: 'CBC', unit: 'x10^3/µL', standardUnit: 'x10^3/µL', normalRange: { min: 4.5, max: 11.0 } },
    { name: 'RBC', category: 'CBC', unit: 'x10^6/µL', standardUnit: 'x10^6/µL', normalRange: { min: 4.1, max: 5.9 } },
    { name: 'Hemoglobin', category: 'CBC', unit: 'g/dL', standardUnit: 'g/dL', normalRange: { min: 12.3, max: 17.5 } },
    { name: 'Hematocrit', category: 'CBC', unit: '%', standardUnit: '%', normalRange: { min: 35.9, max: 50.4 } },
    { name: 'MCV', category: 'CBC', unit: 'fL', standardUnit: 'fL', normalRange: { min: 80, max: 96 } },
    { name: 'MCH', category: 'CBC', unit: 'pg', standardUnit: 'pg', normalRange: { min: 27, max: 33 } },
    { name: 'MCHC', category: 'CBC', unit: 'g/dL', standardUnit: 'g/dL', normalRange: { min: 33, max: 36 } },
    { name: 'Platelet Count', category: 'CBC', unit: 'x10^3/µL', standardUnit: 'x10^3/µL', normalRange: { min: 150, max: 450 } },

    // 2. Electrolytes (Medscape standard)
    { name: 'Sodium', category: 'Electrolytes', unit: 'mEq/L', standardUnit: 'mEq/L', normalRange: { min: 136, max: 145 } },
    { name: 'Potassium', category: 'Electrolytes', unit: 'mEq/L', standardUnit: 'mEq/L', normalRange: { min: 3.5, max: 5.1 } },
    { name: 'Chloride', category: 'Electrolytes', unit: 'mEq/L', standardUnit: 'mEq/L', normalRange: { min: 98, max: 107 } },
    { name: 'CO2 (Bicarbonate)', category: 'Electrolytes', unit: 'mEq/L', standardUnit: 'mEq/L', normalRange: { min: 22, max: 28 } },
    { name: 'Calcium', category: 'Metabolic Panel', unit: 'mg/dL', standardUnit: 'mg/dL', normalRange: { min: 8.5, max: 10.5 } },
    { name: 'Magnesium', category: 'Electrolytes', unit: 'mg/dL', standardUnit: 'mg/dL', normalRange: { min: 1.8, max: 2.6 } },

    // 3. Kidney Function
    { name: 'BUN', category: 'Kidney Function', unit: 'mg/dL', standardUnit: 'mg/dL', normalRange: { min: 7, max: 20 } },
    { name: 'Creatinine', category: 'Kidney Function', unit: 'mg/dL', standardUnit: 'mg/dL', normalRange: { min: 0.6, max: 1.2 } },
    { name: 'eGFR', category: 'Kidney Function', unit: 'mL/min/1.73m²', standardUnit: 'mL/min/1.73m²', normalRange: { min: 60, max: 120 } },
    { name: 'Uric Acid', category: 'Kidney Function', unit: 'mg/dL', standardUnit: 'mg/dL', normalRange: { min: 2.4, max: 7.2 } },

    // 4. Liver Function Panel (LFTs)
    { name: 'ALT (SGPT)', category: 'Liver Function', unit: 'U/L', standardUnit: 'U/L', normalRange: { min: 7, max: 56 } },
    { name: 'AST (SGOT)', category: 'Liver Function', unit: 'U/L', standardUnit: 'U/L', normalRange: { min: 10, max: 40 } },
    { name: 'ALP', category: 'Liver Function', unit: 'U/L', standardUnit: 'U/L', normalRange: { min: 44, max: 147 } },
    { name: 'Albumin', category: 'Liver Function', unit: 'g/dL', standardUnit: 'g/dL', normalRange: { min: 3.5, max: 5.0 } },
    { name: 'Bilirubin, Total', category: 'Liver Function', unit: 'mg/dL', standardUnit: 'mg/dL', normalRange: { min: 0.3, max: 1.9 } },
    { name: 'Total Protein', category: 'Liver Function', unit: 'g/dL', standardUnit: 'g/dL', normalRange: { min: 6.0, max: 8.3 } },

    // 5. Lipid Panel
    { name: 'Total Cholesterol', category: 'Lipid Panel', unit: 'mg/dL', standardUnit: 'mg/dL', normalRange: { min: 125, max: 200 } },
    { name: 'HDL-C', category: 'Lipid Panel', unit: 'mg/dL', standardUnit: 'mg/dL', normalRange: { min: 40, max: 100 } },
    { name: 'LDL-C', category: 'Lipid Panel', unit: 'mg/dL', standardUnit: 'mg/dL', normalRange: { min: 0, max: 100 } },
    { name: 'Triglycerides', category: 'Lipid Panel', unit: 'mg/dL', standardUnit: 'mg/dL', normalRange: { min: 0, max: 150 } },

    // 6. Metabolic
    { name: 'Glucose', category: 'Metabolic Panel', unit: 'mg/dL', standardUnit: 'mg/dL', normalRange: { min: 70, max: 99 } },
    { name: 'HbA1c', category: 'Metabolic Panel', unit: '%', standardUnit: '%', normalRange: { min: 4.0, max: 5.6 } },

    // 7. Hormonal
    { name: 'TSH', category: 'Hormonal', unit: 'µIU/mL', standardUnit: 'µIU/mL', normalRange: { min: 0.45, max: 4.5 } },

    // 8. Inflammation
    { name: 'CRP', category: 'Inflammation & Immune', unit: 'mg/L', standardUnit: 'mg/L', normalRange: { min: 0, max: 10 } },
];

export const POPULAR_DRUGS: string[] = [
    'Lipitor (Atorvastatin)', 'Norvasc (Amlodipine)', 'Zestril (Lisinopril)', 'Cozaar (Losartan)', 
    'Glucophage (Metformin)', 'Synthroid (Levothyroxine)', 'Ventolin (Albuterol)', 'Advair',
    'Tylenol (Acetaminophen)', 'Advil (Ibuprofen)', 'Prilosec (Omeprazole)', 'Nexium',
    'Zoloft (Sertraline)', 'Lexapro (Escitalopram)', 'Xanax (Alprazolam)', 'Augmentin',
    'Controloc (Pantoprazole)', 'Antinal (Nifuroxazide)', 'Panadol (Paracetamol)', 'Brufen (Ibuprofen)'
];

export const commonDiagnoses: string[] = [
    'Hypertension', 'Type 2 Diabetes', 'Hyperlipidemia', 'Asthma', 'COPD', 'GERD',
    'Anxiety Disorder', 'Hypothyroidism', 'Iron Deficiency Anemia', 'Osteoarthritis',
    'Lumbar Radiculopathy', 'Rheumatoid Arthritis', 'Chronic Kidney Disease'
];

export const COMMON_COMPLAINTS: string[] = [
    'Fatigue', 'Chest Pain', 'Shortness of Breath', 'Back Pain', 'Headache', 'Dizziness', 
    'Nausea', 'Abdominal Pain', 'Joint Pain', 'Muscle Weakness', 'Cough', 'Fever',
    'Weight Loss', 'Blurry Vision', 'Palpitations', 'Tingling / Numbness'
];

export function autoConvertLabValue(testName: string, value: number, fromUnit: string): { convertedValue: number, isConverted: boolean } {
    const testRef = commonLabTests.find(t => t.name === testName);
    if (!testRef || fromUnit === testRef.standardUnit) {
        return { convertedValue: value, isConverted: false };
    }

    const conversionGroup = UNIT_CONVERSIONS[testName];
    if (conversionGroup && conversionGroup[fromUnit]) {
        const factor = conversionGroup[fromUnit];
        return { convertedValue: parseFloat((value * factor).toFixed(2)), isConverted: true };
    }

    return { convertedValue: value, isConverted: false };
}

export function calculateRiskLevel(testName: string, value: number | string): RiskLevel {
    const testRef = commonLabTests.find(t => t.name === testName);
    if (!testRef) return RiskLevel.Normal;

    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return RiskLevel.Normal;

    const { min, max } = testRef.normalRange;
    
    // Define which markers are "inverse risk" (Low is dangerous, e.g. Anemia indicators)
    const lowIsRisky = ['HDL-C', 'RBC', 'Hemoglobin', 'Hematocrit', 'eGFR', 'Albumin', 'Calcium'];

    if (numValue < min) {
        return lowIsRisky.includes(testName) ? RiskLevel.High : RiskLevel.Low;
    }
    if (numValue > max) {
        return RiskLevel.High;
    }
    return RiskLevel.Normal;
}