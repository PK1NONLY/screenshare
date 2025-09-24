# 🔧 Extension Troubleshooting Guide

## Current Issue Analysis

Based on your error report, the extension has these specific problems:

### ✅ What's Working:
- Basic Environment: Chrome browser, secure context
- Chrome object available (sometimes)

### ❌ What's NOT Working:
- `chrome.tabs` not available
- `chrome.storage` not available  
- No content scripts loading (STELogger, STEKeyboardTracker, etc.)
- Extension communication failing

## 🎯 Root Cause: Permission/Installation Issues

This pattern indicates **the extension is installed but has permission problems** or **partial loading failures**.

## 🚀 Step-by-Step Fix

### Step 1: Complete Extension Reinstallation

1. **Remove Current Extension**
   ```
   1. Go to chrome://extensions/
   2. Find "Secure Testing Environment"
   3. Click "Remove" button
   4. Confirm removal
   ```

2. **Clear Extension Data**
   ```
   1. Close all Chrome windows
   2. Restart Chrome
   3. Go to chrome://extensions/
   4. Verify extension is completely gone
   ```

3. **Fresh Installation**
   ```
   1. Enable "Developer mode" (toggle in top-right)
   2. Click "Load unpacked"
   3. Navigate to your project folder
   4. Select the "extension" folder (NOT the root project folder)
   5. Click "Select Folder"
   ```

### Step 2: Verify Proper Installation

After installation, you should see:

```
✅ Extension appears in chrome://extensions/
✅ Name: "Secure Testing Environment"
✅ Version: "1.0.0"
✅ Status: Enabled (toggle switch ON)
✅ No error messages in red
✅ "Inspect views: service worker" link available
```

### Step 3: Grant All Permissions

1. **Click "Details" button** on the extension
2. **Scroll down to "Permissions" section**
3. **Verify these permissions are granted:**
   - Read and change all your data on all websites
   - Manage your apps, extensions, and themes
   - Display notifications
   - Access your tabs and browsing activity
   - Modify data you copy and paste
   - Capture content of your screen
   - And many others...

4. **If you see "This extension may not have all permissions":**
   - Click "Allow" or "Grant permissions"
   - Accept all permission requests

### Step 4: Check Service Worker

1. **In chrome://extensions/, find your extension**
2. **Click "Inspect views: service worker"**
3. **Check Console tab for errors**
4. **Look for initialization messages like:**
   ```
   [STE] Service Worker initialized
   [STE] Extension ready
   ```

### Step 5: Test Extension Loading

1. **Go to:** https://work-1-coiqhoypmqstyttp.prod-runtime.all-hands.dev/debug-extension-permissions.html
2. **Click "Check All Chrome APIs"**
3. **Expected result:** All or most APIs should be available
4. **Click "Debug Content Scripts"**
5. **Expected result:** All 4 content scripts should load

## 🔍 Advanced Troubleshooting

### If Extension Still Won't Load:

#### Check Chrome Version
```
1. Go to chrome://settings/help
2. Ensure Chrome is up to date
3. Minimum required: Chrome 88+
```

#### Check Extension Folder Structure
Your extension folder should look like this:
```
extension/
├── manifest.json
├── background/
│   └── service-worker.js
├── content/
│   ├── keyboard-tracker.js
│   ├── page-monitor.js
│   └── security-enforcer.js
├── utils/
│   └── logger.js
├── popup/
│   ├── popup.html
│   └── popup.js
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

#### Check for JavaScript Errors
1. **Install extension**
2. **Open any webpage**
3. **Press F12 to open DevTools**
4. **Go to Console tab**
5. **Look for red error messages**
6. **Common errors to look for:**
   - `Uncaught SyntaxError`
   - `Uncaught ReferenceError`
   - `Extension context invalidated`
   - `Could not establish connection`

### If Content Scripts Won't Load:

#### Check Content Script Injection
1. **Open DevTools on any webpage**
2. **Go to Sources tab**
3. **Look for "Content scripts" section**
4. **You should see:**
   - `logger.js`
   - `security-enforcer.js`
   - `keyboard-tracker.js`
   - `page-monitor.js`

#### Manual Content Script Test
Add this to any webpage console:
```javascript
// Test if content scripts loaded
console.log('STELogger:', typeof window.STELogger);
console.log('STEKeyboardTracker:', typeof window.STEKeyboardTracker);
console.log('STESecurityEnforcer:', typeof window.STESecurityEnforcer);
console.log('STEPageMonitor:', typeof window.STEPageMonitor);
```

Expected output:
```
STELogger: object
STEKeyboardTracker: object
STESecurityEnforcer: object
STEPageMonitor: object
```

## 🆘 If Nothing Works

### Nuclear Option: Complete Chrome Reset

1. **Export bookmarks and important data**
2. **Go to chrome://settings/reset**
3. **Click "Restore settings to their original defaults"**
4. **Restart Chrome**
5. **Reinstall extension**

### Alternative: Try Different Chrome Profile

1. **Go to chrome://settings/people**
2. **Click "Add person"**
3. **Create new Chrome profile**
4. **Install extension in new profile**
5. **Test functionality**

## 📞 Getting Help

If the extension still doesn't work after following all steps:

1. **Take screenshots of:**
   - chrome://extensions/ page showing the extension
   - Any error messages in red
   - DevTools Console errors
   - Extension details page

2. **Provide this information:**
   - Chrome version (chrome://settings/help)
   - Operating system
   - Exact error messages
   - Steps you've already tried

3. **Test pages to verify:**
   - https://work-1-coiqhoypmqstyttp.prod-runtime.all-hands.dev/extension-status-check.html
   - https://work-1-coiqhoypmqstyttp.prod-runtime.all-hands.dev/debug-extension-permissions.html

## ✅ Success Indicators

When the extension is working properly, you should see:

### Extension Status Check:
- ✅ Basic Environment: passed
- ✅ Chrome API: passed
- ✅ Content Scripts: passed (all 4 found)
- ✅ Extension Communication: passed

### Demo Page:
- Extension Status: "Available" (not "Extension not available")
- All monitoring features work
- Keystroke logging shows real keystrokes
- Copy/paste blocking actually blocks operations
- System information shows real data

### Browser Behavior:
- Extension icon visible in toolbar
- Right-click context menu blocked (when activated)
- Keyboard shortcuts blocked (when activated)
- Notifications appear for blocked actions