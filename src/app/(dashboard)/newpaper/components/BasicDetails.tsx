'use client';

import { useState, useEffect } from 'react';
import { usePaperStore } from '@/store/paperStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SchoolSelector from '@/components/SchoolSelector';
import { School } from '@/types';
import { Info } from 'lucide-react';

interface BasicDetailsProps {
  onValidChange: (valid: boolean) => void;
}

export default function BasicDetails({ onValidChange }: BasicDetailsProps) {
  const { paper, setBasicDetails, setSchool } = usePaperStore();
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
      setBasicDetails(subject.trim(), parseInt(totalMarks), parseFloat(totalHours));
    }
  };

  useEffect(() => {
    validate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, totalMarks, totalHours]);

  const handleSchoolChange = (school: School | null) => {
    setSchool(school);
  };

  return (
    <div className="space-y-6 py-4">
      <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-sm">
          Enter the basic details of your exam paper. These details will appear on the question
          paper header.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="subject">
            Subject name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="subject"
            placeholder="e.g., Mathematics, Physics, English"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={`mt-1.5 ${errors.subject ? 'border-destructive' : ''}`}
          />
          {errors.subject && <p className="mt-1 text-sm text-destructive">{errors.subject}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="totalMarks">
              Total marks <span className="text-destructive">*</span>
            </Label>
            <Input
              id="totalMarks"
              type="number"
              placeholder="e.g., 100"
              value={totalMarks}
              onChange={(e) => setTotalMarks(e.target.value)}
              className={`mt-1.5 ${errors.totalMarks ? 'border-destructive' : ''}`}
            />
            {errors.totalMarks && (
              <p className="mt-1 text-sm text-destructive">{errors.totalMarks}</p>
            )}
          </div>

          <div>
            <Label htmlFor="totalHours">
              Total hours <span className="text-destructive">*</span>
            </Label>
            <Input
              id="totalHours"
              type="number"
              step="0.5"
              placeholder="e.g., 3"
              value={totalHours}
              onChange={(e) => setTotalHours(e.target.value)}
              className={`mt-1.5 ${errors.totalHours ? 'border-destructive' : ''}`}
            />
            {errors.totalHours && (
              <p className="mt-1 text-sm text-destructive">{errors.totalHours}</p>
            )}
          </div>
        </div>

        <SchoolSelector value={paper.school ?? null} onChange={handleSchoolChange} />

        <div className="rounded-lg border border-dashed border-border bg-card/60 p-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Preview:</span> {subject || 'Subject'}
            {' \u2014 '}
            {totalMarks || '0'} marks{' \u2014 '}
            {totalHours || '0'} hours
            {paper.school ? `${' \u2014 '}${paper.school.name}` : ''}
          </p>
        </div>
      </div>
    </div>
  );
}
