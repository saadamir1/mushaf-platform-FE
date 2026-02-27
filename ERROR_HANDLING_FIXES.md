# Error Handling — Full Iteration History & Post-Mortem

## The Constraint Everything Revolves Around

Before the timeline, one rule must be understood because every bug in this system
violated it in some way:

> **A React Error Boundary can only catch errors thrown during the render/lifecycle
> of its CHILD components — never its own render(), and never errors from outside
> React's call stack (setTimeout, event handlers, Promise rejections, window.onerror).**

| Source | Caught by boundary? |
|---|---|
| Child component `render()` throws | ✅ Yes |
| Child component `componentDidMount()` throws | ✅ Yes |
| `setTimeout(() => { throw ... })` | ❌ No — outside React's call stack |
| `onClick` event handler throws | ❌ No — outside React's render cycle |
| `window.onerror` / `unhandledrejection` | ❌ No — browser-level, not React |
| Boundary's own `render()` throws | ❌ No — propagates upward past the boundary |

---

## Stage 1 — The Original Broken Code (Before Anyone Touched It)

The codebase had three files wired together:

- `errorHandler.js` — a `GlobalErrorHandler` singleton listening to `window.onerror`
  and `unhandledrejection`, forwarding errors to a registered React error boundary
- `RobustErrorBoundary.js` — a class component error boundary that registered itself
  with the global handler and showed a fallback UI
- `ErrorTest.js` — a test page with two buttons: a red one that threw from a
  `setTimeout`, and a green one that called `triggerErrorBoundary()` directly

### What was broken

**Red button** (`setTimeout` throw):
- Threw `new Error(...)` inside a `setTimeout` callback
- `window.addEventListener('error', ...)` caught it and called
  `errorBoundary.handleGlobalError(error)`
- But `handleGlobalError` checked `this._isMounted` — which was **always `false`**
  because the boundary registered itself in its **constructor**, before
  `componentDidMount` had ever fired
- Result: logged "Component not mounted, cannot handle error", error dropped, no UI

**Green button** (`triggerErrorBoundary()` call):
- Called `this.setState(...)` on the boundary
- React warned: **"Can't call setState on a component that is not yet mounted"**
  — same root cause, constructor-time registration meant the component reference
  existed but React hadn't mounted it yet
- Result: warning in console, no UI

**The registration timing bug in one line:**
```js
// constructor — WRONG. _isMounted is false here. setState is unsafe here.
constructor(props) {
    window.globalErrorHandler.setErrorBoundary(this); // registered too early
}
```

---

## Stage 2 — Cline (VS Code Extension) Makes an Attempt

Cline analysed the errors and produced a set of fixes, along with the original
README (`Error Handling Fixes - Implementation Summary`) documenting its changes.

### What Cline correctly identified
- ✅ That multiple boundary instances were registering and conflicting
- ✅ That error overlay hiding needed to be more selective
- ✅ That `isHandlingError` state needed better management
- ✅ That async error throwing needed mount-state checking

### What Cline got right
- Added `isRegistered` flag to prevent duplicate registrations
- Added `isMountedRef` in `ErrorTest` to guard the `setTimeout` throw
- Improved the DOM overlay-hiding logic to be less aggressive
- Added error deduplication with a `Set`

### What Cline did NOT fix (the core bugs remained)
- ❌ Registration was still happening in the **constructor** — the root cause of both
  the "not mounted" and "can't setState" bugs was untouched
- ❌ `triggerErrorBoundary()` was still calling `this.setState()` directly in a way
  that React would warn about
- ❌ No fix for the fact that `setTimeout` throws can never be caught by a boundary
  naturally — the architectural mismatch between "global error" and "React boundary"
  was not resolved

### State after Cline
The app was still showing:
- "Component not mounted, cannot handle error" on red button press
- "Can't call setState on unmounted component" warning on green button press
- No error boundary UI appearing for either button

---

## Stage 3 — Claude Round 1

The code and console logs were shared. Claude diagnosed the root causes and
produced updated versions of all three files.

### What Claude correctly identified
- ✅ Constructor registration as the root cause of the mount timing bug
- ✅ That `setState` must only be called after `componentDidMount`
- ✅ That `isHandlingError` boolean was a race condition — replaced with Set deduplication
- ✅ That `setTimeout(() => { throw error }, 0)` as a fallback was actively harmful
  (a `setTimeout` throw can never be caught by any boundary or try/catch — it always
  surfaces as an uncaught error, making things worse)
