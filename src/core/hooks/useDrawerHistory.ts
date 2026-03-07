import { useEffect } from 'react';

// History API — pushState on open so iOS Safari edge-swipe triggers popstate
// instead of navigating away; popstate handler invokes onClose to dismiss drawer
// and keep the user in-app. Cleanup removes listener to avoid ghost callbacks.
export function useDrawerHistory(isOpen: boolean, onClose: () => void): void {
  useEffect(() => {
    if (!isOpen) return;

    window.history.pushState({ drawer: 'audit' }, '');

    const handlePopState = () => {
      onClose();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, onClose]);
}
