import {
  GradeBoundary,
  MarkEntry,
  PatrakAItem,
  PatrakBComponent,
  PatrakBItem,
  SchoolSettings,
  Student,
  StudentMarksRecord,
  Subject,
} from '../types';

export const DEFAULT_GRADE_BOUNDARIES: GradeBoundary[] = [
  { grade: 'A1', minPercent: 91, label: 'વિશિષ્ટ પ્રદર્શન (91-100%)', colorClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { grade: 'A2', minPercent: 81, label: 'ખૂબ ઉત્તમ (81-90%)', colorClass: 'bg-teal-100 text-teal-800 border-teal-300' },
  { grade: 'B1', minPercent: 71, label: 'ઉત્તમ (71-80%)', colorClass: 'bg-blue-100 text-blue-800 border-blue-300' },
  { grade: 'B2', minPercent: 61, label: 'સારો (61-70%)', colorClass: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  { grade: 'C1', minPercent: 51, label: 'મધ્યમ સંતોષકારક (51-60%)', colorClass: 'bg-amber-100 text-amber-800 border-amber-300' },
  { grade: 'C2', minPercent: 41, label: 'સાધારણ (41-50%)', colorClass: 'bg-orange-100 text-orange-800 border-orange-300' },
  { grade: 'D', minPercent: 33, label: 'સુધારણા પાત્ર / પાસ (33-40%)', colorClass: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { grade: 'E', minPercent: 0, label: 'સુધારણાની તાતી જરૂર (0-32%)', colorClass: 'bg-rose-100 text-rose-800 border-rose-300' },
];

export function getGradeFromPercentage(percentage: number, boundaries = DEFAULT_GRADE_BOUNDARIES): { grade: string; colorClass: string; label: string } {
  if (isNaN(percentage) || percentage < 0) {
    return { grade: '-', colorClass: 'bg-gray-100 text-gray-700 border-gray-300', label: 'અનિર્ણિત' };
  }
  for (const b of boundaries) {
    if (percentage >= b.minPercent) {
      return { grade: b.grade, colorClass: b.colorClass, label: b.label };
    }
  }
  const last = boundaries[boundaries.length - 1];
  return { grade: last?.grade || 'E', colorClass: last?.colorClass || 'bg-rose-100 text-rose-800 border-rose-300', label: last?.label || 'નાપાસ' };
}

export interface StudentExamSummary {
  studentId: string;
  totalObtained: number;
  totalMax: number;
  percentage: number;
  isAllEntered: boolean;
  hasAbsent: boolean;
  status: 'પાસ' | 'નાપાસ' | 'અનિર્ણિત';
  failingSubjects: string[];
}

// Calculate summary for a specific exam type (e.g. sem1 or sem2 or quarterly1)
export function calculateExamSummary(
  student: Student,
  subjects: Subject[],
  marksRecord: StudentMarksRecord,
  examKey: 'quarterly1' | 'quarterly2' | 'sem1' | 'sem2' | 'assignment',
  passingPercentage = 33
): StudentExamSummary {
  const studentSubs = subjects.filter(s => s.standards.includes(student.standard));
  let totalObtained = 0;
  let totalMax = 0;
  let enteredCount = 0;
  let hasAbsent = false;
  const failingSubjects: string[] = [];

  for (const sub of studentSubs) {
    const max = sub.maxMarks[examKey] || 0;
    totalMax += max;
    const entry: MarkEntry | undefined = marksRecord[student.id]?.[sub.id]?.[examKey];

    if (entry?.isAbsent) {
      hasAbsent = true;
      failingSubjects.push(sub.name);
    } else if (entry?.marks !== undefined && entry.marks !== null) {
      enteredCount++;
      totalObtained += entry.marks;
      const subPct = max > 0 ? (entry.marks / max) * 100 : 0;
      if (subPct < passingPercentage) {
        failingSubjects.push(sub.name);
      }
    }
  }

  const isAllEntered = enteredCount === studentSubs.length;
  const percentage = totalMax > 0 ? Number(((totalObtained / totalMax) * 100).toFixed(2)) : 0;

  let status: 'પાસ' | 'નાપાસ' | 'અનિર્ણિત' = 'અનિર્ણિત';
  if (enteredCount > 0) {
    status = failingSubjects.length === 0 && percentage >= passingPercentage ? 'પાસ' : 'નાપાસ';
  }

  return {
    studentId: student.id,
    totalObtained,
    totalMax,
    percentage,
    isAllEntered,
    hasAbsent,
    status,
    failingSubjects,
  };
}

// Patrak A Calculation
export interface PatrakASummary {
  studentId: string;
  totalObtained: number;
  totalMax: number;
  percentage: number;
  grade: string;
  gradeColor: string;
  subjectDetails: {
    subjectId: string;
    subjectName: string;
    maxMarks: number;
    obtainedMarks?: number;
    isAbsent?: boolean;
    percentage: number;
    grade: string;
    gradeColor: string;
    remarks?: string;
  }[];
}

export function calculatePatrakASummary(
  student: Student,
  subjects: Subject[],
  patrakARecord: Record<string, Record<string, PatrakAItem>>,
  boundaries = DEFAULT_GRADE_BOUNDARIES
): PatrakASummary {
  const studentSubs = subjects.filter(s => s.standards.includes(student.standard));
  let totalObtained = 0;
  let totalMax = 0;
  const subjectDetails = [];

  for (const sub of studentSubs) {
    const max = sub.patrakAMaxMarks || 40;
    totalMax += max;
    const item = patrakARecord[student.id]?.[sub.id];
    const obtained = item?.marks;
    const isAbsent = !!item?.isAbsent;

    let subPct = 0;
    if (!isAbsent && obtained !== undefined) {
      totalObtained += obtained;
      subPct = max > 0 ? Number(((obtained / max) * 100).toFixed(2)) : 0;
    }

    const gradeInfo = getGradeFromPercentage(subPct, boundaries);

    subjectDetails.push({
      subjectId: sub.id,
      subjectName: sub.name,
      maxMarks: max,
      obtainedMarks: obtained,
      isAbsent,
      percentage: subPct,
      grade: isAbsent ? 'ગેરહાજર' : (obtained === undefined ? '-' : gradeInfo.grade),
      gradeColor: isAbsent ? 'bg-rose-50 text-rose-700' : gradeInfo.colorClass,
      remarks: item?.remarks || '',
    });
  }

  const percentage = totalMax > 0 ? Number(((totalObtained / totalMax) * 100).toFixed(2)) : 0;
  const gradeInfo = getGradeFromPercentage(percentage, boundaries);

  return {
    studentId: student.id,
    totalObtained,
    totalMax,
    percentage,
    grade: gradeInfo.grade,
    gradeColor: gradeInfo.colorClass,
    subjectDetails,
  };
}

// Patrak B Calculation
export interface PatrakBSummary {
  studentId: string;
  totalObtained: number;
  totalMax: number;
  percentage: number;
  grade: string;
  gradeColor: string;
  componentDetails: {
    componentId: string;
    componentName: string;
    maxMarks: number;
    obtainedMarks?: number;
    isAbsent?: boolean;
    percentage: number;
    grade: string;
  }[];
}

export function calculatePatrakBSummary(
  studentId: string,
  components: PatrakBComponent[],
  patrakBRecord: Record<string, Record<string, PatrakBItem>>,
  boundaries = DEFAULT_GRADE_BOUNDARIES
): PatrakBSummary {
  let totalObtained = 0;
  let totalMax = 0;
  const componentDetails = [];

  for (const comp of components) {
    totalMax += comp.maxMarks;
    const item = patrakBRecord[studentId]?.[comp.id];
    const obtained = item?.marks;
    const isAbsent = !!item?.isAbsent;

    let compPct = 0;
    if (!isAbsent && obtained !== undefined) {
      totalObtained += obtained;
      compPct = comp.maxMarks > 0 ? Number(((obtained / comp.maxMarks) * 100).toFixed(2)) : 0;
    }

    const gradeInfo = getGradeFromPercentage(compPct, boundaries);

    componentDetails.push({
      componentId: comp.id,
      componentName: comp.name,
      maxMarks: comp.maxMarks,
      obtainedMarks: obtained,
      isAbsent,
      percentage: compPct,
      grade: isAbsent ? 'ગેરહાજર' : (obtained === undefined ? '-' : gradeInfo.grade),
    });
  }

  const percentage = totalMax > 0 ? Number(((totalObtained / totalMax) * 100).toFixed(2)) : 0;
  const gradeInfo = getGradeFromPercentage(percentage, boundaries);

  return {
    studentId,
    totalObtained,
    totalMax,
    percentage,
    grade: gradeInfo.grade,
    gradeColor: gradeInfo.colorClass,
    componentDetails,
  };
}

// Final Consolidated Academic Result Calculation
export interface FinalStudentResult {
  student: Student;
  calculationMethod: string;
  isPendingSetup: boolean;
  totalObtained: number;
  totalMax: number;
  percentage: number;
  grade: string;
  gradeColor: string;
  status: 'પાસ' | 'નાપાસ' | 'અનિર્ણિત' | 'પેન્ડિંગ';
  failingSubjects: string[];
  rank?: number;
  subjectWise: {
    subjectId: string;
    subjectName: string;
    q1?: number;
    q2?: number;
    sem1?: number;
    sem2?: number;
    assignment?: number;
    totalObtained: number;
    totalMax: number;
    percentage: number;
    grade: string;
    isPass: boolean;
  }[];
}

export function calculateFinalStudentResult(
  student: Student,
  subjects: Subject[],
  marksRecord: StudentMarksRecord,
  settings: SchoolSettings
): FinalStudentResult {
  const method = settings.calculationMethod;
  const studentSubs = subjects.filter(s => s.standards.includes(student.standard));

  if (method === 'pending_setup') {
    return {
      student,
      calculationMethod: 'અંતિમ કુલ બાકી – ગુણપદ્ધતિ સેટ કરો',
      isPendingSetup: true,
      totalObtained: 0,
      totalMax: 0,
      percentage: 0,
      grade: '-',
      gradeColor: 'bg-gray-100 text-gray-700',
      status: 'પેન્ડિંગ',
      failingSubjects: [],
      subjectWise: [],
    };
  }

  let totalObtained = 0;
  let totalMax = 0;
  const failingSubjects: string[] = [];
  const subjectWise = [];

  for (const sub of studentSubs) {
    const studentEntry = marksRecord[student.id]?.[sub.id] || {};
    let subObt = 0;
    let subMax = 0;

    const q1 = studentEntry.quarterly1?.marks;
    const q2 = studentEntry.quarterly2?.marks;
    const s1 = studentEntry.sem1?.marks;
    const s2 = studentEntry.sem2?.marks;
    const asgn = studentEntry.assignment?.marks;

    if (method === 'annual_combined') {
      // Combined: q1(40) + q2(40) + sem1(80) + sem2(80) + asgn(20) = 260
      subMax = (sub.maxMarks.quarterly1 || 40) +
               (sub.maxMarks.quarterly2 || 40) +
               (sub.maxMarks.sem1 || 80) +
               (sub.maxMarks.sem2 || 80) +
               (sub.maxMarks.assignment || 20);
      subObt = (q1 || 0) + (q2 || 0) + (s1 || 0) + (s2 || 0) + (asgn || 0);
    } else if (method === 'semesters_only') {
      // sem1(80) + sem2(80) = 160
      subMax = (sub.maxMarks.sem1 || 80) + (sub.maxMarks.sem2 || 80);
      subObt = (s1 || 0) + (s2 || 0);
    } else if (method === 'sem2_only') {
      // sem2(80)
      subMax = sub.maxMarks.sem2 || 80;
      subObt = s2 || 0;
    }

    totalMax += subMax;
    totalObtained += subObt;

    const subPct = subMax > 0 ? Number(((subObt / subMax) * 100).toFixed(2)) : 0;
    const isPass = subPct >= settings.passingPercentage;
    if (!isPass) {
      failingSubjects.push(sub.name);
    }

    const subGrade = getGradeFromPercentage(subPct, settings.gradeBoundaries);

    subjectWise.push({
      subjectId: sub.id,
      subjectName: sub.name,
      q1,
      q2,
      sem1: s1,
      sem2: s2,
      assignment: asgn,
      totalObtained: subObt,
      totalMax: subMax,
      percentage: subPct,
      grade: subGrade.grade,
      isPass,
    });
  }

  const percentage = totalMax > 0 ? Number(((totalObtained / totalMax) * 100).toFixed(2)) : 0;
  const gradeInfo = getGradeFromPercentage(percentage, settings.gradeBoundaries);
  const isPass = failingSubjects.length === 0 && percentage >= settings.passingPercentage;

  return {
    student,
    calculationMethod:
      method === 'annual_combined'
        ? 'વાર્ષિક સંકલિત (ત્રિમાસિક 1 + 2 + સત્ર 1 + 2 + સ્વાધ્યાય)'
        : method === 'semesters_only'
        ? 'બંને સત્ર સંયુક્ત (સત્ર 1 + સત્ર 2)'
        : 'વાર્ષિક સત્ર 2 મૂલ્યાંકન',
    isPendingSetup: false,
    totalObtained,
    totalMax,
    percentage,
    grade: gradeInfo.grade,
    gradeColor: gradeInfo.colorClass,
    status: isPass ? 'પાસ' : 'નાપાસ',
    failingSubjects,
    subjectWise,
  };
}

// Compute Merit Ranking for a class
export function computeClassMeritList(results: FinalStudentResult[]): FinalStudentResult[] {
  // Sort descending by percentage, then totalObtained, then rollNumber
  const sorted = [...results].sort((a, b) => {
    if (b.percentage !== a.percentage) {
      return b.percentage - a.percentage;
    }
    if (b.totalObtained !== a.totalObtained) {
      return b.totalObtained - a.totalObtained;
    }
    return a.student.rollNumber - b.student.rollNumber;
  });

  let currentRank = 1;
  return sorted.map((res, index) => {
    if (index > 0) {
      const prev = sorted[index - 1];
      if (prev.percentage === res.percentage && prev.totalObtained === res.totalObtained) {
        // Tie rank
        return { ...res, rank: prev.rank };
      }
    }
    const assignedRank = currentRank;
    currentRank++;
    return { ...res, rank: assignedRank };
  });
}
