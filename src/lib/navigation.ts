// 🔄 AUTO-UPDATED by codegen - nav items and icons added here

import {
  LayoutDashboard,
  Settings,
  Package,
  type LucideIcon,
  FileText,
} from 'lucide-react'

export type NavItem = {
  title: string
  href: string
  icon: LucideIcon
  description?: string
  badge?: string | number
}

export type NavSection = {
  title: string
  items: NavItem[]
}

// Main navigation structure
export const mainNavigation: NavSection[] = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Dashboard',
        href: '/',
        icon: LayoutDashboard,
        description: 'Overview and analytics',
      },
    ],
  },
  {
    title: 'Resources',
    items: [
      // === RESOURCE NAV ITEMS ===
    {
      title: 'Orders',
      href: '/orders',
      icon: FileText,
      description: 'Vehicle sales orders',
    },
    ],
  },
  {
    title: 'System',
    items: [
      {
        title: 'Settings',
        href: '/settings',
        icon: Settings,
        description: 'Application settings',
      },
    ],
  },
]

// Flat list for search/command palette
export const allNavItems: NavItem[] = mainNavigation.flatMap((s) => s.items)
