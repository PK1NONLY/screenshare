// Debug script to run in extension service worker console
// Copy and paste this into the service worker console to diagnose issues

console.log('=== EXTENSION DEBUG SCRIPT ===');

// Check basic extension info
console.log('1. Extension Basic Info:');
try {
  const manifest = chrome.runtime.getManifest();
  console.log('✅ Manifest loaded:', manifest.name, 'v' + manifest.version);
  console.log('✅ Extension ID:', chrome.runtime.id);
  console.log('✅ Extension URL:', chrome.runtime.getURL(''));
} catch (error) {
  console.error('❌ Failed to get extension info:', error);
}

// Check permissions
console.log('\n2. Permission Check:');
const requiredPermissions = ['tabs', 'storage', 'system.cpu', 'system.memory', 'system.display', 'notifications'];
requiredPermissions.forEach(permission => {
  if (chrome[permission.split('.')[0]]) {
    console.log(`✅ ${permission}: Available`);
  } else {
    console.log(`❌ ${permission}: Not available`);
  }
});

// Check service worker status
console.log('\n3. Service Worker Status:');
try {
  if (self.secureTestingService) {
    console.log('✅ SecureTestingService instance exists');
    console.log('   - isActive:', self.secureTestingService.isActive);
    console.log('   - isInitialized:', self.secureTestingService.isInitialized);
    console.log('   - config:', self.secureTestingService.config);
  } else {
    console.log('❌ SecureTestingService instance not found');
  }
} catch (error) {
  console.error('❌ Error checking service worker:', error);
}

// Test storage access
console.log('\n4. Storage Test:');
chrome.storage.local.get(['config', 'isActive'], (result) => {
  if (chrome.runtime.lastError) {
    console.error('❌ Storage error:', chrome.runtime.lastError);
  } else {
    console.log('✅ Storage accessible:', result);
  }
});

// Test system APIs
console.log('\n5. System API Test:');
if (chrome.system) {
  if (chrome.system.display) {
    chrome.system.display.getInfo((displays) => {
      if (chrome.runtime.lastError) {
        console.error('❌ Display API error:', chrome.runtime.lastError);
      } else {
        console.log('✅ Display API working:', displays.length, 'displays');
      }
    });
  }
  
  if (chrome.system.cpu) {
    chrome.system.cpu.getInfo((cpu) => {
      if (chrome.runtime.lastError) {
        console.error('❌ CPU API error:', chrome.runtime.lastError);
      } else {
        console.log('✅ CPU API working:', cpu.processors?.length, 'processors');
      }
    });
  }
  
  if (chrome.system.memory) {
    chrome.system.memory.getInfo((memory) => {
      if (chrome.runtime.lastError) {
        console.error('❌ Memory API error:', chrome.runtime.lastError);
      } else {
        console.log('✅ Memory API working:', Math.round(memory.capacity / 1024 / 1024 / 1024), 'GB');
      }
    });
  }
} else {
  console.log('❌ chrome.system not available');
}

// Test tabs API
console.log('\n6. Tabs API Test:');
if (chrome.tabs) {
  chrome.tabs.query({}, (tabs) => {
    if (chrome.runtime.lastError) {
      console.error('❌ Tabs API error:', chrome.runtime.lastError);
    } else {
      console.log('✅ Tabs API working:', tabs.length, 'tabs open');
    }
  });
} else {
  console.log('❌ chrome.tabs not available');
}

// Test content script injection
console.log('\n7. Content Script Test:');
if (chrome.tabs) {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'PING'}, (response) => {
        if (chrome.runtime.lastError) {
          console.error('❌ Content script communication failed:', chrome.runtime.lastError.message);
        } else {
          console.log('✅ Content script responding:', response);
        }
      });
    }
  });
}

// Test message handling
console.log('\n8. Message Handler Test:');
try {
  chrome.runtime.sendMessage({action: 'PING'}, (response) => {
    if (chrome.runtime.lastError) {
      console.error('❌ Internal message failed:', chrome.runtime.lastError);
    } else {
      console.log('✅ Internal message working:', response);
    }
  });
} catch (error) {
  console.error('❌ Message test error:', error);
}

console.log('\n=== DEBUG SCRIPT COMPLETE ===');
console.log('Copy the output above and share it for analysis.');