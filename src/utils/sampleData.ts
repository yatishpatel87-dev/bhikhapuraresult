import {
  AppData,
  PatrakBComponent,
  SchoolSettings,
  Student,
  Subject,
} from '../types';
import { DEFAULT_GRADE_BOUNDARIES } from './calculations';

export const DEFAULT_PATRAK_B_COMPONENTS: PatrakBComponent[] = [
  { id: 'pb1', name: '૧. શારીરિક સ્વાસ્થ્ય, સ્વચ્છતા અને યોગ', maxMarks: 50 },
  { id: 'pb2', name: '૨. જીવન મૂલ્યો અને સદ્ગુણો', maxMarks: 50 },
  { id: 'pb3', name: '૩. સામાજિક વર્તન, શિસ્ત અને સહકાર', maxMarks: 50 },
  { id: 'pb4', name: '૪. સર્જનાત્મકતા, ચિત્રકામ અને કાર્યાનુભવ', maxMarks: 50 },
  { id: 'pb5', name: '૫. રમતગમત અને નેતૃત્વ ગુણો', maxMarks: 50 },
  { id: 'pb6', name: '૬. વાંચન, ભાષાકીય અભિવ્યક્તિ અને ગ્રંથાલય ઉપયોગ', maxMarks: 50 },
  { id: 'pb7', name: '૭. પર્યાવરણ જાળવણી અને પ્રકૃતિ પ્રેમ', maxMarks: 50 },
  { id: 'pb8', name: '૮. શાળાકીય સહઅભ્યાસિક પ્રવૃત્તિઓમાં ઉત્સાહ', maxMarks: 50 },
];

export const DEFAULT_SETTINGS: SchoolSettings = {
  schoolName: 'શ્રી ભીખાપુરા પ્રાથમિક શાળા',
  schoolTagline: 'ગુણવત્તાસભર પ્રાથમિક શિક્ષણ – કૌશલ્ય અને સંસ્કાર કેન્દ્ર',
  schoolAddress: 'મુ. પો. ભીખાપુરા, તા. કલોલ, જિ. ગાંધીનગર, ગુજરાત - ૩૮૨૭૨૧',
  academicYear: '૨૦૨૫-૨૦૨૬',
  passingPercentage: 33,
  gradeBoundaries: DEFAULT_GRADE_BOUNDARIES,
  calculationMethod: 'annual_combined',
  showRankInReportCard: true,
  patrakBComponents: DEFAULT_PATRAK_B_COMPONENTS,
  principalName: 'શ્રી મહેશભાઈ પી. પટેલ',
  teacherRemarksTemplate: [
    'ખૂબ જ ઉત્સાહી અને હોશિયાર વિદ્યાર્થી છે.',
    'ગણિત અને વિજ્ઞાનમાં વિશેષ રસ દાખવે છે.',
    'ભાષા શુદ્ધિ અને હસ્તાક્ષરમાં થોડો સુધારો જરૂરી છે.',
    'નિયમિત હાજરી અને વર્ગ પ્રવૃત્તિઓમાં સક્રિય રહે છે.',
    'વધુ મહેનતથી શ્રેષ્ઠ પરિણામ મેળવી શકે તેમ છે.',
    'સહઅભ્યાસિક પ્રવૃત્તિઓ અને રમતોમાં અગ્રેસર છે.',
  ],
};

