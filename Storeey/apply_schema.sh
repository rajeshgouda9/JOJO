#!/bin/bash
set -e

CONTAINER_NAME="supabase-db"
INPUT_FILE="schema.sql"

if [ ! -f "$INPUT_FILE" ]; then
  echo "❌ $INPUT_FILE not found. Copy it from dev first."
  exit 1
fi

echo "Applying schema from $INPUT_FILE to $CONTAINER_NAME..."

cat $INPUT_FILE | docker exec -i $CONTAINER_NAME psql -U postgres -d postgres

echo "✅ Schema applied successfully to prod"
