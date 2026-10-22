export type Standard = 6 | 7 | 8;
export type Division = 'A' | 'B' | 'C' | 'D';

export interface Student {
  id: string;
  standard: Standard;
  division: Division;
  rollNumber: number;
  grNumber: string;
  name: string;
  dob: string; // YYYY-MM-DD
  gender: 'કુમાર' | 'કન્યા';
  attendance: {
    totalDays: number;
    presentDays: number;
  };
  remarks?: string;
}

export type ExamKey = 'quarterly1' | 'quarterly2' | 'sem1' | 'sem2' | 'assignment';

export interface ExamConfig {
  key: ExamKey;
  name: string;
  shortName: string;
  defaultMaxMarks: number;
}

export const EXAM_CONFIGS: ExamConfig[] = [
  { key: 'quarterly1', name: 'પ્રથમ ત્રિમાસિક કસોટી', shortName: 'ત્રિમાસિક 1', defaultMaxMarks: 40 },
  { key: 'quarterly2', name: 'બીજી ત્રિમાસિક કસોટી', shortName: 'ત્રિમાસિક 2', defaultMaxMarks: 40 },
  { key: 'sem1', name: 'સત્ર 1 પરીક્ષા', shortName: 'સત્ર 1', defaultMaxMarks: 80 },
  { key: 'sem2', name: 'સત્ર 2 પરીક્ષા', shortName: 'સત્ર 2', defaultMaxMarks: 80 },
  { key: 'assignment', name: 'સ્વાધ્યાય / પ્રોજેક્ટ', shortName: 'સ્વાધ્યાય', defaultMaxMarks: 20 },
];

export interface Subject {
  id: string;
  name: string;
  code?: string;
  standards: Standard[]; // which standards take this subject
  maxMarks: Record<ExamKey, number>;
  patrakAMaxMarks: number; // default 40
  weightage?: number;
}

export interface MarkEntry {
  marks?: number;
  isAbsent?: boolean;
}

// studentId -> subjectId -> examKey -> MarkEntry
export type StudentMarksRecord = Record<string, Record<string, Record<ExamKey, MarkEntry>>>;

export type OutcomeSign = '✓' | '?' | '' | boolean;

// Patrak A: studentId -> subjectId -> { marks?: number; isAbsent?: boolean; remarks?: string; outcomes?: (OutcomeSign | string)[] }
export interface PatrakAItem {
  marks?: number; // max 40 marks (each '✓' = 2 marks, '?' = 0 marks)
  isAbsent?: boolean;
  remarks?: string;
  outcomes?: (OutcomeSign | string)[]; // 20 boxes: '✓' (2 marks), '?' (0 marks), '' (empty 0 marks)
}
export type PatrakARecord = Record<string, Record<string, PatrakAItem>>;

// Patrak B components (sum = 400)
export interface PatrakBComponent {
  id: string;
  name: string;
  maxMarks: number;
}

// studentId -> componentId -> { marks?: number; isAbsent?: boolean }
export interface PatrakBItem {
  marks?: number;
  isAbsent?: boolean;
}
export type PatrakBRecord = Record<string, Record<string, PatrakBItem>>;

export interface GradeBoundary {
  grade: string;
  minPercent: number;
  label: string;
  colorClass: string;
}

export type CalculationMethod =
  | 'annual_combined' // સત્ર 1 (80) + સત્ર 2 (80) + ત્રિમાસિક 1 (40) + ત્રિમાસિક 2 (40) + સ્વાધ્યાય (20) = 260 per subject
  | 'semesters_only'  // સત્ર 1 (80) + સત્ર 2 (80) = 160 per subject
  | 'sem2_only'        // માત્ર સત્ર 2 વાર્ષિક (80)
  | 'pending_setup';   // અંતિમ કુલ બાકી - ગુણપદ્ધતિ સેટ કરો

export interface SchoolSettings {
  schoolName: string;
  schoolTagline: string;
  schoolAddress: string;
  academicYear: string;
  passingPercentage: number;
  gradeBoundaries: GradeBoundary[];
  calculationMethod: CalculationMethod;
  showRankInReportCard: boolean;
  patrakBComponents: PatrakBComponent[];
  principalName: string;
  teacherRemarksTemplate: string[];
}

export interface AppData {
  version: string;
  lastUpdated: string;
  students: Student[];
  subjects: Subject[];
  marks: StudentMarksRecord;
  patrakA: PatrakARecord;
  patrakB: PatrakBRecord;
  settings: SchoolSettings;
}
