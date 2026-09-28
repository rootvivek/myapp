#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# Database Update Script
# Applies migration fixes to your Supabase database.
# ═══════════════════════════════════════════════════════════════
#
# Usage:
#   ./scripts/update-database.sh
#
# Requires:
#   - supabase CLI installed (npm install -g supabase)
#   - Being in the supabase/ directory
#   - A Supabase project linked (supabase link)
#
# Or run directly via SQL:
#   1. Open Supabase Dashboard → SQL Editor
#   2. Copy the contents of supabase/migrations/20260928_fixes.sql
#   3. Run the query

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MIGRATION_FILE="$SCRIPT_DIR/../supabase/migrations/20260928_fixes.sql"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║           Database Update Script                             ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Check if supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: supabase CLI not found."
    echo "   Install it with: npm install -g supabase"
    echo ""
    echo "   OR run the migration manually:"
    echo "   1. Open Supabase Dashboard → SQL Editor"
    echo "   2. Copy the contents of: $MIGRATION_FILE"
    echo "   3. Run the query"
    exit 1
fi

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Error: Migration file not found: $MIGRATION_FILE"
    exit 1
fi

echo "📁 Migration file: $MIGRATION_FILE"
echo ""

# Ask for confirmation
read -p "⚠️  This will apply database changes. Continue? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled."
    exit 0
fi

echo "🔄 Applying migration..."

# Try to push the migration
supabase db push --include-all 2>/dev/null || {
    echo ""
    echo "⚠️  supabase db push failed. Trying direct SQL execution..."
    echo ""
    
    # Read the SQL file and ask user to run manually
    echo "Please run the following SQL in your Supabase Dashboard → SQL Editor:"
    echo ""
    echo "───────────────────────────────────────────────────────────────"
    cat "$MIGRATION_FILE"
    echo "───────────────────────────────────────────────────────────────"
    echo ""
    echo "✅ After running the SQL above, the database will be up to date."
    exit 0
}

echo ""
echo "✅ Database updated successfully!"
echo ""
echo "Applied fixes:"
echo "  • Search function security & sanitization"
echo "  • Missing indexes (created_by, status)"
echo "  • Missing columns (phone, username, etc.)"
echo "  • Backfill orphaned records"
echo ""