- ✅ That `event.preventDefault()` was needed to suppress "Uncaught Error" browser logs

### What Claude fixed
- Moved registration from `constructor` → `componentDidMount`
- Added `_pendingError` queue: errors arriving before mount are stored and flushed
  when `componentDidMount` fires
- Replaced `isHandlingError` boolean with `handledErrors = new Set()` — deduplicates
  the same error object if it fires twice (e.g. both `window.onerror` and the `error`
  event for the same throw), but allows different errors through
- Added `event.preventDefault()` on both `error` and `unhandledrejection` listeners
- Removed the `setTimeout(() => throw ...)` fallback entirely
- Added `_isMounted` queue flush in `componentDidMount`

### What Claude got wrong (introduced two new bugs)

**New Bug A — `pendingTriggerError` / throw-in-render (green button → white screen)**

To fix `triggerErrorBoundary()`, Claude introduced a `pendingTriggerError` state
field. When set, `render()` would throw it:

```js
render() {
    if (this.state.pendingTriggerError) {
        throw this.state.pendingTriggerError; // ← WRONG
    }
    // ...
}
```

This violated the core constraint: **a boundary cannot catch its own render errors**.
The throw escaped past `RobustErrorBoundary` upward to `App`, which had no boundary
above it, crashing the entire tree to a white screen. React also warned:
"Cannot update during an existing state transition (such as within render)."

**New Bug B — capture phase on error listener (red button → white screen)**

```js
window.addEventListener('error', (event) => {
    event.preventDefault();
    this.handleGlobalError(event.error);
}, true); // ← the `true` (capture phase) was WRONG
```

The third argument `true` puts the listener in **capture phase**, which fires
*before* React's own internal error listeners. React uses those internal listeners
during reconciliation to route errors to the correct boundary. By intercepting in
capture phase, the handler ran and called `preventDefault()` before React could
process the error through its own system — breaking React's error boundary routing
entirely. The component tree was left in a broken half-rendered state: white screen.

### State after Claude Round 1
- Registration timing: ✅ fixed
- Red button "not mounted": ✅ fixed  
- Green button: ❌ white screen (new bug — throw-in-render)
- Red button: ❌ white screen (new bug — capture phase)

---

## Stage 4 — Claude Round 2 (After Seeing the New White Screen Screenshot)

The screenshot showed both buttons now causing white screens with new warnings.
Claude diagnosed both new bugs and issued a second round of fixes.

### Fix for Bug A — The `ErrorThrower` child pattern

Instead of throwing inside the boundary's own `render()`, introduce a tiny child
component that does the throwing:

```jsx
// Lives OUTSIDE the class — it's a child, not the boundary itself
const ErrorThrower = ({ error }) => {
    if (error) throw error;
    return null;
};

// Inside RobustErrorBoundary.render():
return (
    <>
        {/* When triggerError is set, this CHILD throws.
            RobustErrorBoundary (the PARENT) catches it via getDerivedStateFromError.
            A boundary catches CHILD errors — not its own. */}
        <ErrorThrower error={this.state.triggerError} />
        {this.props.children}
    </>
);
```

`getDerivedStateFromError` also clears `triggerError: null` so `ErrorThrower`
stops throwing on subsequent re-renders:

```js
static getDerivedStateFromError(error) {
    return { hasError: true, error, showFallback: true, triggerError: null };
}
```

### Fix for Bug B — Remove capture phase

```js
// Before (broken):
window.addEventListener('error', handler, true);  // capture phase

// After (correct):
window.addEventListener('error', handler);  // bubble phase (default)
```

Bubble phase fires *after* React's own handlers complete. `event.preventDefault()`
in bubble phase still suppresses the "Uncaught Error" console log without touching
React's internals.

### State after Claude Round 2
- Green button: ✅ `ErrorThrower` pattern works, no warnings, no white screen
- Red button: ✅ bubble phase works, `setState` fires, state confirmed updated
- BUT: UI was still not always rendering correctly in some theme/context scenarios

---

## Stage 5 — VS Code Copilot (Final Fix)

