import React from 'react';
import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressStep {
  id: string;
  label: string;
  isComplete: boolean;
  isCurrent?: boolean;
}

interface FormProgressProps {
  steps: ProgressStep[];
  className?: string;
  variant?: 'linear' | 'circular';
}

export const FormProgress: React.FC<FormProgressProps> = ({
  steps,
  className,
  variant = 'linear'
}) => {
  const completedCount = steps.filter(step => step.isComplete).length;
  const progressPercentage = (completedCount / steps.length) * 100;

  if (variant === 'circular') {
    return (
      <div className={cn("relative w-24 h-24", className)}>
        {/* Background circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r="36"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-gray-200"
          />
          {/* Progress circle */}
          <circle
            cx="48"
            cy="48"
            r="36"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 36}`}
            strokeDashoffset={`${2 * Math.PI * 36 * (1 - progressPercentage / 100)}`}
            className="text-blue-600 transition-all duration-500 ease-out"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-semibold">
            {completedCount}/{steps.length}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>{completedCount} of {steps.length} completed</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Step indicators */}
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              "flex items-center gap-3 p-2 rounded-lg transition-all duration-300",
              step.isCurrent && "bg-blue-50",
              step.isComplete && !step.isCurrent && "opacity-75"
            )}
          >
            <div className="relative">
              {step.isComplete ? (
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center success-animation">
                  <Check className="w-4 h-4 text-white" />
                </div>
              ) : (
                <div 
                  className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                    step.isCurrent 
                      ? "border-blue-500 bg-blue-500" 
                      : "border-gray-300"
                  )}
                >
                  {step.isCurrent && (
                    <Circle className="w-3 h-3 text-white fill-white" />
                  )}
                </div>
              )}
              {index < steps.length - 1 && (
                <div 
                  className={cn(
                    "absolute top-6 left-3 w-0.5 h-6",
                    step.isComplete ? "bg-green-500" : "bg-gray-300"
                  )}
                />
              )}
            </div>
            <span 
              className={cn(
                "text-sm font-medium",
                step.isComplete ? "text-green-700" : 
                step.isCurrent ? "text-blue-700" : 
                "text-gray-600"
              )}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};