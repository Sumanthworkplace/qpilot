import { NextRequest, NextResponse } from 'next/server';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import imageSize from 'image-size';
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

// jsPDF's built-in fonts (Helvetica/Times/Courier) use WinAnsi encoding, which
// doesn't include arrow characters or a few other common symbols. Without this,
// they render as garbled artifacts (e.g. "!'") instead of failing loudly.
const UNSUPPORTED_CHAR_MAP: Record<string, string> = {
  '\u2192': '->',
  '\u2190': '<-',
  '\u2194': '<->',
  '\u21d2': '=>',
  '\u21d0': '<=',
  '\u2191': '(up)',
  '\u2193': '(down)',
};

function sanitizeForPdf(text: string): string {
  let result = text;
  for (const [char, replacement] of Object.entries(UNSUPPORTED_CHAR_MAP)) {
    result = result.split(char).join(replacement);
  }
  return result;
}

function formatDuration(totalHours: number): string {
  const hours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - hours) * 60);
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} hr`);
  if (minutes > 0) parts.push(`${minutes} min`);
  return parts.length > 0 ? parts.join(' ') : '0 min';
}

function parseDataUrl(dataUrl?: string): { format: string; buffer: Buffer } | null {
  if (!dataUrl) return null;
  const match = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!match) return null;
  return { format: match[1].toUpperCase(), buffer: Buffer.from(match[2], 'base64') };
}

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
  let content = sanitizeForPdf(q.text ?? '');

  if (q.type === 'MCQ' && q.options && Array.isArray(q.options)) {
    content +=
      '\n' +
      (q.options as string[])
        .map((o, i) => `${String.fromCharCode(97 + i)}) ${sanitizeForPdf(o)}`)
        .join('\n');
  } else if (q.type === 'TRUE_FALSE') {
    content += '\n(True / False)';
  } else if (q.type === 'MATCH_THE_FOLLOWING' && q.options && !Array.isArray(q.options)) {
    const pairs = q.options as { left: string[]; right: string[] };
    const rows = pairs.left.map(
      (l, i) => `${i + 1}. ${sanitizeForPdf(l)}    \u2014    ${sanitizeForPdf(pairs.right[i] ?? '')}`
    );
    content += '\n' + rows.join('\n');
  }

  return content;
}

// Counts the actual visual lines a piece of text will occupy once word-wrapped
// to the given column width - not just literal '\n'-separated segments. Using
// the naive segment count previously caused images to overlap text whenever a
// question wrapped onto more lines than it had explicit newlines for.
function countWrappedLines(doc: jsPDF, content: string, maxWidthMm: number): number {
  const segments = content.split('\n');
  let total = 0;
  segments.forEach((segment) => {
    if (segment === '') {
      total += 1;
      return;
    }
    const wrapped = doc.splitTextToSize(segment, maxWidthMm);
    total += wrapped.length;
  });
  return total;
}

interface RowImage {
  buffer: Buffer;
  format: string;
  widthMm: number;
  heightMm: number;
  textLineCount: number;
}

function computeImageSizeMm(
  parsed: { buffer: Buffer; format: string },
  maxWidthMm: number,
  maxHeightMm: number
): { widthMm: number; heightMm: number } | null {
  let dims;
  try {
    dims = imageSize(parsed.buffer);
  } catch {
    return null;
  }
  if (!dims.width || !dims.height) return null;

  const TARGET_DPI = 200; // sits comfortably within the 150-300 DPI print-legibility range
  const ratio = dims.height / dims.width;

  let widthMm = (dims.width / TARGET_DPI) * 25.4;
  widthMm = Math.min(widthMm, maxWidthMm);
  let heightMm = widthMm * ratio;

  if (heightMm > maxHeightMm) {
    heightMm = maxHeightMm;
    widthMm = heightMm / ratio;
  }

  return { widthMm, heightMm };
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
  const school = paper.school;
  let y = 18;

  if (school) {
    const logo = parseDataUrl(school.logoUrl ?? undefined);
    let textX = pageWidth / 2;
    let align: 'center' | 'left' = 'center';

    if (logo) {
      try {
        const dims = imageSize(logo.buffer);
        const logoSize = 16;
        const ratio = dims.height && dims.width ? dims.height / dims.width : 1;
        doc.addImage(school.logoUrl!, logo.format, 20, 10, logoSize, logoSize * ratio);
        textX = pageWidth / 2 + 10;
      } catch {
        // If the logo fails to decode, just fall back to text-only header.
      }
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(school.name.toUpperCase(), textX, 16, { align });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text((paper.subject ?? '').toUpperCase(), textX, 24, { align });

    y = 32;
  } else {
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text((paper.subject ?? 'QUESTION PAPER').toUpperCase(), pageWidth / 2, 20, { align: 'center' });
    y = 28;
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Marks: ${paper.totalMarks}`, 20, y);
  doc.text(`Duration: ${formatDuration(paper.totalHours)}`, pageWidth - 20, y, {
    align: 'right',
  });

  if (paper.className || paper.section) {
    y += 7;
    const classLine = [
      paper.className ? `Class: ${paper.className}` : '',
      paper.section ? `Section: ${paper.section}` : '',
    ]
      .filter(Boolean)
      .join('    ');
    doc.text(classLine, 20, y);
  }

  y += 4;
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.line(20, y, pageWidth - 20, y);

  return y + 10;
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
  const rowImages: Record<number, RowImage> = {};

  const FONT_SIZE = 9;
  const LINE_HEIGHT_MM = ((FONT_SIZE * 1.15) / 72) * 25.4;
  const CELL_PADDING_MM = 3;
  const IMAGE_MAX_WIDTH_MM = 70;
  const IMAGE_MAX_HEIGHT_MM = 90;

  const SECTION_COL_MM = 22;
  const NUM_COL_MM = 10;
  const MARKS_COL_MM = 16;
  const TABLE_MARGIN_MM = 40; // left + right
  const QUESTION_COL_WIDTH_MM =
    pageWidth - TABLE_MARGIN_MM - SECTION_COL_MM - NUM_COL_MM - MARKS_COL_MM - CELL_PADDING_MM * 2;

  doc.setFontSize(FONT_SIZE);

  // Justify reads badly on structured multi-line content like lettered MCQ
  // options or True/False - each short line gets stretched individually. Only
  // plain flowing paragraph text (descriptive/short-answer/etc.) should justify.
  const STRUCTURED_TYPES: QuestionType[] = ['MCQ', 'TRUE_FALSE', 'MATCH_THE_FOLLOWING'];
  const rowsNeedingLeftAlign = new Set<number>();

  groups.forEach((group, gIdx) => {
    const letter = gIdx < SECTION_LETTERS.length ? SECTION_LETTERS[gIdx] : gIdx + 1;
    const groupHasImage = group.some((q) => parseDataUrl(q.imageUrl));

    group.forEach((q, i) => {
      // Sections with images skip rowSpan merging: a merged cell forces the whole
      // group to relocate together if it doesn't fit the remaining page space,
      // which can shove every question in the section onto a new page even when
      // only one row was actually too tall. Repeating the label avoids that.
      const row: (string | number | { content: string; rowSpan: number })[] = groupHasImage
        ? [`SECTION ${letter}`]
        : i === 0
        ? [{ content: `SECTION ${letter}`, rowSpan: group.length }]
        : [];

      let content = questionContent(q);
      const parsed = parseDataUrl(q.imageUrl);
      const rowIndex = body.length;

      if (STRUCTURED_TYPES.includes(q.type)) {
        rowsNeedingLeftAlign.add(rowIndex);
      }

      if (parsed) {
        const size = computeImageSizeMm(parsed, IMAGE_MAX_WIDTH_MM, IMAGE_MAX_HEIGHT_MM);
        if (size) {
          // Use actual wrapped-line count (accounts for word-wrap), not just
          // literal newline count - otherwise long questions get their image
          // overlapping still-wrapping text.
          const textLineCount = countWrappedLines(doc, content, QUESTION_COL_WIDTH_MM);
          rowImages[rowIndex] = { buffer: parsed.buffer, format: parsed.format, textLineCount, ...size };
          // Pad the cell with blank lines so autoTable computes a tall enough row
          // to fit the image beneath the text, then draw it in didDrawCell below.
          const blankLines = Math.ceil(size.heightMm / LINE_HEIGHT_MM) + 1;
          content += '\n'.repeat(blankLines);
        }
      }

      row.push(`${qNum}.`, content, q.marks);
      body.push(row);
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
    styles: { fontSize: FONT_SIZE, cellPadding: CELL_PADDING_MM, valign: 'top', lineColor: [0, 0, 0], lineWidth: 0.2 },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: SECTION_COL_MM, fontStyle: 'bold', valign: 'middle', halign: 'center' },
      1: { cellWidth: NUM_COL_MM },
      2: { halign: 'justify' },
      3: { cellWidth: MARKS_COL_MM, halign: 'center' },
    },
    margin: { left: 20, right: 20 },
    rowPageBreak: 'avoid',
    didParseCell: (data: any) => {
      // Justify breaks on blank lines (used to reserve vertical space for images)
      // because there are no words to stretch, producing malformed PDF text
      // operators. It also looks wrong on structured content like lettered MCQ
      // options, where each short line gets stretched individually. Force
      // left-alignment for both cases.
      if (
        data.section === 'body' &&
        data.column.index === 2 &&
        (rowImages[data.row.index] || rowsNeedingLeftAlign.has(data.row.index))
      ) {
        data.cell.styles.halign = 'left';
      }
    },
    didDrawCell: (data: any) => {
      if (data.section !== 'body' || data.column.index !== 2) return;
      const img = rowImages[data.row.index];
      if (!img) return;

      const textHeightMm = Math.max(img.textLineCount, 1) * LINE_HEIGHT_MM;
      const imgX = data.cell.x + CELL_PADDING_MM;
      const imgY = data.cell.y + CELL_PADDING_MM + textHeightMm + 2;

      try {
        doc.addImage(img.buffer, img.format, imgX, imgY, img.widthMm, img.heightMm);
      } catch {
        // If the image fails to draw, the padded blank space is left empty rather than crashing generation.
      }
    },
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

      const row: (string | number | { content: string; rowSpan: number })[] =
        i === 0 ? [{ content: `SECTION ${letter}`, rowSpan: group.length }] : [];
      row.push(`${qNum}.`, sanitizeForPdf(q.text ?? ''), sanitizeForPdf(answerText));
      body.push(row);
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
      2: { halign: 'justify' },
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
