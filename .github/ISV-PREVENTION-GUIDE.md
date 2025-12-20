# 🚨 STOP! Read This Before Using `style={{}}`

## You're About to Add an Inline Style Virus (ISV)

If you're reading this, you probably just tried to use `style={{}}` and got blocked by our protection system. **Good!** That means the system is working.

---

## ⚡ Quick Fix (90% of cases)

**Instead of this:**
```tsx
❌ <div style={{ padding: '10px', color: '#333' }}>
```

**Do this:**
```tsx
✅ <div className="my-component">
```

**Then create/update the CSS file:**
```css
/* mycomponent.css */
.my-component {
  padding: 10px;
  color: #333;
}
```

---

## 🎯 Why No Inline Styles?

1. **Performance**: CSS classes are cached by browsers, inline styles are not
2. **Maintainability**: Changes in one place vs scattered across files
3. **Consistency**: Ensures FUSE-STYLE architecture compliance
4. **Scalability**: 100K users need optimized CSS delivery

---

## 🔍 Common Cases & Solutions

### Case 1: Static Styling
```tsx
// ❌ DON'T
<button style={{ padding: '12px', backgroundColor: '#ff4400' }}>

// ✅ DO
<button className="submit-button">
```

### Case 2: Hover States
```tsx
// ❌ DON'T
<div
  onMouseEnter={(e) => e.target.style.opacity = '0.8'}
  onMouseLeave={(e) => e.target.style.opacity = '1'}
>

// ✅ DO - Let CSS handle it
<div className="hover-effect">

/* CSS */
.hover-effect:hover {
  opacity: 0.8;
}
```

### Case 3: Conditional Styling
```tsx
// ❌ DON'T
<div style={{
  backgroundColor: isActive ? '#green' : '#gray'
}}>

// ✅ DO - Use CSS classes
<div className={isActive ? 'card--active' : 'card--inactive'}>

/* CSS */
.card--active {
  background-color: green;
}

.card--inactive {
  background-color: gray;
}
```

### Case 4: Variant Colors
```tsx
// ❌ DON'T
<div style={{
  color: variant === 'success' ? '#10b981' : '#ef4444'
}}>

// ✅ DO - Use modifier classes
<div className={`alert alert--${variant}`}>

/* CSS */
.alert--success {
  color: #10b981;
}

.alert--error {
  color: #ef4444;
}
```

---

## 🎓 When IS Inline Style Allowed?

Only for **runtime-calculated values** (Dynamic Law):

### ✅ Example 1: Animation Transforms
```tsx
// Position calculated from getBoundingClientRect()
<div style={{
  position: 'fixed',
  left: position.x,  // ✅ Runtime value
  top: position.y    // ✅ Runtime value
}} />
```

### ✅ Example 2: Portal Positioning
```tsx
// Tooltip position calculated dynamically
createPortal(
  <div style={{
    top: `${coords.top}px`,     // ✅ Runtime calculation
    left: `${coords.left}px`    // ✅ Runtime calculation
  }} />,
  document.body
)
```

### ✅ Example 3: CSS Custom Property Bridges
```tsx
// User-configurable width passed to CSS
<div style={{
  '--sidebar-width': `${userWidth}px`  // ✅ Dynamic config
} as React.CSSProperties} />
```

**If your case doesn't match these patterns, use CSS classes!**

---

## 🛠️ Step-by-Step Fix Process

1. **Identify your use case** (90% are static values = use CSS)

2. **Create CSS file if needed:**
   ```bash
   touch src/components/mycomponent.css  # lowercase!
   ```

3. **Import in component:**
   ```tsx
   import './mycomponent.css';
   ```

4. **Extract styles to CSS:**
   ```css
   .my-component {
     /* Your styles here */
   }
   ```

5. **Use className:**
   ```tsx
   <div className="my-component">
   ```

6. **Test:**
   ```bash
   npm run check:isv
   ```

---

## 🚫 ISV Protection Will Block You At:

1. **Editor Level** - ESLint red squiggles
2. **Commit Level** - Pre-commit hook rejection
3. **Build Level** - CI/CD failure

**You can't bypass this without approval!**

---

## 📞 Need Help?

1. **Check examples:** `ISVEA-REPORT.md` has 658 real cleanup examples
2. **Check exceptions:** `ISVEA-EXCEPTIONS.md` shows allowed patterns
3. **Ask the team:** If truly stuck, ask in chat
4. **Read architecture:** `~/Apps/~Transfoorm-SDK/02-FUSE-STYLE-ARCHITECTURE.md`

---

## 💡 Pro Tips

- **Use CSS Custom Properties** for theme values: `var(--brand-primary)`
- **Use Tailwind utilities** for quick prototyping (then extract to CSS)
- **BEM naming** for clarity: `.component__element--modifier`
- **Lowercase CSS files** per FUSE-STYLE convention

---

## 🎯 Remember

> "The best inline style is no inline style."

After 658 violations cleaned across 44 files, we've proven CSS classes are:
- ✅ Faster
- ✅ More maintainable
- ✅ More scalable
- ✅ FUSE-STYLE compliant

**Don't undo that work. Use CSS classes.**

---

**Questions?** Read `ISV-PROTECTION.md` for full documentation.

**Status:** 🛡️ Protected by ISV Prevention System v1.0
