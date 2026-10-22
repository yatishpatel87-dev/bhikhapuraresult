import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from './config';
import { handleFirestoreError, OperationType } from './errors';
import {
  AppData,
  Student,
  Subject,
  StudentMarksRecord,
  PatrakARecord,
  PatrakBRecord,
  SchoolSettings,
} from '../types';

/**
 * Loads all school data for the current authenticated teacher from Firestore.
 * If no data exists yet, returns null.
 */
export async function loadUserDataFromFirestore(userId: string): Promise<AppData | null> {
  const userDocPath = `users/${userId}`;
  try {
    const userDocRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userDocRef);

    if (!userSnap.exists()) {
      return null;
    }

    const userData = userSnap.data();

    // 1. Fetch Students subcollection
    const studentsPath = `users/${userId}/students`;
    const studentsSnap = await getDocs(collection(db, 'users', userId, 'students'));
    const students: Student[] = [];
    studentsSnap.forEach((docItem) => {
      const data = docItem.data() as Student;
      students.push({
        ...data,
        id: docItem.id,
      });
    });

    // 2. Fetch Subjects subcollection
    const subjectsPath = `users/${userId}/subjects`;
    const subjectsSnap = await getDocs(collection(db, 'users', userId, 'subjects'));
    const subjects: Subject[] = [];
    subjectsSnap.forEach((docItem) => {
      const data = docItem.data() as Subject;
      subjects.push({
        ...data,
        id: docItem.id,
      });
    });

    // 3. Fetch Results subcollection (Marks, Patrak A, Patrak B)
    const resultsPath = `users/${userId}/results`;
    const resultsSnap = await getDocs(collection(db, 'users', userId, 'results'));
    const marks: StudentMarksRecord = {};
    const patrakA: PatrakARecord = {};
    const patrakB: PatrakBRecord = {};

    resultsSnap.forEach((docItem) => {
      const res = docItem.data();
      const stId = docItem.id;
      if (res.marks) marks[stId] = res.marks;
      if (res.patrakA) patrakA[stId] = res.patrakA;
      if (res.patrakB) patrakB[stId] = res.patrakB;
    });

    // Reconstruct settings
    const settings: SchoolSettings = {
      schoolName: userData.schoolName || 'શ્રી ભીખાપુરા પ્રાથમિક શાળા',
      schoolTagline: userData.schoolTagline || 'વિદ્યાર્થી પરિણામ વ્યવસ્થાપન પ્રણાલી',
      schoolAddress: userData.schoolAddress || '',
      academicYear: userData.academicYear || '2024-2025',
      passingPercentage: userData.passingPercentage ?? 33,
      calculationMethod: userData.calculationMethod || 'annual_combined',
      showRankInReportCard: userData.showRankInReportCard ?? true,
      principalName: userData.principalName || 'શ્રી એમ. કે. પટેલ',
      gradeBoundaries: userData.gradeBoundaries || [
        { grade: 'A1', minPercent: 91, label: 'અસાધારણ (Outstanding)', colorClass: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
        { grade: 'A2', minPercent: 81, label: 'ઉત્કૃષ્ટ (Excellent)', colorClass: 'bg-teal-50 text-teal-800 border-teal-300' },
        { grade: 'B1', minPercent: 71, label: 'ખૂબ સરસ (Very Good)', colorClass: 'bg-blue-50 text-blue-800 border-blue-300' },
        { grade: 'B2', minPercent: 61, label: 'સારું (Good)', colorClass: 'bg-indigo-50 text-indigo-800 border-indigo-300' },
        { grade: 'C1', minPercent: 51, label: 'સંતોષકારક (Above Average)', colorClass: 'bg-amber-50 text-amber-800 border-amber-300' },
        { grade: 'C2', minPercent: 41, label: 'સરેરાશ (Average)', colorClass: 'bg-orange-50 text-orange-800 border-orange-300' },
        { grade: 'D', minPercent: 33, label: 'સામાન્ય પાસ (Pass)', colorClass: 'bg-yellow-50 text-yellow-800 border-yellow-300' },
        { grade: 'E', minPercent: 0, label: 'વધુ મહેનત જરૂરી (Needs Improvement)', colorClass: 'bg-rose-50 text-rose-800 border-rose-300' },
      ],
      patrakBComponents: userData.patrakBComponents || [
        { id: 'b_health', name: '૧. સ્વાસ્થ્ય અને શારીરિક શિક્ષણ', maxMarks: 50 },
        { id: 'b_art', name: '૨. ચિત્ર અને લલિતકળા', maxMarks: 50 },
        { id: 'b_music', name: '૩. સંગીત અને નાટ્યકલા', maxMarks: 50 },
        { id: 'b_work', name: '૪. કાર્યાનુભવ અને સર્જનાત્મકતા', maxMarks: 50 },
        { id: 'b_values', name: '૫. જીવનમૂલ્યો અને નૈતિક શિક્ષણ', maxMarks: 50 },
        { id: 'b_social', name: '૬. સામાજિક વર્તન અને સહકાર', maxMarks: 50 },
        { id: 'b_discipline', name: '૭. નિયમિતતા અને શિસ્ત', maxMarks: 50 },
        { id: 'b_extra', name: '૮. સહઅભ્યાસિક પ્રવૃત્તિઓ (Co-curricular)', maxMarks: 50 },
      ],
      teacherRemarksTemplate: userData.teacherRemarksTemplate || [
        'ખૂબ ઉત્સાહી અને હોંશિયાર વિદ્યાર્થી છે.',
        'ગણિત અને વિજ્ઞાનમાં વિશેષ રસ ધરાવે છે.',
        'વાંચન અને લેખનમાં સુધારો જરૂરી છે.',
        'વર્ગકાર્યમાં નિયમિત અને આજ્ઞાંકિત રહે છે.',
        'સર્જનાત્મક પ્રવૃત્તિઓમાં સક્રિય ભાગ લે છે.',
      ],
    };

    return {
      version: userData.version || '1.0.0',
      lastUpdated: userData.updatedAt || new Date().toISOString(),
      students,
      subjects,
      marks,
      patrakA,
      patrakB,
      settings,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, userDocPath);
  }
}

