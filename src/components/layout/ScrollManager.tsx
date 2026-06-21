import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * On navigation: scroll to the hash target if present, otherwise to the
 * top of the page. Makes in-page anchors like "/#how" work with the
 * router and keeps route changes from preserving the old scroll position.
 */
export function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0 });
  }, [pathname, hash]);

  return null;
}
