#!/bin/bash
set -e

# container name of postgres in your docker-compose
CONTAINER_NAME="supabase-db"
OUTPUT_FILE="schema.sql"

echo "Exporting schema (DDL only) from $CONTAINER_NAME (only 'public' schema)..."

docker exec -t $CONTAINER_NAME pg_dump \
  -U postgres \
  --schema-only \
  --schema=public \
  --no-owner \
  --no-privileges \
  --quote-all-identifiers postgres > $OUTPUT_FILE

echo "✅ Schema exported to $OUTPUT_FILE"
