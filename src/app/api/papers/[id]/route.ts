import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma/client';
import { updatePaperSchema } from '@/lib/validations/paperSchema';

interface RouteParams {
  params: { id: string };
}

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

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;

    const paper = await prisma.paper.findUnique({
      where: { id: params.id },
      include: { questions: { orderBy: { order: 'asc' } }, school: true },
    });

    if (!paper) {
      return NextResponse.json({ error: 'Paper not found' }, { status: 404 });
    }

    if (paper.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(serializePaper(paper));
  } catch (error) {
    console.error('Fetch Paper Error:', error);
    return NextResponse.json({ error: 'Failed to fetch paper' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;

    const existing = await prisma.paper.findUnique({ where: { id: params.id } });

    if (!existing) {
      return NextResponse.json({ error: 'Paper not found' }, { status: 404 });
    }

    if (existing.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updatePaperSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { title, subject, totalMarks, totalHours, questions, questionSplitup, schoolId } = parsed.data;

    if (questions) {
      await prisma.question.deleteMany({ where: { paperId: params.id } });
    }

    const paper = await prisma.paper.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(subject !== undefined && { subject }),
        ...(totalMarks !== undefined && { totalMarks }),
        ...(totalHours !== undefined && { totalHours }),
        ...(schoolId !== undefined && { schoolId }),
        ...(questionSplitup !== undefined && {
          questionSplitup: JSON.stringify(questionSplitup),
        }),
        ...(questions && {
          questions: {
            create: questions.map((q, index) => ({
              type: q.type,
              text: q.text,
              options: q.options ? JSON.stringify(q.options) : null,
              answer: JSON.stringify(q.answer ?? ''),
              marks: q.marks,
              order: q.order ?? index,
              imageUrl: q.imageUrl ?? null,
            })),
          },
        }),
      },
      include: { questions: { orderBy: { order: 'asc' } }, school: true },
    });

    return NextResponse.json(serializePaper(paper));
  } catch (error) {
    console.error('Update Paper Error:', error);
    return NextResponse.json({ error: 'Failed to update paper' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;

    const existing = await prisma.paper.findUnique({ where: { id: params.id } });

    if (!existing) {
      return NextResponse.json({ error: 'Paper not found' }, { status: 404 });
    }

    if (existing.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.question.deleteMany({ where: { paperId: params.id } });
    await prisma.paper.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete Paper Error:', error);
    return NextResponse.json({ error: 'Failed to delete paper' }, { status: 500 });
  }
}
