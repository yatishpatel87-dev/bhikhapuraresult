import { AppData, ExamKey, Student, Subject } from '../types';
import {
  calculateFinalStudentResult,
  calculatePatrakASummary,
  calculatePatrakBSummary,
  computeClassMeritList,
} from './calculations';

export interface WhatsAppExportOptions {
  includeSchoolHeader: boolean;
  includeStudentBio: boolean;
  includeSubjectMarks: boolean;
  includeDetailedExams: boolean;
  includePatrakA: boolean;
  includePatrakB: boolean;
  includeFinalSummary: boolean;
  includeAttendance: boolean;
  includeRank: boolean;
  includeRemarks: boolean;
  includeCongratulations: boolean;
  includeSignOff: boolean;
}

export const DEFAULT_WHATSAPP_OPTIONS: WhatsAppExportOptions = {
  includeSchoolHeader: true,
  includeStudentBio: true,
  includeSubjectMarks: true,
  includeDetailedExams: false,
  includePatrakA: true,
  includePatrakB: true,
  includeFinalSummary: true,
  includeAttendance: true,
  includeRank: true,
  includeRemarks: true,
  includeCongratulations: true,
  includeSignOff: true,
};

export function buildStudentWhatsAppSummary(
  student: Student,
  appData: AppData,
  rankNumber?: number,
  options: WhatsAppExportOptions = DEFAULT_WHATSAPP_OPTIONS
): string {
  const { subjects, marks, patrakA, patrakB, settings, students } = appData;

  // Calculate results
  const finalResult = calculateFinalStudentResult(student, subjects, marks, settings);
  const studentSubjects = subjects.filter((s) => s.standards.includes(student.standard));
  const patrakASum = calculatePatrakASummary(student, subjects, patrakA, settings.gradeBoundaries);
  const patrakBSum = calculatePatrakBSummary(
    student.id,
    settings.patrakBComponents,
    patrakB,
    settings.gradeBoundaries
  );

  // Merit rank computation if not provided
  let computedRank = rankNumber;
  if (computedRank === undefined && options.includeRank) {
    const classStudents = students.filter((s) => s.standard === student.standard);
    const classResults = classStudents.map((st) =>
      calculateFinalStudentResult(st, subjects, marks, settings)
    );
    const meritList = computeClassMeritList(classResults);
    computedRank = meritList.find((r) => r.student.id === student.id)?.rank;
  }

  const lines: string[] = [];

  // 1. School Header
  if (options.includeSchoolHeader) {
    lines.push(`🏫 *${settings.schoolName || 'શ્રી પ્રાથમિક શાળા'}*`);
    if (settings.schoolTagline) {
      lines.push(`_${settings.schoolTagline}_`);
    }
    lines.push(`📋 *વાર્ષિક સર્વગ્રાહી પ્રગતિ પત્રક (રિપોર્ટ કાર્ડ) – શૈક્ષણિક વર્ષ ${settings.academicYear || '૨૦૨૪-૨૫'}*`);
    lines.push('━━━━━━━━━━━━━━━━━━━━');
  }

  // 2. Student Bio
  if (options.includeStudentBio) {
    lines.push(`👤 *વિદ્યાર્થીની વિગત:*`);
    lines.push(`• *નામ:* ${student.name}`);
    lines.push(`• *ધોરણ:* ${student.standard}  |  *વર્ગ:* ${student.division}`);
    lines.push(`• *રોલ નંબર:* ${student.rollNumber}  |  *GR નં:* ${student.grNumber || '-'}`);

    if (options.includeAttendance) {
      const attPct =
        student.attendance.totalDays > 0
          ? Math.round((student.attendance.presentDays / student.attendance.totalDays) * 100)
          : 0;
      lines.push(
        `• *હાજરી:* ${student.attendance.presentDays}/${student.attendance.totalDays} દિવસ (${attPct}%)`
      );
    }
    lines.push('━━━━━━━━━━━━━━━━━━━━');
  }

  // 3. Subject-wise Marks
  if (options.includeSubjectMarks && studentSubjects.length > 0) {
    lines.push(`📊 *વિષયવાર વાર્ષિક પરિણામ:*`);
    for (const sub of studentSubjects) {
      const sw = finalResult.subjectWise.find((x) => x.subjectId === sub.id);
      if (sw) {
        if (options.includeDetailedExams) {
          const subEntry = marks[student.id]?.[sub.id] || {};
          const q1 = subEntry.quarterly1?.isAbsent ? 'ગેરહાજર' : (subEntry.quarterly1?.marks ?? '-');
          const q2 = subEntry.quarterly2?.isAbsent ? 'ગેરહાજર' : (subEntry.quarterly2?.marks ?? '-');
          const s1 = subEntry.sem1?.isAbsent ? 'ગેરહાજર' : (subEntry.sem1?.marks ?? '-');
          const s2 = subEntry.sem2?.isAbsent ? 'ગેરહાજર' : (subEntry.sem2?.marks ?? '-');
          const asg = subEntry.assignment?.isAbsent ? 'ગેરહાજર' : (subEntry.assignment?.marks ?? '-');

          lines.push(`• *${sub.name}:* *${sw.totalObtained}/${sw.totalMax}* (${sw.percentage}%) [ગ્રેડ: *${sw.grade}*]`);
          lines.push(`   └ Q1: ${q1} | Q2: ${q2} | સત્ર1: ${s1} | સત્ર2: ${s2} | સ્વા: ${asg}`);
        } else {
          lines.push(`• *${sub.name}:* ${sw.totalObtained}/${sw.totalMax} (${sw.percentage}%) – ગ્રેડ *${sw.grade}*`);
        }
      }
    }
    lines.push('━━━━━━━━━━━━━━━━━━━━');
  }

  // 4. Patrak A & Patrak B Summary
  if (options.includePatrakA || options.includePatrakB) {
    const patrakLines: string[] = [];
    if (options.includePatrakA) {
      patrakLines.push(`• *પત્રક A (સર્વગ્રાહી મૂલ્યાંકન):* ${patrakASum.totalObtained}/${patrakASum.totalMax} (${patrakASum.percentage}%) – ગ્રેડ *${patrakASum.grade}*`);
    }
    if (options.includePatrakB) {
      patrakLines.push(`• *પત્રક B (વ્યક્તિત્વ વિકાસ):* ${patrakBSum.totalObtained}/૪૦૦ (${patrakBSum.percentage}%) – ગ્રેડ *${patrakBSum.grade}*`);
    }
    if (patrakLines.length > 0) {
      lines.push(`📑 *સહ-અભ્યાસિક મૂલ્યાંકન:*`);
      lines.push(...patrakLines);
      lines.push('━━━━━━━━━━━━━━━━━━━━');
    }
  }

  // 5. Final Academic Result Summary
  if (options.includeFinalSummary) {
    lines.push(`🌟 *વાર્ષિક અંતિમ પરિણામ:*`);
    lines.push(`🎯 *કુલ મેળવેલ ગુણ:* ${finalResult.totalObtained} / ${finalResult.totalMax}`);
    lines.push(`📈 *વાર્ષિક ટકાવારી:* *${finalResult.percentage}%*`);
    lines.push(`🏅 *અંતિમ ગ્રેડ:* *${finalResult.grade}*`);
    lines.push(`✅ *પરિણામ સ્થિતિ:* *${finalResult.status}*`);

    if (options.includeRank && computedRank && settings.showRankInReportCard !== false) {
      const medal = computedRank === 1 ? '🥇' : computedRank === 2 ? '🥈' : computedRank === 3 ? '🥉' : '🏆';
      lines.push(`${medal} *વર્ગમાં મેરિટ ક્રમ:* *#${computedRank}*`);
    }
    lines.push('━━━━━━━━━━━━━━━━━━━━');
  }

  // 6. Teacher remarks
  if (options.includeRemarks && student.remarks) {
    lines.push(`💬 *શિક્ષકની નોંધ:*`);
    lines.push(`_${student.remarks}_`);
    lines.push('━━━━━━━━━━━━━━━━━━━━');
  }

  // 7. Congratulations note
  if (options.includeCongratulations) {
    if (finalResult.status === 'પાસ') {
      if (finalResult.grade === 'A1' || finalResult.grade === 'A2') {
        lines.push(`🎉 *ખૂબ ખૂબ અભિનંદન!* વિદ્યાર્થીએ ઉત્કૃષ્ટ પરિણામ મેળવી શાળાનું ગૌરવ વધાર્યું છે. ભવિષ્ય માટે ઉજ્જવળ શુભેચ્છાઓ! 🌟`);
      } else {
        lines.push(`👏 *સફળતા બદલ વિદ્યાર્થી તથા વાલીશ્રીને હાર્દિક અભિનંદન!* ઉત્તરોત્તર પ્રગતિ કરો એવી શુભકામનાઓ! 💐`);
      }
    } else {
      lines.push(`💪 *આગામી સત્રમાં વધુ મહેનત અને લગનથી અભ્યાસ કરવા પ્રેરણા પાઠવીએ છીએ.*`);
    }
  }

  // 8. Sign Off
  if (options.includeSignOff) {
    lines.push('');
    lines.push(`✍️ *વર્ગ શિક્ષક & આચાર્યશ્રી*`);
    if (settings.principalName) {
      lines.push(`_${settings.principalName}_`);
    }
    if (settings.schoolAddress) {
      lines.push(`📍 ${settings.schoolAddress}`);
    }
  }

  return lines.join('\n');
}

/**
 * Open WhatsApp share link directly
 */
export function openWhatsAppShare(text: string, phone = ''): void {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  let fullPhone = '';
  if (cleanPhone.length === 10) {
    fullPhone = `91${cleanPhone}`;
  } else if (cleanPhone.length > 10) {
    fullPhone = cleanPhone;
  }

  const encodedText = encodeURIComponent(text);
  let url = '';
  if (fullPhone) {
    url = `https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodedText}`;
  } else {
    url = `https://api.whatsapp.com/send?text=${encodedText}`;
  }

  window.open(url, '_blank');
}

/**
 * Copy text to clipboard with fallback
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fallback
    }
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}
