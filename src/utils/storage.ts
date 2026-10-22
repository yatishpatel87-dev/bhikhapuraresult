import { AppData, Student, Subject } from '../types';
import { generateInitialAppData } from './sampleData';

const STORAGE_KEY = 'shri_bhikhapura_school_data_v1';

export function loadAppData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = generateInitialAppData();
      saveAppData(initial);
      return initial;
    }
    const parsed = JSON.parse(raw) as AppData;
    // Basic integrity check
    if (!parsed.students || !Array.isArray(parsed.students) || !parsed.settings) {
      console.warn('Invalid storage data detected, resetting to default');
      const initial = generateInitialAppData();
      saveAppData(initial);
      return initial;
    }
    // Ensure 7 main subjects are retained
    if (parsed.subjects && parsed.subjects.some(s => s.id === 'sub_art')) {
      parsed.subjects = parsed.subjects.filter(s => s.id !== 'sub_art');
    }
    return parsed;
  } catch (err) {
    console.error('Error loading data from localStorage:', err);
    return generateInitialAppData();
  }
}

export function saveAppData(data: AppData): void {
  try {
    const updated: AppData = {
      ...data,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error saving data to localStorage:', err);
  }
}

export function exportBackup(data: AppData): void {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = `${now.getHours()}-${now.getMinutes()}`;
    link.href = url;
    link.download = `shri_bhikhapura_school_backup_${dateStr}_${timeStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Export failed:', err);
    alert('બેકઅપ એક્સપોર્ટ કરવામાં ક્ષતિ આવી છે.');
  }
}

export interface ImportInspection {
  isValid: boolean;
  version?: string;
  lastUpdated?: string;
  studentsCount: number;
  subjectsCount: number;
  schoolName?: string;
  academicYear?: string;
  errorMessage?: string;
  parsedData?: AppData;
}

export function inspectBackupJSON(jsonString: string): ImportInspection {
  try {
    const parsed = JSON.parse(jsonString) as AppData;
    if (!parsed || typeof parsed !== 'object') {
      return { isValid: false, studentsCount: 0, subjectsCount: 0, errorMessage: 'આ માન્ય JSON ફાઇલ નથી.' };
    }
    if (!Array.isArray(parsed.students)) {
      return { isValid: false, studentsCount: 0, subjectsCount: 0, errorMessage: 'ફાઇલમાં વિદ્યાર્થીઓનો ડેટા (students array) મળ્યો નથી.' };
    }
    return {
      isValid: true,
      version: parsed.version || '1.0.0',
      lastUpdated: parsed.lastUpdated || '',
      studentsCount: parsed.students.length,
      subjectsCount: Array.isArray(parsed.subjects) ? parsed.subjects.length : 0,
      schoolName: parsed.settings?.schoolName || 'શ્રી ભીખાપુરા પ્રાથમિક શાળા',
      academicYear: parsed.settings?.academicYear || '',
      parsedData: parsed,
    };
  } catch (err: any) {
    return {
      isValid: false,
      studentsCount: 0,
      subjectsCount: 0,
      errorMessage: `JSON વાંચવામાં ભૂલ આવી: ${err.message || 'અમાન્ય ફોર્મેટ'}`,
    };
  }
}

export function applyImport(
  importedData: AppData,
  mode: 'replace' | 'merge',
  currentData: AppData
): AppData {
  if (mode === 'replace') {
    return {
      ...importedData,
      lastUpdated: new Date().toISOString(),
    };
  }

  // Merge Mode
  // Merge students: prioritize existing by ID/GR, add new
  const studentMap = new Map<string, Student>();
  for (const st of currentData.students) {
    studentMap.set(st.id, st);
  }
  for (const st of importedData.students || []) {
    studentMap.set(st.id, st); // Update or add
  }
  const mergedStudents = Array.from(studentMap.values());

  // Merge subjects
  const subjectMap = new Map<string, Subject>();
  for (const s of currentData.subjects) {
    subjectMap.set(s.id, s);
  }
  for (const s of importedData.subjects || []) {
    subjectMap.set(s.id, s);
  }
  const mergedSubjects = Array.from(subjectMap.values());

  // Merge marks
  const mergedMarks = { ...currentData.marks };
  for (const [stId, subMarks] of Object.entries(importedData.marks || {})) {
    mergedMarks[stId] = {
      ...(mergedMarks[stId] || {}),
      ...subMarks,
    };
  }

  // Merge Patrak A
  const mergedPatrakA = { ...currentData.patrakA };
  for (const [stId, subA] of Object.entries(importedData.patrakA || {})) {
    mergedPatrakA[stId] = {
      ...(mergedPatrakA[stId] || {}),
      ...subA,
    };
  }

  // Merge Patrak B
  const mergedPatrakB = { ...currentData.patrakB };
  for (const [stId, compB] of Object.entries(importedData.patrakB || {})) {
    mergedPatrakB[stId] = {
      ...(mergedPatrakB[stId] || {}),
      ...compB,
    };
  }

  return {
    ...currentData,
    students: mergedStudents,
    subjects: mergedSubjects,
    marks: mergedMarks,
    patrakA: mergedPatrakA,
    patrakB: mergedPatrakB,
    settings: {
      ...currentData.settings,
      ...(importedData.settings || {}),
    },
    lastUpdated: new Date().toISOString(),
  };
}
