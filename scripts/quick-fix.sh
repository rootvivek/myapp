#!/bin/bash
# Quick fix for app crash - clears caches without reinstalling dependencies

echo "🔧 Quick fix for app crash after splash..."
echo ""

# Check Node version
NODE_VERSION=$(node --version | sed 's/v//' | cut -d. -f1)
echo "📦 Current Node.js version: $(node --version)"

if [ "$NODE_VERSION" -ge 21 ]; then
    echo ""
    echo "❌ CRITICAL: Node.js v$NODE_VERSION is TOO NEW!"
    echo "   React Native 0.79.2 requires Node.js 18.x or 20.x"
    echo ""
    echo "   Quick fix using nvm:"
    echo "   $ nvm install 20"
    echo "   $ nvm use 20"
    echo "   $ npm install"
    echo ""
    exit 1
fi

# Clear all caches
echo "🧹 Clearing all caches..."
rm -rf $TMPDIR/metro-* 2>/dev/null || true
rm -rf $TMPDIR/haste-* 2>/dev/null || true
rm -rf $TMPDIR/react-* 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true

# Clear watchman
if command -v watchman &> /dev/null; then
    watchman watch-del-all > /dev/null 2>&1
fi

# Clear Android build
rm -rf android/app/build 2>/dev/null || true
rm -rf android/build 2>/dev/null || true

# Clean gradle
cd android && ./gradlew clean > /dev/null 2>&1 && cd ..

echo "✅ Caches cleared!"
echo ""
echo "🚀 Now run:"
echo "   npx react-native start --reset-cache"
echo "   (in another terminal) npm run android"
echo ""
