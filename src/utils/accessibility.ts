import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Custom hook for managing focus
 */
export const useFocusManagement = () => {
  const focusableElementsRef = useRef<HTMLElement[]>([]);
  const currentFocusIndexRef = useRef(0);

  const registerFocusableElement = useCallback((element: HTMLElement | null) => {
    if (element && !focusableElementsRef.current.includes(element)) {
      focusableElementsRef.current.push(element);
    }
  }, []);

  const unregisterFocusableElement = useCallback((element: HTMLElement | null) => {
    if (element) {
      focusableElementsRef.current = focusableElementsRef.current.filter(el => el !== element);
    }
  }, []);

  const focusNext = useCallback(() => {
    const elements = focusableElementsRef.current.filter(el => 
      el.offsetParent !== null && !el.hasAttribute('disabled')
    );
    
    if (elements.length === 0) return;
    
    currentFocusIndexRef.current = (currentFocusIndexRef.current + 1) % elements.length;
    elements[currentFocusIndexRef.current]?.focus();
  }, []);

  const focusPrevious = useCallback(() => {
    const elements = focusableElementsRef.current.filter(el => 
      el.offsetParent !== null && !el.hasAttribute('disabled')
    );
    
    if (elements.length === 0) return;
    
    currentFocusIndexRef.current = currentFocusIndexRef.current === 0 
      ? elements.length - 1 
      : currentFocusIndexRef.current - 1;
    elements[currentFocusIndexRef.current]?.focus();
  }, []);

  const focusFirst = useCallback(() => {
    const elements = focusableElementsRef.current.filter(el => 
      el.offsetParent !== null && !el.hasAttribute('disabled')
    );
    
    if (elements.length > 0) {
      currentFocusIndexRef.current = 0;
      elements[0]?.focus();
    }
  }, []);

  const focusLast = useCallback(() => {
    const elements = focusableElementsRef.current.filter(el => 
      el.offsetParent !== null && !el.hasAttribute('disabled')
    );
    
    if (elements.length > 0) {
      currentFocusIndexRef.current = elements.length - 1;
      elements[elements.length - 1]?.focus();
    }
  }, []);

  return {
    registerFocusableElement,
    unregisterFocusableElement,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
  };
};

/**
 * Custom hook for keyboard navigation
 */
export const useKeyboardNavigation = (
  onKeyDown?: (event: KeyboardEvent) => void,
  dependencies: React.DependencyList = []
) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    onKeyDown?.(event);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onKeyDown, ...dependencies]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};

/**
 * Custom hook for screen reader announcements
 */
export const useScreenReaderAnnouncement = () => {
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (announcement) {
      const announcementElement = document.createElement('div');
      announcementElement.setAttribute('aria-live', 'polite');
      announcementElement.setAttribute('aria-atomic', 'true');
      announcementElement.style.position = 'absolute';
      announcementElement.style.left = '-10000px';
      announcementElement.style.width = '1px';
      announcementElement.style.height = '1px';
      announcementElement.style.overflow = 'hidden';
      
      document.body.appendChild(announcementElement);
      
      // Use setTimeout to ensure the element is in the DOM
      setTimeout(() => {
        announcementElement.textContent = announcement;
        setAnnouncement('');
        
        // Remove the element after announcement
        setTimeout(() => {
          document.body.removeChild(announcementElement);
        }, 1000);
      }, 100);
    }
  }, [announcement]);

  const announce = useCallback((message: string) => {
    setAnnouncement(message);
  }, []);

  return { announce };
};

/**
 * Custom hook for skip links
 */
export const useSkipLinks = () => {
  const skipLinksRef = useRef<HTMLAnchorElement[]>([]);

  const registerSkipLink = useCallback((link: HTMLAnchorElement | null) => {
    if (link && !skipLinksRef.current.includes(link)) {
      skipLinksRef.current.push(link);
    }
  }, []);

  const unregisterSkipLink = useCallback((link: HTMLAnchorElement | null) => {
    if (link) {
      skipLinksRef.current = skipLinksRef.current.filter(l => l !== link);
    }
  }, []);

  const showSkipLinks = useCallback(() => {
    skipLinksRef.current.forEach(link => {
      link.style.display = 'block';
    });
  }, []);

  const hideSkipLinks = useCallback(() => {
    skipLinksRef.current.forEach(link => {
      link.style.display = 'none';
    });
  }, []);

  return {
    registerSkipLink,
    unregisterSkipLink,
    showSkipLinks,
    hideSkipLinks,
  };
};

/**
 * Utility for generating accessible IDs
 */
