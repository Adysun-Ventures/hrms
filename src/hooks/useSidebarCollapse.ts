
import { useEffect, useState } from 'react';

const KEY = 'sidebarCollapsed';

/** Desktop sidebar collapse state. Publishes width as --sidebar-w so layout/header can follow it. */
export const useSidebarCollapse = () => {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(KEY) === '1');
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-w', collapsed ? '3.5rem' : '14rem');
    try {
      localStorage.setItem(KEY, collapsed ? '1' : '0');
    } catch {}
  }, [collapsed]);

  return { collapsed, toggleCollapsed: () => setCollapsed((c) => !c) };
};
