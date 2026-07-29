'use client';

import { useState, useEffect } from 'react';
import { usePaperStore } from '@/store/paperStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

interface BasicDetailsProps {
  onValidChange: (valid: boolean) => void;
}

export default function BasicDetails({ onValidChange }: BasicDetailsProps) {
  const { paper, setBasicDetails } = usePaperStore();
  const [subject, setSubject] = useState(paper.subject);
  const [totalMarks, setTotalMarks] = useState(paper.totalMarks.toString());
  const [totalHours, setTotalHours] = useState(paper.totalHours.toString());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!subject.trim()) {
      newErrors.subject = 'Subject name is required';
    }
    
    if (!totalMarks || parseInt(totalMarks) <= 0) {
      newErrors.totalMarks = 'Please enter a valid total marks';
    }
    
    if (!totalHours || parseFloat(totalHours) <= 0) {
      newErrors.totalHours = 'Please enter a valid total hours';
    }
    
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    onValidChange(isValid);
    
    if (isValid) {
      setBasicDetails(
        subject.trim(),
        parseInt(totalMarks),
        parseFloat(totalHours)
      );
    }
  };

  useEffect(() => {
    validate();
  }, [subject, totalMarks, totalHours]);

  return (
    <div className="space-y-6 py-4">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          💡 Enter the basic details of your exam paper. These details will appear on the question paper header.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="subject" className="text-lg font-medium">
            Subject Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="subject"
            placeholder="e.g., Mathematics, Physics, English"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={`mt-1 ${errors.subject ? 'border-red-500' : ''}`}
          />
          {errors.subject && (
            <p className="text-red-500 text-sm mt-1">{errors.subject}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="totalMarks" className="text-lg font-medium">
              Total Marks <span className="text-red-500">*</span>
            </Label>
            <Input
              id="totalMarks"
              type="number"
              placeholder="e.g., 100"
              value={totalMarks}
              onChange={(e) => setTotalMarks(e.target.value)}
              className={`mt-1 ${errors.totalMarks ? 'border-red-500' : ''}`}
            />
            {errors.totalMarks && (
              <p className="text-red-500 text-sm mt-1">{errors.totalMarks}</p>
            )}
          </div>

          <div>
            <Label htmlFor="totalHours" className="text-lg font-medium">
              Total Hours <span className="text-red-500">*</span>
            </Label>
            <Input
              id="totalHours"
              type="number"
              step="0.5"
              placeholder="e.g., 3"
              value={totalHours}
              onChange={(e) => setTotalHours(e.target.value)}
              className={`mt-1 ${errors.totalHours ? 'border-red-500' : ''}`}
            />
            {errors.totalHours && (
              <p className="text-red-500 text-sm mt-1">{errors.totalHours}</p>
            )}
          </div>
        </div>

        <Card className="bg-gray-50 border-dashed">
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Preview:</span> {subject || 'Subject'} - {totalMarks || '0'} marks - {totalHours || '0'} hours
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}