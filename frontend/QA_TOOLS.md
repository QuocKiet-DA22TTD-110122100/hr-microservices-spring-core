# QA Testing Tools Guide

## Browser DevTools

### Chrome DevTools
**Built-in features:**

#### Device Mode (Mobile Testing)
1. Open DevTools: `F12` or `Ctrl+Shift+I`
2. Toggle device toolbar: `Ctrl+Shift+M`
3. Select device or custom size
4. Test responsive layouts

**Useful devices:**
- iPhone SE (375x667)
- iPhone 12 Pro (390x844)
- iPad (768x1024)
- iPad Pro (1024x1366)

#### Lighthouse (Accessibility Audit)
1. Open DevTools → Lighthouse tab
2. Select categories:
   - ✅ Performance
   - ✅ Accessibility
   - ✅ Best Practices
   - ✅ SEO
3. Click "Generate report"
4. Review issues

**Key Metrics:**
- Accessibility score (target: 90+)
- Color contrast issues
- ARIA issues
- Form label issues

#### Elements Inspector
1. Right-click element → Inspect
2. Check HTML structure
3. Verify ARIA attributes
4. Check computed styles

**Accessibility Tree:**
1. Elements tab → Accessibility pane
2. View how screen readers see elements

### Firefox DevTools
Similar to Chrome, with additional:
- Better CSS Grid tools
- Font debugging

### Safari Web Inspector
For macOS/iOS testing:
1. Develop menu → Show Web Inspector
2. Similar to Chrome DevTools

---

## Screen Readers

### 1. NVDA (Free - Windows)

**Download:** https://www.nvaccess.org/download/

**Installation:**
1. Download installer
2. Run installer
3. Reboot system

**Usage:**
- Start: `Ctrl+Alt+N`
- Stop: `Insert+Q`
- Navigate: Use arrow keys and Tab
- Read current line: `Insert+Up Arrow`
- Read from here: `Insert+Down Arrow`

**Essential Keys:**
- `NVDA+T`: Read title
- `NVDA+B`: Read status bar
- `H`: Next heading
- `Shift+H`: Previous heading
- `K`: Next link
- `F`: Next form field
- `B`: Next button

**Test Checklist:**
- [ ] Page title reads correctly
- [ ] Headings announce with level
- [ ] Links announce text
- [ ] Buttons announce label
- [ ] Form fields announce label
- [ ] Errors announce
- [ ] Success messages announce

### 2. ChromeVox (Free - Chrome Extension)

**Installation:**
1. Chrome Web Store → Search "ChromeVox"
2. Add to Chrome
3. Enable extension

**Usage:**
- Activate: Click extension icon
- Navigate: Arrow keys
- Next element: `Tab`
- Announce: Automatic

**Advantages:**
- Easy to install
- Cross-platform
- Good for quick testing

### 3. VoiceOver (Built-in - macOS/iOS)

**macOS:**
- Activate: `Cmd+F5`
- Navigate: `VO+Arrow keys` (VO = Ctrl+Option)
- Web rotor: `VO+U`

**iOS:**
- Settings → Accessibility → VoiceOver → On
- Navigate: Swipe left/right
- Activate: Double tap

### 4. JAWS (Paid - Windows)

**Download:** https://www.freedomscientific.com/

**Free version:** 40 minutes per session

**Most used by blind users, gold standard for testing**

---

## Accessibility Testing Tools

### 1. axe DevTools (Free Chrome Extension)

**Installation:**
- Chrome Web Store → "axe DevTools"

**Usage:**
1. Open DevTools
2. Go to "axe DevTools" tab
3. Click "Scan ALL of my page"
4. Review issues by severity

**Features:**
- Automatic issue detection
- Issue descriptions
- How to fix suggestions
- WCAG level indicators

### 2. WAVE (Free Web Tool)

**URL:** https://wave.webaim.org/

**Usage:**
1. Enter website URL
2. View visual report
3. Check errors, alerts, features

**Features:**
- Visual overlay of issues
- Color coding
- Detailed explanations

### 3. Lighthouse (Built-in Chrome)

**Already covered above**

### 4. Accessibility Insights (Free - Microsoft)

**Download:** https://accessibilityinsights.io/

**Features:**
- Fast Pass (automated tests)
- Assessment (manual tests)
- Highlighting tool
- Tab stops visualization

---

## Color Contrast Tools

### 1. WebAIM Contrast Checker

**URL:** https://webaim.org/resources/contrastchecker/

**Usage:**
1. Enter foreground color
2. Enter background color
3. Check WCAG compliance

**Requirements:**
- Normal text: 4.5:1 (AA), 7:1 (AAA)
- Large text: 3:1 (AA), 4.5:1 (AAA)

### 2. Chrome DevTools Contrast Checker

**Built-in:**
1. Inspect element
2. Color picker in Styles pane
3. Shows contrast ratio
4. Indicates WCAG pass/fail

### 3. Colorblind Simulator

**Chrome Extension:** "Colorblinding"

**Simulates:**
- Protanopia (red-blind)
- Deuteranopia (green-blind)
- Tritanopia (blue-blind)
- Achromatopsia (total color blind)

---

## Mobile Testing Tools

### 1. Chrome DevTools Device Mode
Already covered above.

