# Secure Testing Environment (STE) Chrome Extension

A comprehensive Chrome extension designed to create a secure testing environment for online examinations. This extension provides robust monitoring, security restrictions, and integration capabilities to ensure test integrity.

## 🚀 Features

### Security Restrictions
- **Copy/Paste Blocking**: Prevents clipboard operations during tests
- **New Tab Prevention**: Blocks creation of new browser tabs
- **Screenshot Protection**: Prevents screen capture and recording
- **Developer Tools Blocking**: Disables F12, inspect element, and view source
- **Right-Click Blocking**: Disables context menus
- **Text Selection Prevention**: Blocks text highlighting and selection
- **Drag & Drop Blocking**: Prevents file drag and drop operations
- **Application Switching Detection**: Monitors when users switch to other applications
- **Multiple Monitor Detection**: Alerts when multiple displays are connected
- **Screen Sharing Detection**: Identifies active screen sharing sessions
- **Bluetooth Device Monitoring**: Tracks connected Bluetooth devices

### System Monitoring
- **Real-time System Stats**: CPU, memory, and battery usage monitoring
- **Keystroke Tracking**: Records keyboard activity and patterns
- **Mouse Movement Tracking**: Optional mouse activity monitoring
- **Page Interaction Logging**: Tracks clicks, scrolls, and form interactions
- **Network Activity Monitoring**: Logs network requests and responses
- **Running Process Detection**: Monitors active applications
- **Performance Thresholds**: Configurable alerts for system resource usage

### Session Management
- **Test Session Control**: Start/stop test sessions with unique identifiers
- **Candidate Management**: Track individual test-takers
- **Time Management**: Session duration tracking with auto-submit
- **Emergency Stop**: Immediate session termination capability
- **Session Analytics**: Comprehensive test session reporting

### Configuration & Integration
- **URL Whitelisting**: Configure allowed websites during tests
- **Extension Management**: Control which browser extensions are permitted
- **Backend Integration**: RESTful API for configuration and data sync
- **Real-time Synchronization**: Live configuration updates from backend
- **Custom Notifications**: Configurable alerts and warnings
- **Export/Import**: Configuration backup and restore

## 📁 Project Structure

```
extension/
├── manifest.json                 # Extension manifest (Manifest V3)
├── background/
│   ├── service-worker.js        # Main background service worker
│   ├── system-monitor.js        # System monitoring utilities
│   └── config-manager.js        # Configuration management
├── content/
│   ├── security-enforcer.js     # Page-level security restrictions
│   ├── keyboard-tracker.js      # Keyboard activity monitoring
│   └── page-monitor.js          # Page interaction tracking
├── popup/
│   ├── popup.html              # Extension popup interface
│   ├── popup.css               # Popup styling
│   └── popup.js                # Popup functionality
├── admin/
│   ├── admin.html              # Admin configuration panel
│   ├── admin.css               # Admin panel styling
│   └── admin.js                # Admin panel functionality
├── api/
│   └── integration-api.js       # Third-party integration API
├── utils/
│   ├── logger.js               # Logging utilities
│   └── api-client.js           # Backend API client
└── icons/
    ├── icon16.png              # Extension icons (16x16)
    ├── icon32.png              # Extension icons (32x32)
    ├── icon48.png              # Extension icons (48x48)
    └── icon128.png             # Extension icons (128x128)

demo/
└── index.html                   # Integration demo page
```

## 🛠️ Installation

### Development Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-repo/secure-testing-environment.git
   cd secure-testing-environment
   ```

2. **Load the extension in Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the `extension` folder

3. **Verify installation**:
   - The STE icon should appear in the Chrome toolbar
   - Click the icon to open the popup interface

### Production Installation

1. **Package the extension**:
   ```bash
   # Create a ZIP file of the extension folder
   zip -r ste-extension.zip extension/
   ```

2. **Upload to Chrome Web Store** (for distribution)
   - Follow Chrome Web Store developer guidelines
   - Submit the packaged extension for review

## ⚙️ Configuration

### Admin Panel

Access the admin panel by clicking "Settings" in the extension popup or navigating to `chrome-extension://[extension-id]/admin/admin.html`.

