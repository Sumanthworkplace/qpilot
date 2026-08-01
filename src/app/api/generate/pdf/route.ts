import { NextRequest, NextResponse } from 'next/server';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Paper, Question, QuestionType } from '@/types';

const SECTION_LETTERS = 'ABCDEFGH';

const TYPE_ORDER: QuestionType[] = [
  'MCQ',
  'FILL_IN_BLANKS',
  'MATCH_THE_FOLLOWING',
  'TRUE_FALSE',
  'SHORT_ANSWER',
  'DESCRIPTIVE',
  'DETAILED',
  'IMAGE_BASED',
];

function groupByType(questions: Question[]) {
  const groups = TYPE_ORDER.map((type) => questions.filter((q) => q.type === type)).filter(
    (group) => group.length > 0
  );

  // Safety net: any question whose type didn't match a known TYPE_ORDER value
  // would otherwise silently vanish from the output. Catch those here instead.
  const matched = new Set(groups.flat());
  const unmatched = questions.filter((q) => !matched.has(q));
  if (unmatched.length > 0) {
    groups.push(unmatched);
  }

  return groups;
}

function questionContent(q: Question): string {
  let content = q.text ?? '';

  if (q.type === 'MCQ' && q.options && Array.isArray(q.options)) {
    content += '\n' + (q.options as string[]).map((o, i) => `${String.fromCharCode(97 + i)}) ${o}`).join('\n');
  } else if (q.type === 'TRUE_FALSE') {
    content += '\n(True / False)';
  } else if (q.type === 'MATCH_THE_FOLLOWING' && q.options && !Array.isArray(q.options)) {
    const pairs = q.options as { left: string[]; right: string[] };
    const rows = pairs.left.map((l, i) => `${i + 1}. ${l}    \u2014    ${pairs.right[i] ?? ''}`);
    content += '\n' + rows.join('\n');
  } else if (q.type === 'IMAGE_BASED') {
    content += '\n[See attached image]';
  }

  return content;
}

function buildInstructions(paper: Paper, groups: Question[][]): string[] {
  const lines = ['General Instructions:', `(i) All ${paper.questions.length} questions are compulsory.`];

  const sectionSummary = groups
    .map((group, i) => {
      const letter = i < SECTION_LETTERS.length ? SECTION_LETTERS[i] : i + 1;
      const marks = group[0]?.marks ?? 0;
      return `Section-${letter} has ${group.length} question${group.length > 1 ? 's' : ''} of ${marks} mark${marks > 1 ? 's' : ''} each`;
    })
    .join('; ');
  lines.push(`(ii) ${sectionSummary}.`);
  lines.push('(iii) Marks for each question are indicated against it.');

  return lines;
}

