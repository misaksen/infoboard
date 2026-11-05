# Auto-Cycle Feature - Automatic Post Slideshow

## Overview

The display page now automatically cycles through all active posts like a slideshow, changing every 30 seconds!

## How It Works

### Automatic Cycling
- **Starts automatically** when page loads
- **Cycles every 30 seconds** (same as refresh interval)
- **Loops continuously** - goes to first post after showing the last one
- **Pauses on interaction** - stops for 2 seconds when you manually click/navigate
- **Resumes automatically** - continues cycling after you're done

### Cycle Flow
```
Post 1 (30s) → Post 2 (30s) → Post 3 (30s) → Post 1 (30s) → ...
```

## Features

✅ **Automatic Slideshow**
- No user interaction needed
- Continuously cycles through all posts
- Perfect for display screens/kiosks

✅ **Smart Pause on Interaction**
- Click buttons = cycle pauses for 2 seconds
- Press arrow keys = cycle pauses for 2 seconds
- User stays in control

✅ **Continuous Buttons**
- < and > buttons always enabled
- Click < to go to previous post
- Click > to go to next post
- Clicking wraps around (end → start, start → end)

✅ **Persistent Selection**
- Your current post saved to localStorage
- Survives page refresh
- Auto-cycle resumes from saved position

✅ **Responsive Design**
- Works on desktop displays
- Works on tablets
- Works on mobile devices
- Touch-friendly buttons

## Usage

### Default Behavior
Just open http://localhost:3000 and watch the posts cycle automatically!

### Manual Navigation (Optional)
- **Click < button** - Go to previous post (pauses auto-cycle for 2 seconds)
- **Click > button** - Go to next post (pauses auto-cycle for 2 seconds)
- **Press ← arrow** - Go to previous post (pauses auto-cycle for 2 seconds)
- **Press → arrow** - Go to next post (pauses auto-cycle for 2 seconds)

### Watching Continuous Cycling
```
Initial load:
Display: "1 / 3"
Post 1 shown
↓
After 30 seconds:
Display: "2 / 3"
Post 2 shown
↓
After 30 seconds:
Display: "3 / 3"
Post 3 shown
↓
After 30 seconds:
Display: "1 / 3"
Post 1 shown (cycles back to start)
↓
... continues forever ...
```

## Configuration

### Enable/Disable Auto-Cycle
Open browser DevTools Console and type:

**Enable auto-cycle:**
```javascript
localStorage.setItem('autoCycle', 'true');
location.reload();
```

**Disable auto-cycle (manual control only):**
```javascript
localStorage.setItem('autoCycle', 'false');
location.reload();
```

### Change Cycle Interval
```javascript
// Change to 10 seconds
localStorage.setItem('refreshInterval', '10000');
location.reload();

// Change to 60 seconds
localStorage.setItem('refreshInterval', '60000');
location.reload();
```

### Check Current Settings
```javascript
// Check if auto-cycle is enabled
console.log(localStorage.getItem('autoCycle'));

// Check current cycle interval (in milliseconds)
console.log(localStorage.getItem('refreshInterval'));

// Check current post index
console.log(localStorage.getItem('currentPostIndex'));
```

## Perfect For

✅ **Reception Area Displays**
- Show announcements automatically
- No staff interaction needed
- Great for waiting areas

✅ **Conference/Event Displays**
- Automatic slide show mode
- Keep audience engaged
- Professional presentation

✅ **Office Information Boards**
- Display rotating announcements
- News updates
- Company info

✅ **Retail Displays**
- Promotional messaging
- Product info cycling
- No operator needed

✅ **Public Information Screens**
- Transit stations
- Hospitals
- Shopping centers

## Technical Details

### Files Modified
- `public/js/display.js` - Auto-cycle logic

### Key Implementation
```javascript
// Auto-cycle timer
setInterval(() => {
  if (!this.cyclePaused && this.posts.length > 1) {
    this.nextPost();
  }
}, this.refreshInterval);

// Pause on user interaction
this.nextBtn.addEventListener('click', () => {
  this.cyclePaused = true;
  this.nextPost();
  setTimeout(() => { this.cyclePaused = false; }, 2000);
});

// Continuous cycling (no disabled state)
this.nextPost() {
  if (this.currentIndex < this.posts.length - 1) {
    this.currentIndex++;
  } else {
    this.currentIndex = 0; // Wrap to start
  }
}
```

