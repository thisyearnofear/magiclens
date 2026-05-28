'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export function useFullscreen() {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  const toggle = useCallback(() => {
    if (!document.fullscreenElement) {
      void elementRef.current?.requestFullscreen();
    } else {
      void document.exitFullscreen();
    }
  }, []);

  const enter = useCallback(() => {
    if (!document.fullscreenElement) {
      void elementRef.current?.requestFullscreen();
    }
  }, []);

  const exit = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      setControlsVisible(true);
    };
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  // F key to toggle fullscreen — skip when typing in inputs or with modifiers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'f' && e.key !== 'F') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;
      e.preventDefault();
      toggle();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  return { elementRef, isFullscreen, controlsVisible, setControlsVisible, toggle, enter, exit };
}
