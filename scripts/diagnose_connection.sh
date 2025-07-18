#!/bin/bash

# --- Supabase Connection Diagnostic Script ---
#
# Instructions:
# 1. Replace the placeholder values below with your actual Supabase credentials.
#    You can find these in your Supabase project's "API Settings".
# 2. Save the file.
# 3. Open your terminal and navigate to the 'scripts' directory.
# 4. Make the script executable by running: chmod +x diagnose_connection.sh
# 5. Run the script: ./diagnose_connection.sh
#
# Expected Outcome:
# - If successful, you will see a JSON array (e.g., [] or [{...}]).
#   This means your credentials are correct and the connection is working.
# - If it fails, you will see an error message (e.g., "Unauthorized" or "Could not resolve host").
#   This means your SUPABASE_URL or SUPABASE_KEY is incorrect.

# --- REPLACE THESE VALUES ---
SUPABASE_URL="https://uohdmtnrxakoilaltahr.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvaGRtdG5yeGFrb2lsYWx0YWhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExNTQxMDksImV4cCI6MjA2NjczMDEwOX0.-toc1GJnanwqZOIzcSv0_T5n_BzpjwD0y-TZbLb2MkY"
# --------------------------

# The command to test the connection by trying to fetch memory_items
curl -X GET \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  "${SUPABASE_URL}/rest/v1/memory_items?select=*"

echo "" # Add a newline for better readability