### 2. BrowserStack (Paid)

**URL:** https://www.browserstack.com/

**Features:**
- Real device testing
- Multiple OS versions
- Screenshots/videos
- Automated testing

### 3. Responsive Design Checker

**URL:** https://responsivedesignchecker.com/

**Features:**
- Quick multi-device view
- Common device sizes
- Side-by-side comparison

### 4. Physical Devices

**Recommended:**
- iPhone (iOS)
- Android phone
- iPad
- Android tablet

---

## Performance Testing

### 1. Lighthouse (Chrome DevTools)
- Performance score
- First Contentful Paint
- Largest Contentful Paint
- Time to Interactive
- Cumulative Layout Shift

### 2. WebPageTest

**URL:** https://www.webpagetest.org/

**Features:**
- Real browser testing
- Multiple locations
- Video capture
- Detailed metrics

### 3. Chrome DevTools Performance Tab

**Usage:**
1. Open DevTools → Performance
2. Click Record
3. Interact with page
4. Stop recording
5. Analyze timeline

---

## Keyboard Testing

### Essential Keys to Test

**Navigation:**
- `Tab` - Next focusable element
- `Shift+Tab` - Previous focusable element
- `Enter` - Activate link/button
- `Space` - Activate button/toggle checkbox
- `Esc` - Close modal/dropdown
- `Arrow keys` - Navigate within component

**Advanced:**
- `Home` - Jump to start
- `End` - Jump to end
- `Page Up/Down` - Scroll
- `Ctrl+Home` - Top of page
- `Ctrl+End` - Bottom of page

### Focus Indicator Testing

**Check:**
- Visible outline on focus
- Sufficient contrast (3:1)
- Not removed by CSS
- Works on all backgrounds

### Keyboard Trap Testing

**Test:**
- Can you Tab out of all components?
- Modals trap focus correctly?
- No infinite loops?

---

## Cross-Browser Testing

### Manual Testing

**Test on:**
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

**For each browser:**
- Visual rendering
- Functionality
- Console errors
- Performance

### Automated Testing

**BrowserStack:** Multi-browser cloud testing
**Sauce Labs:** Similar to BrowserStack
**LambdaTest:** Cloud testing platform

---

## Validation Tools

### 1. HTML Validator

**URL:** https://validator.w3.org/

**Checks:**
- Valid HTML5
- Proper nesting
- Closed tags
- Valid attributes

### 2. CSS Validator

**URL:** https://jigsaw.w3.org/css-validator/

**Checks:**
- Valid CSS
- Browser compatibility
- Syntax errors

### 3. Link Checker

**URL:** https://validator.w3.org/checklink

**Checks:**
- Broken links
- Redirects
- External links

---

## Testing Checklist Workflow

### Step 1: Automated Testing
1. Run Lighthouse audit
2. Run axe DevTools scan
3. Check HTML validator
4. Review console errors

### Step 2: Keyboard Testing
1. Tab through entire page
2. Test all forms
3. Test all modals
4. Check focus indicators

### Step 3: Screen Reader Testing
1. Test with NVDA (Windows)
2. Test with VoiceOver (Mac)
3. Check announcements
4. Verify labels

### Step 4: Mobile Testing
1. Test on Chrome DevTools devices
2. Test on physical devices (if available)
3. Check touch targets
4. Check text readability

### Step 5: Cross-Browser Testing
1. Test on Chrome
2. Test on Firefox
3. Test on Safari (if Mac available)
4. Test on Edge

### Step 6: Manual QA
1. Follow QA_CHECKLIST.md
2. Test all CRUD operations
3. Test error scenarios
4. Document issues

---

## Issue Priority Guidelines

### Critical (P0)
- Application crash
- Data loss
- Security vulnerability
- Cannot complete primary tasks

### High (P1)
- Major feature broken
- Accessibility blocker
- Incorrect data displayed
- Performance severely degraded

### Medium (P2)
- Minor feature issue
- UI inconsistency
- Accessibility warning
- Non-critical error

### Low (P3)
- Cosmetic issue
- Enhancement
- Nice-to-have feature
- Documentation

---

## Recommended Testing Schedule

### Daily (During Development)
- Run automated tests
- Check console errors
- Quick smoke test

### Weekly
- Full regression testing
- Accessibility audit
- Mobile responsive check

### Before Release
- Complete QA checklist
- Cross-browser testing
- Performance testing
- Security review

### After Release
- Smoke test production
- Monitor error logs
- User feedback review

---

## Resources

### Documentation
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM Articles](https://webaim.org/articles/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)

### Communities
- [WebAIM Forum](https://webaim.org/discussion/)
- [A11y Slack](https://web-a11y.slack.com/)
- [Stack Overflow Accessibility](https://stackoverflow.com/questions/tagged/accessibility)

### Tools List
- [List of Accessibility Tools](https://www.w3.org/WAI/ER/tools/)
- [Chrome Accessibility Extensions](https://chrome.google.com/webstore/search/accessibility)

### Training
- [Free Accessibility Course (Udacity)](https://www.udacity.com/course/web-accessibility--ud891)
- [Deque University](https://dequeuniversity.com/)
- [WebAIM Training](https://webaim.org/training/)