With the core architecture now correct, Copilot made the remaining fixes that got
the UI actually appearing reliably.

### What Copilot fixed

**1. Integrated theme context into `RobustErrorBoundary`**

The component was importing `useTheme` and `COLORS` but not using them in the
error fallback render — so in dark mode the error UI appeared with wrong colours
or sometimes not at all due to CSS variable conflicts.

**2. Removed the aggressive `querySelectorAll('*')` DOM sweep**

Both `errorHandler.js` and `RobustErrorBoundary.js` had a loop that scanned
every DOM element for text containing "error", "something went wrong", "failed",
or "crashed" — and hid those elements:

```js
// This was hiding the error boundary's OWN UI
const allElements = document.querySelectorAll('*');
allElements.forEach(element => {
    const text = element.textContent.toLowerCase();
    if (text.includes('something went wrong') || text.includes('unexpected')) {
        element.style.display = 'none'; // ← was hiding our own card!
    }
});
```

The error boundary card's text reads *"Something went wrong"* and *"The application
encountered an unexpected error"* — exactly the strings being searched for. The
sweep was hiding the very UI it was supposed to display. Copilot replaced this with
a targeted selector-only approach that only removes known dev overlay elements by
ID or class name.

**3. Added verbose setState callback logging**

Added `setState(..., () => { console.log('state updated:', this.state) })` callbacks
to confirm state was actually committing — which helped verify the chain was working
end to end.

### State after Copilot
- ✅ Both buttons show error boundary UI correctly
- ✅ No React warnings
- ✅ No white screens
- ✅ Theme-aware error UI
- ✅ "Try Again" correctly resets and re-renders children

---

## Final Working Flow

```
RED BUTTON — setTimeout throw
─────────────────────────────
setTimeout fires → throws Error
    ↓
window 'error' event (bubble phase)
    ↓
event.preventDefault()           ← suppresses "Uncaught Error" console log
    ↓
GlobalErrorHandler.handleGlobalError(error)
    ↓  Set-based dedup check
RobustErrorBoundary.handleGlobalError(error)
    ↓  _isMounted === true
setState({ hasError: true, showFallback: true })
    ↓
render() → shows fallback UI ✅


GREEN BUTTON — triggerErrorBoundary()
──────────────────────────────────────
triggerErrorBoundary(error) called
    ↓
setState({ triggerError: error })
    ↓
render() runs → <ErrorThrower error={triggerError} /> throws
    ↓
getDerivedStateFromError() on RobustErrorBoundary (parent boundary catches child throw)
    → { hasError: true, showFallback: true, triggerError: null }
    ↓
render() → shows fallback UI ✅
```

---

## Anti-Patterns Discovered (Do Not Reintroduce)

| Anti-pattern | Consequence |
|---|---|
| Register boundary in `constructor` | `_isMounted` always false; setState unsafe; errors silently dropped |
| `throw` inside boundary's own `render()` | Boundary can't catch itself; propagates upward; white screen |
| `addEventListener('error', fn, true)` capture phase | Intercepts React's internal error routing; breaks boundary mechanism; white screen |
| `setTimeout(() => { throw error }, 0)` as fallback | setTimeout throws are always uncaught; no boundary or try/catch can catch them |
| `isHandlingError` boolean with setTimeout reset | Race condition; blocks legitimate errors within the reset window |
| `querySelectorAll('*')` sweep for text containing "error" | Hides your own error boundary UI which contains those exact strings |
| Calling `setState` from constructor or before mount | "Can't call setState on unmounted component" warning; state update silently dropped |

---

## Summary Table

| Stage | Who | What changed | Did it work? |
|---|---|---|---|
| Original | — | Constructor registration, no mount guard | ❌ Both buttons broken |
| Stage 2 | Cline | Dedup, overlay hiding, mount guard in ErrorTest | ❌ Root cause untouched |
| Stage 3 | Claude R1 | Moved registration to `componentDidMount`, `_pendingError` queue, Set dedup, `preventDefault` | ⚠️ Fixed root cause, introduced 2 new bugs |
| Stage 4 | Claude R2 | `ErrorThrower` child pattern, removed capture phase | ⚠️ Architecture correct, UI rendering issue remained |
| Stage 5 | Copilot | Theme context, removed DOM text sweep, setState logging | ✅ Fully working |