function buildHeader(doc: jsPDF, paper: Paper, pageWidth: number) {
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text((paper.subject ?? 'QUESTION PAPER').toUpperCase(), pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Marks: ${paper.totalMarks}`, 20, 30);
  doc.text(`Duration: ${paper.totalHours} hr${paper.totalHours !== 1 ? 's' : ''}`, pageWidth - 20, 30, {
    align: 'right',
  });

  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.line(20, 34, pageWidth - 20, 34);

  doc.text('Roll No: ____________', 20, 42);
  doc.text('Name: ________________________________', pageWidth - 20, 42, { align: 'right' });

  return 50;
}

function generateQuestionPaper(paper: Paper): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  let y = buildHeader(doc, paper, pageWidth);

  const groups = groupByType(paper.questions ?? []);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('General Instructions:', 20, y);
  doc.setFont('helvetica', 'normal');
  y += 6;

  const instructionLines = buildInstructions(paper, groups).slice(1);
  instructionLines.forEach((line) => {
    const split = doc.splitTextToSize(line, pageWidth - 40);
    doc.text(split, 20, y);
    y += split.length * 5;
  });
  y += 4;

  let qNum = 1;
  const body: (string | number | { content: string; rowSpan: number })[][] = [];

  groups.forEach((group, gIdx) => {
    const letter = gIdx < SECTION_LETTERS.length ? SECTION_LETTERS[gIdx] : gIdx + 1;
    group.forEach((q, i) => {
      body.push([
        i === 0 ? { content: `SECTION ${letter}`, rowSpan: group.length } : '',
        `${qNum}.`,
        questionContent(q),
        q.marks,
      ]);
      qNum++;
    });
  });

  // Avoid starting the table (or its header) with too little room left on the page —
  // otherwise autoTable can print an orphaned header with no rows beneath it before breaking.
  const MIN_TABLE_START_ROOM = 40;
  if (pageHeight - y < MIN_TABLE_START_ROOM) {
    doc.addPage();
    y = 20;
  }

  // @ts-expect-error jspdf-autotable attaches autoTable to the jsPDF prototype at runtime
  doc.autoTable({
    startY: y,
    head: [['Section', '#', 'Question', 'Marks']],
    body,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3, valign: 'top', lineColor: [0, 0, 0], lineWidth: 0.2 },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 22, fontStyle: 'bold', valign: 'middle', halign: 'center' },
      1: { cellWidth: 10 },
      3: { cellWidth: 16, halign: 'center' },
    },
    margin: { left: 20, right: 20 },
    rowPageBreak: 'avoid',
  });

  // @ts-expect-error jspdf-autotable adds this property to the doc at runtime
  const finalY = doc.lastAutoTable.finalY ?? y;
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  return doc;
}

function generateAnswerKey(paper: Paper): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('ANSWER KEY', pageWidth / 2, 20, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Subject: ${paper.subject}`, 20, 30);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 20, 30, { align: 'right' });
  doc.line(20, 34, pageWidth - 20, 34);

  const groups = groupByType(paper.questions ?? []);
  let qNum = 1;
  const body: (string | number | { content: string; rowSpan: number })[][] = [];

  groups.forEach((group, gIdx) => {
    const letter = gIdx < SECTION_LETTERS.length ? SECTION_LETTERS[gIdx] : gIdx + 1;
    group.forEach((q, i) => {
      let answerText: string;
      if (q.type === 'MCQ' && q.answer) {
        const idx = (q.options as string[])?.indexOf(q.answer as string) ?? -1;
        answerText = idx >= 0 ? `${String.fromCharCode(97 + idx)}) ${q.answer}` : String(q.answer);
      } else if (q.type === 'MATCH_THE_FOLLOWING' && Array.isArray(q.answer)) {
        answerText = (q.answer as { left: string; right: string }[])
          .map((m, i) => `${i + 1}. ${m.left} -> ${m.right}`)
          .join('\n');
      } else if (Array.isArray(q.answer)) {
        answerText = q.answer.join(', ');
      } else {
        answerText = String(q.answer ?? '');
      }

      body.push([
        i === 0 ? { content: `SECTION ${letter}`, rowSpan: group.length } : '',
        `${qNum}.`,
        q.text ?? '',
        answerText,
      ]);
      qNum++;
    });
  });

  // @ts-expect-error jspdf-autotable attaches autoTable to the jsPDF prototype at runtime
  doc.autoTable({
    startY: 40,
    head: [['Section', '#', 'Question', 'Answer']],
    body,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3, valign: 'top', lineColor: [0, 0, 0], lineWidth: 0.2 },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 22, fontStyle: 'bold', valign: 'middle', halign: 'center' },
      1: { cellWidth: 10 },
      3: { cellWidth: 45, textColor: [22, 101, 52] },
    },
    margin: { left: 20, right: 20 },
    rowPageBreak: 'avoid',
  });

  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  return doc;
}

export async function POST(req: NextRequest) {
  try {
    const { paper, type } = await req.json();

    if (!paper || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: paper and type' },
        { status: 400 }
      );
    }

    let doc;
    if (type === 'question_paper') {
      doc = generateQuestionPaper(paper);
    } else if (type === 'answer_key') {
      doc = generateAnswerKey(paper);
    } else {
      return NextResponse.json(
        { error: 'Invalid type. Must be "question_paper" or "answer_key"' },
        { status: 400 }
      );
    }

    const pdfBuffer = doc.output('arraybuffer');
    const filename = `${type}_${paper.subject}_${new Date().toISOString().split('T')[0]}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('PDF Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