#### General Settings
- **Allowed URLs**: Configure which websites candidates can access
- **Allowed Extensions**: Specify permitted Chrome extensions
- **Notifications**: Control warning and alert settings

#### Security Restrictions
- **Basic Restrictions**: Copy/paste, new tabs, screenshots, etc.
- **Interface Restrictions**: Developer tools, right-click, text selection
- **Advanced Security**: Virtual machine detection, biometric verification

#### Monitoring Configuration
- **Activity Tracking**: Keyboard, mouse, system usage monitoring
- **Alert Thresholds**: CPU, memory, battery level warnings
- **Monitoring Intervals**: How frequently to check system status

#### Backend Integration
- **API Configuration**: Backend URL and authentication
- **Synchronization**: Real-time config updates
- **Connection Testing**: Verify backend connectivity

#### Session Management
- **Current Session**: View active test session details
- **New Sessions**: Start test sessions with specific parameters
- **Session Controls**: End sessions and emergency stops

### Configuration File Format

```json
{
  "allowedUrls": [
    "https://exam.example.com/*",
    "https://resources.example.com/*"
  ],
  "allowedExtensions": [
    "extension-id-1",
    "extension-id-2"
  ],
  "restrictions": {
    "blockCopyPaste": true,
    "blockNewTabs": true,
    "blockScreenshots": true,
    "blockMultipleMonitors": true,
    "blockScreenSharing": true,
    "blockBluetoothDevices": true,
    "blockDevTools": true,
    "blockPrintScreen": true,
    "blockRightClick": true,
    "blockTextSelection": true,
    "blockDragDrop": true
  },
  "monitoring": {
    "trackKeystrokes": true,
    "trackMouseMovements": false,
    "trackSystemUsage": true,
    "trackRunningApps": true,
    "trackNetworkActivity": true,
    "batteryThreshold": 50,
    "cpuThreshold": 80,
    "memoryThreshold": 90,
    "monitoringInterval": 5000
  },
  "backend": {
    "apiUrl": "https://api.example.com",
    "apiKey": "your-api-key",
    "timeout": 10000,
    "retryAttempts": 3,
    "enableRealTimeSync": true,
    "syncInterval": 30000
  },
  "session": {
    "sessionId": "test-session-123",
    "candidateId": "candidate-456",
    "examId": "exam-789",
    "duration": 7200000,
    "autoSubmit": true
  }
}
```

## 🔌 Integration API

### JavaScript API

Include the integration API in your web application:

```html
<script src="chrome-extension://[extension-id]/api/integration-api.js"></script>
```

### Basic Usage

```javascript
// Wait for API to be ready
window.addEventListener('STEReady', async (event) => {
  const ste = event.detail.api;
  
  // Check if extension is available
  if (ste.isAvailable()) {
    console.log('STE Extension is ready');
    
    // Start a test session
    const success = await ste.createTestSession({
      sessionId: 'test-123',
      candidateId: 'student-456',
      examId: 'math-final',
      duration: 120 * 60 * 1000, // 2 hours
      allowedUrls: [
        'https://exam.example.com/*',
        'https://calculator.example.com'
      ],
      blockCopyPaste: true,
      blockNewTabs: true,
      blockScreenshots: true
    });
    
    if (success) {
      console.log('Test session started successfully');
    }
  }
});
```

### API Methods

#### Extension Control
- `isAvailable()` - Check if extension is connected
- `getExtensionInfo()` - Get extension version and details
- `activateMonitoring(config)` - Start monitoring with configuration
- `deactivateMonitoring()` - Stop monitoring
- `getStatus()` - Get current monitoring status

#### Session Management
- `startSession(sessionData)` - Start a new test session
- `endSession()` - End the current session
- `emergencyStop()` - Immediately stop all monitoring

#### Configuration
- `updateConfiguration(config)` - Update extension settings
- `setAllowedUrls(urls)` - Set permitted websites
- `setAllowedExtensions(extensionIds)` - Set permitted extensions
- `setSecurityRestrictions(restrictions)` - Configure security settings
- `setMonitoringSettings(monitoring)` - Configure monitoring options

