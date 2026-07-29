'use client';

import { usePaperStore } from '@/store/paperStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, FileText, FileCheck, Loader2, Save } from 'lucide-react';

export default function ReviewPaper() {
  const { paper, isLoading, setLoading } = usePaperStore();
  const [generating, setGenerating] = useState<'question' | 'answer' | null>(null);
  const router = useRouter();

  const handleGenerate = async (type: 'question_paper' | 'answer_key') => {
    setGenerating(type === 'question_paper' ? 'question' : 'answer');
    setLoading(true);
    
    try {
      const response = await fetch('/api/generate/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          paper: {
            ...paper,
            title: `${paper.subject} - Question Paper`
          }, 
          type 
        }),
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_${paper.subject}_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Generation failed:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setGenerating(null);
      setLoading(false);
    }
  };

  const handleSavePaper = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/papers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paper),
      });
      
      if (response.ok) {
        router.push('/my-papers');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to save paper');
      }
    } catch (error) {
      alert('Failed to save paper');
    } finally {
      setLoading(false);
    }
  };

  // Group questions by type
  const questionsByType = paper.questions.reduce((acc, q) => {
    acc[q.type] = (acc[q.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 py-4">
      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <p className="text-sm text-green-800">
          ✅ All {paper.questions.length} questions have been added. Review the summary below and generate your papers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4">
            <h3 className="font-semibold mb-3 text-lg">📋 Paper Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1 border-b">
                <span className="text-gray-600">Subject</span>
                <span className="font-medium">{paper.subject}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-gray-600">Total Marks</span>
                <span className="font-medium">{paper.totalMarks}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-gray-600">Total Hours</span>
                <span className="font-medium">{paper.totalHours}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-gray-600">Total Questions</span>
                <span className="font-medium">{paper.questions.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <h3 className="font-semibold mb-3 text-lg">📊 Questions Breakdown</h3>
            <div className="space-y-1 text-sm">
              {Object.entries(questionsByType).length === 0 ? (
                <p className="text-gray-500">No questions added yet</p>
              ) : (
                Object.entries(questionsByType).map(([type, count]) => (
                  <div key={type} className="flex justify-between py-1 border-b">
                    <span className="text-gray-600">{type}</span>
                    <span className="font-medium">{count} questions</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <p className="text-sm text-yellow-800">
          ⚠️ Please review all questions carefully before generating. 
          Once generated, you can download both the question paper and answer key.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => handleGenerate('question_paper')}
          disabled={!!generating || isLoading}
        >
          {generating === 'question' ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="h-5 w-5 mr-2" />
              Question Paper
            </>
          )}
        </Button>
        
        <Button
          size="lg"
          className="bg-green-600 hover:bg-green-700 text-white"
          onClick={() => handleGenerate('answer_key')}
          disabled={!!generating || isLoading}
        >
          {generating === 'answer' ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileCheck className="h-5 w-5 mr-2" />
              Answer Key
            </>
          )}
        </Button>

        <Button
          size="lg"
          variant="outline"
          onClick={handleSavePaper}
          disabled={isLoading}
          className="border-blue-600 text-blue-600 hover:bg-blue-50"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          ) : (
            <Save className="h-5 w-5 mr-2" />
          )}
          Save Paper
        </Button>
      </div>
    </div>
  );
}