import { NextRequest, NextResponse } from 'next/server';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  VerticalAlign,
  ShadingType,
} from 'docx';
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

  const matched = new Set(groups.flat());
  const unmatched = questions.filter((q) => !matched.has(q));
  if (unmatched.length > 0) {
    groups.push(unmatched);
  }

  return groups;
}

const cellBorder = {
  top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
  left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
  right: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
};

function headerCell(text: string, width: number): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: cellBorder,
    shading: { type: ShadingType.CLEAR, fill: 'F0F0F0' },
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text, bold: true })],
      }),
    ],
  });
}

function questionParagraphs(q: Question): Paragraph[] {
  const paras = [new Paragraph({ children: [new TextRun({ text: q.text ?? '' })] })];

  if (q.type === 'MCQ' && q.options && Array.isArray(q.options)) {
    (q.options as string[]).forEach((opt, i) => {
      paras.push(
        new Paragraph({
          indent: { left: 300 },
          children: [new TextRun({ text: `${String.fromCharCode(97 + i)}) ${opt}` })],
        })
      );
    });
  } else if (q.type === 'TRUE_FALSE') {
    paras.push(new Paragraph({ children: [new TextRun({ text: '(True / False)', italics: true })] }));
  } else if (q.type === 'MATCH_THE_FOLLOWING' && q.options && !Array.isArray(q.options)) {
    const pairs = q.options as { left: string[]; right: string[] };
    pairs.left.forEach((l, i) => {
      paras.push(
        new Paragraph({
          indent: { left: 300 },
          children: [new TextRun({ text: `${i + 1}. ${l}    \u2014    ${pairs.right[i] ?? ''}` })],
        })
      );
    });
  } else if (q.type === 'IMAGE_BASED') {
    paras.push(new Paragraph({ children: [new TextRun({ text: '[See attached image]', italics: true })] }));
  }

  return paras;
}

function buildQuestionTable(groups: Question[][], marksHeader: string, isAnswerKey: boolean): Table {
  const rows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [
        headerCell('Section', 1200),
        headerCell('#', 500),
        headerCell('Question', 6500),
        headerCell(marksHeader, 1200),
      ],
    }),
  ];

  let qNum = 1;
  groups.forEach((group, gIdx) => {
    const letter = gIdx < SECTION_LETTERS.length ? SECTION_LETTERS[gIdx] : gIdx + 1;
    group.forEach((q, i) => {
      const cells: TableCell[] = [];

      if (i === 0) {
        cells.push(
          new TableCell({
            width: { size: 1200, type: WidthType.DXA },
            borders: cellBorder,
            verticalAlign: VerticalAlign.CENTER,
            rowSpan: group.length,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: `SECTION ${letter}`, bold: true })],
              }),
            ],
          })
        );
      }

      cells.push(
        new TableCell({
          width: { size: 500, type: WidthType.DXA },
          borders: cellBorder,
          children: [new Paragraph({ children: [new TextRun({ text: `${qNum}.` })] })],
        })
      );

      let lastCellContent: Paragraph[];
      if (isAnswerKey) {
        let answerText: string;
        if (q.type === 'MCQ' && q.answer) {
          const idx = (q.options as string[])?.indexOf(q.answer as string) ?? -1;
          answerText = idx >= 0 ? `${String.fromCharCode(97 + idx)}) ${q.answer}` : String(q.answer);
        } else if (q.type === 'MATCH_THE_FOLLOWING' && Array.isArray(q.answer)) {
          answerText = (q.answer as { left: string; right: string }[])
            .map((m, i2) => `${i2 + 1}. ${m.left} -> ${m.right}`)
            .join('; ');
        } else if (Array.isArray(q.answer)) {
          answerText = q.answer.join(', ');
        } else {
          answerText = String(q.answer ?? '');
        }
        cells.push(
          new TableCell({
            width: { size: 6500, type: WidthType.DXA },
            borders: cellBorder,
            children: [new Paragraph({ children: [new TextRun({ text: q.text ?? '' })] })],
          })
        );
        lastCellContent = [new Paragraph({ children: [new TextRun({ text: answerText, color: '166534' })] })];
      } else {
        cells.push(
          new TableCell({
            width: { size: 6500, type: WidthType.DXA },
            borders: cellBorder,
            children: questionParagraphs(q),
          })
        );
        lastCellContent = [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(q.marks) })] })];
      }

      cells.push(
        new TableCell({
          width: { size: 1200, type: WidthType.DXA },
          borders: cellBorder,
          children: lastCellContent,
        })
      );

      rows.push(new TableRow({ children: cells }));
      qNum++;
    });
  });

  return new Table({
    width: { size: 9400, type: WidthType.DXA },
    columnWidths: [1200, 500, 6500, 1200],
    rows,
  });
}

function buildInstructions(paper: Paper, groups: Question[][]): Paragraph[] {
  const sectionSummary = groups
    .map((group, i) => {
      const letter = i < SECTION_LETTERS.length ? SECTION_LETTERS[i] : i + 1;
      const marks = group[0]?.marks ?? 0;
      return `Section-${letter} has ${group.length} question${group.length > 1 ? 's' : ''} of ${marks} mark${marks > 1 ? 's' : ''} each`;
    })
    .join('; ');

  return [
    new Paragraph({ children: [new TextRun({ text: 'General Instructions:', bold: true })] }),
    new Paragraph({
      children: [new TextRun({ text: `(i) All ${paper.questions.length} questions are compulsory.` })],
    }),
    new Paragraph({ children: [new TextRun({ text: `(ii) ${sectionSummary}.` })] }),
    new Paragraph({
      spacing: { after: 200 },
      children: [new TextRun({ text: '(iii) Marks for each question are indicated against it.' })],
    }),
  ];
}

function buildDocument(paper: Paper, isAnswerKey: boolean): Document {
  const groups = groupByType(paper.questions ?? []);

  const headerParagraphs = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: (paper.subject ?? 'QUESTION PAPER').toUpperCase(), bold: true, size: 32 })],
    }),
    new Paragraph({
      spacing: { after: 100 },
      children: [new TextRun({ text: `Total Marks: ${paper.totalMarks}` })],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({ text: `Duration: ${paper.totalHours} hr${paper.totalHours !== 1 ? 's' : ''}` }),
      ],
    }),
  ];

  if (isAnswerKey) {
    return new Document({
      sections: [
        {
          properties: {},
          children: [
            ...headerParagraphs,
            buildQuestionTable(groups, 'Answer', true),
          ],
        },
      ],
    });
  }

  return new Document({
    sections: [
      {
        properties: {},
        children: [
          ...headerParagraphs,
          new Paragraph({
            children: [new TextRun({ text: 'Roll No: ____________' })],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({ text: 'Name: ________________________________' })],
          }),
          ...buildInstructions(paper, groups),
          buildQuestionTable(groups, 'Marks', false),
        ],
      },
    ],
  });
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

    if (type !== 'question_paper' && type !== 'answer_key') {
      return NextResponse.json(
        { error: 'Invalid type. Must be "question_paper" or "answer_key"' },
        { status: 400 }
      );
    }

    const doc = buildDocument(paper, type === 'answer_key');
    const buffer = await Packer.toBuffer(doc);

    const filename = `${type}_${paper.subject}_${new Date().toISOString().split('T')[0]}.docx`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('DOCX Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate DOCX' }, { status: 500 });
  }
}
