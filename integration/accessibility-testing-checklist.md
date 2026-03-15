# Accessibility Testing Checklist

**Project:** Agent Monitor Dashboard  
**WCAG Level:** AA (2.1)  
**Last Tested:** March 14, 2026  
**Status:** ✅ Ready for Testing

---

## ✅ Pre-Testing Setup

### Tools to Install

```bash
# Browser extensions
- axe DevTools (Chrome/Firefox)
- WAVE (Chrome/Firefox)
- Accessibility Insights (Chrome)
- Color Contrast Analyzer (Chrome)

# CLI tools
npm install -g @axe-core/cli
npm install -g pa11y
npm install -g lighthouse
```

### Test Environment

- [ ] Clear browser cache
- [ ] Disable browser extensions (except a11y tools)
- [ ] Set viewport to 1920x1080
- [ ] Test in Chrome, Firefox, Safari
- [ ] Test on mobile (iOS Safari, Android Chrome)

---

## 📋 Manual Testing Checklist

### 1. Keyboard Navigation

#### Global Navigation
- [ ] Press `Tab` - focus moves through all interactive elements
- [ ] Press `Shift+Tab` - focus moves backward
- [ ] Press `Enter` on links - navigates to page
- [ ] Press `Space` on buttons - activates button
- [ ] Press `Escape` - closes mobile menu
- [ ] No keyboard traps encountered

**Test Path:**
1. Start at top of page
2. Tab through entire page
3. Count tab stops (should be logical)
4. Verify focus visible at all times
5. Verify focus order matches visual order

#### Mobile Menu
- [ ] Open menu with keyboard
- [ ] Tab through menu items
- [ ] Escape closes menu
- [ ] Focus returns to trigger button
- [ ] Menu state announced to screen reader

#### Agent Cards
- [ ] Card is focusable
- [ ] Action buttons are keyboard accessible
- [ ] Edit button toggles with keyboard
- [ ] Chat button activates with keyboard
- [ ] Detail link navigates with keyboard

