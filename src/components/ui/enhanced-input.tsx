import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HelpCircle, Check, X, Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface EnhancedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  tooltip?: string;
  showValidation?: boolean;
  isValidating?: boolean;
  isValid?: boolean;
  suggestions?: string[];
  onSuggestionSelect?: (value: string) => void;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const EnhancedInput: React.FC<EnhancedInputProps> = ({
  label,
  error,
  helperText,
  tooltip,
  showValidation,
  isValidating,
  isValid,
  suggestions = [],
  onSuggestionSelect,
  leftIcon,
  rightElement,
  className,
  id,
  ...props
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  };

  const getValidationIcon = () => {
    if (isValidating) {
      return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
    }
    if (showValidation && isValid) {
      return <Check className="w-4 h-4 text-green-500 success-animation" />;
    }
    if (showValidation && !isValid && error) {
      return <X className="w-4 h-4 text-red-500 error-shake" />;
    }
    return null;
  };

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center gap-2">
          <Label htmlFor={inputId} className="text-sm font-medium">
            {label}
          </Label>
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-help transition-colors" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-sm">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300">
            {leftIcon}
          </div>
        )}
        
        <Input
          id={inputId}
          className={cn(
            "transition-all duration-200",
            leftIcon && "pl-10",
            (showValidation || rightElement) && "pr-10",
            error && "border-red-500 focus:ring-red-500",
            showValidation && isValid && "border-green-500 focus:ring-green-500",
            className
          )}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onKeyDown={handleKeyDown}
          {...props}
        />
        
        {(showValidation || rightElement) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightElement || getValidationIcon()}
          </div>
        )}
        
        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto fade-in">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                className={cn(
                  "w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
                  highlightedIndex === index && "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                )}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {(helperText || error) && (
        <p className={cn(
          "text-sm transition-all duration-200",
          error ? "text-red-500" : "text-gray-600 dark:text-gray-300"
        )}>
          {error || helperText}
        </p>
      )}
    </div>
  );
};