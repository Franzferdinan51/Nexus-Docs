/**
 * Accessibility Utilities for WCAG 2.1 AA Compliance
 * 
 * Provides ARIA labels, focus management, keyboard navigation,
 * and screen reader announcements for accessible UI components.
 */

// ============================================================================
// ARIA Label Utilities
// ============================================================================

/**
 * Generate ARIA label for icon-only buttons
 */
export function getIconLabel(
  action: string,
  context?: string,
  state?: string
): string {
  const parts = [action];
  if (context) parts.push(context);
  if (state) parts.push(`(${state})`);
  return parts.join(' ');
}

/**
 * Generate ARIA label for interactive elements with dynamic state
 */
export function getDynamicLabel(
  baseLabel: string,
  state: Record<string, string | number | boolean>
): string {
  const stateParts = Object.entries(state)
    .filter(([_, value]) => value !== '' && value !== false)
    .map(([key, value]) => `${key}: ${value}`);
  
  return stateParts.length > 0 
    ? `${baseLabel}, ${stateParts.join(', ')}`
    : baseLabel;
}

/**
 * Generate ARIA label for form fields with validation
 */
export function getFormFieldLabel(
  fieldName: string,
  required?: boolean,
  error?: string
): string {
  const parts = [fieldName];
  if (required) parts.push('required');
  if (error) parts.push(error);
  return parts.join(', ');
}

/**
 * Generate ARIA label for tabs and tab panels
 */
export function getTabLabel(
  tabName: string,
  position: number,
  total: number,
  isActive: boolean
): string {
  return `${tabName}, tab ${position} of ${total}${isActive ? ', selected' : ''}`;
}

/**
 * Generate ARIA label for dialogs and modals
 */
export function getDialogLabel(
  title: string,
  type: 'alert' | 'dialog' | 'alertdialog' = 'dialog'
): string {
  return `${title} ${type}`;
}

// ============================================================================
// Focus Management Utilities
// ============================================================================

/**
 * Trap focus within a container (for modals/dialogs)
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = getFocusableElements(container);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }

  container.addEventListener('keydown', handleKeyDown);
  
  // Focus first element
  firstElement?.focus();

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'button:not([disabled])',
    'a[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    'audio[controls]',
    'video[controls]',
    '[contenteditable]:not([contenteditable="false"])'
  ].join(', ');

  return Array.from(container.querySelectorAll(focusableSelectors));
}

/**
 * Restore focus to a previously focused element
 */
export function restoreFocus(element: HTMLElement | null): void {
  element?.focus();
}

/**
 * Save current focus for later restoration
 */
export function saveFocus(): HTMLElement | null {
  return document.activeElement as HTMLElement | null;
}

/**
 * Move focus to element by ID
 */
export function focusById(id: string): boolean {
  const element = document.getElementById(id);
  if (element) {
    element.focus();
    return true;
  }
  return false;
}

/**
 * Move focus to first error in form
 */
export function focusFirstError(container: HTMLElement): boolean {
  const errorElement = container.querySelector('[aria-invalid="true"], .error');
  if (errorElement) {
    (errorElement as HTMLElement).focus();
    return true;
  }
  return false;
}

// ============================================================================
// Keyboard Navigation Helpers
// ============================================================================

export interface KeyboardNavigationConfig {
  onEnter?: () => void;
  onEscape?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onTab?: () => void;
  onSpace?: () => void;
  customKeys?: Record<string, () => void>;
}

/**
 * Create keyboard navigation handler for components
 */
export function createKeyboardHandler(
  config: KeyboardNavigationConfig
): (event: KeyboardEvent) => void {
  return function handleKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Enter':
        if (config.onEnter) {
          event.preventDefault();
          config.onEnter();
        }
        break;
      case 'Escape':
        if (config.onEscape) {
          event.preventDefault();
          config.onEscape();
        }
        break;
      case 'ArrowUp':
        if (config.onArrowUp) {
          event.preventDefault();
          config.onArrowUp();
        }
        break;
      case 'ArrowDown':
        if (config.onArrowDown) {
          event.preventDefault();
          config.onArrowDown();
        }
        break;
      case 'ArrowLeft':
        if (config.onArrowLeft) {
          event.preventDefault();
          config.onArrowLeft();
        }
        break;
      case 'ArrowRight':
        if (config.onArrowRight) {
          event.preventDefault();
          config.onArrowRight();
        }
        break;
      case 'Tab':
        if (config.onTab) {
          config.onTab();
        }
        break;
      case ' ':
        if (config.onSpace) {
          event.preventDefault();
          config.onSpace();
        }
        break;
      default:
        // Check for custom key bindings
        if (config.customKeys?.[event.key]) {
          event.preventDefault();
          config.customKeys[event.key]();
        }
    }
  };
}