#### Data Retrieval
- `getSystemInfo()` - Get system resource information
- `getSecurityStatus()` - Get security check results
- `getUnauthorizedActions(limit)` - Get recent violations
- `getKeystrokeStats()` - Get keyboard activity statistics
- `getPageStats()` - Get page interaction statistics
- `generateReport()` - Create comprehensive test report

#### Utilities
- `showNotification(title, message, type)` - Display notifications
- `hasMultipleDisplays()` - Check for multiple monitors
- `isScreenSharingActive()` - Check for screen sharing
- `getBatteryInfo()` - Get battery status
- `testBackendConnection()` - Test API connectivity

### Event Listeners

```javascript
// Listen for extension events
ste.addEventListener('BATTERY_WARNING', (data) => {
  console.log(`Battery low: ${data.level}%`);
});

ste.addEventListener('UNAUTHORIZED_ACTION', (data) => {
  console.log(`Violation detected: ${data.type}`);
});

ste.addEventListener('SYSTEM_ALERT', (data) => {
  console.log(`System alert: ${data.message}`);
});
```

## 🔧 Backend API

### Endpoints

The extension can integrate with a backend API for configuration management and data logging.

#### Configuration Management
- `GET /config` - Retrieve configuration
- `POST /config` - Update configuration
- `GET /health` - Health check endpoint

#### Session Management
- `POST /session/start` - Start new session
- `POST /session/{id}/end` - End session
- `PUT /session/{id}` - Update session data
- `GET /session/{id}` - Get session details

#### Data Logging
- `POST /log-action` - Log single unauthorized action
- `POST /log-batch` - Log multiple actions
- `POST /report` - Submit comprehensive report

#### Candidate Management
- `GET /candidate/{id}/validate` - Validate candidate
- `GET /candidate/{id}/config` - Get candidate-specific config
- `PUT /candidate/{id}/status` - Update candidate status

### Request/Response Format

#### Start Session Request
```json
{
  "sessionId": "test-session-123",
  "candidateId": "candidate-456",
  "examId": "exam-789",
  "startTime": 1640995200000,
  "duration": 7200000,
  "configuration": {
    "allowedUrls": ["https://exam.example.com/*"],
    "restrictions": {
      "blockCopyPaste": true,
      "blockNewTabs": true
    }
  }
}
```

#### Log Action Request
```json
{
  "sessionId": "test-session-123",
  "candidateId": "candidate-456",
  "type": "COPY_PASTE_BLOCKED",
  "timestamp": 1640995260000,
  "data": {
    "url": "https://exam.example.com/question/1",
    "userAgent": "Mozilla/5.0...",
    "details": "User attempted to copy text"
  }
}
```

## 📊 Monitoring & Analytics

### System Metrics
- **CPU Usage**: Real-time processor utilization
- **Memory Usage**: RAM consumption monitoring
- **Battery Level**: Power status and warnings
- **Display Configuration**: Multiple monitor detection
- **Network Activity**: Request/response logging

### Security Events
- **Blocked Actions**: Copy/paste, screenshots, new tabs
- **Suspicious Patterns**: Rapid keystrokes, unusual shortcuts
- **Application Switching**: Focus loss detection
- **Hardware Changes**: New devices, display changes

### Behavioral Analytics
- **Keystroke Patterns**: Typing speed, rhythm analysis
- **Mouse Activity**: Movement patterns, click frequency
- **Page Interactions**: Scroll behavior, form interactions
- **Time Analysis**: Session duration, idle time detection

### Reporting
- **Real-time Dashboard**: Live monitoring interface
- **Session Reports**: Comprehensive test summaries
- **Violation Logs**: Detailed unauthorized action records
- **Performance Metrics**: System resource usage over time

## 🔒 Security Considerations

### Data Privacy
- **Local Storage**: Sensitive data stored locally when possible
- **Encryption**: API communications use HTTPS
- **Data Retention**: Configurable data cleanup policies
- **Anonymization**: Personal data can be anonymized

### Permission Model
- **Minimal Permissions**: Only necessary Chrome permissions requested
- **User Consent**: Clear permission explanations
- **Granular Control**: Individual feature toggles
- **Audit Trail**: All permission usage logged