**Expected Tab Order:**
1. Skip link
2. Navigation links
3. Connection status
4. Settings button
5. Agent cards (each card's actions)
6. Activity feed
7. Footer

---

### 2. Screen Reader Testing

#### VoiceOver (macOS)

**Setup:**
- Enable VoiceOver: `Cmd+F5`
- Open rotor: `Cmd+Option+U`
- Navigate by landmarks: `Cmd+Option+Arrow`

**Test Scenarios:**

##### Page Load
- [ ] Page title announced
- [ ] Skip link available
- [ ] Landmarks announced (navigation, main, etc.)
- [ ] Focus starts at top

**Commands:**
- `Cmd+Option+M` - Read from top
- `Cmd+Option+Right Arrow` - Next item
- `Cmd+Option+Left Arrow` - Previous item

##### Navigation
- [ ] Nav region announced
- [ ] Links read with purpose
- [ ] Current page identified ("Dashboard link, current page")
- [ ] Mobile menu state announced ("Open menu button, collapsed/expanded")

##### Agent Cards
- [ ] Card content read in logical order
- [ ] Agent name and emoji announced
- [ ] Status badge described ("Active status")
- [ ] Token usage announced ("Token usage: 45%")
- [ ] Action buttons labeled ("Chat with DuckBot button")

##### Activity Feed
- [ ] Feed region announced
- [ ] Event count mentioned
- [ ] New events announced (aria-live)
- [ ] Timestamps read clearly

##### Connection Status
- [ ] Status announced ("Connected")
- [ ] Changes announced when status updates
- [ ] Error messages read

**Voiceover Rotor Check:**
- [ ] Headings present and logical
- [ ] Landmarks properly labeled
- [ ] Links descriptive
- [ ] Form fields labeled

#### NVDA (Windows)

**Setup:**
- Download from nvaccess.org
- Enable with `Caps+N`

**Test Scenarios:**

##### Quick Navigation
- [ ] `H` - Navigate headings
- [ ] `B` - Navigate buttons
- [ ] `L` - Navigate links
- [ ] `R` - Navigate regions
- [ ] `Tab` - Navigate forward
- [ ] `Shift+Tab` - Navigate backward

##### Content Reading
- [ ] `Caps+Up` - Read line
- [ ] `Caps+M` - Read page
- [ ] `Caps+Space` - Activate element

##### Forms (Future)
- [ ] `F` - Navigate form fields
- [ ] Labels announced
- [ ] Errors described

#### TalkBack (Android)

**Setup:**
- Settings > Accessibility > TalkBack
- Enable with volume keys

**Test Scenarios:**
- [ ] Swipe right/left to navigate
- [ ] Double-tap to activate
- [ ] Content read in logical order
- [ ] Touch exploration works

---

### 3. Visual Testing

#### Color Contrast

**Tools:**
- WebAIM Contrast Checker: webaim.org/resources/contrastchecker
- Stark Plugin (Figma/Sketch)
- Color Oracle (color blindness simulator)

**Test Pairs:**

| Element | Foreground | Background | Required | Actual | Pass |
|---------|-----------|------------|----------|--------|------|
| Primary text | `#e0e0e0` | `#0a0a0f` | 4.5:1 | 16:1 | ✅ |
| Secondary text | `#888888` | `#0a0a0f` | 4.5:1 | 5.7:1 | ✅ |
| Accent primary | `#4FC3F7` | `#0a0a0f` | 3:1 | 8.2:1 | ✅ |
| Accent danger | `#EF5350` | `#0a0a0f` | 3:1 | 6.1:1 | ✅ |
| Focus ring | `#4FC3F7` | `#0a0a0f` | 3:1 | 8.2:1 | ✅ |

**Color Blindness Simulation:**
- [ ] Protanopia (red-blind) - test with Color Oracle
- [ ] Deuteranopia (green-blind) - test with Color Oracle
- [ ] Tritanopia (blue-blind) - test with Color Oracle
- [ ] Achromatopsia (monochromacy) - test with Color Oracle

**Key Check:**
- [ ] Status indicators not color-only (emoji + text present)
- [ ] Error states not color-only (icons + text present)
- [ ] Links distinguishable without color (hover states)

#### Focus Indicators

- [ ] All interactive elements have visible focus
- [ ] Focus rings are high contrast (3:1 minimum)
- [ ] Focus rings are 2px minimum width
- [ ] Focus visible in all themes
- [ ] Focus not obscured by other elements

#### Text Resizing

**Test Method:**
- Browser zoom: 200%
- Font size: 24px minimum

**Check:**
- [ ] Text readable at 200% zoom
- [ ] No text clipped or cut off
- [ ] Layout adapts without horizontal scroll
- [ ] All functionality available
- [ ] No loss of information

---

### 4. Cognitive Accessibility

#### Content Clarity

- [ ] Language is clear and simple
- [ ] Jargon explained or avoided
- [ ] Instructions are specific
- [ ] Error messages are helpful
- [ ] Consistent terminology used

#### Navigation

- [ ] Navigation is consistent across pages
- [ ] Current location is clear
- [ ] Breadcrumbs present (future)
- [ ] Search available (future)
- [ ] Sitemap available (future)

#### Predictability

- [ ] No unexpected changes on focus
- [ ] No unexpected changes on input
- [ ] Actions are reversible
- [ ] Confirmation for destructive actions
- [ ] Progress indicators for long operations

---

### 5. Dynamic Content

#### Live Regions

**Test Method:**
- Use screen reader
- Trigger updates

**Check:**
- [ ] Status changes announced
- [ ] New activity events announced
- [ ] Loading states communicated
- [ ] Announcements not too frequent
- [ ] Announcements not disruptive

#### Animations

**Test Method:**
- Enable `prefers-reduced-motion`
- Check animations

**Check:**
- [ ] Animations respect reduced motion
- [ ] No flashing content (>3 flashes/second)
- [ ] Auto-playing content can be paused
- [ ] Motion not essential for understanding

---

## 🤖 Automated Testing

### axe-core

```bash
# Install
npm install -g @axe-core/cli

# Run full audit
axe http://localhost:3000

# Check specific rules
axe http://localhost:3000 --rules color-contrast
axe http://localhost:3000 --rules aria-allowed-attr
axe http://localhost:3000 --rules button-name

# Output to file
axe http://localhost:3000 --output axe-report.json
```

**Expected Results:**
- [ ] 0 critical violations
- [ ] 0 serious violations
- [ ] <5 moderate violations
- [ ] <10 minor violations

### Lighthouse

```bash
# Run accessibility audit
lighthouse http://localhost:3000 --only-categories=accessibility

# Output to HTML
lighthouse http://localhost:3000 --only-categories=accessibility --output html
```

**Expected Score:**
- [ ] 90+ accessibility score
- [ ] All audits pass
- [ ] No manual audits failed

### pa11y

```bash
# Run accessibility test
pa11y http://localhost:3000

# Run with WCAG 2.1 AA standard
pa11y --standard WCAG2AA http://localhost:3000

# Output to JSON
pa11y --json http://localhost:3000 > pa11y-report.json
```

**Expected Results:**
- [ ] 0 errors
- [ ] <5 warnings
- [ ] <10 notices

---

## 📱 Mobile Testing

### iOS (Safari + VoiceOver)

**Setup:**
- iPhone or iPad
- VoiceOver enabled
- Safari browser

**Test Scenarios:**
- [ ] Page loads correctly
- [ ] Touch gestures work
- [ ] VoiceOver navigation works
- [ ] Content readable
- [ ] Forms usable
- [ ] No horizontal scroll

### Android (Chrome + TalkBack)

**Setup:**
- Android phone or tablet
- TalkBack enabled
- Chrome browser

**Test Scenarios:**
- [ ] Page loads correctly
- [ ] Touch gestures work
- [ ] TalkBack navigation works
- [ ] Content readable
- [ ] Forms usable
- [ ] No horizontal scroll

---

## 🎯 Issue Tracking Template

### Accessibility Issue Report

```markdown
## Issue: [Brief description]

**WCAG Criterion:** [e.g., 1.1.1 Non-text Content]
**Severity:** [Critical/serious/moderate/minor]
**Location:** [URL or component]

### Description
[Describe the issue]

### Impact
[Who is affected and how]

### Current Behavior
[What happens now]

### Expected Behavior
[What should happen]

### Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Tools Used
- [e.g., VoiceOver, axe-core, manual testing]

### Suggested Fix
[How to fix the issue]

### References
- [Link to WCAG criterion]
- [Link to best practices]
```

---

## 📊 Testing Report Template

### Accessibility Audit Report

**Date:** [Date]  
**Auditor:** [Name]  
**Scope:** [Pages/components tested]  
**Standard:** WCAG 2.1 AA

### Executive Summary

**Overall Status:** [Pass/Fail/Partial]  
**Critical Issues:** [Number]  
**Serious Issues:** [Number]  
**Moderate Issues:** [Number]  
**Minor Issues:** [Number]

### Test Results

| Category | Pass | Fail | Not Applicable |
|----------|------|------|----------------|
| Perceivable | [ ] | [ ] | [ ] |
| Operable | [ ] | [ ] | [ ] |
| Understandable | [ ] | [ ] | [ ] |
| Robust | [ ] | [ ] | [ ] |

### Critical Issues

[List critical issues with links to detailed reports]

### Recommendations

1. [Priority 1 recommendation]
2. [Priority 2 recommendation]
3. [Priority 3 recommendation]

### Next Steps

- [ ] Fix critical issues by [date]
- [ ] Fix serious issues by [date]
- [ ] Re-test by [date]
- [ ] Schedule next audit

---

## 🔄 Continuous Testing

### CI/CD Integration

Add to `.github/workflows/accessibility.yml`:

```yaml
name: Accessibility Testing

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  axe-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm run build
      - run: npm run start &
      - run: sleep 5
      - run: axe http://localhost:3000 --output axe-report.json
      - uses: actions/upload-artifact@v2
        with:
          name: axe-report
          path: axe-report.json

  lighthouse-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install -g lighthouse
      - run: lighthouse http://localhost:3000 --only-categories=accessibility --output json
      - uses: actions/upload-artifact@v2
        with:
          name: lighthouse-report
          path: *.report.json
```

### Scheduled Audits

- [ ] **Weekly:** Automated axe-core tests (CI/CD)
- [ ] **Monthly:** Manual keyboard testing
- [ ] **Quarterly:** Full screen reader testing
- [ ] **Bi-annually:** External accessibility audit

---

## ✅ Sign-off Checklist

Before marking accessibility as complete:

- [ ] All critical issues resolved
- [ ] All serious issues resolved
- [ ] Moderate issues documented with timeline
- [ ] Manual testing completed
- [ ] Automated tests passing
- [ ] Screen reader testing completed
- [ ] Mobile testing completed
- [ ] Documentation updated
- [ ] Team trained on accessibility
- [ ] Process established for ongoing testing

---

**Testing Completed:** [Date]  
**Tested By:** [Name]  
**Status:** [Pass/Fail]  
**Next Audit:** [Date]

---

## 📚 Resources

### Testing Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE](https://wave.webaim.org/)
- [Accessibility Insights](https://accessibilityinsights.io/)
- [Color Contrast Analyzer](https://www.tpgi.com/color-contrast-checker/)

### Guidelines
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

### Training
- [WebAIM Training](https://webaim.org/training/)
- [A11y Project](https://www.a11yproject.com/)
- [Inclusive Components](https://inclusive-components.design/)

---

**Last Updated:** March 14, 2026  
**Version:** 1.0.0  
**Maintained By:** DuckBot Team
