import { GoogleGenAI, Type } from "@google/genai";
import type { Patient, AISummary, ImagingStudy, DifferentialDiagnosis, AIClinicalOutlook, LabAnalysisResult, AIWellnessPlan, LabResult, Treatment, DrugInteractionResult } from '../types';

// Helper to get fresh AI instance with latest API_KEY
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const summarySchema = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING, description: 'A brief summary of the patient\'s health status.' },
        risks: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'A list of potential health risks.' },
        recommendations: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'A list of recommended actions or follow-ups.' },
    },
    required: ['summary', 'risks', 'recommendations'],
};

const interactionSchema = {
    type: Type.OBJECT,
    properties: {
        interactions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    involvedDrugs: { type: Type.ARRAY, items: { type: Type.STRING } },
                    severity: { type: Type.STRING, enum: ['Mild', 'Moderate', 'Severe', 'None'] },
                    description: { type: Type.STRING },
                    actionRequired: { type: Type.STRING }
                },
                required: ['involvedDrugs', 'severity', 'description', 'actionRequired']
            }
        },
        disclaimer: { type: Type.STRING }
    },
    required: ['interactions', 'disclaimer']
};

const drugNormalizationSchema = {
  type: Type.OBJECT,
  properties: {
    generic: { type: Type.STRING },
    brand: { type: Type.STRING },
    drug_class: { type: Type.STRING },
    status: { type: Type.STRING, enum: ['validated', 'unvalidated'] }
  },
  required: ['generic', 'brand', 'drug_class', 'status']
};

const metricsSummarySchema = {
  type: Type.OBJECT,
  properties: {
    stabilityScore: { type: Type.NUMBER, description: 'Score from 0 to 100 based on lab trends.' },
    trendAnalysis: { type: Type.STRING },
    topConcerns: { type: Type.ARRAY, items: { type: Type.STRING } },
    improvementAdvice: { type: Type.STRING }
  },
  required: ['stabilityScore', 'trendAnalysis', 'topConcerns', 'improvementAdvice']
};

const docClassifierSchema = {
    type: Type.OBJECT,
    properties: {
        category: { type: Type.STRING, enum: ['LAB', 'IMAGING', 'PRESCRIPTION'], description: 'The detected category of the document.' },
    },
    required: ['category'],
};

const labExtractionSchema = {
    type: Type.ARRAY,
    description: "An array of lab test results extracted from the document.",
    items: {
        type: Type.OBJECT,
        properties: {
            testName: { type: Type.STRING, description: 'The name of the lab test.' },
            value: { type: Type.NUMBER, description: 'The numerical value.' },
            unit: { type: Type.STRING, description: 'The unit.' },
            date: { type: Type.STRING, description: 'The date in YYYY-MM-DD format.' },
        },
        required: ['testName', 'value', 'unit', 'date'],
    }
};

const medicationExtractionSchema = {
    type: Type.ARRAY,
    description: "An array of medications extracted from the document.",
    items: {
        type: Type.OBJECT,
        properties: {
            medication: { type: Type.STRING, description: 'The medication name.' },
            dosage: { type: Type.STRING, description: 'The dosage.' },
            startDate: { type: Type.STRING, description: 'The date in YYYY-MM-DD format.' },
        },
        required: ['medication', 'dosage', 'startDate'],
    }
};

async function processDocument(base64Data: string, prompt: string, schema?: any) {
    if (!base64Data.includes(',')) throw new Error('Invalid document format.');
    const [header, data] = base64Data.split(',');
    const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
    const part = { inlineData: { mimeType, data } };
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [part, { text: prompt }] },
        config: schema ? { responseMimeType: 'application/json', responseSchema: schema } : undefined,
    });
    return response;
}

export async function classifyDocument(base64Data: string): Promise<'LAB' | 'IMAGING' | 'PRESCRIPTION'> {
    const prompt = "Analyze this medical document. Categorize it as either a 'LAB' report (blood tests), an 'IMAGING' scan report (MRI, X-Ray, etc.), or a 'PRESCRIPTION' (list of medications). Return JSON.";
    const response = await processDocument(base64Data, prompt, docClassifierSchema);
    const result = JSON.parse(response.text);
    return result.category;
}

