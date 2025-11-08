#!/bin/bash

# Script to update the A-Coder app icon using a-coder-transparent-512.png
# This ensures the app icon matches the README logo

set -e

SOURCE_IMAGE="a-coder-transparent-512.png"
ICONSET_DIR="a-coder.iconset"
ICNS_FILE="a-coder.icns"
TARGET_ICON="resources/darwin/code.icns"

echo "🎨 Updating A-Coder app icon..."

# Check if source image exists
if [ ! -f "$SOURCE_IMAGE" ]; then
    echo "❌ Error: $SOURCE_IMAGE not found"
    exit 1
fi

# Remove old iconset if it exists
if [ -d "$ICONSET_DIR" ]; then
    echo "🗑️  Removing old iconset..."
    rm -rf "$ICONSET_DIR"
fi

# Create new iconset directory
echo "📁 Creating iconset directory..."
mkdir "$ICONSET_DIR"

# Generate all required icon sizes
echo "🖼️  Generating icon sizes..."
sips -z 16 16     "$SOURCE_IMAGE" --out "$ICONSET_DIR/icon_16x16.png" > /dev/null 2>&1
sips -z 32 32     "$SOURCE_IMAGE" --out "$ICONSET_DIR/icon_16x16@2x.png" > /dev/null 2>&1
sips -z 32 32     "$SOURCE_IMAGE" --out "$ICONSET_DIR/icon_32x32.png" > /dev/null 2>&1
sips -z 64 64     "$SOURCE_IMAGE" --out "$ICONSET_DIR/icon_32x32@2x.png" > /dev/null 2>&1
sips -z 128 128   "$SOURCE_IMAGE" --out "$ICONSET_DIR/icon_128x128.png" > /dev/null 2>&1
sips -z 256 256   "$SOURCE_IMAGE" --out "$ICONSET_DIR/icon_128x128@2x.png" > /dev/null 2>&1
sips -z 256 256   "$SOURCE_IMAGE" --out "$ICONSET_DIR/icon_256x256.png" > /dev/null 2>&1
sips -z 512 512   "$SOURCE_IMAGE" --out "$ICONSET_DIR/icon_256x256@2x.png" > /dev/null 2>&1
sips -z 512 512   "$SOURCE_IMAGE" --out "$ICONSET_DIR/icon_512x512.png" > /dev/null 2>&1
cp "$SOURCE_IMAGE" "$ICONSET_DIR/icon_512x512@2x.png"

# Convert iconset to .icns
echo "🔄 Converting to .icns format..."
iconutil -c icns "$ICONSET_DIR" -o "$ICNS_FILE"

# Replace the app icon
echo "📦 Replacing app icon..."
cp "$ICNS_FILE" "$TARGET_ICON"

echo "✅ App icon updated successfully!"
echo ""
echo "Next steps:"
echo "1. Rebuild the app: npm run gulp -- vscode-darwin-arm64"
echo "2. Create DMG: hdiutil create -volname \"A-Coder\" -srcfolder ../VSCode-darwin-arm64/A-Coder.app -ov -format UDZO A-Coder.dmg"
