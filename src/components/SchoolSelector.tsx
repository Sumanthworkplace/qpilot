'use client';

import { useEffect, useRef, useState } from 'react';
import { School } from '@/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, School as SchoolIcon, Upload, X } from 'lucide-react';

interface SchoolSelectorProps {
  value: School | null;
  onChange: (school: School | null) => void;
}

export default function SchoolSelector({ value, onChange }: SchoolSelectorProps) {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLogo, setNewLogo] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSchools();
  }, []);

  async function fetchSchools() {
    setLoading(true);
    try {
      const res = await fetch('/api/schools', { cache: 'no-store' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSchools(data);
    } catch {
      // Non-critical: paper creation can still proceed without a school selected.
    } finally {
      setLoading(false);
    }
  }

  function handleLogoFile(file: File) {
    setError('');
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Logo is too large. Please use a file under 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setNewLogo(reader.result as string);
    reader.onerror = () => setError('Could not read that file. Try again.');
    reader.readAsDataURL(file);
  }

  async function handleCreateSchool() {
    if (!newName.trim()) {
      setError('School name is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), logoUrl: newLogo }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? 'Failed to create school');
      }
      const school: School = await res.json();
      setSchools((prev) => [school, ...prev]);
      onChange(school);
      setShowAddForm(false);
      setNewName('');
      setNewLogo(undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create school');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Label>School (optional)</Label>
      <p className="mt-1 text-xs text-muted-foreground">
        {'Add your school\u2019s name and logo once \u2014 it\u2019ll be available for every paper you create.'}
      </p>

      {loading ? (
        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {'Loading schools\u2026'}
        </div>
      ) : (
        <div className="mt-2 space-y-2">
          {schools.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onChange(null)}
                className={`rounded-md border px-3 py-2 text-sm ${
                  !value ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'
                }`}
              >
                No school
              </button>
              {schools.map((school) => (
                <button
                  key={school.id}
                  type="button"
                  onClick={() => onChange(school)}
                  className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                    value?.id === school.id
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border text-foreground'
                  }`}
                >
                  {school.logoUrl ? (
                    <img src={school.logoUrl} alt="" className="h-5 w-5 rounded object-contain" />
                  ) : (
                    <SchoolIcon className="h-4 w-4" />
                  )}
                  {school.name}
                </button>
              ))}
            </div>
          )}

          {!showAddForm ? (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              Add a new school
            </button>
          ) : (
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <Label>New school</Label>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setError('');
                  }}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Cancel"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <Input
                placeholder="School name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="mt-2"
              />

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleLogoFile(file);
                }}
              />

              <div className="mt-3">
                {newLogo ? (
                  <div className="flex items-center gap-3">
                    <img src={newLogo} alt="" className="h-12 w-12 rounded-md border border-border object-contain" />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Replace logo
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary"
                  >
                    <Upload className="h-4 w-4" />
                    Upload logo (optional, max 2MB)
                  </button>
                )}
              </div>

              {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

              <button
                type="button"
                onClick={handleCreateSchool}
                disabled={saving}
                className="mt-3 flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save school
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