export const DEFAULT_SUBJECTS: Subject[] = [
  {
    id: 'sub_guj',
    name: 'ગુજરાતી (પ્રથમ ભાષા)',
    standards: [6, 7, 8],
    maxMarks: { quarterly1: 40, quarterly2: 40, sem1: 80, sem2: 80, assignment: 20 },
    patrakAMaxMarks: 40,
    weightage: 1,
  },
  {
    id: 'sub_hin',
    name: 'હિન્દી',
    standards: [6, 7, 8],
    maxMarks: { quarterly1: 40, quarterly2: 40, sem1: 80, sem2: 80, assignment: 20 },
    patrakAMaxMarks: 40,
    weightage: 1,
  },
  {
    id: 'sub_eng',
    name: 'અંગ્રેજી (દ્વિતીય ભાષા)',
    standards: [6, 7, 8],
    maxMarks: { quarterly1: 40, quarterly2: 40, sem1: 80, sem2: 80, assignment: 20 },
    patrakAMaxMarks: 40,
    weightage: 1,
  },
  {
    id: 'sub_math',
    name: 'ગણિત',
    standards: [6, 7, 8],
    maxMarks: { quarterly1: 40, quarterly2: 40, sem1: 80, sem2: 80, assignment: 20 },
    patrakAMaxMarks: 40,
    weightage: 1,
  },
  {
    id: 'sub_sci',
    name: 'વિજ્ઞાન અને ટેકનોલોજી',
    standards: [6, 7, 8],
    maxMarks: { quarterly1: 40, quarterly2: 40, sem1: 80, sem2: 80, assignment: 20 },
    patrakAMaxMarks: 40,
    weightage: 1,
  },
  {
    id: 'sub_ss',
    name: 'સામાજિક વિજ્ઞાન',
    standards: [6, 7, 8],
    maxMarks: { quarterly1: 40, quarterly2: 40, sem1: 80, sem2: 80, assignment: 20 },
    patrakAMaxMarks: 40,
    weightage: 1,
  },
  {
    id: 'sub_sans',
    name: 'સંસ્કૃત',
    standards: [6, 7, 8],
    maxMarks: { quarterly1: 40, quarterly2: 40, sem1: 80, sem2: 80, assignment: 20 },
    patrakAMaxMarks: 40,
    weightage: 1,
  },
];

export const INITIAL_STUDENTS: Student[] = [
  // ધોરણ 8 - વર્ગ A
  {
    id: 'st_8a_1',
    standard: 8,
    division: 'A',
    rollNumber: 1,
    grNumber: 'GR-2101',
    name: 'પટેલ આરવ કલ્પેશકુમાર',
    dob: '2012-04-12',
    gender: 'કુમાર',
    attendance: { totalDays: 220, presentDays: 212 },
    remarks: 'વર્ગનો સૌથી તેજસ્વી અને શિસ્તબદ્ધ વિદ્યાર્થી.',
  },
  {
    id: 'st_8a_2',
    standard: 8,
    division: 'A',
    rollNumber: 2,
    grNumber: 'GR-2102',
    name: 'પરમાર દિયાબેન મુકેશભાઈ',
    dob: '2012-08-25',
    gender: 'કન્યા',
    attendance: { totalDays: 220, presentDays: 215 },
    remarks: 'ભાષા અને સામાજિક વિજ્ઞાનમાં ઉત્કૃષ્ટ પરિણામ.',
  },
  {
    id: 'st_8a_3',
    standard: 8,
    division: 'A',
    rollNumber: 3,
    grNumber: 'GR-2103',
    name: 'ચૌહાણ રોહન દિનેશભાઈ',
    dob: '2012-02-18',
    gender: 'કુમાર',
    attendance: { totalDays: 220, presentDays: 198 },
    remarks: 'ગણિતમાં વધુ પ્રેક્ટિસની જરૂર છે.',
  },
  {
    id: 'st_8a_4',
    standard: 8,
    division: 'A',
    rollNumber: 4,
    grNumber: 'GR-2104',
    name: 'શાહ ખુશી તેજસકુમાર',
    dob: '2012-11-05',
    gender: 'કન્યા',
    attendance: { totalDays: 220, presentDays: 208 },
    remarks: 'ચિત્રકલા અને વકતૃત્વમાં ખૂબ હોશિયાર.',
  },
  {
    id: 'st_8a_5',
    standard: 8,
    division: 'A',
    rollNumber: 5,
    grNumber: 'GR-2105',
    name: 'ઠાકોર સાહિલ વિક્રમજી',
    dob: '2011-12-14',
    gender: 'કુમાર',
    attendance: { totalDays: 220, presentDays: 202 },
    remarks: 'રમતગમતમાં શાળાનું પ્રતિનિધિત્વ કરે છે.',
  },
  // ધોરણ 7 - વર્ગ A
  {
    id: 'st_7a_1',
    standard: 7,
    division: 'A',
    rollNumber: 1,
    grNumber: 'GR-2201',
    name: 'દેસાઈ મિતેશ ભરતભાઈ',
    dob: '2013-05-10',
    gender: 'કુમાર',
    attendance: { totalDays: 220, presentDays: 210 },
    remarks: 'સર્વાંગી શ્રેષ્ઠ પ્રદર્શન.',
  },
  {
    id: 'st_7a_2',
    standard: 7,
    division: 'A',
    rollNumber: 2,
    grNumber: 'GR-2202',
    name: 'સોલંકી નેહાબેન રાજેન્દ્રકુમાર',
    dob: '2013-09-17',
    gender: 'કન્યા',
    attendance: { totalDays: 220, presentDays: 214 },
    remarks: 'વિજ્ઞાન પ્રયોગોમાં ખાસ રુચિ.',
  },
  {
    id: 'st_7a_3',
    standard: 7,
    division: 'A',
    rollNumber: 3,
    grNumber: 'GR-2203',
    name: 'વાઘેલા હર્ષ સંજયભાઈ',
    dob: '2013-01-29',
    gender: 'કુમાર',
    attendance: { totalDays: 220, presentDays: 195 },
    remarks: 'નિયમિત ગૃહકાર્ય કરે છે.',
  },
  // ધોરણ 6 - વર્ગ A
  {
    id: 'st_6a_1',
    standard: 6,
    division: 'A',
    rollNumber: 1,
    grNumber: 'GR-2301',
    name: 'પ્રજાપતિ તન્વી કમલેશભાઈ',
    dob: '2014-03-22',
    gender: 'કન્યા',
    attendance: { totalDays: 220, presentDays: 216 },
    remarks: 'વાંચન અને શ્રુતલેખનમાં ઉત્તમ.',
  },
  {
    id: 'st_6a_2',
    standard: 6,
    division: 'A',
    rollNumber: 2,
    grNumber: 'GR-2302',
    name: 'પંચાલ મનન હરેશકુમાર',
    dob: '2014-07-08',
    gender: 'કુમાર',
    attendance: { totalDays: 220, presentDays: 205 },
    remarks: 'ગણિતની ક્રિયાઓમાં ઝડપી.',
  },
  {
    id: 'st_6a_3',
    standard: 6,
    division: 'A',
    rollNumber: 3,
    grNumber: 'GR-2303',
    name: 'જોષી પ્રાચી શૈલેષકુમાર',
    dob: '2014-10-15',
    gender: 'કન્યા',
    attendance: { totalDays: 220, presentDays: 212 },
    remarks: 'સુંદર અક્ષરો અને નમ્ર સ્વભાવ.',
  },
];

