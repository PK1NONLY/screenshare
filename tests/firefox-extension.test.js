// Firefox extension compatibility tests

const fs = require('fs');
const path = require('path');

describe('Firefox Extension Compatibility', () => {
  let manifest;

  beforeAll(() => {
    const manifestPath = path.join(__dirname, '../extension/manifest.json');
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  });

  describe('Manifest V2 Compatibility', () => {
    test('should use manifest version 2', () => {
      expect(manifest.manifest_version).toBe(2);
    });

    test('should have browser_action instead of action', () => {
      expect(manifest.browser_action).toBeDefined();
      expect(manifest.action).toBeUndefined();
    });

    test('should have background scripts instead of service worker', () => {
      expect(manifest.background.scripts).toBeDefined();
      expect(manifest.background.service_worker).toBeUndefined();
    });

    test('should have web_accessible_resources as array', () => {
      expect(Array.isArray(manifest.web_accessible_resources)).toBe(true);
    });

    test('should have content_security_policy as string', () => {
      expect(typeof manifest.content_security_policy).toBe('string');
    });

    test('should have Firefox-specific applications section', () => {
      expect(manifest.applications).toBeDefined();
      expect(manifest.applications.gecko).toBeDefined();
      expect(manifest.applications.gecko.id).toBeDefined();
    });

    test('should have _execute_browser_action command', () => {
      expect(manifest.commands._execute_browser_action).toBeDefined();
    });
  });

  describe('Cross-browser API Helper', () => {
    test('should provide getAPI function in background script', () => {
      const serviceWorkerPath = path.join(__dirname, '../extension/background/service-worker.js');
      const serviceWorkerContent = fs.readFileSync(serviceWorkerPath, 'utf8');
      
      expect(serviceWorkerContent).toContain('const getAPI = () => typeof browser !== \'undefined\' ? browser : chrome;');
      expect(serviceWorkerContent).toContain('getAPI().');
      expect(serviceWorkerContent).not.toContain('chrome.');
    });

    test('should provide getAPI function in content scripts', () => {
      const contentScripts = [
        'keyboard-tracker.js',
        'page-monitor.js',
        'security-enforcer.js'
      ];

      contentScripts.forEach(script => {
        const scriptPath = path.join(__dirname, '../extension/content', script);
        const scriptContent = fs.readFileSync(scriptPath, 'utf8');
        
        expect(scriptContent).toContain('const getAPI = () => typeof browser !== \'undefined\' ? browser : chrome;');
        expect(scriptContent).toContain('getAPI().');
        expect(scriptContent).not.toContain('chrome.');
      });
    });

    test('should provide getAPI function in popup script', () => {
      const popupPath = path.join(__dirname, '../extension/popup/popup.js');
      const popupContent = fs.readFileSync(popupPath, 'utf8');
      
      expect(popupContent).toContain('const getAPI = () => typeof browser !== \'undefined\' ? browser : chrome;');
      expect(popupContent).toContain('getAPI().');
      expect(popupContent).not.toContain('chrome.');
    });

    test('should provide getAPI function in admin script', () => {
      const adminPath = path.join(__dirname, '../extension/admin/admin.js');
      const adminContent = fs.readFileSync(adminPath, 'utf8');
      
      expect(adminContent).toContain('const getAPI = () => typeof browser !== \'undefined\' ? browser : chrome;');
      expect(adminContent).toContain('getAPI().');
      expect(adminContent).not.toContain('chrome.');
    });

    test('should provide getAPI function in utility scripts', () => {
      const utilityScripts = [
        'config-manager.js',
        'system-monitor.js',
        'logger.js'
      ];

      utilityScripts.forEach(script => {
        const scriptPath = path.join(__dirname, '../extension/background', script);
        if (!fs.existsSync(scriptPath)) {
          // Try utils directory
          const utilsPath = path.join(__dirname, '../extension/utils', script);
          if (fs.existsSync(utilsPath)) {
            const scriptContent = fs.readFileSync(utilsPath, 'utf8');
            expect(scriptContent).toContain('const getAPI = () => typeof browser !== \'undefined\' ? browser : chrome;');
            expect(scriptContent).toContain('getAPI().');
            expect(scriptContent).not.toContain('chrome.');
          }
        } else {
          const scriptContent = fs.readFileSync(scriptPath, 'utf8');
          expect(scriptContent).toContain('const getAPI = () => typeof browser !== \'undefined\' ? browser : chrome;');
          expect(scriptContent).toContain('getAPI().');
          expect(scriptContent).not.toContain('chrome.');
        }
      });
    });
  });

  describe('Firefox-specific Features', () => {
    test('should handle both _execute_action and _execute_browser_action commands', () => {
      const serviceWorkerPath = path.join(__dirname, '../extension/background/service-worker.js');
      const serviceWorkerContent = fs.readFileSync(serviceWorkerPath, 'utf8');
      
      expect(serviceWorkerContent).toContain('case \'_execute_action\':');
      expect(serviceWorkerContent).toContain('case \'_execute_browser_action\':');
    });

    test('should have Firefox-compatible permissions', () => {
      const requiredPermissions = [
        'activeTab',
        'storage',
        'tabs',
        'commands'
      ];

      requiredPermissions.forEach(permission => {
        expect(manifest.permissions).toContain(permission);
      });

      // Should not have Chrome-only permissions that don't exist in Firefox
      expect(manifest.permissions).not.toContain('processes');
      expect(manifest.permissions).not.toContain('system.cpu');
      expect(manifest.permissions).not.toContain('system.memory');
    });

    test('should have proper content script matches', () => {
      expect(manifest.content_scripts).toBeDefined();
      expect(Array.isArray(manifest.content_scripts)).toBe(true);
      
      manifest.content_scripts.forEach(script => {
        expect(script.matches).toBeDefined();
        expect(Array.isArray(script.matches)).toBe(true);
        expect(script.js).toBeDefined();
        expect(Array.isArray(script.js)).toBe(true);
      });
    });
  });

  describe('Extension Structure', () => {
    test('should have all required files', () => {
      const requiredFiles = [
        'extension/manifest.json',
        'extension/background/service-worker.js',
        'extension/popup/popup.html',
        'extension/popup/popup.js',
        'extension/popup/popup.css',
        'extension/admin/admin.html',
        'extension/admin/admin.js',
        'extension/admin/admin.css',
        'extension/content/keyboard-tracker.js',
        'extension/content/page-monitor.js',
        'extension/content/security-enforcer.js'
      ];

      requiredFiles.forEach(file => {
        const filePath = path.join(__dirname, '..', file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    test('should have valid JSON manifest', () => {
      expect(manifest).toBeDefined();
      expect(typeof manifest).toBe('object');
      expect(manifest.name).toBeDefined();
      expect(manifest.version).toBeDefined();
      expect(manifest.description).toBeDefined();
    });
  });
});