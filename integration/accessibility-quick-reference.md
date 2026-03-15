# Accessibility Quick Reference Guide

**For:** Agent Monitor Developers  
**Version:** 1.0.0  
**Last Updated:** March 14, 2026

---

## 🎯 Quick Wins (5 Minutes)

### 1. Add ARIA Labels to Icons

```tsx
// ❌ Before
<button>⚙️</button>

// ✅ After
<button aria-label="Open settings">⚙️</button>
```

### 2. Make Divs Keyboard Accessible

```tsx
// ❌ Before
<div onClick={handleClick}>Click me</div>

// ✅ After
<button onClick={handleClick}>Click me</button>

// Or if you must use div:
<div 
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') handleClick()
  }}
>
  Click me
</div>
```

### 3. Add Alt Text to Images

```tsx
// ❌ Before
<img src="/logo.png" />

// ✅ After
<img src="/logo.png" alt="DuckBot Dashboard Logo" />

// Decorative image
<img src="/decorative.png" alt="" aria-hidden="true" />
```

### 4. Add Focus Styles

```css
/* Add to globals.css */
*:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}
```

### 5. Use Semantic HTML

```tsx
// ❌ Before
<div class="nav">...</div>
<div class="main">...</div>
<div class="article">...</div>

// ✅ After
<nav>...</nav>
<main>...</main>
<article>...</article>
```

---

## 🏷️ ARIA Labels Cheat Sheet

### Common UI Elements

| Element | ARIA Label Example |
|---------|-------------------|
| Close button | `aria-label="Close dialog"` |
| Settings button | `aria-label="Open settings"` |
| Search button | `aria-label="Search"` |
| Menu button | `aria-label="Toggle menu" aria-expanded={isOpen}` |
| Icon link | `aria-label="View profile"` |
| Avatar | `aria-label="John Doe's avatar" role="img"` |
| Status indicator | `role="status" aria-label="Online"` |
| Loading spinner | `aria-label="Loading" role="progressbar"` |

### Forms

| Element | ARIA Label Example |
|---------|-------------------|
| Input field | `<label htmlFor="email">Email</label><input id="email" />` |
| Required field | `aria-required="true"` |
| Invalid field | `aria-invalid="true" aria-describedby="email-error"` |
| Error message | `id="email-error" role="alert"` |
| Help text | `aria-describedby="email-help"` |

### Navigation

| Element | ARIA Label Example |
|---------|-------------------|
| Main nav | `<nav aria-label="Main navigation">` |
| Breadcrumb | `<nav aria-label="Breadcrumb">` |
| Current page | `aria-current="page"` |
| Tab list | `role="tablist" aria-label="Account settings"` |
| Tab | `role="tab" aria-selected={isActive}` |
| Tab panel | `role="tabpanel" aria-labelledby={tabId}` |

### Dynamic Content

| Element | ARIA Label Example |
|---------|-------------------|
| Live region | `role="status" aria-live="polite"` |
| Alert | `role="alert" aria-live="assertive"` |
| Loading | `aria-busy="true"` |
| Progress | `role="progressbar" aria-valuenow={50} aria-valuemin={0} aria-valuemax={100}` |

---

## ⌨️ Keyboard Navigation Patterns

### Basic Pattern

```tsx
import { createKeyboardHandler } from '@/lib/accessibility';

function MyComponent() {
  const handleKeyDown = createKeyboardHandler({
    onEnter: () => handleAction(),
    onEscape: () => handleClose(),
    onSpace: () => handleToggle(),
  });

  return (
    <button onKeyDown={handleKeyDown}>
      Action
    </button>
  );
}
```

### List Navigation

```tsx
import { createListNavigation } from '@/lib/accessibility';

function MyList({ items }) {
  const itemRefs = useRef([]);
  
  const handleKeyDown = createListNavigation(
    itemRefs.current,
    {
      orientation: 'vertical',
      wrap: true,
      onSelect: (index) => handleSelect(items[index]),
    }
  );

  return (
    <ul onKeyDown={handleKeyDown}>
      {items.map((item, index) => (
        <li 
          key={item.id}
          ref={el => itemRefs.current[index] = el}
          tabIndex={-1}
        >
          {item.name}
        </li>
      ))}
    </ul>
  );
}
```

### Focus Trap (Modals)

```tsx
import { trapFocus, saveFocus, restoreFocus } from '@/lib/accessibility';

function Modal({ isOpen, onClose }) {
  const modalRef = useRef();
  const previousFocus = useRef();

  useEffect(() => {
    if (isOpen) {
      previousFocus.current = saveFocus();
      const cleanup = trapFocus(modalRef.current);
      return () => {
        cleanup();
        restoreFocus(previousFocus.current);
      };
    }
  }, [isOpen]);

  return (
    <div ref={modalRef} role="dialog" aria-modal="true">
      {/* Modal content */}
      <button onClick={onClose}>Close</button>
    </div>
  );
}
```

