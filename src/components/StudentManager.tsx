import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Upload,
  Download,
  Edit2,
  Trash2,
  FileSpreadsheet,
  Calendar,
  AlertTriangle,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { AppData, Division, Standard, Student } from '../types';

interface StudentManagerProps {
  appData: AppData;
  onUpdateAppData: (data: AppData) => void;
  onNavigateToReport: (studentId: string) => void;
}

export const StudentManager: React.FC<StudentManagerProps> = ({
  appData,
  onUpdateAppData,
  onNavigateToReport,
}) => {
  const [selectedStandard, setSelectedStandard] = useState<Standard | 'all'>('all');
  const [selectedDivision, setSelectedDivision] = useState<Division | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    standard: Standard;
    division: Division;
    rollNumber: number;
    grNumber: string;
    dob: string;
    gender: 'કુમાર' | 'કન્યા';
    totalDays: number;
    presentDays: number;
    remarks: string;
  }>({
    name: '',
    standard: 8,
    division: 'A',
    rollNumber: 1,
    grNumber: '',
    dob: '2012-01-01',
    gender: 'કુમાર',
    totalDays: 220,
    presentDays: 210,
    remarks: '',
  });

  // Filter students
  const filteredStudents = appData.students.filter((st) => {
    if (selectedStandard !== 'all' && st.standard !== selectedStandard) return false;
    if (selectedDivision !== 'all' && st.division !== selectedDivision) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = st.name.toLowerCase().includes(q);
      const matchGr = st.grNumber.toLowerCase().includes(q);
      const matchRoll = st.rollNumber.toString().includes(q);
      return matchName || matchGr || matchRoll;
    }
    return true;
  });

  // Sort by Standard, Division, Roll Number
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    if (a.standard !== b.standard) return a.standard - b.standard;
    if (a.division !== b.division) return a.division.localeCompare(b.division);
    return a.rollNumber - b.rollNumber;
  });

  const openAddModal = () => {
    // Pick next roll number for current standard
    const std = selectedStandard === 'all' ? 8 : selectedStandard;
    const existing = appData.students.filter((s) => s.standard === std);
    const maxRoll = existing.reduce((max, s) => Math.max(max, s.rollNumber), 0);

    setEditingStudent(null);
    setFormData({
      name: '',
      standard: std,
      division: selectedDivision === 'all' ? 'A' : selectedDivision,
      rollNumber: maxRoll + 1,
      grNumber: `GR-${std}${maxRoll + 101}`,
      dob: '2012-01-01',
      gender: 'કુમાર',
      totalDays: 220,
      presentDays: 210,
      remarks: '',
    });
    setIsAddEditOpen(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      standard: student.standard,
      division: student.division,
      rollNumber: student.rollNumber,
      grNumber: student.grNumber,
      dob: student.dob,
      gender: student.gender,
      totalDays: student.attendance.totalDays,
      presentDays: student.attendance.presentDays,
      remarks: student.remarks || '',
    });
    setIsAddEditOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formData.name.trim()) {
      setFormError('કૃપા કરીને વિદ્યાર્થીનું પૂરું નામ દાખલ કરો.');
      return;
    }

    if (editingStudent) {
      // Update
      const updatedList = appData.students.map((st) =>
        st.id === editingStudent.id
          ? {
              ...st,
              name: formData.name.trim(),
              standard: formData.standard,
              division: formData.division,
              rollNumber: Number(formData.rollNumber),
              grNumber: formData.grNumber.trim(),
              dob: formData.dob,
              gender: formData.gender,
              attendance: {
                totalDays: Number(formData.totalDays) || 220,
                presentDays: Number(formData.presentDays) || 0,
              },
              remarks: formData.remarks.trim(),
            }
          : st
      );
      onUpdateAppData({ ...appData, students: updatedList });
    } else {
      // Create
      const newStudent: Student = {
        id: `st_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name: formData.name.trim(),
        standard: formData.standard,
        division: formData.division,
        rollNumber: Number(formData.rollNumber),
        grNumber: formData.grNumber.trim(),
        dob: formData.dob,
        gender: formData.gender,
        attendance: {
          totalDays: Number(formData.totalDays) || 220,
          presentDays: Number(formData.presentDays) || 0,
        },
        remarks: formData.remarks.trim(),
      };
      onUpdateAppData({ ...appData, students: [...appData.students, newStudent] });
    }
    setIsAddEditOpen(false);
  };

  const confirmDelete = () => {
    if (!studentToDelete) return;
    const remainingStudents = appData.students.filter((s) => s.id !== studentToDelete.id);
    const updatedMarks = { ...appData.marks };
    delete updatedMarks[studentToDelete.id];
    const updatedPatrakA = { ...appData.patrakA };
    delete updatedPatrakA[studentToDelete.id];
    const updatedPatrakB = { ...appData.patrakB };
    delete updatedPatrakB[studentToDelete.id];

    onUpdateAppData({
      ...appData,
      students: remainingStudents,
      marks: updatedMarks,
      patrakA: updatedPatrakA,
      patrakB: updatedPatrakB,
    });
    setIsDeleteOpen(false);
    setStudentToDelete(null);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['રોલ નંબર', 'GR નંબર', 'વિદ્યાર્થીનું નામ', 'ધોરણ', 'વર્ગ', 'જન્મ તારીખ', 'જાતિ', 'કુલ દિવસો', 'હાજર દિવસો', 'નોંધ'];
    const rows = sortedStudents.map((s) => [
      s.rollNumber,
      `"${s.grNumber}"`,
      `"${s.name}"`,
      s.standard,
      s.division,
      s.dob,
      s.gender,
      s.attendance.totalDays,
      s.attendance.presentDays,
      `"${s.remarks || ''}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vidyarthi_yadi_dhoran_${selectedStandard}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // CSV Import
  const handleImportCSV = () => {
    if (!csvText.trim()) {
      setImportFeedback('કૃપા કરીને CSV લખાણ પેસ્ટ કરો.');
      return;
    }

    try {
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) {
        setImportFeedback('CSV માં ઓછામાં ઓછી એક હેડર લાઇન અને એક વિદ્યાર્થીની લાઇન હોવી જોઈએ.');
        return;
      }

      const imported: Student[] = [];
      // Skip header line
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        // Simple comma split
        const parts = line.split(',').map((p) => p.replace(/^"|"$/g, '').trim());
        if (parts.length >= 3) {
          const roll = Number(parts[0]) || i;
          const gr = parts[1] || `GR-${roll + 1000}`;
          const name = parts[2];
          const std = ([6, 7, 8].includes(Number(parts[3])) ? Number(parts[3]) : 8) as Standard;
          const div = (['A', 'B', 'C', 'D'].includes(parts[4]) ? parts[4] : 'A') as Division;
          const dob = parts[5] || '2012-01-01';
          const gender = parts[6] === 'કન્યા' ? 'કન્યા' : 'કુમાર';
          const totalDays = Number(parts[7]) || 220;
          const presentDays = Number(parts[8]) || 200;
          const remarks = parts[9] || '';

          if (name) {
            imported.push({
              id: `st_imp_${Date.now()}_${i}`,
              rollNumber: roll,
              grNumber: gr,
              name,
              standard: std,
              division: div,
              dob,
              gender,
              attendance: { totalDays, presentDays },
              remarks,
            });
          }
        }
      }

      if (imported.length === 0) {
        setImportFeedback('કોઈ માન્ય વિદ્યાર્થી મળ્યા નથી.');
        return;
      }

      onUpdateAppData({
        ...appData,
        students: [...appData.students, ...imported],
      });

      setImportFeedback(`સફળતાપૂર્વક ${imported.length} વિદ્યાર્થીઓ ઉમેરવામાં આવ્યા!`);
      setTimeout(() => {
        setIsImportOpen(false);
        setCsvText('');
        setImportFeedback(null);
      }, 1500);
    } catch (err: any) {
      setImportFeedback(`CSV પાર્સ કરવામાં ભૂલ: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" /> વિદ્યાર્થી વ્યવસ્થાપન (Students Management)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ધોરણ ૬, ૭ અને ૮ ના વિદ્યાર્થીઓની નોંધણી, સુધારા અને વિગતો
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsImportOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4 text-slate-600" />
            <span>Excel / CSV Import</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>નવો વિદ્યાર્થી ઉમેરો</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Standard Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <span className="px-2 text-slate-500">ધોરણ:</span>
            {(['all', 6, 7, 8] as const).map((std) => (
              <button
                key={std}
                onClick={() => setSelectedStandard(std)}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedStandard === std
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                {std === 'all' ? 'બધા' : `ધોરણ ${std}`}
              </button>
            ))}
          </div>

          {/* Division Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <span className="px-2 text-slate-500">વર્ગ:</span>
            {(['all', 'A', 'B'] as const).map((div) => (
              <button
                key={div}
                onClick={() => setSelectedDivision(div)}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedDivision === div
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                {div === 'all' ? 'બધા' : `વર્ગ ${div}`}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="નામ, રોલ નં અથવા GR થી શોધો..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4 w-14 text-center">રોલ નં</th>
                <th className="py-3 px-4 w-24">GR નંબર</th>
                <th className="py-3 px-4">વિદ્યાર્થીનું પૂરું નામ</th>
                <th className="py-3 px-4 w-28 text-center">ધોરણ / વર્ગ</th>
                <th className="py-3 px-4 w-24 text-center">જાતિ</th>
                <th className="py-3 px-4 w-28 text-center">જન્મ તારીખ</th>
                <th className="py-3 px-4 w-32 text-center">હાજરી (દિવસો)</th>
                <th className="py-3 px-4 w-36 text-center">ક્રિયાઓ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    કોઈ વિદ્યાર્થી મળ્યા નથી.
                  </td>
                </tr>
              ) : (
                sortedStudents.map((st) => {
                  const attPct =
                    st.attendance.totalDays > 0
                      ? Math.round((st.attendance.presentDays / st.attendance.totalDays) * 100)
                      : 0;
                  return (
                    <tr key={st.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3 px-4 text-center font-black text-slate-900 text-sm">
                        {st.rollNumber}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 text-xs">
                        {st.grNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{st.name}</div>
                        {st.remarks && (
                          <div className="text-[11px] text-slate-400 italic">{st.remarks}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          ધોરણ {st.standard} - {st.division}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-600">
                        {st.gender}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-700 text-xs font-mono font-bold">
                        {st.dob}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-black text-slate-900">
                          {st.attendance.presentDays}/{st.attendance.totalDays}
                        </span>{' '}
                        <span className="text-xs text-blue-700 font-black">({attPct}%)</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => onNavigateToReport(st.id)}
                            title="રિપોર્ટ કાર્ડ જુઓ"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(st)}
                            title="વિગતો સુધારો"
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setStudentToDelete(st);
                              setIsDeleteOpen(true);
                            }}
                            title="વિદ્યાર્થી કાઢી નાખો"
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
          <div>કુલ દર્શાવેલ વિદ્યાર્થીઓ: <strong>{sortedStudents.length}</strong></div>
          <div>શ્રી ભીખાપુરા પ્રાથમિક શાળા • ધોરણ ૬-૮</div>
        </div>
      </div>

      {/* ADD / EDIT STUDENT MODAL */}
      {isAddEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              {editingStudent ? 'વિદ્યાર્થીની વિગતો સુધારો' : 'નવા વિદ્યાર્થીની નોંધણી'}
            </h3>

            <form onSubmit={handleSaveStudent} className="space-y-4 text-xs md:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">વિદ્યાર્થીનું પૂરું નામ *</label>
                <input
                  type="text"
                  required
                  placeholder="દા.ત. પટેલ આરવ કલ્પેશકુમાર"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ધોરણ *</label>
                  <select
                    value={formData.standard}
                    onChange={(e) => setFormData({ ...formData, standard: Number(e.target.value) as Standard })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value={6}>ધોરણ ૬</option>
                    <option value={7}>ધોરણ ૭</option>
                    <option value={8}>ધોરણ ૮</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">વર્ગ (Division) *</label>
                  <select
                    value={formData.division}
                    onChange={(e) => setFormData({ ...formData, division: e.target.value as Division })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="A">વર્ગ A</option>
                    <option value="B">વર્ગ B</option>
                    <option value="C">વર્ગ C</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">રોલ નંબર *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formData.rollNumber}
                    onChange={(e) => setFormData({ ...formData, rollNumber: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GR નંબર *</label>
                  <input
                    type="text"
                    required
                    placeholder="દા.ત. GR-2101"
                    value={formData.grNumber}
                    onChange={(e) => setFormData({ ...formData, grNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">જન્મ તારીખ</label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">જાતિ</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="કુમાર">કુમાર (Boy)</option>
                    <option value="કન્યા">કન્યા (Girl)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">કુલ શાળાકીય દિવસો</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.totalDays}
                    onChange={(e) => setFormData({ ...formData, totalDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">હાજર દિવસો</label>
                  <input
                    type="number"
                    min={0}
                    max={formData.totalDays}
                    value={formData.presentDays}
                    onChange={(e) => setFormData({ ...formData, presentDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">શિક્ષકની વિશેષ નોંધ</label>
                <input
                  type="text"
                  placeholder="દા.ત. નિયમિત અને અભ્યાસમાં સક્રિય"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddEditOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  રદ કરો
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-black text-sm shadow-md cursor-pointer btn-3d"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>સબમિટ કરો (Submit)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteOpen && studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-slate-900">વિદ્યાર્થી કાઢી નાખવો છે?</h3>
            </div>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              તમે <strong className="text-slate-900">{studentToDelete.name}</strong> (રોલ નં: {studentToDelete.rollNumber}, ધોરણ: {studentToDelete.standard}) નો રેકોર્ડ અને તેના તમામ ગુણ કાયમી માટે ડિલીટ કરી રહ્યા છો.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 text-sm cursor-pointer"
              >
                રદ કરો
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow-md cursor-pointer"
              >
                હા, કાઢી નાખો
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMPORT CSV MODAL */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2 mb-2 text-slate-800">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-bold">CSV / Excel માંથી વિદ્યાર્થીઓ આયાત કરો</h3>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              નીચેના ફોર્મેટ મુજબ અલ્પવિરામ (comma-separated) લાઇન પેસ્ટ કરો:
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] font-mono text-slate-600 mb-3">
              રોલ,GR,નામ,ધોરણ,વર્ગ,જન્મતારીખ,જાતિ,કુલદિવસ,હાજરદિવસ<br />
              1,GR-101,પટેલ માનવ,8,A,2012-05-10,કુમાર,220,210<br />
              2,GR-102,શાહ રીયા,8,A,2012-08-14,કન્યા,220,215
            </div>

            <textarea
              rows={6}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="અહીં CSV પેસ્ટ કરો..."
              className="w-full p-3 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 mb-3"
            />

            {importFeedback && (
              <div className="p-2.5 rounded-lg text-xs font-medium mb-3 bg-blue-50 text-blue-800 border border-blue-200">
                {importFeedback}
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setIsImportOpen(false);
                  setCsvText('');
                  setImportFeedback(null);
                }}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 text-xs font-medium cursor-pointer"
              >
                રદ કરો
              </button>
              <button
                onClick={handleImportCSV}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer btn-3d"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>વિદ્યાર્થીઓ સબમિટ કરો (Submit)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