/**
 * Add keyboard navigation to a list/menu
 */
export function createListNavigation(
  items: HTMLElement[],
  options: {
    orientation?: 'vertical' | 'horizontal';
    wrap?: boolean;
    onSelect?: (index: number) => void;
  } = {}
): (event: KeyboardEvent) => void {
  let currentIndex = -1;
  const { orientation = 'vertical', wrap = true, onSelect } = options;

  function focusItem(index: number): void {
    if (index >= 0 && index < items.length) {
      items[index].focus();
      currentIndex = index;
    }
  }

  return function handleListNavigation(event: KeyboardEvent): void {
    const isVertical = orientation === 'vertical';
    
    switch (event.key) {
      case isVertical ? 'ArrowDown' : 'ArrowRight':
        event.preventDefault();
        if (currentIndex < items.length - 1) {
          focusItem(currentIndex + 1);
        } else if (wrap) {
          focusItem(0);
        }
        break;
      case isVertical ? 'ArrowUp' : 'ArrowLeft':
        event.preventDefault();
        if (currentIndex > 0) {
          focusItem(currentIndex - 1);
        } else if (wrap) {
          focusItem(items.length - 1);
        }
        break;
      case 'Home':
        event.preventDefault();
        focusItem(0);
        break;
      case 'End':
        event.preventDefault();
        focusItem(items.length - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (currentIndex >= 0 && onSelect) {
          onSelect(currentIndex);
        }
        break;
    }
  };
}

// ============================================================================
// Screen Reader Announcements
// ============================================================================

/**
 * Announce message to screen readers using aria-live region
 */
export function announce(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  // Get or create live region
  let liveRegion = document.getElementById('aria-live-region');
  
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'aria-live-region';
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.setAttribute('role', 'status');
    liveRegion.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
    document.body.appendChild(liveRegion);
  }

  // Update attributes if priority changed
  liveRegion.setAttribute('aria-live', priority);

  // Clear and set message (triggers announcement)
  liveRegion.textContent = '';
  setTimeout(() => {
    liveRegion.textContent = message;
  }, 100);
}

/**
 * Announce error to screen readers
 */
export function announceError(message: string): void {
  announce(message, 'assertive');
}

/**
 * Announce status change
 */
export function announceStatus(status: string): void {
  announce(`Status: ${status}`, 'polite');
}

/**
 * Announce page navigation
 */
export function announcePageChange(pageName: string): void {
  announce(`Navigated to ${pageName}`, 'polite');
}

/**
 * Announce form submission result
 */
export function announceFormResult(
  success: boolean,
  successMessage: string,
  errorMessage: string
): void {
  announce(success ? successMessage : errorMessage, success ? 'polite' : 'assertive');
}

// ============================================================================
// Skip Links
// ============================================================================

/**
 * Create skip link for keyboard users to bypass navigation
 */
export function createSkipLink(
  targetId: string,
  labelText: string = 'Skip to main content'
): HTMLAnchorElement {
  const link = document.createElement('a');
  link.href = `#${targetId}`;
  link.className = 'skip-link';
  link.textContent = labelText;
  link.setAttribute('role', 'link');
  
  // Style for skip link (visible on focus)
  link.style.cssText = `
    position: absolute;
    top: -40px;
    left: 0;
    background: #000;
    color: #fff;
    padding: 8px;
    z-index: 10000;
    text-decoration: none;
    font-weight: bold;
  `;
  
  link.addEventListener('focus', () => {
    link.style.top = '0';
  });
  
  link.addEventListener('blur', () => {
    link.style.top = '-40px';
  });

  return link;
}

/**
 * Add skip link to document
 */
export function addSkipLink(targetId: string, labelText?: string): void {
  const skipLink = createSkipLink(targetId, labelText);
  document.body.insertBefore(skipLink, document.body.firstChild);
}

// ============================================================================
// Color Contrast Utilities
// ============================================================================

/**
 * Calculate luminance of a color
 */