---

## 📢 Screen Reader Announcements

### Basic Announcement

```tsx
import { announce } from '@/lib/accessibility';

function MyComponent() {
  const handleSave = () => {
    // Save data...
    announce('Settings saved successfully', 'polite');
  };

  const handleError = () => {
    announce('Error: Unable to save settings', 'assertive');
  };

  return (
    <button onClick={handleSave}>Save</button>
  );
}
```

### Status Updates

```tsx
import { announceStatus, announcePageChange } from '@/lib/accessibility';

function Dashboard() {
  useEffect(() => {
    announcePageChange('Dashboard');
  }, []);

  const handleRefresh = () => {
    announceStatus('Refreshing data...');
    refreshData().then(() => {
      announceStatus('Data refreshed');
    });
  };

  return <button onClick={handleRefresh}>Refresh</button>;
}
```

---

## 🎨 Color Contrast

### Check Contrast Programmatically

```tsx
import { getContrastRatio, meetsContrastStandard } from '@/lib/accessibility';

const foreground = '#e0e0e0';
const background = '#0a0a0f';

const ratio = getContrastRatio(foreground, background);
console.log(`Contrast ratio: ${ratio}:1`);

const passes = meetsContrastStandard(foreground, background, 'AA', 'normal');
console.log(`Passes WCAG AA: ${passes}`);
```

### Get Accessible Text Color

```tsx
import { getAccessibleTextColor } from '@/lib/accessibility';

function ColoredCard({ backgroundColor, children }) {
  const textColor = getAccessibleTextColor(backgroundColor);
  
  return (
    <div style={{ backgroundColor, color: textColor }}>
      {children}
    </div>
  );
}
```

---

## ♿ Reduced Motion

### Respect User Preferences

```css
/* In globals.css */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

```tsx
// In components
<div className="animate-ping motion-reduce:animate-none" />
```

---

## 🧪 Testing Checklist

### Before Committing

- [ ] All interactive elements keyboard accessible
- [ ] All icons have aria-labels
- [ ] All images have alt text (or are marked decorative)
- [ ] Focus is visible on all interactive elements
- [ ] Color contrast passes 4.5:1
- [ ] Screen reader can navigate content
- [ ] No keyboard traps
- [ ] Reduced motion respected

### Quick Test Commands

```bash
# Run axe-core
npx axe http://localhost:3000

# Run Lighthouse
npx lighthouse http://localhost:3000 --only-categories=accessibility

# Run pa11y
npx pa11y http://localhost:3000
```

### Manual Testing

#### Keyboard Test (2 minutes)
1. Press `Tab` - does focus move logically?
2. Press `Enter` on links - do they navigate?
3. Press `Space` on buttons - do they activate?
4. Press `Escape` - does it close modals/menus?
5. Can you navigate entire page without mouse?

#### Screen Reader Test (5 minutes)
1. Enable VoiceOver (`Cmd+F5`) or NVDA
2. Navigate with rotor (`Cmd+Option+U`)
3. Check headings are logical
4. Check links are descriptive
5. Check forms have labels
6. Check dynamic updates are announced

---

## 🚫 Common Mistakes

### ❌ Don't Do This

```tsx
// Missing aria-label on icon button
<button>🔍</button>

// Div instead of button
<div onClick={handleClick}>Click me</div>

// Missing focus styles
button:focus {
  outline: none;
}

// Color-only information
<span style={{ color: 'red' }}>Error</span>

// Auto-playing media
<video autoPlay />

// Missing form labels
<input type="email" placeholder="Email" />
```

### ✅ Do This Instead

```tsx
// Add aria-label
<button aria-label="Search">🔍</button>

// Use button element
<button onClick={handleClick}>Click me</button>

// Add focus styles
button:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

// Add icon/text
<span style={{ color: 'red' }}>⚠️ Error</span>

// Add controls
<video controls />

// Add label
<label htmlFor="email">Email</label>
<input id="email" type="email" />
```

---

## 📚 Resources

### Quick Reference
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

### Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE](https://wave.webaim.org/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Color Oracle](https://colororacle.org/)

### Training
- [WebAIM Training](https://webaim.org/training/)
- [A11y Project](https://www.a11yproject.com/)
- [Inclusive Components](https://inclusive-components.design/)

---

## 🆘 Getting Help

### Internal Resources
- **Accessibility Champion:** DuckBot Team
- **Documentation:** `/integration/accessibility-*.md`
- **Utilities:** `src/lib/accessibility.ts`

### External Resources
- **Stack Overflow:** Tag questions with `accessibility`, `a11y`, `wcag`
- **GitHub Issues:** Report accessibility issues with `accessibility` label
- **WebAIM Community:** community.webaim.org

---

**Remember:** Accessibility is not a feature, it's a fundamental requirement. Build it in from the start, not as an afterthought.

**Last Updated:** March 14, 2026  
**Version:** 1.0.0
