import { useState, useEffect, useRef } from 'react';
import { useIsMobile } from '@/components/ui/bottom-sheet';

export const useMobileFeatures = (hasRequiredFields: boolean) => {
  const isMobile = useIsMobile();
  const [showStickyButton, setShowStickyButton] = useState(false);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const calculateButtonRef = useRef<HTMLDivElement>(null);

  // Sticky button scroll behavior
  useEffect(() => {
    if (!isMobile) return;

    const handleScroll = () => {
      if (!calculateButtonRef.current) return;
      
      const buttonRect = calculateButtonRef.current.getBoundingClientRect();
      const isButtonVisible = buttonRect.top < window.innerHeight && buttonRect.bottom > 0;
      
      setShowStickyButton(!isButtonVisible && hasRequiredFields);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile, hasRequiredFields]);

  return {
    isMobile,
    showStickyButton,
    isBottomSheetOpen,
    setIsBottomSheetOpen,
    calculateButtonRef,
  };
};