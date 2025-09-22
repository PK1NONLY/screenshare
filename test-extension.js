#!/usr/bin/env node

// Simple test script to validate extension structure and basic functionality

const fs = require('fs');
const path = require('path');

class ExtensionTester {
  constructor() {
    this.extensionPath = path.join(__dirname, 'extension');
    this.errors = [];
    this.warnings = [];
    this.passed = 0;
    this.total = 0;
  }

  test(description, testFn) {
    this.total++;
    try {
      const result = testFn();
      if (result) {
        console.log(`✅ ${description}`);
        this.passed++;
      } else {
        console.log(`❌ ${description}`);
        this.errors.push(description);
      }
    } catch (error) {
      console.log(`❌ ${description} - ${error.message}`);
      this.errors.push(`${description}: ${error.message}`);
    }
  }

  warn(description, testFn) {
    try {
      const result = testFn();
      if (!result) {
        console.log(`⚠️  ${description}`);
        this.warnings.push(description);
      }
    } catch (error) {
      console.log(`⚠️  ${description} - ${error.message}`);
      this.warnings.push(`${description}: ${error.message}`);
    }
  }

  fileExists(filePath) {
    return fs.existsSync(path.join(this.extensionPath, filePath));
  }

  readJsonFile(filePath) {
    const fullPath = path.join(this.extensionPath, filePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    const content = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(content);
  }

  readFile(filePath) {
    const fullPath = path.join(this.extensionPath, filePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    return fs.readFileSync(fullPath, 'utf8');
  }

  runTests() {
    console.log('🧪 Testing Secure Testing Environment Extension\n');

    // Test manifest.json
    console.log('📋 Testing manifest.json...');
    this.test('manifest.json exists', () => this.fileExists('manifest.json'));
    
    this.test('manifest.json is valid JSON', () => {
      const manifest = this.readJsonFile('manifest.json');
      return manifest && typeof manifest === 'object';
    });

    this.test('manifest has required fields', () => {
      const manifest = this.readJsonFile('manifest.json');
      return manifest.name && manifest.version && manifest.manifest_version === 3;
    });

    this.test('manifest has background service worker', () => {
      const manifest = this.readJsonFile('manifest.json');
      return manifest.background && manifest.background.service_worker;
    });

    this.test('manifest has content scripts', () => {
      const manifest = this.readJsonFile('manifest.json');
      return manifest.content_scripts && manifest.content_scripts.length > 0;
    });

    this.test('manifest has required permissions', () => {
      const manifest = this.readJsonFile('manifest.json');
      const requiredPermissions = ['activeTab', 'tabs', 'storage', 'system.cpu', 'system.memory'];
      return requiredPermissions.every(perm => manifest.permissions.includes(perm));
    });

    // Test background scripts
    console.log('\n🔧 Testing background scripts...');
    this.test('service-worker.js exists', () => this.fileExists('background/service-worker.js'));
    this.test('system-monitor.js exists', () => this.fileExists('background/system-monitor.js'));
    this.test('config-manager.js exists', () => this.fileExists('background/config-manager.js'));

    this.test('service-worker.js has main class', () => {
      const content = this.readFile('background/service-worker.js');
      return content.includes('class SecureTestingService');
    });

    this.test('system-monitor.js has monitoring class', () => {
      const content = this.readFile('background/system-monitor.js');
      return content.includes('class SystemMonitor');
    });

    this.test('config-manager.js has config class', () => {
      const content = this.readFile('background/config-manager.js');
      return content.includes('class ConfigManager');
    });

    // Test content scripts
    console.log('\n📄 Testing content scripts...');
    this.test('security-enforcer.js exists', () => this.fileExists('content/security-enforcer.js'));
    this.test('keyboard-tracker.js exists', () => this.fileExists('content/keyboard-tracker.js'));
    this.test('page-monitor.js exists', () => this.fileExists('content/page-monitor.js'));

    this.test('security-enforcer.js has main class', () => {
      const content = this.readFile('content/security-enforcer.js');
      return content.includes('class SecurityEnforcer');
    });

    this.test('keyboard-tracker.js has tracking class', () => {
      const content = this.readFile('content/keyboard-tracker.js');
      return content.includes('class KeyboardTracker');
    });

    this.test('page-monitor.js has monitoring class', () => {
      const content = this.readFile('content/page-monitor.js');
      return content.includes('class PageMonitor');
    });

    // Test popup interface
    console.log('\n🖼️  Testing popup interface...');
    this.test('popup.html exists', () => this.fileExists('popup/popup.html'));
    this.test('popup.css exists', () => this.fileExists('popup/popup.css'));
    this.test('popup.js exists', () => this.fileExists('popup/popup.js'));

    this.test('popup.html is valid HTML', () => {
      const content = this.readFile('popup/popup.html');
      return content.includes('<!DOCTYPE html>') && content.includes('<html');
    });

    this.test('popup.js has controller class', () => {
      const content = this.readFile('popup/popup.js');
      return content.includes('class PopupController');
    });

    // Test admin interface
    console.log('\n⚙️  Testing admin interface...');
    this.test('admin.html exists', () => this.fileExists('admin/admin.html'));
    this.test('admin.css exists', () => this.fileExists('admin/admin.css'));
    this.test('admin.js exists', () => this.fileExists('admin/admin.js'));

    this.test('admin.html is valid HTML', () => {
      const content = this.readFile('admin/admin.html');
      return content.includes('<!DOCTYPE html>') && content.includes('<html');
    });

    this.test('admin.js has panel class', () => {
      const content = this.readFile('admin/admin.js');
      return content.includes('class AdminPanel');
    });

    // Test integration API
    console.log('\n🔌 Testing integration API...');
    this.test('integration-api.js exists', () => this.fileExists('api/integration-api.js'));

    this.test('integration-api.js has main API class', () => {
      const content = this.readFile('api/integration-api.js');
      return content.includes('class SecureTestingEnvironmentAPI');
    });

    this.test('integration-api.js exposes global API', () => {
      const content = this.readFile('api/integration-api.js');
      return content.includes('window.SecureTestingEnvironment');
    });

    // Test utilities
    console.log('\n🛠️  Testing utilities...');
    this.test('logger.js exists', () => this.fileExists('utils/logger.js'));
    this.test('api-client.js exists', () => this.fileExists('utils/api-client.js'));

    this.test('logger.js has Logger class', () => {
      const content = this.readFile('utils/logger.js');
      return content.includes('class Logger');
    });

    this.test('api-client.js has APIClient class', () => {
      const content = this.readFile('utils/api-client.js');
      return content.includes('class APIClient');
    });

    // Test manifest references
    console.log('\n🔗 Testing manifest file references...');
    this.test('all background scripts exist', () => {
      const manifest = this.readJsonFile('manifest.json');
      const serviceWorker = manifest.background.service_worker;
      return this.fileExists(serviceWorker);
    });

    this.test('all content scripts exist', () => {
      const manifest = this.readJsonFile('manifest.json');
      const contentScripts = manifest.content_scripts[0].js;
      return contentScripts.every(script => this.fileExists(script));
    });

    this.test('popup HTML exists', () => {
      const manifest = this.readJsonFile('manifest.json');
      const popupHtml = manifest.action.default_popup;
      return this.fileExists(popupHtml);
    });

    // Test web accessible resources
    this.test('web accessible resources exist', () => {
      const manifest = this.readJsonFile('manifest.json');
      const resources = manifest.web_accessible_resources[0].resources;
      return resources.every(resource => this.fileExists(resource));
    });

    // Warnings for optional files
    console.log('\n⚠️  Checking optional files...');
    this.warn('Icon files should exist', () => {
      return this.fileExists('icons/icon16.png') && 
             this.fileExists('icons/icon32.png') && 
             this.fileExists('icons/icon48.png') && 
             this.fileExists('icons/icon128.png');
    });

    // Test demo page
    console.log('\n🎯 Testing demo page...');
    this.test('demo page exists', () => fs.existsSync(path.join(__dirname, 'demo/index.html')));

    this.test('demo page is valid HTML', () => {
      const demoPath = path.join(__dirname, 'demo/index.html');
      if (!fs.existsSync(demoPath)) return false;
      const content = fs.readFileSync(demoPath, 'utf8');
      return content.includes('<!DOCTYPE html>') && content.includes('STEDemo');
    });

    // Summary
    console.log('\n📊 Test Summary');
    console.log('================');
    console.log(`✅ Passed: ${this.passed}/${this.total}`);
    console.log(`❌ Failed: ${this.errors.length}`);
    console.log(`⚠️  Warnings: ${this.warnings.length}`);

    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.errors.forEach(error => console.log(`  - ${error}`));
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      this.warnings.forEach(warning => console.log(`  - ${warning}`));
    }

    const successRate = (this.passed / this.total * 100).toFixed(1);
    console.log(`\n🎯 Success Rate: ${successRate}%`);

    if (this.errors.length === 0) {
      console.log('\n🎉 All tests passed! Extension structure is valid.');
      return true;
    } else {
      console.log('\n💥 Some tests failed. Please fix the errors above.');
      return false;
    }
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new ExtensionTester();
  const success = tester.runTests();
  process.exit(success ? 0 : 1);
}

module.exports = ExtensionTester;