import { useState, useEffect, useRef } from 'react';

export type TabType = 'calculator' | 'config';

export const useTabNavigation = (isMobile: boolean) => {
  const [activeTab, setActiveTab] = useState<TabType>('calculator');
  const tabsRef = useRef<HTMLDivElement>(null);

  // Swipe gesture for tabs on mobile
  useEffect(() => {
    if (!isMobile || !tabsRef.current) return;

    let startX = 0;
    let currentX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      currentX = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
      const diffX = currentX - startX;
      const threshold = 50; // minimum swipe distance

      if (Math.abs(diffX) > threshold) {
        if (diffX > 0 && activeTab === 'config') {
          // Swipe right to calculator
          setActiveTab('calculator');
        } else if (diffX < 0 && activeTab === 'calculator') {
          // Swipe left to config
          setActiveTab('config');
        }
      }
    };

    const tabsElement = tabsRef.current;
    tabsElement.addEventListener('touchstart', handleTouchStart);
    tabsElement.addEventListener('touchmove', handleTouchMove);
    tabsElement.addEventListener('touchend', handleTouchEnd);

    return () => {
      tabsElement.removeEventListener('touchstart', handleTouchStart);
      tabsElement.removeEventListener('touchmove', handleTouchMove);
      tabsElement.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, activeTab]);

  return {
    activeTab,
    setActiveTab,
    tabsRef,
  };
};