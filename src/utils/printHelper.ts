/**
 * Print & PDF Export Utility for Gujarat Primary School Result System
 * Solves iframe print blocking and provides 100% reliable printing + A4 PDF download.
 */

import { AppData, Standard, Student, Subject } from '../types';
import {
  calculateFinalStudentResult,
  calculatePatrakASummary,
  calculatePatrakBSummary,
  computeClassMeritList,
} from './calculations';

/**
 * Safely triggers window.print with focus and error handling.
 */
export const triggerBrowserPrint = (): boolean => {
  try {
    window.focus();
    window.print();
    return true;
  } catch (err) {
    console.warn('window.print() could not be invoked directly:', err);
    return false;
  }
};

/**
 * Triggers a download of standalone HTML that opens in any browser and auto-triggers print dialog
 */
export const downloadPrintableHtml = (
  title: string,
  contentHtml: string,
  fileName: string,
  orientation: 'portrait' | 'landscape' = 'portrait'
) => {
  const fullHtml = `<!DOCTYPE html>
<html lang="gu">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Anek+Gujarati:wght@400;600;700;800;900&family=Baloo+Bhai+2:wght@500;700;800&family=Hind+Vadodara:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Anek Gujarati', 'Hind Vadodara', system-ui, sans-serif;
      background: #f8fafc;
      color: #0f172a;
      line-height: 1.4;
      padding: 20px;
    }
    h1, h2, h3, .heading {
      font-family: 'Baloo Bhai 2', 'Anek Gujarati', sans-serif;
    }
    .bold-num, strong, b, input, td, th {
      font-weight: 800 !important;
    }
    @page {
      size: A4 ${orientation};
      margin: 8mm;
    }
    @media print {
      body {
        background: #ffffff !important;
        padding: 0 !important;
      }
      .no-print {
        display: none !important;
      }
      .page-break {
        page-break-after: always;
        break-after: page;
      }
    }
    .print-bar {
      position: sticky;
      top: 0;
      background: #1e293b;
      color: white;
      padding: 12px 20px;
      margin: -20px -20px 20px -20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 100;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .btn-print {
      background: #4f46e5;
      color: white;
      border: none;
      padding: 8px 18px;
      border-radius: 8px;
      font-weight: bold;
      cursor: pointer;
      font-size: 14px;
    }
    .btn-print:hover {
      background: #4338ca;
    }
  </style>
</head>
<body>
  <div class="print-bar no-print">
    <div>
      <strong>${title}</strong> – પ્રિન્ટ માટે તૈયાર પેજ
    </div>
    <div style="display: flex; gap: 10px;">
      <button class="btn-print" onclick="window.print()">🖨️ પ્રિન્ટ / Save as PDF</button>
      <button class="btn-print" style="background:#475569;" onclick="window.close()">બંધ કરો</button>
    </div>
  </div>
  ${contentHtml}
  <script>
    // Automatically open print dialog if allowed
    window.addEventListener('load', function() {
      setTimeout(function() {
        try {
          window.print();
        } catch(e) {
          console.log('Auto print prevented', e);
        }
      }, 500);
    });
  </script>
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName.endsWith('.html') ? fileName : `${fileName}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

/**
 * Generate Printable HTML for Student Report Cards
 */
export const buildReportCardPrintHtml = (
  studentsToPrint: Student[],
  appData: AppData,
  includeChart = true
): string => {
  const { subjects, marks, patrakA, patrakB, settings } = appData;

  const cardsHtml = studentsToPrint
    .map((student) => {
      const studentSubjects = subjects.filter((s) => s.standards.includes(student.standard));
      const patrakASum = calculatePatrakASummary(student, subjects, patrakA, settings.gradeBoundaries);
      const patrakBSum = calculatePatrakBSummary(
        student.id,
        settings.patrakBComponents,
        patrakB,
        settings.gradeBoundaries
      );
      const finalResult = calculateFinalStudentResult(student, subjects, marks, settings);

      const attPct =
        student.attendance.totalDays > 0
          ? Math.round((student.attendance.presentDays / student.attendance.totalDays) * 100)
          : 0;

      // Rows for scholastic table
      const rowsHtml = studentSubjects
        .map((sub) => {
          const subEntry = marks[student.id]?.[sub.id] || {};
          const sw = finalResult.subjectWise.find((x) => x.subjectId === sub.id);
          const q1 = subEntry.quarterly1?.isAbsent ? 'AB' : subEntry.quarterly1?.marks ?? '-';
          const q2 = subEntry.quarterly2?.isAbsent ? 'AB' : subEntry.quarterly2?.marks ?? '-';
          const s1 = subEntry.sem1?.isAbsent ? 'AB' : subEntry.sem1?.marks ?? '-';
          const s2 = subEntry.sem2?.isAbsent ? 'AB' : subEntry.sem2?.marks ?? '-';
          const ass = subEntry.assignment?.isAbsent ? 'AB' : subEntry.assignment?.marks ?? '-';
          const tot = sw ? `${sw.totalObtained} / ${sw.totalMax}` : '-';
          const pct = sw ? `${sw.percentage}%` : '-';
          const grd = sw ? sw.grade : '-';

          return `
            <tr style="border-bottom: 1px solid #cbd5e1;">
              <td style="padding: 6px 8px; font-weight: bold; border-right: 1px solid #cbd5e1;">${sub.name}</td>
              <td style="padding: 6px; text-align: center; border-right: 1px solid #cbd5e1; font-weight:800;">${q1}</td>
              <td style="padding: 6px; text-align: center; border-right: 1px solid #cbd5e1; font-weight:800;">${q2}</td>
              <td style="padding: 6px; text-align: center; border-right: 1px solid #cbd5e1; font-weight:800;">${s1}</td>
              <td style="padding: 6px; text-align: center; border-right: 1px solid #cbd5e1; font-weight:800;">${s2}</td>
              <td style="padding: 6px; text-align: center; border-right: 1px solid #cbd5e1; font-weight:800;">${ass}</td>
              <td style="padding: 6px; text-align: center; border-right: 1px solid #cbd5e1; font-weight:800; background:#f1f5f9;">${tot}</td>
              <td style="padding: 6px; text-align: center; border-right: 1px solid #cbd5e1; font-weight:800; color:#4338ca;">${pct}</td>
              <td style="padding: 6px; text-align: center; font-weight:800; background:#f8fafc;">${grd}</td>
            </tr>
          `;
        })
        .join('');

      return `
        <div class="page-break" style="max-width: 820px; margin: 0 auto 30px auto; background: #ffffff; border: 2px solid #0f172a; border-radius: 16px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px;">
            <div style="font-size: 24px; font-weight: 900; color: #1e1b4b; text-transform: uppercase;">
              ${settings.schoolName}
            </div>
            <div style="font-size: 13px; font-weight: bold; color: #4338ca;">
              ${settings.schoolTagline}
            </div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
              ${settings.schoolAddress}
            </div>
            <div style="display: inline-block; margin-top: 8px; padding: 4px 16px; background: #e0e7ff; border: 1px solid #a5b4fc; border-radius: 9999px; font-size: 12px; font-weight: 800; color: #1e1b4b;">
              વાર્ષિક સર્વગ્રાહી પ્રગતિ પત્રક (રિપોર્ટ કાર્ડ) – શૈક્ષણિક વર્ષ ${settings.academicYear}
            </div>
          </div>

          <!-- Student Biodata -->
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 10px 14px; margin-bottom: 16px; font-size: 12px;">
            <div>
              <span style="color: #64748b; display: block;">વિદ્યાર્થીનું નામ:</span>
              <strong style="color: #0f172a; font-size: 14px;">${student.name}</strong>
            </div>
            <div>
              <span style="color: #64748b; display: block;">ધોરણ અને વર્ગ:</span>
              <strong style="color: #0f172a; font-size: 14px;">ધોરણ ${student.standard} - વર્ગ ${student.division}</strong>
            </div>
            <div>
              <span style="color: #64748b; display: block;">રોલ નંબર / GR:</span>
              <strong style="color: #0f172a; font-size: 14px;">રોલ ${student.rollNumber} | ${student.grNumber}</strong>
            </div>
            <div>
              <span style="color: #64748b; display: block;">હાજરી:</span>
              <strong style="color: #0f172a; font-size: 14px;">${student.attendance.presentDays}/${student.attendance.totalDays} (${attPct}%)</strong>
            </div>
          </div>

          <!-- Scholastic Table -->
          <div style="margin-bottom: 16px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 11.5px; border: 1.5px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
              <thead>
                <tr style="background: #e2e8f0; color: #0f172a; font-weight: 900; border-bottom: 2px solid #cbd5e1;">
                  <th style="padding: 8px; text-align: left; border-right: 1px solid #cbd5e1;">વિષયનું નામ</th>
                  <th style="padding: 8px; text-align: center; border-right: 1px solid #cbd5e1;">UT-1 (૪૦)</th>
                  <th style="padding: 8px; text-align: center; border-right: 1px solid #cbd5e1;">UT-2 (૪૦)</th>
                  <th style="padding: 8px; text-align: center; border-right: 1px solid #cbd5e1;">સત્ર ૧ (૮૦)</th>
                  <th style="padding: 8px; text-align: center; border-right: 1px solid #cbd5e1;">સત્ર ૨ (૮૦)</th>
                  <th style="padding: 8px; text-align: center; border-right: 1px solid #cbd5e1;">સ્વાધ્યાય (૨૦)</th>
                  <th style="padding: 8px; text-align: center; border-right: 1px solid #cbd5e1; background: #dbeafe;">કુલ ગુણ</th>
                  <th style="padding: 8px; text-align: center; border-right: 1px solid #cbd5e1; background: #e0e7ff;">ટકા (%)</th>
                  <th style="padding: 8px; text-align: center; background: #ede9fe;">ગ્રેડ</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>

          <!-- Patrak A and B mini summaries -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
            <div style="background: #eef2ff; border: 1.5px solid #c7d2fe; border-radius: 8px; padding: 10px; font-size: 11px;">
              <div style="font-weight: 900; color: #1e1b4b; display: flex; justify-content: space-between; border-bottom: 1px solid #c7d2fe; padding-bottom: 4px;">
                <span>પત્રક A (૪૦ ગુણ મૂલ્યાંકન):</span>
                <span>ગ્રેડ: <strong>${patrakASum.grade}</strong></span>
              </div>
              <div style="margin-top: 6px; font-weight: 800; color: #312e81;">
                કુલ મેળવેલા: ${patrakASum.totalObtained} / ${patrakASum.totalMax} (${patrakASum.percentage}%)
              </div>
            </div>

            <div style="background: #ecfdf5; border: 1.5px solid #a7f3d0; border-radius: 8px; padding: 10px; font-size: 11px;">
              <div style="font-weight: 900; color: #064e3b; display: flex; justify-content: space-between; border-bottom: 1px solid #a7f3d0; padding-bottom: 4px;">
                <span>પત્રક B (વ્યક્તિત્વ વિકાસ):</span>
                <span>ગ્રેડ: <strong>${patrakBSum.grade}</strong></span>
              </div>
              <div style="margin-top: 6px; font-weight: 800; color: #065f46;">
                કુલ ગુણ: ${patrakBSum.totalObtained} / ${patrakBSum.totalMax} (${patrakBSum.percentage}%)
              </div>
            </div>
          </div>

          <!-- Final Overall Result Summary Box -->
          <div style="background: #f8fafc; border: 2px solid #6366f1; border-radius: 12px; padding: 12px 18px; margin-bottom: 24px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; text-align: center;">
            <div>
              <span style="font-size: 11px; color: #64748b; font-weight: bold;">કુલ મેળવેલા ગુણ</span>
              <div style="font-size: 18px; font-weight: 900; color: #0f172a;">${finalResult.totalObtained} / ${finalResult.totalMax}</div>
            </div>
            <div>
              <span style="font-size: 11px; color: #64748b; font-weight: bold;">વાર્ષિક ટકાવારી</span>
              <div style="font-size: 20px; font-weight: 900; color: #4338ca;">${finalResult.percentage}%</div>
            </div>
            <div>
              <span style="font-size: 11px; color: #64748b; font-weight: bold;">સમગ્ર ગ્રેડ</span>
              <div style="font-size: 20px; font-weight: 900; color: #7c3aed;">${finalResult.grade}</div>
            </div>
            <div>
              <span style="font-size: 11px; color: #64748b; font-weight: bold;">અંતિમ સ્થિતિ</span>
              <div style="font-size: 18px; font-weight: 900; color: ${finalResult.status === 'પાસ' ? '#059669' : '#dc2626'};">${finalResult.status}</div>
            </div>
          </div>

          <!-- Signatures Footer -->
          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 30px; padding-top: 10px;">
            <div style="text-align: center; width: 180px;">
              <div style="border-top: 1.5px solid #64748b; margin-bottom: 4px;"></div>
              <span style="font-size: 12px; font-weight: 800;">વર્ગશિક્ષકની સહી</span>
            </div>
            <div style="text-align: center; width: 180px;">
              <div style="border-top: 1.5px solid #64748b; margin-bottom: 4px;"></div>
              <span style="font-size: 12px; font-weight: 800;">વાલીની સહી</span>
            </div>
            <div style="text-align: center; width: 180px;">
              <div style="border-top: 1.5px solid #64748b; margin-bottom: 4px;"></div>
              <span style="font-size: 12px; font-weight: 800;">આચાર્યશ્રીની સહી & સિક્કો</span>
              <div style="font-size: 10px; color: #64748b;">${settings.principalName}</div>
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  return cardsHtml;
};

/**
 * Generate Printable HTML for Class Ledger Sheet
 */
export const buildClassLedgerPrintHtml = (
  appData: AppData,
  standard: Standard,
  division: string
): string => {
  const { students, subjects, marks, settings } = appData;
  const classStudents = students
    .filter((s) => s.standard === standard)
    .filter((s) => (division === 'all' ? true : s.division === division))
    .sort((a, b) => a.rollNumber - b.rollNumber);

  const classSubjects = subjects.filter((s) => s.standards.includes(standard));

  const results = classStudents.map((st) =>
    calculateFinalStudentResult(st, subjects, marks, settings)
  );
  const ranked = computeClassMeritList(results);

  const rows = ranked
    .map((r, idx) => {
      const subCols = classSubjects
        .map((sub) => {
          const sw = r.subjectWise.find((x) => x.subjectId === sub.id);
          return `<td style="padding: 5px; text-align: center; border-right: 1px solid #cbd5e1; font-weight: 800;">${sw ? sw.totalObtained : '-'}</td>`;
        })
        .join('');

      return `
        <tr style="border-bottom: 1px solid #cbd5e1; ${idx % 2 === 1 ? 'background: #f8fafc;' : ''}">
          <td style="padding: 5px 8px; text-align: center; border-right: 1px solid #cbd5e1; font-weight: 800;">${r.rank ?? idx + 1}</td>
          <td style="padding: 5px 8px; text-align: center; border-right: 1px solid #cbd5e1; font-weight: 800;">${r.student.rollNumber}</td>
          <td style="padding: 5px 8px; border-right: 1px solid #cbd5e1; font-weight: 800;">${r.student.grNumber}</td>
          <td style="padding: 5px 8px; border-right: 1px solid #cbd5e1; font-weight: 800; white-space: nowrap;">${r.student.name}</td>
          ${subCols}
          <td style="padding: 5px; text-align: center; border-right: 1px solid #cbd5e1; font-weight: 900; background: #e0e7ff;">${r.totalObtained} / ${r.totalMax}</td>
          <td style="padding: 5px; text-align: center; border-right: 1px solid #cbd5e1; font-weight: 900; color: #4338ca;">${r.percentage}%</td>
          <td style="padding: 5px; text-align: center; border-right: 1px solid #cbd5e1; font-weight: 900; background: #ede9fe;">${r.grade}</td>
          <td style="padding: 5px; text-align: center; font-weight: 900; color: ${r.status === 'પાસ' ? '#059669' : '#dc2626'};">${r.status}</td>
        </tr>
      `;
    })
    .join('');

  const subHeaders = classSubjects
    .map(
      (s) =>
        `<th style="padding: 6px; text-align: center; border-right: 1px solid #cbd5e1; font-size: 11px;">${s.name.split(' ')[0]}</th>`
    )
    .join('');

  return `
    <div style="background: white; padding: 15px; border: 2px solid #0f172a; border-radius: 12px;">
      <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 12px;">
        <h2 style="font-size: 22px; font-weight: 900; color: #1e1b4b;">${settings.schoolName}</h2>
        <div style="font-size: 13px; font-weight: bold; color: #334155;">
          વાર્ષિક સર્વગ્રાહી પરિણામ પત્રક (માસ્ટર લેજર) • ધોરણ ${standard} ${division !== 'all' ? `(વર્ગ ${division})` : ''} • શૈક્ષણિક વર્ષ: ${settings.academicYear}
        </div>
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 11px; border: 1.5px solid #cbd5e1;">
        <thead>
          <tr style="background: #e2e8f0; font-weight: 900; border-bottom: 2px solid #cbd5e1;">
            <th style="padding: 6px; text-align: center; border-right: 1px solid #cbd5e1; width: 45px;">મેરિટ</th>
            <th style="padding: 6px; text-align: center; border-right: 1px solid #cbd5e1; width: 45px;">રોલ</th>
            <th style="padding: 6px; text-align: left; border-right: 1px solid #cbd5e1; width: 70px;">GR નં</th>
            <th style="padding: 6px; text-align: left; border-right: 1px solid #cbd5e1;">વિદ્યાર્થીનું નામ</th>
            ${subHeaders}
            <th style="padding: 6px; text-align: center; border-right: 1px solid #cbd5e1; background: #c7d2fe;">કુલ ગુણ</th>
            <th style="padding: 6px; text-align: center; border-right: 1px solid #cbd5e1; background: #e0e7ff;">ટકા (%)</th>
            <th style="padding: 6px; text-align: center; border-right: 1px solid #cbd5e1; background: #ddd6fe;">ગ્રેડ</th>
            <th style="padding: 6px; text-align: center; background: #a7f3d0;">પરિણામ</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      <div style="display: flex; justify-content: space-between; margin-top: 35px; padding: 0 20px;">
        <div style="text-align: center; width: 180px; border-top: 1.5px solid #334155; font-weight: 800; font-size: 12px; padding-top: 4px;">વર્ગશિક્ષકની સહી</div>
        <div style="text-align: center; width: 180px; border-top: 1.5px solid #334155; font-weight: 800; font-size: 12px; padding-top: 4px;">તપાસનારની સહી</div>
        <div style="text-align: center; width: 180px; border-top: 1.5px solid #334155; font-weight: 800; font-size: 12px; padding-top: 4px;">આચાર્યશ્રીની સહી & સિક્કો</div>
      </div>
    </div>
  `;
};

/**
 * Generate Printable HTML for Patrak A (40 boxes official sheet)
 */
export const buildPatrakAPrintHtml = (
  appData: AppData,
  standard: Standard,
  subjectId: string,
  division = 'all'
): string => {
  const { students, subjects, patrakA, settings } = appData;
  const classStudents = students
    .filter((s) => s.standard === standard)
    .filter((s) => (division === 'all' ? true : s.division === division))
    .sort((a, b) => a.rollNumber - b.rollNumber);

  const subject = subjects.find((s) => s.id === subjectId) || subjects[0];

  // 20 header columns (દરેક ખાનાના ૨ ગુણ, કુલ ૪૦ ગુણ)
  const boxHeaders = Array.from({ length: 20 }, (_, i) => `<th style="padding: 4px 1px; width: 22px; text-align: center; font-size: 10px; border-right: 1px solid #cbd5e1; background: #e0e7ff; color: #1e1b4b;">${i + 1}</th>`).join('');

  const rows = classStudents
    .map((st, idx) => {
      const entry = patrakA[st.id]?.[subject.id];
      const isAbsent = !!entry?.isAbsent;
      const rawMarks = entry?.marks;
      
      let outcomes: ('✓' | '?' | '')[] = [];
      if (entry?.outcomes && entry.outcomes.length === 20) {
        outcomes = entry.outcomes.map((v: any) => {
          if (v === '✓' || v === true || v === 'check') return '✓';
          if (v === '?' || v === 'question') return '?';
          return '';
        });
      } else if (entry?.outcomes && entry.outcomes.length === 40) {
        const checkedCount = entry.outcomes.filter((v: any) => v === true || v === '✓').length;
        const count20 = Math.min(20, Math.round(checkedCount / 2));
        outcomes = Array.from({ length: 20 }, (_, i) => (i < count20 ? '✓' : '?'));
      } else {
        const count20 = Math.min(20, Math.round((rawMarks || 0) / 2));
        outcomes = Array.from({ length: 20 }, (_, i) => (i < count20 ? '✓' : ''));
      }

      const checkCount = outcomes.filter((s) => s === '✓').length;
      const questionCount = outcomes.filter((s) => s === '?').length;
      const calculatedMarks = isAbsent
        ? undefined
        : rawMarks !== undefined
        ? rawMarks
        : checkCount * 2;
      const pct = calculatedMarks !== undefined ? Number(((calculatedMarks / 40) * 100).toFixed(1)) : 0;
      const grade = isAbsent
        ? 'AB'
        : calculatedMarks !== undefined
        ? calculatedMarks >= 36
          ? 'A1'
          : calculatedMarks >= 32
          ? 'A2'
          : calculatedMarks >= 28
          ? 'B1'
          : calculatedMarks >= 24
          ? 'B2'
          : calculatedMarks >= 20
          ? 'C1'
          : calculatedMarks >= 16
          ? 'C2'
          : 'D'
        : '-';

      const boxCells = outcomes
        .map((sign) => {
          if (sign === '✓') {
            return `<td style="padding: 3px 1px; text-align: center; border-right: 1px solid #cbd5e1; font-size: 11px; font-weight: 900; background: #d1fae5; color: #047857;">✓</td>`;
          }
          if (sign === '?') {
            return `<td style="padding: 3px 1px; text-align: center; border-right: 1px solid #cbd5e1; font-size: 11px; font-weight: 900; background: #fef3c7; color: #b45309;">?</td>`;
          }
          return `<td style="padding: 3px 1px; text-align: center; border-right: 1px solid #cbd5e1; font-size: 11px; color: #94a3b8; background: #ffffff;"></td>`;
        })
        .join('');

      return `
        <tr style="border-bottom: 1px solid #cbd5e1; ${idx % 2 === 1 ? 'background: #f8fafc;' : ''}">
          <td style="padding: 4px; text-align: center; border-right: 1px solid #cbd5e1; font-weight: 800;">${st.rollNumber}</td>
          <td style="padding: 4px; border-right: 1px solid #cbd5e1; font-weight: 800;">${st.grNumber}</td>
          <td style="padding: 4px 8px; border-right: 1px solid #cbd5e1; font-weight: 800; white-space: nowrap;">${st.name}</td>
          ${boxCells}
          <td style="padding: 4px; text-align: center; border-right: 1px solid #cbd5e1; font-weight: 900; background: #c7d2fe; font-size: 11px;">
            ${isAbsent ? '<span style="color:#dc2626;">ગેરહાજર</span>' : `<strong>${calculatedMarks}</strong> / ૪૦<div style="font-size: 9px; font-weight: normal; color: #374151;">(${checkCount}✓ • ${questionCount}?)</div>`}
          </td>
          <td style="padding: 4px; text-align: center; border-right: 1px solid #cbd5e1; font-weight: 900; background: #e0e7ff; color: #3730a3; font-size: 11px;">${isAbsent ? '-' : `${pct}%`}</td>
          <td style="padding: 4px; text-align: center; font-weight: 900; background: #ddd6fe; font-size: 11px;">${grade}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <div style="background: white; padding: 15px; border: 2px solid #0f172a; border-radius: 12px;">
      <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 12px;">
        <h2 style="font-size: 20px; font-weight: 900; color: #1e1b4b;">${settings.schoolName}</h2>
        <div style="font-size: 13px; font-weight: bold; color: #334155;">
          પત્રક A : રચનાત્મક મૂલ્યાંકન પત્રક (૨૦ અધ્યયન નિષ્પત્તિ/ખાના • કુલ ૪૦ ગુણ) • વિષય: ${subject.name} • ધોરણ ${standard} ${division !== 'all' ? `(વર્ગ ${division})` : ''} • શૈક્ષણિક વર્ષ: ${settings.academicYear}
        </div>
        <div style="font-size: 11px; font-weight: 800; color: #047857; margin-top: 4px; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 4px 8px; border-radius: 6px; display: inline-block;">
          સંકેત: [✓] ખરું (True) = ૨ ગુણ  |  [?] પ્રશ્નાર્થ (Question) = ૦ ગુણ  |  કુલ ૨૦ ખાના = ૪૦ ગુણ (સ્વચાલિત સરવાળો)
        </div>
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 10px; border: 1.5px solid #cbd5e1;">
        <thead>
          <tr style="background: #e2e8f0; font-weight: 900; border-bottom: 2px solid #cbd5e1;">
            <th style="padding: 4px; text-align: center; border-right: 1px solid #cbd5e1; width: 35px;">રોલ</th>
            <th style="padding: 4px; text-align: left; border-right: 1px solid #cbd5e1; width: 60px;">GR નં</th>
            <th style="padding: 4px 8px; text-align: left; border-right: 1px solid #cbd5e1; width: 140px;">વિદ્યાર્થીનું નામ</th>
            ${boxHeaders}
            <th style="padding: 4px; text-align: center; border-right: 1px solid #cbd5e1; background: #c7d2fe; width: 70px;">કુલ (૪૦)</th>
            <th style="padding: 4px; text-align: center; border-right: 1px solid #cbd5e1; background: #e0e7ff; width: 50px;">ટકા (%)</th>
            <th style="padding: 4px; text-align: center; background: #ddd6fe; width: 45px;">ગ્રેડ</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      <div style="display: flex; justify-content: space-between; margin-top: 30px; padding: 0 20px;">
        <div style="text-align: center; width: 180px; border-top: 1.5px solid #334155; font-weight: 800; font-size: 12px; padding-top: 4px;">વિષય શિક્ષકની સહી</div>
        <div style="text-align: center; width: 180px; border-top: 1.5px solid #334155; font-weight: 800; font-size: 12px; padding-top: 4px;">આચાર્યશ્રીની સહી & સિક્કો</div>
      </div>
    </div>
  `;
};

/**
 * Generate Printable HTML for Patrak B (Co-curricular & Personality Assessment 400 marks)
 */
export const buildPatrakBPrintHtml = (
  appData: AppData,
  standard: Standard,
  division = 'all'
): string => {
  const { students, settings, patrakB } = appData;
  const components = settings.patrakBComponents || [];
  const classStudents = students
    .filter((s) => s.standard === standard)
    .filter((s) => (division === 'all' ? true : s.division === division))
    .sort((a, b) => a.rollNumber - b.rollNumber);

  // Headers for 8 components (દરેકના ૫૦ ગુણ = ૪૦૦ ગુણ)
  const compHeaders = components
    .map(
      (c, idx) =>
        `<th style="padding: 6px 3px; font-size: 10px; text-align: center; border-right: 1px solid #cbd5e1; background: #e0f2fe; color: #0369a1; min-width: 60px;">
          <div>${idx + 1}. ${c.name}</div>
          <span style="font-size: 9px; font-weight: bold; color: #0284c7;">(${c.maxMarks})</span>
        </th>`
    )
    .join('');

  let totalStudentsEvaluated = 0;
  let totalMarksAllStudents = 0;

  const rows = classStudents
    .map((st, idx) => {
      const summary = calculatePatrakBSummary(st.id, components, patrakB, settings.gradeBoundaries);
      if (summary.totalObtained > 0) {
        totalStudentsEvaluated++;
        totalMarksAllStudents += summary.totalObtained;
      }

      const compCells = components
        .map((c) => {
          const item = patrakB[st.id]?.[c.id];
          const m = item?.marks !== undefined && item?.marks !== null ? item.marks : '-';
          return `<td style="padding: 5px 3px; text-align: center; border-right: 1px solid #cbd5e1; font-weight: 800; font-size: 11px;">${m}</td>`;
        })
        .join('');

      return `
        <tr style="border-bottom: 1px solid #cbd5e1; ${idx % 2 === 1 ? 'background: #f8fafc;' : ''}">
          <td style="padding: 5px; text-align: center; border-right: 1px solid #cbd5e1; font-weight: 800;">${st.rollNumber}</td>
          <td style="padding: 5px; border-right: 1px solid #cbd5e1; font-weight: 800;">${st.grNumber}</td>
          <td style="padding: 5px 8px; border-right: 1px solid #cbd5e1; font-weight: 800; white-space: nowrap;">${st.name}</td>
          ${compCells}
          <td style="padding: 5px; text-align: center; border-right: 1px solid #cbd5e1; font-weight: 900; background: #dcfce7; color: #166534; font-size: 12px;">${summary.totalObtained} / ૪૦૦</td>
          <td style="padding: 5px; text-align: center; border-right: 1px solid #cbd5e1; font-weight: 900; background: #e0f2fe; color: #075985;">${summary.percentage}%</td>
          <td style="padding: 5px; text-align: center; font-weight: 900; background: #fef3c7; color: #92400e;">${summary.grade}</td>
        </tr>
      `;
    })
    .join('');

  const classAvgPct = totalStudentsEvaluated > 0
    ? (totalMarksAllStudents / (totalStudentsEvaluated * 400) * 100).toFixed(1)
    : '0';

  return `
    <div style="background: white; padding: 15px; border: 2px solid #0f172a; border-radius: 12px;">
      <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 12px;">
        <h2 style="font-size: 20px; font-weight: 900; color: #1e1b4b;">${settings.schoolName}</h2>
        <div style="font-size: 13px; font-weight: bold; color: #334155;">
          પત્રક B : વ્યક્તિત્વ વિકાસ & સહઅભ્યાસિક પ્રવૃત્તિઓનું મૂલ્યાંકન પત્રક (કુલ ૪૦૦ ગુણ) • ધોરણ ${standard} ${division !== 'all' ? `(વર્ગ ${division})` : ''} • શૈક્ષણિક વર્ષ: ${settings.academicYear}
        </div>
        <div style="font-size: 11px; font-weight: 800; color: #047857; margin-top: 4px; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 4px 8px; border-radius: 6px; display: inline-block;">
          સર્વાંગી મૂલ્યાંકન: ૮ ઘટકો × ૫૦ ગુણ = કુલ ૪૦૦ ગુણ • ગ્રેડિંગ માળખું: A1 (૯૧-૧૦૦%), A2 (૮૧-૯૦%), B1 (૭૧-૮૦%), B2 (૬૧-૭૦%), C1 (૫૧-૬૦%), C2 (૪૧-૫૦%), D (૩૩-૪૦%)
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 10px; border: 1.5px solid #cbd5e1;">
        <thead>
          <tr style="background: #e2e8f0; font-weight: 900; border-bottom: 2px solid #cbd5e1;">
            <th style="padding: 6px; text-align: center; border-right: 1px solid #cbd5e1; width: 35px;">રોલ</th>
            <th style="padding: 6px; text-align: left; border-right: 1px solid #cbd5e1; width: 60px;">GR નં</th>
            <th style="padding: 6px 8px; text-align: left; border-right: 1px solid #cbd5e1; width: 140px;">વિદ્યાર્થીનું નામ</th>
            ${compHeaders}
            <th style="padding: 6px; text-align: center; border-right: 1px solid #cbd5e1; background: #bbf7d0; width: 75px; color: #14532d;">કુલ (૪૦૦)</th>
            <th style="padding: 6px; text-align: center; border-right: 1px solid #cbd5e1; background: #bae6fd; width: 55px; color: #0c4a6e;">ટકા (%)</th>
            <th style="padding: 6px; text-align: center; background: #fde68a; width: 45px; color: #78350f;">ગ્રેડ</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <!-- Statistics summary bar -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px; padding: 8px 12px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 11px; font-weight: bold; color: #334155;">
        <div>કુલ વિદ્યાર્થીઓ: <strong>${classStudents.length}</strong></div>
        <div>મૂલ્યાંકિત સંખ્યા: <strong>${totalStudentsEvaluated}</strong></div>
        <div>વર્ગની સરેરાશ ટકાવારી: <strong>${classAvgPct}%</strong></div>
      </div>

      <div style="display: flex; justify-content: space-between; margin-top: 30px; padding: 0 20px;">
        <div style="text-align: center; width: 180px; border-top: 1.5px solid #334155; font-weight: 800; font-size: 12px; padding-top: 4px;">વર્ગશિક્ષકની સહી</div>
        <div style="text-align: center; width: 180px; border-top: 1.5px solid #334155; font-weight: 800; font-size: 12px; padding-top: 4px;">તપાસનારની સહી</div>
        <div style="text-align: center; width: 180px; border-top: 1.5px solid #334155; font-weight: 800; font-size: 12px; padding-top: 4px;">આચાર્યશ્રીની સહી & સિક્કો</div>
      </div>
    </div>
  `;
};
