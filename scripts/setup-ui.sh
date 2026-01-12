#!/bin/bash

# 🦈 Zeshark - Setup UI Components
# This script installs the commonly used shadcn/ui components

echo "🦈 Installing shadcn/ui components..."
echo ""

# Core components
COMPONENTS=(
  "button"
  "input"
  "label"
  "textarea"
  "select"
  "card"
  "dialog"
  "popover"
  "command"
  "dropdown-menu"
  "table"
  "separator"
)

# Install each component
for component in "${COMPONENTS[@]}"; do
  echo "Installing $component..."
  pnpm dlx shadcn@latest add "$component" -y
done

echo ""
echo "✅ UI components installed!"
echo ""
echo "You can add more components anytime with:"
echo "  pnpm dlx shadcn@latest add <component-name>"
echo ""
echo "See all available components at: https://ui.shadcn.com/docs/components"
