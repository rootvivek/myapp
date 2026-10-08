#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# Database Update Script
# Applies every migration in supabase/migrations to your Supabase
# database, in filename (date) order.
# ═══════════════════════════════════════════════════════════════
#
# Usage:
#   ./scripts/update-database.sh
#
# Requires one of:
#   - supabase CLI installed and linked (npm install -g supabase), or
#   - the Supabase Dashboard SQL Editor (the script prints the SQL to paste)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MIGRATIONS_DIR="$SCRIPT_DIR/../supabase/migrations"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║           Database Update Script                             ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo "❌ Error: Migrations directory not found: $MIGRATIONS_DIR"
    exit 1
fi

# Collect migration files in deterministic (chronological) order.
MIGRATION_FILES=()
while IFS= read -r file; do
    MIGRATION_FILES+=("$file")
done < <(find "$MIGRATIONS_DIR" -maxdepth 1 -name '*.sql' | sort)

if [ ${#MIGRATION_FILES[@]} -eq 0 ]; then
    echo "❌ Error: No .sql migration files found in $MIGRATIONS_DIR"
    exit 1
fi

echo "📁 Migrations to apply (${#MIGRATION_FILES[@]}):"
for file in "${MIGRATION_FILES[@]}"; do
    echo "   • $(basename "$file")"
done
echo ""

# Ask for confirmation
read -p "⚠️  This will apply database changes. Continue? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled."
    exit 0
fi

echo "🔄 Applying migrations..."

# `supabase db push --include-all` applies all pending migrations, so a single
# call covers every file above. Fall back to printing the SQL for manual runs.
if command -v supabase &> /dev/null && supabase db push --include-all; then
    echo ""
    echo "✅ Database updated successfully!"
else
    echo ""
    echo "⚠️  Automatic apply unavailable (supabase CLI missing or push failed)."
    echo "    Run the following SQL in your Supabase Dashboard → SQL Editor,"
    echo "    one file at a time, in this order:"
    echo ""
    for file in "${MIGRATION_FILES[@]}"; do
        echo "───────────────────────────────────────────────────────────────"
        echo "-- $(basename "$file")"
        echo "───────────────────────────────────────────────────────────────"
        cat "$file"
        echo ""
    done
    echo "✅ After running the SQL above, the database will be up to date."
fi
