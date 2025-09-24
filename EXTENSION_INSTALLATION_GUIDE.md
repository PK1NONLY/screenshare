# Chrome Extension Installation Guide

## Quick Installation Steps

1. **Open Chrome Extensions Page**
   - Go to `chrome://extensions/` in your Chrome browser
   - OR click the three dots menu → More tools → Extensions

2. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

3. **Load the Extension**
   - Click "Load unpacked" button
   - Navigate to and select the `extension` folder in this project
   - The extension should appear in your extensions list

4. **Verify Installation**
   - The extension should show as "Secure Testing Environment"
   - Make sure it's enabled (toggle switch is on)
   - You should see the extension icon in your toolbar

## Troubleshooting

### Extension Not Loading
If the extension doesn't load, check for:

1. **Manifest Errors**
   - Look for red error messages in the extensions page
   - Common issues: invalid JSON, missing files, permission errors

2. **Missing Files**
   - Ensure all files referenced in manifest.json exist
   - Check that all icon files are present

3. **JavaScript Errors**
   - Open Chrome DevTools (F12)
   - Check Console for any JavaScript errors
   - Look in the Extensions tab for service worker errors

### Extension Loads But Doesn't Work
If the extension loads but features don't work:

1. **Check Extension Status**
   - Visit the debug page: `/test-extension-debug.html`
   - All content script objects should show "Found"
   - Chrome runtime should be available

2. **Reload Extension**
   - Go to `chrome://extensions/`
   - Click the reload button on the extension
   - Refresh any open web pages

3. **Check Permissions**
   - Ensure the extension has all required permissions
   - Some features may require additional permissions

## Testing the Extension

1. **Visit the Debug Page**
   ```
   http://localhost:12000/test-extension-debug.html
   ```

2. **Expected Results**
   - Content Script Objects: All should show "Found"
   - Chrome Runtime: Should show "Available"
   - Extension Communication: Should show successful ping

3. **Visit the Demo Page**
   ```
   http://localhost:12000/demo/index.html
   ```

4. **Test Features**
   - Extension status should show "Available"
   - All buttons should work without "Extension not available" messages
   - Keystroke monitoring should capture keystrokes
   - Copy/paste should be blocked when activated

## Common Issues

### "Extension not available" in demo
- Extension is not installed or not enabled
- Content scripts are not injecting properly
- Service worker is not running

### Content scripts not found
- Extension failed to load due to errors
- Manifest.json has incorrect content script paths
- JavaScript syntax errors in content scripts

### Chrome runtime not available
- Extension is not properly installed
- Browser is not Chrome or doesn't support extensions
- Extension permissions are insufficient

## Manual Verification Steps

1. **Check Extension in Chrome**
   ```
   chrome://extensions/
   ```
   - Should see "Secure Testing Environment" extension
   - Should be enabled
   - No error messages

2. **Check Service Worker**
   - Click "service worker" link in extension details
   - Should see console logs from initialization
   - No error messages in console

3. **Check Content Scripts**
   - Open any webpage
   - Open DevTools (F12)
   - In Console, type: `window.STELogger`
   - Should return the Logger object, not undefined

4. **Test Communication**
   - In Console, type: `chrome.runtime.sendMessage({action: 'PING'}, console.log)`
   - Should receive response with extension info

If all these steps pass, the extension is properly installed and should work with the demo page.