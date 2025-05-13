#!/bin/bash
set -e

# Script to clean up unused or obsolete scripts
# Run from the repository root

echo "======================================================="
echo "          OfficeStonks Frontend Script Cleanup          "
echo "======================================================="

# Create a backup directory
BACKUP_DIR="scripts-backup-$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# List of scripts to remove (relative to repo root)
SCRIPTS_TO_REMOVE=(
  # Old scripts (replaced by improved versions)
  "deploy.sh"
  
  # Temporary scripts
  "commit-refactoring.sh"
  "push-changes.sh"
)

# Rename improved scripts
if [ -f "deploy.improved.sh" ]; then
  echo "Renaming: deploy.improved.sh -> deploy.sh"
  cp "deploy.improved.sh" "$BACKUP_DIR/"
  mv "deploy.improved.sh" "deploy.sh"
fi

# Rename improved configuration files
if [ -f "railway.improved.json" ]; then
  echo "Renaming: railway.improved.json -> railway.json"
  cp "railway.improved.json" "$BACKUP_DIR/"
  mv "railway.improved.json" "railway.json"
fi

# Backup and remove scripts
for script in "${SCRIPTS_TO_REMOVE[@]}"; do
  if [ -f "$script" ]; then
    echo "Backing up and removing: $script"
    cp "$script" "$BACKUP_DIR/"
    rm "$script"
  fi
done

echo "======================================================="
echo "               Script Cleanup Complete                  "
echo "======================================================="
echo "Obsolete scripts have been backed up to: $BACKUP_DIR"
echo "======================================================="