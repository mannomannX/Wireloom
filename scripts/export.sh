#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
OUTPUT_FILE="${1:-project_export.txt}"

if [[ "$OUTPUT_FILE" != /* ]]; then
  OUTPUT_FILE="${PROJECT_ROOT}/${OUTPUT_FILE}"
fi

EXCLUDES=(".claude" "dist" ".git" "node_modules")
SEPARATOR="$(printf '=%.0s' {1..80})"
SUB_SEPARATOR="$(printf -- '-%.0s' {1..80})"

echo "Scanning project at: ${PROJECT_ROOT}"
echo "Excluding directories: ${EXCLUDES[*]}"

# Find all files excluding the specified patterns and the output file
FIND_EXCLUDES=()
for exc in "${EXCLUDES[@]}"; do
  FIND_EXCLUDES+=(-not -path "*/${exc}/*" -not -name "${exc}")
done

mapfile -t FILES < <(cd "${PROJECT_ROOT}" && find . -type f "${FIND_EXCLUDES[@]}" | sed 's|^\./||' | sort)

# Filter out the output file itself
FILTERED_FILES=()
for f in "${FILES[@]}"; do
  full_path="${PROJECT_ROOT}/${f}"
  if [[ "${full_path}" != "${OUTPUT_FILE}" ]]; then
    FILTERED_FILES+=("${f}")
  fi
done

TOTAL_FILES=${#FILTERED_FILES[@]}
echo "Found ${TOTAL_FILES} included files."

{
  echo "${SEPARATOR}"
  echo "PROJECT EXPORT: Wireloom"
  echo "Generated at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo "Root directory: ${PROJECT_ROOT}"
  echo "Excluded patterns: ${EXCLUDES[*]}"
  echo "Total included files: ${TOTAL_FILES}"
  echo "${SEPARATOR}"
  echo ""
  echo "DIRECTORY STRUCTURE OVERVIEW:"
  echo "${SUB_SEPARATOR}"
  for f in "${FILTERED_FILES[@]}"; do
    echo "├── ${f}"
  done
  echo ""
  echo "${SEPARATOR}"
  echo "FILE CONTENTS"
  echo "${SEPARATOR}"
  echo ""

  for f in "${FILTERED_FILES[@]}"; do
    full_path="${PROJECT_ROOT}/${f}"
    size=$(wc -c < "${full_path}" | tr -d ' ')
    echo "${SEPARATOR}"
    echo "FILE: ${f} (${size} bytes)"
    echo "${SEPARATOR}"

    if file -b --mime "${full_path}" 2>/dev/null | grep -q "binary"; then
      echo "[Binary file skipped: ${size} bytes]"
    else
      cat "${full_path}"
      # Ensure trailing newline
      tail -c1 "${full_path}" | read -r _ || echo ""
    fi
    echo ""
  done
} > "${OUTPUT_FILE}"

echo "Successfully exported ${TOTAL_FILES} files."
echo "Output written to: ${OUTPUT_FILE}"
