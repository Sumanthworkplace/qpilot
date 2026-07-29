'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function MyPapersPage() {
  const [papers, setPapers] = useState<any[]>([]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Papers</h1>
          <p className="text-gray-600">Manage your saved question papers</p>
        </div>
        <Link href="/new-paper">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            New Paper
          </Button>
        </Link>
      </div>

      {papers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Papers Yet</h3>
            <p className="text-gray-500 mb-4">Create your first question paper to get started</p>
            <Link href="/new-paper">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Create New Paper
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {papers.map((paper, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <h3 className="font-semibold">{paper.subject}</h3>
                <p className="text-sm text-gray-600">{paper.totalMarks} marks</p>
                <p className="text-xs text-gray-400 mt-2">{new Date().toLocaleDateString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}