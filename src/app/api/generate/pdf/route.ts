import { NextRequest, NextResponse } from 'next/server';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Paper, Question } from '@/types';

function generateQuestionPaper(paper: Paper): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Header
  doc.setFontSize(24);
  doc.setTextColor(44, 62, 80);
  doc.text('QUESTION PAPER', pageWidth / 2, 25, { align: 'center' });
  
  // Divider
  doc.setDrawColor(52, 152, 219);
  doc.setLineWidth(0.5);
  doc.line(20, 30, pageWidth - 20, 30);
  
  // Exam Details
  doc.setFontSize(12);
  doc.setTextColor(44, 62, 80);
  doc.text(`Subject: ${paper.subject}`, 20, 45);
  doc.text(`Total Marks: ${paper.totalMarks}`, 20, 55);
  doc.text(`Total Hours: ${paper.totalHours}`, 20, 65);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 75);
  
  // Instructions
  doc.setFontSize(11);
  doc.setTextColor(52, 73, 94);
  doc.text('Instructions:', 20, 90);
  const instructions = [
    '1. Read each question carefully before answering.',
    '2. Answer all questions to the best of your ability.',
    '3. Manage your time wisely across all sections.',
    '4. Check your answers before submitting.',
  ];
  instructions.forEach((inst, index) => {
    doc.text(inst, 25, 98 + (index * 6));
  });
  
  // Questions
  let yPosition = 125;
  doc.setFontSize(12);
  doc.setTextColor(44, 62, 80);
  
  paper.questions.forEach((q: Question, index: number) => {
    // Check if we need a new page
    if (yPosition > pageHeight - 30) {
      doc.addPage();
      yPosition = 25;
    }
    
    // Question number and marks
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${index + 1}.`, 20, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(`(${q.marks} marks)`, 30, yPosition);
    
    // Question text with word wrap
    const splitText = doc.splitTextToSize(q.text, 150);
    doc.text(splitText, 20, yPosition + 7);
    yPosition += 7 + (splitText.length * 6);
    
    // Options for MCQ
    if (q.options && Array.isArray(q.options) && q.options.length > 0) {
      q.options.forEach((opt: string, idx: number) => {
        doc.text(`${String.fromCharCode(65 + idx)}. ${opt}`, 25, yPosition);
        yPosition += 6;
      });
      yPosition += 4;
    }
    
    // Space between questions
    yPosition += 8;
  });
  
  // Footer
  const pageCount = doc.internal.pages.length;
  for (let i = 1; i < pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${pageCount - 1}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }
  
  return doc;
}

function generateAnswerKey(paper: Paper): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Header
  doc.setFontSize(24);
  doc.setTextColor(44, 62, 80);
  doc.text('ANSWER KEY', pageWidth / 2, 25, { align: 'center' });
  
  doc.setDrawColor(52, 152, 219);
  doc.setLineWidth(0.5);
  doc.line(20, 30, pageWidth - 20, 30);
  
  // Details
  doc.setFontSize(12);
  doc.setTextColor(44, 62, 80);
  doc.text(`Subject: ${paper.subject}`, 20, 45);
  doc.text(`Total Marks: ${paper.totalMarks}`, 20, 55);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 65);
  
  let yPosition = 85;
  doc.setFontSize(11);
  
  paper.questions.forEach((q: Question, index: number) => {
    if (yPosition > pageHeight - 30) {
      doc.addPage();
      yPosition = 25;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.text(`Q${index + 1}:`, 20, yPosition);
    doc.setFont('helvetica', 'normal');
    const splitText = doc.splitTextToSize(q.text, 150);
    doc.text(splitText, 28, yPosition);
    yPosition += 7 + (splitText.length * 6);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(46, 204, 113);
    doc.text('Answer:', 20, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(44, 62, 80);
    
    if (q.type === 'MCQ' && q.answer) {
      const answerIndex = (q.options as string[])?.indexOf(q.answer as string);
      doc.text(`Option ${String.fromCharCode(65 + (answerIndex || 0))}: ${q.answer}`, 35, yPosition);
      yPosition += 8;
    } else if (q.type === 'MATCH_THE_FOLLOWING') {
      const matches = q.answer as { left: string; right: string }[];
      matches?.forEach((match, idx) => {
        doc.text(`${idx + 1}. ${match.left} → ${match.right}`, 35, yPosition);
        yPosition += 6;
      });
      yPosition += 4;
    } else {
      const answerText = Array.isArray(q.answer) ? q.answer.join(', ') : q.answer;
      const splitAnswer = doc.splitTextToSize(answerText, 140);
      doc.text(splitAnswer, 35, yPosition);
      yPosition += 7 + (splitAnswer.length * 6);
    }
    
    yPosition += 6;
  });
  
  // Footer
  const pageCount = doc.internal.pages.length;
  for (let i = 1; i < pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${pageCount - 1}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
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
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('PDF Generation Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}