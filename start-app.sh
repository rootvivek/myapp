#!/bin/bash
# Run your app with Node 20

echo "════════════════════════════════════════════════════════════"
echo "   🚀 Starting Your App with Node 20.20.2"
echo "════════════════════════════════════════════════════════════"
echo ""

# Ensure we're using Node 20
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"

# Verify Node version
CURRENT_NODE=$(node --version)
echo "📦 Using Node.js: $CURRENT_NODE"
echo ""

if [[ ! "$CURRENT_NODE" =~ ^v20 ]]; then
    echo "❌ ERROR: Wrong Node version detected!"
    echo "   Please restart your terminal and try again"
    exit 1
fi

echo "✅ Node version is correct!"
echo ""
echo "🚀 Starting Metro bundler with fresh cache..."
echo ""
echo "   Keep this terminal open"
echo "   Open another terminal and run: npm run android"
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""

# Start Metro with fresh cache
npx react-native start --reset-cache
