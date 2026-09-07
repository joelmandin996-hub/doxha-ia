import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export const useSidebarAutoClose = (setSidebarOpen) => {
  const location = useLocation();
  const wasAutoClosed = useRef(false);
  const prevIsBudget = useRef(location.pathname.startsWith('/budget'));

  useEffect(() => {
    const isBudget = location.pathname.startsWith('/budget');
    
    if (isBudget && !prevIsBudget.current) {
      // Entering budget routes: close sidebar if it's open
      setSidebarOpen((prev) => {
        if (prev) {
          wasAutoClosed.current = true;
          return false;
        }
        return prev;
      });
    } else if (!isBudget && prevIsBudget.current) {
      // Leaving budget routes: restore sidebar if we auto-closed it
      setSidebarOpen((prev) => {
        if (!prev && wasAutoClosed.current) {
          wasAutoClosed.current = false;
          return true;
        }
        wasAutoClosed.current = false;
        return prev;
      });
    }
    
    prevIsBudget.current = isBudget;
  }, [location.pathname, setSidebarOpen]);
};