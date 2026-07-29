import { NextRequest, NextResponse } from 'next/server';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from 'docx';
import { Paper, Question } from '@/types';

function buildQuestionParagraphs(paper: Paper): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  paper.questions.forEach((q: Question, index: number) => {
    paragraphs.push(
      new Paragraph({
        spacing: { before: 200, after: 100 },
        children: [
          new TextRun({ text: `${index + 1}. `, bold: true }),
          new TextRun({ text: q.text }),
          new TextRun({ text: `  (${q.marks} marks)`, italics: true }),
        ],
      })
    );

    if (q.options && Array.isArray(q.options) && q.options.length > 0) {
      q.options.forEach((opt: string, idx: number) => {
        paragraphs.push(
          new Paragraph({
            indent: { left: 400 },
            children: [new TextRun({ text: `${String.fromCharCode(65 + idx)}. ${opt}` })],
          })
        );
      });
    }
  });

  return paragraphs;
}

function buildAnswerParagraphs(paper: Paper): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  paper.questions.forEach((q: Question, index: number) => {
    paragraphs.push(
      new Paragraph({
        spacing: { before: 200, after: 50 },
        children: [
          new TextRun({ text: `Q${index + 1}: `, bold: true }),
          new TextRun({ text: q.text }),
        ],
      })
    );

    let answerText: string;
    if (q.type === 'MATCH_THE_FOLLOWING') {
      const matches = q.answer as { left: string; right: string }[];
      answerText = matches.map((m) => `${m.left} -> ${m.right}`).join('; ');
    } else if (Array.isArray(q.answer)) {
      answerText = q.answer.join(', ');
    } else {
      answerText = String(q.answer);
    }

    paragraphs.push(
      new Paragraph({
        indent: { left: 400 },
        children: [
          new TextRun({ text: 'Answer: ', bold: true, color: '2E7D32' }),
          new TextRun({ text: answerText }),
        ],
      })
    );
  });

  return paragraphs;
}

function buildDocument(paper: Paper, type: 'question_paper' | 'answer_key'): Document {
  const title = type === 'question_paper' ? 'QUESTION PAPER' : 'ANSWER KEY';
  const bodyParagraphs =
    type === 'question_paper' ? buildQuestionParagraphs(paper) : buildAnswerParagraphs(paper);

  return new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: title, bold: true, size: 36 })],
          }),
          new Paragraph({
            border: {
              bottom: { style: BorderStyle.SINGLE, size: 6, color: '3498DB' },
            },
            spacing: { after: 200 },
            children: [],
          }),
          new Paragraph({
            children: [new TextRun({ text: `Subject: ${paper.subject}`, bold: true })],
          }),
          new Paragraph({
            children: [new TextRun({ text: `Total Marks: ${paper.totalMarks}` })],
          }),
          new Paragraph({
            children: [new TextRun({ text: `Total Hours: ${paper.totalHours}` })],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({ text: `Date: ${new Date().toLocaleDateString()}` })],
          }),
          ...bodyParagraphs,
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

    const doc = buildDocument(paper, type);
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