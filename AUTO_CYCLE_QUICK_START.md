# Auto-Cycle Feature - Quick Start Guide

## 🎯 What You Get

The display page (/home/misak/src/infoboard/public/index.html) now automatically cycles through all active posts every 30 seconds, like a slideshow!

## ⚡ Quick Usage

1. **Create 2+ posts in the admin panel** (e.g., http://localhost:3000/admin)
   - Post 1: Active for 5 hours
   - Post 2: Active for 5 hours
   
2. **Visit the display page** (http://localhost:3000)
   - Posts automatically change every 30 seconds
   - Counter shows "1 / 2", "2 / 2", "1 / 2"...
   
3. **Optional: Manual control**
   - Click `<` button to go back
   - Click `>` button to go forward
   - Press arrow keys on keyboard
   - Auto-cycle pauses for 2 seconds, then resumes

## 🎬 Demo Behavior

```
Time 0:00 → Display "Post 1 of 2"
Time 0:30 → Display "Post 2 of 2"  (auto-changed)
Time 1:00 → Display "Post 1 of 2"  (wrapped around)
Time 1:30 → Display "Post 2 of 2"  (continue looping)
```

## ⚙️ Configuration (Optional)

Open browser DevTools Console (F12) and paste one:

### Faster cycling (15 seconds)
```javascript
localStorage.setItem('refreshInterval', '15000');
location.reload();
```

### Slower cycling (60 seconds)
```javascript
localStorage.setItem('refreshInterval', '60000');
location.reload();
```

### Disable auto-cycle (manual only)
```javascript
localStorage.setItem('autoCycle', 'false');
location.reload();
```

### Re-enable auto-cycle
```javascript
localStorage.setItem('autoCycle', 'true');
location.reload();
```

## ✅ Verify It's Working

1. Open http://localhost:3000
2. Note the current post number (e.g., "1 / 2")
3. Set a timer for 30 seconds
4. Watch the page - it should change to next post automatically
5. ✅ If it changed, auto-cycle is working!

## 🔍 Check Settings

```javascript
// Open DevTools Console and type:
localStorage.getItem('autoCycle')        // Should be 'true'
localStorage.getItem('refreshInterval')  // Should be '30000'
localStorage.getItem('currentPostIndex')  // Current post number (0-based)
```

## 📱 Works On

✅ Desktop browsers
✅ Tablets
✅ Mobile phones
✅ Kiosk displays
✅ Large TV screens

## 🚀 Real-World Uses

- **Reception area display** - Show announcements automatically
- **Conference room** - Auto-present slides
- **Office bulletin board** - Rotate announcements
- **Retail displays** - Cycle products
- **Public information screens** - Automatic updates

## ❓ FAQ

**Q: How do I stop the auto-cycling?**
A: Click the `<` or `>` button to pause for 2 seconds, or disable it:
```javascript
localStorage.setItem('autoCycle', 'false');
location.reload();
```

**Q: Can I go backwards?**
A: Yes! Click the `<` button. It wraps around to the end.

**Q: What if I only have 1 post?**
A: The navigation buttons are hidden (nothing to cycle through).

**Q: Does it refresh the data automatically?**
A: Yes! Every 30 seconds it also checks the server for new/updated posts.

**Q: Can I change the timing?**
A: Yes! Use localStorage commands above to adjust (10s-120s recommended).

## 🔧 Implementation Details

- **File:** [public/js/display.js](/home/misak/src/infoboard/public/js/display.js)
- **Method:** JavaScript `setInterval()` calling `nextPost()` every 30 seconds
- **Pause Logic:** User interaction pauses cycling for 2 seconds
- **Wrapping:** Last post → First post (infinite loop)
- **Persistence:** Current post saved to browser localStorage

## 📋 Files Modified

- `public/js/display.js` - Added auto-cycle logic

## ❌ Troubleshooting

| Issue | Fix |
|-------|-----|
| Not cycling | Create 2+ posts; refresh page; check console for errors |
| Too fast/slow | Adjust `refreshInterval` in localStorage |
| Buttons disabled | Hard refresh: Ctrl+Shift+R |
| Lost progress | Check localStorage: `localStorage.getItem('currentPostIndex')` |

## 🎓 Examples

### Setup for Kiosk (hands-off display)
```javascript
// Cycle every 20 seconds, no manual control needed
localStorage.setItem('refreshInterval', '20000');
localStorage.setItem('autoCycle', 'true');
location.reload();
```

### Setup for Interactive Display (with manual control)
```javascript
// Auto-cycle every 60 seconds (plenty of time to read)
localStorage.setItem('refreshInterval', '60000');
localStorage.setItem('autoCycle', 'true');
// Users can manually click buttons to advance
location.reload();
```

### Setup for Manual-Only (no auto-cycle)
```javascript
// Disable auto-cycle
localStorage.setItem('autoCycle', 'false');
location.reload();
// Users click buttons to navigate (no auto-advancement)
```

---

**Status:** ✅ Ready to Use
**Browser Support:** All modern browsers
**Performance:** Minimal impact
**No Setup Required:** Auto-enabled by default!
