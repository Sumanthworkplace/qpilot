import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma/client';
import { paperSchema } from '@/lib/validations/paperSchema';

function serializePaper(paper: any) {
  return {
    ...paper,
    questionSplitup: JSON.parse(paper.questionSplitup),
    questions: paper.questions?.map((q: any) => ({
      ...q,
      options: q.options ? JSON.parse(q.options) : null,
      answer: JSON.parse(q.answer),
    })),
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;

    const papers = await prisma.paper.findMany({
      where: { userId },
      include: { questions: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(papers.map(serializePaper));
  } catch (error) {
    console.error('Fetch Papers Error:', error);
    return NextResponse.json({ error: 'Failed to fetch papers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;

    const body = await req.json();
    const parsed = paperSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { title, subject, totalMarks, totalHours, questions, questionSplitup } = parsed.data;

    const paper = await prisma.paper.create({
      data: {
        title,
        subject,
        totalMarks,
        totalHours,
        userId: userId as string,
        questionSplitup: JSON.stringify(questionSplitup),
        questions: {
          create: questions.map((q, index) => ({
            type: q.type,
            text: q.text,
            options: q.options ? JSON.stringify(q.options) : null,
            answer: JSON.stringify(q.answer),
            marks: q.marks,
            order: q.order ?? index,
          })),
        },
      },
      include: { questions: { orderBy: { order: 'asc' } } },
    });

    return NextResponse.json(serializePaper(paper), { status: 201 });
  } catch (error) {
    console.error('Create Paper Error:', error);
    return NextResponse.json({ error: 'Failed to create paper' }, { status: 500 });
  }
}