export async function generatePatientSummary(patient: Patient): Promise<AISummary> {
    const ai = getAI();
    const prompt = `Act as an expert clinical lead. Generate a comprehensive clinical summary for ${patient.name}. 
    Age: ${new Date().getFullYear() - new Date(patient.dob).getFullYear()}. 
    Chief Complaints: ${JSON.stringify(patient.complaints)}. 
    Symptoms: ${JSON.stringify(patient.symptoms)}. 
    Labs: ${JSON.stringify(patient.labResults)}. 
    Imaging: ${JSON.stringify(patient.imagingStudies)}. 
    Medications: ${JSON.stringify(patient.treatments)}.
    Provide a professional narrative summary, identified risks, and specific clinical recommendations. 
    Use a clinical tone. Return strictly JSON with keys: summary, risks, recommendations.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json', responseSchema: summarySchema },
    });
    return JSON.parse(response.text);
}

export async function analyzeDrugInteractions(medications: Treatment[]): Promise<DrugInteractionResult> {
    const ai = getAI();
    const medList = medications.map(m => m.medication).join(', ');
    const prompt = `Analyze potential drug-drug interactions for the following medications: ${medList}.
    
    Rules:
    - Identify potential interactions between pairs or groups of drugs.
    - Classify severity: Mild, Moderate, Severe, or None.
    - Provide clear action step.
    - Always include a medical disclaimer.
    
    Return JSON.`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json', responseSchema: interactionSchema },
    });
    return JSON.parse(response.text);
}

export async function generateMetricsSummary(patient: Patient): Promise<any> {
  const ai = getAI();
  const prompt = `Analyze the laboratory trends for ${patient.name}. Labs: ${JSON.stringify(patient.labResults)}.
  Evaluate health stability. Return JSON with stabilityScore (0-100), trendAnalysis, topConcerns (array), and improvementAdvice.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: { responseMimeType: 'application/json', responseSchema: metricsSummarySchema },
  });
  return JSON.parse(response.text);
}

export async function normalizeDrugName(input: string): Promise<{ generic: string; brand: string; drug_class: string; status: 'validated' | 'unvalidated' }> {
  const ai = getAI();
  const prompt = `Verify the following medication name: "${input}". Map brand names to generic equivalents. Return JSON.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: { responseMimeType: 'application/json', responseSchema: drugNormalizationSchema },
  });
  return JSON.parse(response.text);
}

export async function extractLabsFromDocument(base64Data: string): Promise<Omit<LabResult, 'id' | 'riskLevel'>[]> {
    const prompt = `Extract all lab test results from this medical document. Identify test name, value (number), unit, and date (YYYY-MM-DD). Return as JSON array.`;
    const response = await processDocument(base64Data, prompt, labExtractionSchema);
    return JSON.parse(response.text);
}

export async function extractMedicationsFromDocument(base64Data: string): Promise<Omit<Treatment, 'id'>[]> {
    const prompt = `Extract all medications or treatments from this document. Identify medication name, dosage/frequency, and start date. Return as JSON array.`;
    const response = await processDocument(base64Data, prompt, medicationExtractionSchema);
    return JSON.parse(response.text);
}

export async function generateImagingReportFromDocument(base64Data: string): Promise<string> {
    const response = await processDocument(base64Data, `Act as an expert radiologist. Analyze this imaging scan or report. Provide detailed findings in markdown format.`);
    return response.text;
}

export async function analyzeImagingImage(base64Data: string): Promise<string> {
  const response = await processDocument(base64Data, `Analyze this medical imaging photo. Describe visible anatomical structures and any abnormalities. Provide a "Patient-Friendly Summary" at the end.`);
  return response.text;
}

export async function generateDifferentialDiagnoses(patient: Patient, symptoms: string, findings: string, history: string): Promise<DifferentialDiagnosis[]> {
    const ai = getAI();
    const prompt = `Generate differential diagnoses for ${patient.name} based on: symptoms: ${symptoms}, findings: ${findings}, history: ${history}. Return JSON.`;
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json', responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { diagnosis: { type: Type.STRING }, reasoning: { type: Type.STRING }, confidence: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] } }, required: ['diagnosis', 'reasoning', 'confidence'] } } },
    });
    return JSON.parse(response.text);
}

export async function analyzeFullLabPanel(patient: Patient): Promise<LabAnalysisResult> {
    const ai = getAI();
    const userPrompt = `Analyze the full lab panel for ${patient.name}. Provide a functional medicine and longevity analysis. Return JSON.`;
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: userPrompt,
        config: { responseMimeType: 'application/json', responseSchema: { type: Type.OBJECT, properties: { analysisBySystem: { type: Type.OBJECT }, prioritizedInsights: { type: Type.ARRAY, items: { type: Type.STRING } }, recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }, followUpTests: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ['analysisBySystem', 'prioritizedInsights', 'recommendations', 'followUpTests'] } },
    });
    return JSON.parse(response.text);
}