/**
 * Saves all user data to Firestore under users/{userId} subcollections.
 */
export async function saveUserDataToFirestore(
  userId: string,
  data: AppData,
  userProfile?: { displayName?: string | null; email?: string | null; photoURL?: string | null }
): Promise<void> {
  const userDocPath = `users/${userId}`;
  try {
    const userDocRef = doc(db, 'users', userId);

    // Save user profile & school settings document
    const userDocPayload = {
      uid: userId,
      email: userProfile?.email || '',
      displayName: userProfile?.displayName || '',
      photoURL: userProfile?.photoURL || '',
      schoolName: data.settings.schoolName,
      schoolTagline: data.settings.schoolTagline,
      schoolAddress: data.settings.schoolAddress,
      academicYear: data.settings.academicYear,
      passingPercentage: data.settings.passingPercentage,
      principalName: data.settings.principalName,
      calculationMethod: data.settings.calculationMethod,
      showRankInReportCard: data.settings.showRankInReportCard,
      gradeBoundaries: data.settings.gradeBoundaries,
      patrakBComponents: data.settings.patrakBComponents,
      teacherRemarksTemplate: data.settings.teacherRemarksTemplate,
      version: data.version,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(userDocRef, userDocPayload);

    // Write students
    const studentPromises = data.students.map((st) => {
      const studentRef = doc(db, 'users', userId, 'students', st.id);
      return setDoc(studentRef, {
        ...st,
        updatedAt: new Date().toISOString(),
      });
    });

    // Write subjects
    const subjectPromises = data.subjects.map((sub) => {
      const subRef = doc(db, 'users', userId, 'subjects', sub.id);
      return setDoc(subRef, sub);
    });

    // Write results per student
    const resultPromises = data.students.map((st) => {
      const resultRef = doc(db, 'users', userId, 'results', st.id);
      return setDoc(resultRef, {
        studentId: st.id,
        standard: st.standard,
        division: st.division,
        marks: data.marks[st.id] || {},
        patrakA: data.patrakA[st.id] || {},
        patrakB: data.patrakB[st.id] || {},
        updatedAt: new Date().toISOString(),
      });
    });

    await Promise.all([...studentPromises, ...subjectPromises, ...resultPromises]);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userDocPath);
  }
}

/**
 * Saves or updates a single student document.
 */
export async function saveSingleStudentToFirestore(userId: string, student: Student): Promise<void> {
  const path = `users/${userId}/students/${student.id}`;
  try {
    const studentRef = doc(db, 'users', userId, 'students', student.id);
    await setDoc(studentRef, {
      ...student,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Deletes a student and their corresponding result document.
 */
export async function deleteStudentFromFirestore(userId: string, studentId: string): Promise<void> {
  const path = `users/${userId}/students/${studentId}`;
  try {
    const studentRef = doc(db, 'users', userId, 'students', studentId);
    const resultRef = doc(db, 'users', userId, 'results', studentId);
    await Promise.all([deleteDoc(studentRef), deleteDoc(resultRef)]);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Saves examination, Patrak A, or Patrak B marks for a student.
 */
export async function saveStudentResultToFirestore(
  userId: string,
  studentId: string,
  standard: number,
  division: string,
  marksPayload: {
    marks?: any;
    patrakA?: any;
    patrakB?: any;
  }
): Promise<void> {
  const path = `users/${userId}/results/${studentId}`;
  try {
    const resultRef = doc(db, 'users', userId, 'results', studentId);
    await setDoc(
      resultRef,
      {
        studentId,
        standard,
        division,
        ...marksPayload,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
