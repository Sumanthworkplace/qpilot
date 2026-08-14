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

  // Duration is stored internally as decimal hours (e.g. 2.5), but entered
  // as separate Hours/Minutes fields for clarity.
  const initialHours = Math.floor(paper.totalHours);
  const initialMinutes = Math.round((paper.totalHours - initialHours) * 60);
  const [hours, setHours] = useState(paper.totalHours > 0 ? initialHours.toString() : '');
  const [minutes, setMinutes] = useState(paper.totalHours > 0 ? initialMinutes.toString() : '');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!subject.trim()) {
      newErrors.subject = 'Subject name is required';
    }

    const marksNum = parseFloat(totalMarks);
    if (!totalMarks || isNaN(marksNum) || marksNum <= 0) {
      newErrors.totalMarks = 'Please enter a valid total marks';
    }

    const hoursNum = parseInt(hours) || 0;
    const minutesNum = parseInt(minutes) || 0;

    if (minutesNum < 0 || minutesNum > 59) {
      newErrors.minutes = 'Minutes must be between 0 and 59';
    }

    if (hoursNum <= 0 && minutesNum <= 0) {
      newErrors.hours = 'Please enter a valid duration';
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    onValidChange(isValid);

    if (isValid) {
      const totalHours = hoursNum + minutesNum / 60;
      setBasicDetails(subject.trim(), marksNum, totalHours);
    }
  };

  useEffect(() => {
    validate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, totalMarks, hours, minutes]);

  const handleSchoolChange = (school: School | null) => {
    setSchool(school);
  };

  const durationLabel = () => {
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    if (h === 0 && m === 0) return '0 min';
    const parts = [];
    if (h > 0) parts.push(`${h} hr`);
    if (m > 0) parts.push(`${m} min`);
    return parts.join(' ');
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <Label htmlFor="totalMarks">
              Total marks <span className="text-destructive">*</span>
            </Label>
            <Input
              id="totalMarks"
              type="number"
              step="0.5"
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
            <Label htmlFor="hours">
              {'Duration \u2014 hours '}<span className="text-destructive">*</span>
            </Label>
            <Input
              id="hours"
              type="number"
              min="0"
              step="1"
              placeholder="e.g., 3"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className={`mt-1.5 ${errors.hours ? 'border-destructive' : ''}`}
            />
            {errors.hours && <p className="mt-1 text-sm text-destructive">{errors.hours}</p>}
          </div>

          <div>
            <Label htmlFor="minutes">{'Duration \u2014 minutes'}</Label>
            <Input
              id="minutes"
              type="number"
              min="0"
              max="59"
              step="1"
              placeholder="e.g., 30"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className={`mt-1.5 ${errors.minutes ? 'border-destructive' : ''}`}
            />
            {errors.minutes && <p className="mt-1 text-sm text-destructive">{errors.minutes}</p>}
          </div>
        </div>

        <SchoolSelector value={paper.school ?? null} onChange={handleSchoolChange} />

        <div className="rounded-lg border border-dashed border-border bg-card/60 p-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Preview:</span> {subject || 'Subject'}
            {' \u2014 '}
            {totalMarks || '0'} marks{' \u2014 '}
            {durationLabel()}
            {paper.school ? `${' \u2014 '}${paper.school.name}` : ''}
          </p>
        </div>
      </div>
    </div>
  );
}
