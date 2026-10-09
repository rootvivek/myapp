#!/bin/bash
# Run Android build with Node 20

echo "════════════════════════════════════════════════════════════"
echo "   📱 Building and Running Android App"
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
echo "🏗️  Building and launching app..."
echo ""

# Run the Android build
npm run android
