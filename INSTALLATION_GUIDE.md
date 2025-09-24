# 🚀 Extension Installation Guide

## ⚠️ IMPORTANT: You MUST Reinstall the Extension

The recent service worker fixes require a **complete reinstallation** of the extension. The old version with the DOMException error will not work properly.

## 📋 Step-by-Step Installation

### Step 1: Remove Old Extension (CRITICAL)

1. **Open Chrome Extensions Page**
   ```
   Go to: chrome://extensions/
   ```

2. **Find "Secure Testing Environment" Extension**
   - Look for the extension in the list
   - If you see it, proceed to remove it

3. **Remove the Extension**
   - Click the **"Remove"** button (trash icon)
   - Confirm removal when prompted
   - **IMPORTANT**: This step is crucial - the old version will not work

4. **Verify Removal**
   - Refresh the extensions page
   - Ensure "Secure Testing Environment" is completely gone

### Step 2: Download Latest Code

1. **Get the Latest Code**
   - Go to: https://github.com/PK1NONLY/screenshare/tree/feature/secure-testing-environment-extension
   - Click "Code" → "Download ZIP"
   - Extract the ZIP file to your computer

2. **Locate Extension Folder**
   - Navigate to the extracted folder
   - Find the `extension` folder (NOT the root folder)
   - The path should be: `screenshare-feature-secure-testing-environment-extension/extension/`

### Step 3: Install Fresh Extension

1. **Enable Developer Mode**
   ```
   Go to: chrome://extensions/
   Toggle "Developer mode" ON (top-right corner)
   ```

2. **Load Unpacked Extension**
   - Click **"Load unpacked"** button
   - Navigate to the `extension` folder (the one containing manifest.json)
   - Select the `extension` folder
   - Click **"Select Folder"**

3. **Verify Installation**
   - Extension should appear in the list
   - Name: "Secure Testing Environment"
   - Version: "1.0.0"
   - Status: Enabled (toggle switch ON)
   - **No red error messages should appear**

### Step 4: Verify Service Worker

1. **Check Service Worker Status**
   - In chrome://extensions/, find your extension
   - Look for **"Inspect views: service worker"** link
   - Click on it to open DevTools

2. **Check Console Messages**
   - Go to Console tab
   - Look for messages starting with `[STE]`
   - You should see:
     ```
     [STE] Service Worker: Starting initialization...
     [STE] Service Worker: Initializing...
     [STE] Service Worker: Built-in system monitor initialized
     [STE] Service Worker: Loading configuration...
     [STE] Service Worker: Setting up event listeners...
     [STE] Service Worker: Initialized successfully
     [STE] Service Worker: Notifying tabs extension is ready...
     ```

3. **If You See Errors**
   - Red error messages indicate problems
   - Copy the exact error messages
   - Share them for further troubleshooting

### Step 5: Test Extension Functionality

1. **Test Basic Functionality**
   ```
   Go to: https://work-1-coiqhoypmqstyttp.prod-runtime.all-hands.dev/test-extension-loading.html
   ```
   - Should show: "✅ Chrome object available"
   - Should show: "✅ Chrome runtime available"
   - Should show extension ID and other details

2. **Test Extension Status**
   ```
   Go to: https://work-1-coiqhoypmqstyttp.prod-runtime.all-hands.dev/extension-status-check.html
   ```
   - Should show: "✅ Chrome object available"
   - Should show: "✅ chrome.runtime available"
   - May still show some APIs missing (this is expected for now)

3. **Test Extension Communication**
   - On the test-extension-loading.html page
   - Click "Test Communication" button
   - Should get successful response with extension details

## 🔍 Expected Results After Installation

### ✅ What Should Work:
- Chrome object available
- chrome.runtime available
- Extension responds to messages
- Service worker loads without errors
- Extension appears in chrome://extensions/

### ⚠️ What May Still Need Work:
- Some Chrome APIs (tabs, storage) may need additional permissions
- Content scripts may need further debugging
- Full functionality testing

## 🆘 Troubleshooting

### Extension Won't Install
- **Error**: "Manifest file is missing or unreadable"
  - **Solution**: Make sure you selected the `extension` folder, not the root project folder
  - **Check**: The folder should contain `manifest.json` directly

- **Error**: "This extension may not have all permissions"
  - **Solution**: Click "Allow" or "Grant permissions" when prompted
  - **Check**: Go to extension details and verify all permissions are granted

### Service Worker Errors
- **Error**: Still seeing DOMException
  - **Solution**: You're using the old version - remove and reinstall completely
  - **Check**: Make sure you downloaded the latest code from GitHub

- **Error**: "Failed to load dependencies"
  - **Solution**: This should be fixed in the new version - reinstall completely
  - **Check**: Verify you're using the latest code with the service worker fix

### Extension Not Responding
- **Error**: Communication tests fail
  - **Solution**: Reload the extension in chrome://extensions/
  - **Check**: Click the reload button (circular arrow) on the extension

### Content Scripts Not Loading
- **Error**: STELogger, STEKeyboardTracker not found
  - **Solution**: This is expected for now - we're working on content script fixes
  - **Check**: Focus on getting the service worker working first

## 📞 Getting Help

If you encounter issues:

1. **Take Screenshots**
   - chrome://extensions/ page showing the extension
   - Service worker console with any error messages
   - Test page results

2. **Provide Information**
   - Exact error messages (copy/paste)
   - Chrome version (chrome://settings/help)
   - Operating system
   - Steps you followed

3. **Test Pages**
   - https://work-1-coiqhoypmqstyttp.prod-runtime.all-hands.dev/test-extension-loading.html
   - https://work-1-coiqhoypmqstyttp.prod-runtime.all-hands.dev/extension-status-check.html

## ✅ Success Checklist

- [ ] Old extension completely removed
- [ ] Latest code downloaded from GitHub
- [ ] Extension installed from correct `extension` folder
- [ ] Extension appears in chrome://extensions/ without errors
- [ ] Service worker shows `[STE]` initialization messages
- [ ] Test pages show Chrome object available
- [ ] Extension responds to communication tests

Once you complete these steps, the extension should be working much better than before!