### Bypass Prevention
- **Multiple Detection Methods**: Redundant security checks
- **Tamper Detection**: Extension modification monitoring
- **Process Monitoring**: Unauthorized application detection
- **Network Analysis**: Suspicious traffic identification

## 🧪 Testing

### Manual Testing
1. **Load the demo page**: Open `demo/index.html` in Chrome
2. **Install extension**: Load the unpacked extension
3. **Test basic functionality**: Activate monitoring, start session
4. **Test restrictions**: Try blocked actions (copy/paste, new tabs)
5. **Verify monitoring**: Check system stats, activity logs

### Automated Testing
```bash
# Run extension tests (if test framework is set up)
npm test

# Validate manifest
chrome --pack-extension=./extension --pack-extension-key=./extension.pem
```

### Security Testing
- **Bypass Attempts**: Try to circumvent restrictions
- **Performance Impact**: Monitor system resource usage
- **Compatibility**: Test with different Chrome versions
- **Edge Cases**: Test with multiple monitors, low battery, etc.

## 🚀 Deployment

### Chrome Web Store
1. **Prepare package**: Create ZIP file of extension folder
2. **Developer Account**: Register Chrome Web Store developer account
3. **Upload Extension**: Submit package for review
4. **Store Listing**: Add descriptions, screenshots, privacy policy
5. **Review Process**: Wait for Google approval

### Enterprise Deployment
1. **Policy Configuration**: Set up Chrome enterprise policies
2. **Force Installation**: Deploy via Group Policy or MDM
3. **Configuration Management**: Centralized settings distribution
4. **Monitoring**: Track deployment status across organization

### Self-Hosted Distribution
1. **Package Extension**: Create CRX file
2. **Update Server**: Set up extension update server
3. **Installation Instructions**: Provide manual installation guide
4. **Version Management**: Handle extension updates

## 📝 Troubleshooting

### Common Issues

#### Extension Not Loading
- **Check Manifest**: Verify manifest.json syntax
- **Permission Errors**: Ensure all required permissions are declared
- **File Paths**: Verify all referenced files exist
- **Chrome Version**: Check compatibility with Chrome version

#### Monitoring Not Working
- **Extension Active**: Verify extension is enabled and active
- **Permissions**: Check if required permissions are granted
- **Content Script Injection**: Ensure scripts load on target pages
- **Background Service**: Verify service worker is running

#### API Integration Issues
- **Extension ID**: Verify correct extension ID in integration code
- **Message Passing**: Check chrome.runtime.sendMessage usage
- **CORS Issues**: Ensure proper cross-origin configuration
- **Event Listeners**: Verify event listener setup

### Debug Mode
Enable debug logging by setting:
```javascript
window.STELogger.setLogLevel('DEBUG');
```

### Support Channels
- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: Check README and code comments
- **Community**: Join discussion forums
- **Enterprise Support**: Contact for business inquiries

## 🤝 Contributing

### Development Setup
1. **Fork Repository**: Create your own fork
2. **Clone Locally**: `git clone your-fork-url`
3. **Create Branch**: `git checkout -b feature/your-feature`
4. **Make Changes**: Implement your improvements
5. **Test Thoroughly**: Verify all functionality works
6. **Submit PR**: Create pull request with detailed description

### Code Standards
- **ESLint**: Follow JavaScript linting rules
- **Comments**: Document complex functionality
- **Error Handling**: Implement proper error handling
- **Security**: Follow secure coding practices

### Testing Requirements
- **Manual Testing**: Test all affected functionality
- **Cross-browser**: Verify Chrome compatibility
- **Performance**: Ensure no significant performance impact
- **Security**: Validate security implications

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Chrome Extension API documentation
- Web security best practices
- Open source testing tools
- Community feedback and contributions

## 📞 Support

For support, questions, or feature requests:
- **Email**: support@example.com
- **GitHub Issues**: [Create an issue](https://github.com/your-repo/issues)
- **Documentation**: [Wiki](https://github.com/your-repo/wiki)
- **Community**: [Discussions](https://github.com/your-repo/discussions)

---

**Note**: This extension is designed for legitimate testing and examination purposes. Users should comply with all applicable laws and regulations regarding monitoring and privacy.