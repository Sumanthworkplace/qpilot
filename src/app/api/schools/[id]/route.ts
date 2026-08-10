import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma/client';

interface RouteParams {
  params: { id: string };
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;

    const existing = await prisma.school.findUnique({ where: { id: params.id } });

    if (!existing) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    if (existing.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Papers referencing this school keep their record; just detach the reference.
    await prisma.paper.updateMany({
      where: { schoolId: params.id },
      data: { schoolId: null },
    });

    await prisma.school.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete School Error:', error);
    return NextResponse.json({ error: 'Failed to delete school' }, { status: 500 });
  }
}
