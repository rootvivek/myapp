#!/bin/bash
# Automated fix for app crash after splash screen
# This script will guide you through fixing the Node.js version issue

set -e

echo "════════════════════════════════════════════════════════════"
echo "   🚨 APP CRASH FIX - Node.js Version Compatibility Issue   "
echo "════════════════════════════════════════════════════════════"
echo ""

# Check current Node version
CURRENT_NODE=$(node --version)
NODE_MAJOR=$(echo $CURRENT_NODE | sed 's/v//' | cut -d. -f1)

echo "📦 Current Node.js: $CURRENT_NODE"
echo ""

if [ "$NODE_MAJOR" -ge 21 ]; then
    echo "❌ PROBLEM IDENTIFIED!"
    echo "   Node.js v$NODE_MAJOR is TOO NEW for React Native 0.79.2"
    echo "   This is causing your app to crash after splash screen"
    echo ""
    echo "✅ SOLUTION: Switch to Node.js v20"
    echo ""
    
    # Check if nvm is available
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    
    if command -v nvm &> /dev/null; then
        echo "🔧 NVM detected! Fixing now..."
        echo ""
        
        # Install Node 20 if not present
        echo "📥 Installing Node.js v20..."
        nvm install 20
        
        echo ""
        echo "🔄 Switching to Node.js v20..."
        nvm use 20
        
        echo ""
        FIXED_NODE=$(node --version)
        echo "✅ Node.js switched to: $FIXED_NODE"
        echo ""
        
        # Clear all caches
        echo "🧹 Clearing caches..."
        rm -rf node_modules/.cache 2>/dev/null || true
        rm -rf $TMPDIR/metro-* 2>/dev/null || true
        rm -rf $TMPDIR/haste-* 2>/dev/null || true
        rm -rf android/app/build 2>/dev/null || true
        rm -rf android/build 2>/dev/null || true
        
        if command -v watchman &> /dev/null; then
            watchman watch-del-all > /dev/null 2>&1 || true
        fi
        
        echo "✅ Caches cleared!"
        echo ""
        
        # Reinstall dependencies
        echo "📦 Reinstalling dependencies with correct Node version..."
        rm -rf node_modules
        rm -f package-lock.json
        npm install
        
        echo ""
        echo "════════════════════════════════════════════════════════════"
        echo "   ✅ FIX COMPLETE! Your app should work now!              "
        echo "════════════════════════════════════════════════════════════"
        echo ""
        echo "🚀 To run your app:"
        echo ""
        echo "   Terminal 1:"
        echo "   $ npm run start:fresh"
        echo ""
        echo "   Terminal 2:"
        echo "   $ npm run android"
        echo ""
        echo "💡 TIP: Run 'nvm use' in your project directory to always"
        echo "   use the correct Node version (thanks to .nvmrc file)"
        echo ""
        
    else
        echo "❌ NVM not found!"
        echo ""
        echo "📋 MANUAL FIX REQUIRED:"
        echo ""
        echo "1. Install Node.js v20 using one of these methods:"
        echo ""
        echo "   Option A - Install NVM (recommended):"
        echo "   $ curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
        echo "   $ source ~/.zshrc  # or ~/.bashrc"
        echo "   $ nvm install 20"
        echo "   $ nvm use 20"
        echo ""
        echo "   Option B - Use Homebrew:"
        echo "   $ brew install node@20"
        echo "   $ brew link --force --overwrite node@20"
        echo ""
        echo "2. After installing Node 20, run this script again:"
        echo "   $ ./scripts/fix-app-crash.sh"
        echo ""
        exit 1
    fi
else
    echo "✅ Node.js version is compatible!"
    echo ""
    echo "🧹 Clearing caches to fix any remaining issues..."
    
    rm -rf node_modules/.cache 2>/dev/null || true
    rm -rf $TMPDIR/metro-* 2>/dev/null || true
    rm -rf $TMPDIR/haste-* 2>/dev/null || true
    rm -rf android/app/build 2>/dev/null || true
    rm -rf android/build 2>/dev/null || true
    
    if command -v watchman &> /dev/null; then
        watchman watch-del-all > /dev/null 2>&1 || true
    fi
    
    cd android && ./gradlew clean > /dev/null 2>&1 && cd .. || true
    
    echo "✅ Caches cleared!"
    echo ""
    echo "🚀 Your app should work now. Run:"
    echo ""
    echo "   Terminal 1: npm run start:fresh"
    echo "   Terminal 2: npm run android"
    echo ""
fi