// Helper to generate realistic initial marks
export function generateInitialAppData(): AppData {
  const marks: AppData['marks'] = {};
  const patrakA: AppData['patrakA'] = {};
  const patrakB: AppData['patrakB'] = {};

  const subjects = DEFAULT_SUBJECTS;

  for (const st of INITIAL_STUDENTS) {
    marks[st.id] = {};
    patrakA[st.id] = {};
    patrakB[st.id] = {};

    // Standard specific factor to add slight variance
    const baseVariance = st.rollNumber === 1 ? 0.92 : st.rollNumber === 2 ? 0.86 : st.rollNumber === 3 ? 0.74 : 0.80;

    for (const sub of subjects) {
      const q1 = Math.round(38 * baseVariance - Math.random() * 3);
      const q2 = Math.round(37 * baseVariance - Math.random() * 4);
      const sem1 = Math.round(76 * baseVariance - Math.random() * 5);
      const sem2 = Math.round(77 * baseVariance - Math.random() * 4);
      const asgn = Math.round(19 * baseVariance);

      marks[st.id][sub.id] = {
        quarterly1: { marks: Math.max(12, Math.min(40, q1)) },
        quarterly2: { marks: Math.max(12, Math.min(40, q2)) },
        sem1: { marks: Math.max(25, Math.min(80, sem1)) },
        sem2: { marks: Math.max(25, Math.min(80, sem2)) },
        assignment: { marks: Math.max(6, Math.min(20, asgn)) },
      };

      // Patrak A (Max 40 marks with 20 outcome boxes, each box = 2 marks)
      const paMarks = Math.max(16, Math.min(40, Math.round(38 * baseVariance - Math.random() * 3)));
      const checkedBoxes = Math.min(20, Math.round(paMarks / 2));
      const outcomes = Array.from({ length: 20 }, (_, idx) => idx < checkedBoxes);
      patrakA[st.id][sub.id] = {
        marks: paMarks,
        outcomes,
        remarks: 'સંતોષકારક રસ દાખવે છે.',
      };
    }

    // Patrak B (8 components, max 50 each -> total 400)
    for (const comp of DEFAULT_PATRAK_B_COMPONENTS) {
      const pbMarks = Math.round(48 * baseVariance - Math.random() * 3);
      patrakB[st.id][comp.id] = {
        marks: Math.max(20, Math.min(50, pbMarks)),
      };
    }
  }

  return {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    students: INITIAL_STUDENTS,
    subjects,
    marks,
    patrakA,
    patrakB,
    settings: DEFAULT_SETTINGS,
  };
}
