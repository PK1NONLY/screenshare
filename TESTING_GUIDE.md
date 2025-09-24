# Secure Testing Environment Extension - Testing Guide

## Fixed Issues

### 1. Service Worker Error (TypeError: Cannot read properties of undefined)
**Issue**: `chrome.desktopCapture.onStarted.addListener` was causing a TypeError because this API doesn't exist.

**Fix**: Removed the incorrect event listener and added proper screen capture detection through system monitoring.

### 2. Battery API in Service Worker
**Issue**: Battery API (`navigator.getBattery()`) is not available in service workers.

**Fix**: Implemented battery monitoring through content scripts that communicate with the service worker.

## Installation Instructions

1. **Open Chrome Extensions Page**
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)

2. **Load the Extension**
   - Click "Load unpacked"
   - Select the `extension` folder from this project
   - The extension should load without errors

3. **Verify Installation**
   - Check that "Secure Testing Environment" appears in the extensions list
   - The extension icon should appear in the Chrome toolbar
   - No errors should be shown in the extension details

## Testing the Extension

### Method 1: Using the Test Page

1. **Start the Test Server**
   ```bash
   cd /workspace/project/screenshare
   python3 -m http.server 12000
   ```

2. **Open the Test Page**
   - Navigate to: `http://localhost:12000/test.html`
   - The page will automatically check for the extension

3. **Run Tests**
   - Click various test buttons to verify functionality
   - Check the log output for results
   - Test copy/paste blocking, new tab blocking, etc.

### Method 2: Manual Testing

1. **Activate the Extension**
   - Click the extension icon in Chrome toolbar
   - Configure settings in the popup
   - Or use the admin panel at `chrome-extension://[extension-id]/admin/admin.html`

2. **Test Security Features**
   - Try copying/pasting text (should be blocked when active)
   - Try opening new tabs (should be blocked when active)
   - Try keyboard shortcuts (should be tracked)
   - Check system monitoring data

### Method 3: Integration API Testing

1. **Load Integration API**
   ```html
   <script src="chrome-extension://[extension-id]/api/integration-api.js"></script>
   ```

2. **Use the API**
   ```javascript
   // Activate with configuration
   window.SecureTestingEnvironment.activate({
     restrictions: {
       blockNewTabs: true,
       blockCopyPaste: true,
       blockScreenSharing: true
     },
     allowedUrls: ['https://example.com'],
     allowedExtensions: []
   });

   // Get status
   window.SecureTestingEnvironment.getStatus().then(status => {
     console.log('Extension status:', status);
   });
   ```

## Debugging

### Check Service Worker Console
1. Go to `chrome://extensions/`
2. Find "Secure Testing Environment"
3. Click "service worker" link
4. Check console for any errors

### Check Content Script Console
1. Open any webpage
2. Open Developer Tools (F12)
3. Check console for extension-related messages
4. Look for messages from `STELogger`

### Common Issues

1. **Extension not loading**: Check manifest.json syntax
2. **Permission errors**: Ensure all required permissions are declared
3. **Content script errors**: Check if scripts are properly injected
4. **API errors**: Verify Chrome API usage and permissions

## Expected Behavior

When the extension is active:
- ✅ Copy/paste operations should be blocked
- ✅ New tab creation should be restricted
- ✅ Keyboard inputs should be tracked
- ✅ System information should be monitored
- ✅ Battery level should be checked
- ✅ Unauthorized actions should be logged
- ✅ Integration API should be available to external pages

## Configuration

The extension can be configured through:
1. **Popup Interface**: Click extension icon
2. **Admin Panel**: `chrome-extension://[extension-id]/admin/admin.html`
3. **Integration API**: External JavaScript integration
4. **Backend API**: RESTful configuration endpoints

## Monitoring Data

The extension collects and reports:
- Keystroke patterns and timing
- Tab creation/navigation attempts
- Copy/paste attempts
- System resource usage (CPU, RAM, Battery)
- Display configuration changes
- Extension installation/activation
- Network requests and navigation
- Focus and window events

All data is logged locally and can be sent to a backend service for analysis.