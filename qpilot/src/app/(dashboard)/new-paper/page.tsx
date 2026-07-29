'use client';

import { useState, useEffect } from 'react';
import { usePaperStore } from '@/store/paperStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import BasicDetails from './components/BasicDetails';
import QuestionSplitup from './components/QuestionSplitup';
import QuestionEntry from './components/QuestionEntry';
import ReviewPaper from './components/ReviewPaper';
import { ArrowLeft, ArrowRight, FileText } from 'lucide-react';

const steps = [
  { id: 0, title: 'Basic Details', icon: '📝' },
  { id: 1, title: 'Question Split-up', icon: '📊' },
  { id: 2, title: 'Enter Questions', icon: '✍️' },
  { id: 3, title: 'Review & Generate', icon: '✅' },
];

export default function NewPaperPage() {
  const { currentStep, nextStep, previousStep } = usePaperStore();
  const [isValid, setIsValid] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <BasicDetails onValidChange={setIsValid} />;
      case 1:
        return <QuestionSplitup onValidChange={setIsValid} />;
      case 2:
        return <QuestionEntry onValidChange={setIsValid} />;
      case 3:
        return <ReviewPaper />;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Create New Question Paper</h1>
            </div>
            <p className="text-gray-600">
              Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
            </p>
          </div>

          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {steps.map((step, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className={`text-2xl ${index <= currentStep ? 'opacity-100' : 'opacity-50'}`}>
                    {step.icon}
                  </div>
                  <span className={`text-xs mt-1 ${index <= currentStep ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
            <Progress value={(currentStep / (steps.length - 1)) * 100} className="h-2" />
          </div>

          <Card className="shadow-lg border-0">
            <CardContent className="pt-6">
              <div className="min-h-[400px]">
                {renderStep()}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={previousStep}
              disabled={currentStep === 0}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>
            
            {currentStep < steps.length - 1 && (
              <Button
                onClick={nextStep}
                disabled={!isValid}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}