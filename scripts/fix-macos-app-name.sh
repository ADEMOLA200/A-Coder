#!/bin/bash

# Script to fix macOS permission dialog showing "Electron" instead of "A-Coder"
# This renames the executable and updates Info.plist

set -e

APP_PATH="../VSCode-darwin-arm64/A-Coder.app"
CONTENTS_PATH="$APP_PATH/Contents"
MACOS_PATH="$CONTENTS_PATH/MacOS"
INFO_PLIST="$CONTENTS_PATH/Info.plist"

echo "🔧 Fixing macOS app name in permission dialogs..."

# Check if app exists
if [ ! -d "$APP_PATH" ]; then
    echo "❌ Error: App not found at $APP_PATH"
    echo "   Please run: npm run gulp -- vscode-darwin-arm64"
    exit 1
fi

# Rename the Electron executable to A-Coder
if [ -f "$MACOS_PATH/Electron" ]; then
    echo "📝 Renaming executable: Electron → A-Coder"
    mv "$MACOS_PATH/Electron" "$MACOS_PATH/A-Coder"
else
    echo "ℹ️  Executable already renamed or not found"
fi

# Update CFBundleExecutable in Info.plist
echo "📝 Updating Info.plist..."
/usr/libexec/PlistBuddy -c "Set :CFBundleExecutable A-Coder" "$INFO_PLIST" 2>/dev/null || \
    /usr/libexec/PlistBuddy -c "Add :CFBundleExecutable string A-Coder" "$INFO_PLIST"

# Update any helper executables that might reference the old name
FRAMEWORKS_PATH="$CONTENTS_PATH/Frameworks"
for helper in "$FRAMEWORKS_PATH/A-Coder Helper"*.app; do
    if [ -d "$helper" ]; then
        helper_name=$(basename "$helper" .app)
        helper_plist="$helper/Contents/Info.plist"
        
        if [ -f "$helper_plist" ]; then
            echo "📝 Updating helper: $helper_name"
            /usr/libexec/PlistBuddy -c "Set :CFBundleExecutable $helper_name" "$helper_plist" 2>/dev/null || true
        fi
    fi
done

echo "✅ App name fixed successfully!"
echo ""
echo "macOS permission dialogs will now show 'A-Coder' instead of 'Electron'"
echo ""
echo "Next steps:"
echo "1. Create DMG: hdiutil create -volname \"A-Coder\" -srcfolder ../VSCode-darwin-arm64/A-Coder.app -ov -format UDZO A-Coder.dmg"
echo "2. Test the app to verify permission dialogs show 'A-Coder'"