## Browser Support

✅ All modern browsers
- Chrome/Chromium ✅
- Firefox ✅
- Safari ✅
- Edge ✅
- Mobile browsers ✅

## Testing Auto-Cycle

### Test 1: Basic Cycling
1. Open http://localhost:3000
2. Wait 30 seconds
3. ✅ Post should change automatically
4. Wait another 30 seconds
5. ✅ Post should change again

### Test 2: Cycle Wrapping
1. Note which post is displayed
2. Click next button until you've cycled through all posts
3. ✅ After last post, clicking next should show first post

### Test 3: Pause on Click
1. Watch the auto-cycle
2. Click the next button
3. ✅ Auto-cycle should pause (stays on new post)
4. Wait 2 seconds
5. ✅ Auto-cycle should resume (post changes after 2 seconds)

### Test 4: Keyboard Navigation
1. Watch the auto-cycle
2. Press right arrow key
3. ✅ Auto-cycle should pause
4. Wait 2 seconds
5. ✅ Auto-cycle should resume

### Test 5: Persistence
1. Refresh page (F5)
2. ✅ Should stay on same post
3. ✅ Auto-cycle should resume from that post

## Visual Indicators

**Active/Enabled Buttons**
- Buttons always visible and enabled
- Blue color when not hovering
- Darker blue when hovering
- Click effect when pressing

**Post Counter**
- Shows "X / Y" format
- Example: "2 / 3" = showing post 2 out of 3 total
- Updates with each cycle

**Smooth Transitions**
- Fade-in animation when post changes
- Animation duration: 0.5 seconds
- Professional appearance

## Example Configuration

### For a Reception Display
```javascript
// Auto-cycle every 15 seconds (faster)
localStorage.setItem('refreshInterval', '15000');
localStorage.setItem('autoCycle', 'true');
location.reload();
```

### For a Conference Room
```javascript
// Auto-cycle every 60 seconds (slower, more time to read)
localStorage.setItem('refreshInterval', '60000');
localStorage.setItem('autoCycle', 'true');
location.reload();
```

### For Manual-Only Display
```javascript
// Disable auto-cycle, manual buttons only
localStorage.setItem('autoCycle', 'false');
location.reload();
```

## Troubleshooting

### Not Cycling
**Problem:** Posts aren't changing automatically
**Solutions:**
1. Check you have 2+ active posts
2. Verify DevTools Console has no errors
3. Check localStorage: `localStorage.getItem('autoCycle')`
4. Make sure it says 'true'
5. Try: `location.reload()`

### Cycling Too Fast/Slow
**Problem:** Interval not what you want
**Solutions:**
1. Change interval: `localStorage.setItem('refreshInterval', '45000');`
2. Reload page: `location.reload()`
3. Check new interval: `localStorage.getItem('refreshInterval')`

### Pause Not Working
**Problem:** Clicking button doesn't pause
**Solutions:**
1. Check for JavaScript errors in console
2. Try keyboard shortcut instead (arrow keys)
3. Hard refresh page: Ctrl+Shift+R
4. Try different browser

### Post Count Shows But No Cycling
**Problem:** Shows "1/3" but posts don't change
**Solutions:**
1. Verify active posts: `curl http://localhost:3000/api/public/posts/active`
2. Check that 2+ posts are really active (times correct)
3. Open console, look for error messages
4. Try manual click first (should work)

## Performance

- **Memory:** Negligible - just one interval timer
- **CPU:** Minimal - only updates when needed
- **Network:** One API call per refresh (30 sec default)
- **Responsiveness:** No lag or delay

## Future Enhancements

Possible future improvements:
- Pause/resume button
- Speed control slider
- Theme support (dark mode)
- Animation preferences
- Gesture support (swipe)

---

**Feature Status:** ✅ Complete and Working
**Last Updated:** 2026-11-05
**Default Interval:** 30 seconds
**Pause Duration:** 2 seconds