export function getLuminance(hexColor: string): number {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return 0;

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((val) => {
    val /= 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Check if color contrast meets WCAG 2.1 AA standard (4.5:1 for normal text)
 */
export function meetsContrastStandard(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  size: 'normal' | 'large' = 'normal'
): boolean {
  const ratio = getContrastRatio(foreground, background);
  
  // WCAG 2.1 AA requirements
  const thresholds = {
    AA: { normal: 4.5, large: 3 },
    AAA: { normal: 7, large: 4.5 }
  };
  
  return ratio >= thresholds[level][size];
}

/**
 * Convert hex to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null;
}

/**
 * Get accessible text color for a given background
 */
export function getAccessibleTextColor(backgroundColor: string): string {
  const luminance = getLuminance(backgroundColor);
  return luminance > 0.179 ? '#000000' : '#FFFFFF';
}

// ============================================================================
// Accessible Component Helpers
// ============================================================================

/**
 * Make a div behave like a button for accessibility
 */
export function makeButtonAccessible(element: HTMLElement): void {
  element.setAttribute('role', 'button');
  element.setAttribute('tabindex', '0');
  
  element.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      element.click();
    }
  });
}

/**
 * Add accessible tooltip to element
 */
export function addAccessibleTooltip(
  element: HTMLElement,
  description: string
): void {
  element.setAttribute('aria-describedby', `${element.id}-tooltip`);
  
  const tooltip = document.createElement('div');
  tooltip.id = `${element.id}-tooltip`;
  tooltip.className = 'sr-only';
  tooltip.textContent = description;
  tooltip.style.cssText = `
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  `;
  
  document.body.appendChild(tooltip);
}

/**
 * Mark element as loading for screen readers
 */
export function setLoadingState(
  element: HTMLElement,
  isLoading: boolean,
  loadingText?: string
): void {
  if (isLoading) {
    element.setAttribute('aria-busy', 'true');
    element.setAttribute('aria-label', loadingText || 'Loading');
  } else {
    element.removeAttribute('aria-busy');
    element.removeAttribute('aria-label');
  }
}

/**
 * Handle accessible accordion behavior
 */
export function createAccordionBehavior(
  headers: HTMLElement[],
  panels: HTMLElement[]
): void {
  headers.forEach((header, index) => {
    const panel = panels[index];
    const isExpanded = header.getAttribute('aria-expanded') === 'true';
    
    header.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    header.setAttribute('aria-controls', panel.id);
    
    header.addEventListener('click', () => {
      const expanded = header.getAttribute('aria-expanded') === 'true';
      header.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      panel.setAttribute('aria-hidden', expanded ? 'true' : 'false');
    });
    
    header.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        header.click();
      }
    });
  });
}

// ============================================================================
// Focus Visible Styles
// ============================================================================

/**
 * Inject focus visible styles into document
 */
export function injectFocusStyles(): void {
  const styleId = 'accessibility-focus-styles';
  
  // Don't add if already exists
  if (document.getElementById(styleId)) return;
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    /* Focus visible styles for keyboard navigation */
    *:focus-visible {
      outline: 2px solid #005fcc;
      outline-offset: 2px;
    }
    
    *:focus:not(:focus-visible) {
      outline: none;
    }
    
    /* High contrast focus for dark backgrounds */
    .dark *:focus-visible {
      outline: 2px solid #4dabf7;
      outline-offset: 2px;
    }
    
    /* Focus within for containers */
    .focus-within:focus-within {
      outline: 2px solid #005fcc;
      outline-offset: 2px;
    }
    
    /* Skip link styles */
    .skip-link {
      position: absolute;
      top: -40px;
      left: 0;
      background: #000;
      color: #fff;
      padding: 8px;
      z-index: 10000;
      text-decoration: none;
      font-weight: bold;
      transition: top 0.3s;
    }
    
    .skip-link:focus {
      top: 0;
    }
    
    /* Screen reader only content */
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `;
  
  document.head.appendChild(style);
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize accessibility features for the application
 */
export function initializeAccessibility(): void {
  // Inject focus styles
  injectFocusStyles();
  
  // Add skip link
  const mainContent = document.getElementById('main-content') || document.querySelector('main');
  if (mainContent) {
    mainContent.id = 'main-content';
    addSkipLink('main-content');
  }
  
  // Set document language if not set
  if (!document.documentElement.lang) {
    document.documentElement.lang = 'en';
  }
  
  console.log('✅ Accessibility features initialized');
}

// Auto-initialize if in browser environment
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAccessibility);
  } else {
    initializeAccessibility();
  }
}
