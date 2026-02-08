import { Patient } from '../types';

export function exportPatientLabsToCSV(patient: Patient) {
  if (!patient.labResults || patient.labResults.length === 0) {
    alert("No lab results to export.");
    return;
  }

  // Get unique dates and unique tests to create a pivot table
  const dates = Array.from(new Set(patient.labResults.map(r => r.date))).sort();
  const testNames = Array.from(new Set(patient.labResults.map(r => r.testName))).sort();

  // Header row: Test Name, Units, followed by dates
  const headers = ['Test Name', 'Unit', ...dates.map(d => new Date(d).toLocaleDateString())];
  
  const rows = testNames.map(testName => {
    const testResults = patient.labResults.filter(r => r.testName === testName);
    const unit = testResults[0]?.unit || '';
    
    const row = [testName, unit];
    
    dates.forEach(date => {
      const result = testResults.find(r => r.date === date);
      row.push(result ? result.value.toString() : '');
    });
    
    return row;
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(val => `"${val}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${patient.name.replace(/\s+/g, '_')}_Lab_Data.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}