#!/usr/bin/env python3

import os
import json
import sys
from pathlib import Path

class ExtensionTester:
    def __init__(self):
        self.extension_path = Path(__file__).parent / 'extension'
        self.errors = []
        self.warnings = []
        self.passed = 0
        self.total = 0

    def test(self, description, test_fn):
        self.total += 1
        try:
            result = test_fn()
            if result:
                print(f"✅ {description}")
                self.passed += 1
            else:
                print(f"❌ {description}")
                self.errors.append(description)
        except Exception as error:
            print(f"❌ {description} - {str(error)}")
            self.errors.append(f"{description}: {str(error)}")

    def warn(self, description, test_fn):
        try:
            result = test_fn()
            if not result:
                print(f"⚠️  {description}")
                self.warnings.append(description)
        except Exception as error:
            print(f"⚠️  {description} - {str(error)}")
            self.warnings.append(f"{description}: {str(error)}")

    def file_exists(self, file_path):
        return (self.extension_path / file_path).exists()

    def read_json_file(self, file_path):
        full_path = self.extension_path / file_path
        if not full_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        with open(full_path, 'r', encoding='utf-8') as f:
            return json.load(f)

    def read_file(self, file_path):
        full_path = self.extension_path / file_path
        if not full_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        with open(full_path, 'r', encoding='utf-8') as f:
            return f.read()

    def run_tests(self):
        print('🧪 Testing Secure Testing Environment Extension\n')

        # Test manifest.json
        print('📋 Testing manifest.json...')
        self.test('manifest.json exists', lambda: self.file_exists('manifest.json'))
        
        self.test('manifest.json is valid JSON', lambda: (
            isinstance(self.read_json_file('manifest.json'), dict)
        ))

        self.test('manifest has required fields', lambda: (
            lambda manifest: manifest.get('name') and manifest.get('version') and manifest.get('manifest_version') == 3
        )(self.read_json_file('manifest.json')))

        self.test('manifest has background service worker', lambda: (
            lambda manifest: manifest.get('background', {}).get('service_worker')
        )(self.read_json_file('manifest.json')))

        self.test('manifest has content scripts', lambda: (
            lambda manifest: manifest.get('content_scripts') and len(manifest.get('content_scripts', [])) > 0
        )(self.read_json_file('manifest.json')))

        self.test('manifest has required permissions', lambda: (
            lambda manifest: all(perm in manifest.get('permissions', []) 
                                for perm in ['activeTab', 'tabs', 'storage', 'system.cpu', 'system.memory'])
        )(self.read_json_file('manifest.json')))

        # Test background scripts
        print('\n🔧 Testing background scripts...')
        self.test('service-worker.js exists', lambda: self.file_exists('background/service-worker.js'))
        self.test('system-monitor.js exists', lambda: self.file_exists('background/system-monitor.js'))
        self.test('config-manager.js exists', lambda: self.file_exists('background/config-manager.js'))

        self.test('service-worker.js has main class', lambda: (
            'class SecureTestingService' in self.read_file('background/service-worker.js')
        ))

        self.test('system-monitor.js has monitoring class', lambda: (
            'class SystemMonitor' in self.read_file('background/system-monitor.js')
        ))

        self.test('config-manager.js has config class', lambda: (
            'class ConfigManager' in self.read_file('background/config-manager.js')
        ))

        # Test content scripts
        print('\n📄 Testing content scripts...')
        self.test('security-enforcer.js exists', lambda: self.file_exists('content/security-enforcer.js'))
        self.test('keyboard-tracker.js exists', lambda: self.file_exists('content/keyboard-tracker.js'))
        self.test('page-monitor.js exists', lambda: self.file_exists('content/page-monitor.js'))

        self.test('security-enforcer.js has main class', lambda: (
            'class SecurityEnforcer' in self.read_file('content/security-enforcer.js')
        ))

        self.test('keyboard-tracker.js has tracking class', lambda: (
            'class KeyboardTracker' in self.read_file('content/keyboard-tracker.js')
        ))

        self.test('page-monitor.js has monitoring class', lambda: (
            'class PageMonitor' in self.read_file('content/page-monitor.js')
        ))

        # Test popup interface
        print('\n🖼️  Testing popup interface...')
        self.test('popup.html exists', lambda: self.file_exists('popup/popup.html'))
        self.test('popup.css exists', lambda: self.file_exists('popup/popup.css'))
        self.test('popup.js exists', lambda: self.file_exists('popup/popup.js'))

        self.test('popup.html is valid HTML', lambda: (
            lambda content: '<!DOCTYPE html>' in content and '<html' in content
        )(self.read_file('popup/popup.html')))

        self.test('popup.js has controller class', lambda: (
            'class PopupController' in self.read_file('popup/popup.js')
        ))

        # Test admin interface
        print('\n⚙️  Testing admin interface...')
        self.test('admin.html exists', lambda: self.file_exists('admin/admin.html'))
        self.test('admin.css exists', lambda: self.file_exists('admin/admin.css'))
        self.test('admin.js exists', lambda: self.file_exists('admin/admin.js'))

        self.test('admin.html is valid HTML', lambda: (
            lambda content: '<!DOCTYPE html>' in content and '<html' in content
        )(self.read_file('admin/admin.html')))

        self.test('admin.js has panel class', lambda: (
            'class AdminPanel' in self.read_file('admin/admin.js')
        ))

        # Test integration API
        print('\n🔌 Testing integration API...')
        self.test('integration-api.js exists', lambda: self.file_exists('api/integration-api.js'))

        self.test('integration-api.js has main API class', lambda: (
            'class SecureTestingEnvironmentAPI' in self.read_file('api/integration-api.js')
        ))

        self.test('integration-api.js exposes global API', lambda: (
            'window.SecureTestingEnvironment' in self.read_file('api/integration-api.js')
        ))

        # Test utilities
        print('\n🛠️  Testing utilities...')
        self.test('logger.js exists', lambda: self.file_exists('utils/logger.js'))
        self.test('api-client.js exists', lambda: self.file_exists('utils/api-client.js'))

        self.test('logger.js has Logger class', lambda: (
            'class Logger' in self.read_file('utils/logger.js')
        ))

        self.test('api-client.js has APIClient class', lambda: (
            'class APIClient' in self.read_file('utils/api-client.js')
        ))

        # Test manifest references
        print('\n🔗 Testing manifest file references...')
        self.test('all background scripts exist', lambda: (
            lambda manifest: self.file_exists(manifest['background']['service_worker'])
        )(self.read_json_file('manifest.json')))

        self.test('all content scripts exist', lambda: (
            lambda manifest: all(self.file_exists(script) 
                                for script in manifest['content_scripts'][0]['js'])
        )(self.read_json_file('manifest.json')))

        self.test('popup HTML exists', lambda: (
            lambda manifest: self.file_exists(manifest['action']['default_popup'])
        )(self.read_json_file('manifest.json')))

        # Test web accessible resources
        self.test('web accessible resources exist', lambda: (
            lambda manifest: all(self.file_exists(resource) 
                                for resource in manifest['web_accessible_resources'][0]['resources'])
        )(self.read_json_file('manifest.json')))

        # Warnings for optional files
        print('\n⚠️  Checking optional files...')
        self.warn('Icon files should exist', lambda: (
            self.file_exists('icons/icon16.png') and 
            self.file_exists('icons/icon32.png') and 
            self.file_exists('icons/icon48.png') and 
            self.file_exists('icons/icon128.png')
        ))

        # Test demo page
        print('\n🎯 Testing demo page...')
        demo_path = Path(__file__).parent / 'demo/index.html'
        self.test('demo page exists', lambda: demo_path.exists())

        self.test('demo page is valid HTML', lambda: (
            lambda: (demo_path.exists() and 
                    '<!DOCTYPE html>' in demo_path.read_text(encoding='utf-8') and 
                    'STEDemo' in demo_path.read_text(encoding='utf-8'))
        )())

        # Summary
        print('\n📊 Test Summary')
        print('================')
        print(f"✅ Passed: {self.passed}/{self.total}")
        print(f"❌ Failed: {len(self.errors)}")
        print(f"⚠️  Warnings: {len(self.warnings)}")

        if self.errors:
            print('\n❌ Errors:')
            for error in self.errors:
                print(f"  - {error}")

        if self.warnings:
            print('\n⚠️  Warnings:')
            for warning in self.warnings:
                print(f"  - {warning}")

        success_rate = (self.passed / self.total * 100) if self.total > 0 else 0
        print(f"\n🎯 Success Rate: {success_rate:.1f}%")

        if not self.errors:
            print('\n🎉 All tests passed! Extension structure is valid.')
            return True
        else:
            print('\n💥 Some tests failed. Please fix the errors above.')
            return False

if __name__ == '__main__':
    tester = ExtensionTester()
    success = tester.run_tests()
    sys.exit(0 if success else 1)