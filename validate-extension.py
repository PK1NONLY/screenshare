#!/usr/bin/env python3
"""
Extension Validation Script
Checks for common issues that prevent Chrome extensions from loading
"""

import json
import os
import sys
from pathlib import Path

def validate_extension(extension_path):
    """Validate Chrome extension for common issues"""
    
    print(f"🔍 Validating extension at: {extension_path}")
    print("=" * 60)
    
    issues = []
    warnings = []
    
    # Check if extension directory exists
    if not os.path.exists(extension_path):
        issues.append(f"❌ Extension directory does not exist: {extension_path}")
        return issues, warnings
    
    # Check manifest.json
    manifest_path = os.path.join(extension_path, 'manifest.json')
    if not os.path.exists(manifest_path):
        issues.append("❌ manifest.json not found")
        return issues, warnings
    
    try:
        with open(manifest_path, 'r') as f:
            manifest = json.load(f)
        print("✅ manifest.json is valid JSON")
    except json.JSONDecodeError as e:
        issues.append(f"❌ manifest.json has invalid JSON: {e}")
        return issues, warnings
    
    # Check required manifest fields
    required_fields = ['manifest_version', 'name', 'version']
    for field in required_fields:
        if field not in manifest:
            issues.append(f"❌ Missing required field in manifest: {field}")
    
    # Check manifest version
    if manifest.get('manifest_version') != 3:
        warnings.append(f"⚠️  Manifest version is {manifest.get('manifest_version')}, expected 3")
    
    # Check icons
    if 'icons' in manifest:
        for size, icon_path in manifest['icons'].items():
            full_icon_path = os.path.join(extension_path, icon_path)
            if not os.path.exists(full_icon_path):
                issues.append(f"❌ Icon file not found: {icon_path}")
            else:
                print(f"✅ Icon {size}x{size}: {icon_path}")
    
    # Check background script
    if 'background' in manifest:
        if 'service_worker' in manifest['background']:
            sw_path = os.path.join(extension_path, manifest['background']['service_worker'])
            if not os.path.exists(sw_path):
                issues.append(f"❌ Service worker not found: {manifest['background']['service_worker']}")
            else:
                print(f"✅ Service worker: {manifest['background']['service_worker']}")
    
    # Check content scripts
    if 'content_scripts' in manifest:
        for i, cs in enumerate(manifest['content_scripts']):
            print(f"\n📄 Content Script {i+1}:")
            print(f"   Matches: {cs.get('matches', [])}")
            
            # Check JS files
            for js_file in cs.get('js', []):
                js_path = os.path.join(extension_path, js_file)
                if not os.path.exists(js_path):
                    issues.append(f"❌ Content script JS not found: {js_file}")
                else:
                    print(f"   ✅ JS: {js_file}")
            
            # Check CSS files
            for css_file in cs.get('css', []):
                css_path = os.path.join(extension_path, css_file)
                if not os.path.exists(css_path):
                    issues.append(f"❌ Content script CSS not found: {css_file}")
                else:
                    print(f"   ✅ CSS: {css_file}")
    
    # Check popup
    if 'action' in manifest and 'default_popup' in manifest['action']:
        popup_path = os.path.join(extension_path, manifest['action']['default_popup'])
        if not os.path.exists(popup_path):
            issues.append(f"❌ Popup HTML not found: {manifest['action']['default_popup']}")
        else:
            print(f"✅ Popup: {manifest['action']['default_popup']}")
    
    # Check permissions
    permissions = manifest.get('permissions', [])
    print(f"\n🔐 Permissions: {permissions}")
    
    host_permissions = manifest.get('host_permissions', [])
    if host_permissions:
        print(f"🌐 Host Permissions: {host_permissions}")
    
    # Check for common file structure
    expected_dirs = ['background', 'content', 'popup', 'icons', 'utils']
    for dir_name in expected_dirs:
        dir_path = os.path.join(extension_path, dir_name)
        if os.path.exists(dir_path):
            print(f"✅ Directory: {dir_name}/")
        else:
            warnings.append(f"⚠️  Directory not found: {dir_name}/")
    
    return issues, warnings

def main():
    extension_path = os.path.join(os.path.dirname(__file__), 'extension')
    
    issues, warnings = validate_extension(extension_path)
    
    print("\n" + "=" * 60)
    print("📋 VALIDATION RESULTS")
    print("=" * 60)
    
    if issues:
        print("❌ CRITICAL ISSUES (will prevent extension from loading):")
        for issue in issues:
            print(f"   {issue}")
    else:
        print("✅ No critical issues found!")
    
    if warnings:
        print("\n⚠️  WARNINGS:")
        for warning in warnings:
            print(f"   {warning}")
    
    if not issues and not warnings:
        print("\n🎉 Extension validation passed! Extension should load properly.")
    elif not issues:
        print("\n✅ Extension should load, but check warnings above.")
    else:
        print(f"\n❌ Extension has {len(issues)} critical issues that must be fixed.")
        return 1
    
    return 0

if __name__ == '__main__':
    sys.exit(main())