export const generateAccessibleId = (prefix: string, suffix?: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}-${timestamp}-${random}${suffix ? `-${suffix}` : ''}`;
};

/**
 * Utility for creating accessible labels
 */
export const createAccessibleLabel = (
  label: string,
  description?: string,
  required?: boolean
): string => {
  let accessibleLabel = label;
  
  if (required) {
    accessibleLabel += ' (required)';
  }
  
  if (description) {
    accessibleLabel += `, ${description}`;
  }
  
  return accessibleLabel;
};

/**
 * Utility for validating ARIA attributes
 */
export const validateAriaAttributes = (attributes: Record<string, string>): string[] => {
  const errors: string[] = [];
  
  // Check for required ARIA attributes
  if (attributes['aria-labelledby'] && !document.getElementById(attributes['aria-labelledby'])) {
    errors.push(`aria-labelledby references non-existent element: ${attributes['aria-labelledby']}`);
  }
  
  if (attributes['aria-describedby'] && !document.getElementById(attributes['aria-describedby'])) {
    errors.push(`aria-describedby references non-existent element: ${attributes['aria-describedby']}`);
  }
  
  if (attributes['aria-controls'] && !document.getElementById(attributes['aria-controls'])) {
    errors.push(`aria-controls references non-existent element: ${attributes['aria-controls']}`);
  }
  
  // Check for valid ARIA values
  if (attributes['aria-expanded'] && !['true', 'false'].includes(attributes['aria-expanded'])) {
    errors.push('aria-expanded must be "true" or "false"');
  }
  
  if (attributes['aria-selected'] && !['true', 'false'].includes(attributes['aria-selected'])) {
    errors.push('aria-selected must be "true" or "false"');
  }
  
  if (attributes['aria-hidden'] && !['true', 'false'].includes(attributes['aria-hidden'])) {
    errors.push('aria-hidden must be "true" or "false"');
  }
  
  return errors;
};

/**
 * Utility for creating accessible button props
 */
export const createAccessibleButtonProps = (
  label: string,
  description?: string,
  disabled?: boolean
) => ({
  'aria-label': createAccessibleLabel(label, description),
  'aria-disabled': disabled,
  role: 'button',
  tabIndex: disabled ? -1 : 0,
});

/**
 * Utility for creating accessible link props
 */
export const createAccessibleLinkProps = (
  label: string,
  description?: string,
  external?: boolean
) => ({
  'aria-label': createAccessibleLabel(label, description),
  'aria-describedby': external ? 'external-link-description' : undefined,
  rel: external ? 'noopener noreferrer' : undefined,
});

/**
 * Utility for creating accessible form field props
 */
export const createAccessibleFormFieldProps = (
  id: string,
  label: string,
  description?: string,
  required?: boolean,
  error?: string
) => ({
  id,
  'aria-label': createAccessibleLabel(label, description, required),
  'aria-required': required,
  'aria-invalid': !!error,
  'aria-describedby': error ? `${id}-error` : undefined,
});

/**
 * Custom hook for managing focus trap
 */
export const useFocusTrap = (enabled: boolean = true) => {
  const containerRef = useRef<HTMLElement | null>(null);

  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    
    return Array.from(
      containerRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter(el => 
      el instanceof HTMLElement && 
      el.offsetParent !== null && 
      !el.hasAttribute('disabled')
    ) as HTMLElement[];
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled || event.key !== 'Tab') return;

    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    }
  }, [enabled, getFocusableElements]);

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
    return undefined;
  }, [enabled, handleKeyDown]);

  const setContainer = useCallback((element: HTMLElement | null) => {
    containerRef.current = element;
  }, []);

  return { setContainer };
};

/**
 * Utility for creating accessible table props
 */
export const createAccessibleTableProps = (
  caption: string,
  rowCount: number,
  columnCount: number
) => ({
  'aria-label': caption,
  'aria-rowcount': rowCount,
  'aria-colcount': columnCount,
  role: 'table',
});

/**
 * Utility for creating accessible list props
 */
export const createAccessibleListProps = (
  type: 'ordered' | 'unordered' | 'description',
  itemCount: number
) => ({
  role: type === 'ordered' ? 'list' : type === 'unordered' ? 'list' : 'list',
  'aria-label': `${type} list with ${itemCount} items`,
});

/**
 * Custom hook for managing live regions
 */
export const useLiveRegion = (type: 'polite' | 'assertive' = 'polite') => {
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (message) {
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', type);
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.style.position = 'absolute';
      liveRegion.style.left = '-10000px';
      liveRegion.style.width = '1px';
      liveRegion.style.height = '1px';
      liveRegion.style.overflow = 'hidden';
      
      document.body.appendChild(liveRegion);
      
      setTimeout(() => {
        liveRegion.textContent = message;
        setMessage('');
        
        setTimeout(() => {
          document.body.removeChild(liveRegion);
        }, 1000);
      }, 100);
    }
  }, [message, type]);

  const announce = useCallback((msg: string) => {
    setMessage(msg);
  }, []);

  return { announce };
};

/**
 * Utility for checking color contrast
 */
export const checkColorContrast = (foreground: string, background: string): number => {
  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1] || '0', 16),
      g: parseInt(result[2] || '0', 16),
      b: parseInt(result[3] || '0', 16)
    } : null;
  };

  // Calculate relative luminance
  const getLuminance = (r: number, g: number, b: number) => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * (rs || 0) + 0.7152 * (gs || 0) + 0.0722 * (bs || 0);
  };

  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);

  if (!fg || !bg) return 0;

  const l1 = getLuminance(fg.r, fg.g, fg.b);
  const l2 = getLuminance(bg.r, bg.g, bg.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Utility for creating accessible dialog props
 */
export const createAccessibleDialogProps = (
  _title: string,
  description?: string,
  modal: boolean = true
) => ({
  role: 'dialog',
  'aria-modal': modal,
  'aria-labelledby': 'dialog-title',
  'aria-describedby': description ? 'dialog-description' : undefined,
});

/**
 * Custom hook for managing accessible state
 */
export const useAccessibleState = <T>(
  initialState: T,
  stateName: string,
  onChange?: (newState: T) => void
) => {
  const [state, setState] = useState<T>(initialState);
  const { announce } = useScreenReaderAnnouncement();

  const updateState = useCallback((newState: T) => {
    setState(newState);
    announce(`${stateName} changed to ${newState}`);
    onChange?.(newState);
  }, [stateName, announce, onChange]);

  return [state, updateState] as const;
};