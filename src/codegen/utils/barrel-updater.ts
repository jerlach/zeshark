import { existsSync, readFileSync, writeFileSync } from 'fs'

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// ============================================================================
// SCHEMAS INDEX
// ============================================================================

export function updateSchemasBarrel(
  resourceName: string,
  resourceVarName: string
): void {
  const path = './src/schemas/index.ts'
  const exportLine = `export { ${resourceVarName} } from './${resourceName}.schema'`

  if (!existsSync(path)) {
    writeFileSync(
      path,
      `// 🔄 AUTO-UPDATED by codegen\nexport * from './_resource.schema'\n\n// === RESOURCE EXPORTS (auto-generated) ===\n${exportLine}\n`
    )
    console.log(`  ✓ Created ${path}`)
    return
  }

  const content = readFileSync(path, 'utf-8')

  if (content.includes(exportLine)) {
    return
  }

  const newContent = content.trimEnd() + '\n' + exportLine + '\n'
  writeFileSync(path, newContent)
  console.log(`  ✓ Updated ${path}`)
}

// ============================================================================
// COLLECTIONS INDEX
// ============================================================================

export function updateCollectionsBarrel(
  resourceName: string,
  pluralName: string
): void {
  const path = './src/collections/index.ts'
  const typeName = capitalize(resourceName)
  const exportLine = `export { ${pluralName}Collection, type ${typeName} } from './${pluralName}.collection'`

  if (!existsSync(path)) {
    writeFileSync(
      path,
      `// 🔄 AUTO-UPDATED by codegen\n\n// === COLLECTION EXPORTS (auto-generated) ===\n${exportLine}\n`
    )
    console.log(`  ✓ Created ${path}`)
    return
  }

  const content = readFileSync(path, 'utf-8')

  if (content.includes(exportLine)) {
    return
  }

  const newContent = content.trimEnd() + '\n' + exportLine + '\n'
  writeFileSync(path, newContent)
  console.log(`  ✓ Updated ${path}`)
}

// ============================================================================
// REGISTRY
// ============================================================================

export function updateRegistry(
  resourceName: string,
  pluralName: string,
  resourceVarName: string
): void {
  const path = './src/lib/registry.ts'

  if (!existsSync(path)) {
    console.log(`  ⚠ Registry not found, skipping`)
    return
  }

  const content = readFileSync(path, 'utf-8')
  const typeName = capitalize(resourceName)

  // Check if already registered
  if (content.includes(`${resourceName}: {`)) {
    return
  }

  // Add import
  const importLine = `import { ${resourceVarName} } from '@/schemas/${resourceName}.schema'`
  const collectionImportLine = `import { ${pluralName}Collection } from '@/collections'`

  let newContent = content

  // Add schema import after existing schema imports or at the top
  const schemaImportMarker = "from '@/schemas"
  if (content.includes(schemaImportMarker)) {
    const lastSchemaImport = content.lastIndexOf(schemaImportMarker)
    const endOfLine = content.indexOf('\n', lastSchemaImport)
    newContent =
      newContent.slice(0, endOfLine + 1) +
      importLine +
      '\n' +
      newContent.slice(endOfLine + 1)
  } else {
    newContent = importLine + '\n' + newContent
  }

  // Add collection import
  if (!newContent.includes(`${pluralName}Collection`)) {
    // Find the last import statement and add after it
    const importMatch = newContent.match(/^import .+ from .+$/gm)
    if (importMatch) {
      const lastImport = importMatch[importMatch.length - 1]
      const lastImportIndex = newContent.lastIndexOf(lastImport)
      const endOfLine = newContent.indexOf('\n', lastImportIndex)
      newContent =
        newContent.slice(0, endOfLine + 1) +
        collectionImportLine +
        '\n' +
        newContent.slice(endOfLine + 1)
    } else {
      // No imports found, add at top after the comment
      const firstNewline = newContent.indexOf('\n')
      newContent =
        newContent.slice(0, firstNewline + 1) +
        collectionImportLine +
        '\n' +
        newContent.slice(firstNewline + 1)
    }
  }

  // Add registry entry
  const registryEntry = `  ${resourceName}: {
    config: ${resourceVarName}.config,
    collection: ${pluralName}Collection,
    routes: {
      list: '/${pluralName}',
      new: '/${pluralName}/new',
      edit: (id: string) => \`/${pluralName}/\${id}\`,
    },
  },`

  const registryMarker = '// === REGISTRY ENTRIES ==='
  if (newContent.includes(registryMarker)) {
    newContent = newContent.replace(
      registryMarker,
      registryMarker + '\n' + registryEntry
    )
  }

  writeFileSync(path, newContent)
  console.log(`  ✓ Updated ${path}`)
}

// ============================================================================
// DB CLIENT
// ============================================================================

export function updateDbClient(
  resourceName: string,
  pluralName: string
): void {
  const path = './src/lib/db-client.ts'

  if (!existsSync(path)) {
    console.log(`  ⚠ DB client not found, skipping`)
    return
  }

  const content = readFileSync(path, 'utf-8')

  // Check if already registered
  if (content.includes(`${pluralName}: ${pluralName}Collection`)) {
    return
  }

  let newContent = content

  // Add import
  const importLine = `import { ${pluralName}Collection } from '@/collections'`
  const collectionImportMarker = "from '@/collections"

  if (!content.includes(`${pluralName}Collection`)) {
    if (content.includes(collectionImportMarker)) {
      const lastImport = newContent.lastIndexOf(collectionImportMarker)
      const endOfLine = newContent.indexOf('\n', lastImport)
      newContent =
        newContent.slice(0, endOfLine + 1) +
        importLine +
        '\n' +
        newContent.slice(endOfLine + 1)
    } else {
      newContent = importLine + '\n' + newContent
    }
  }

  // Add to collections object
  const collectionsMarker = '// === COLLECTIONS ==='
  const collectionEntry = `    ${pluralName}: ${pluralName}Collection,`

  if (newContent.includes(collectionsMarker)) {
    newContent = newContent.replace(
      collectionsMarker,
      collectionsMarker + '\n' + collectionEntry
    )
  }

  writeFileSync(path, newContent)
  console.log(`  ✓ Updated ${path}`)
}

// ============================================================================
// NAVIGATION
// ============================================================================

export function updateNavigation(
  resourceName: string,
  pluralName: string,
  icon: string = 'Package',
  description?: string
): void {
  const path = './src/lib/navigation.ts'

  if (!existsSync(path)) {
    console.log(`  ⚠ Navigation not found, skipping`)
    return
  }

  const content = readFileSync(path, 'utf-8')
  const displayName = capitalize(pluralName)

  // Check if already added
  if (content.includes(`href: '/${pluralName}'`)) {
    return
  }

  // Add icon import if needed
  let newContent = content
  if (!content.includes(`  ${icon},`) && !content.includes(`  ${icon}\n`)) {
    // Find the closing brace of the lucide-react import and insert before it
    const lucideImportEnd = content.indexOf("} from 'lucide-react'")
    if (lucideImportEnd !== -1) {
      // Find the last newline before the closing brace
      const beforeBrace = content.lastIndexOf('\n', lucideImportEnd)
      newContent =
        content.slice(0, beforeBrace + 1) +
        `  ${icon},\n` +
        content.slice(beforeBrace + 1)
    }
  }

  // Add nav item
  const navMarker = '// === RESOURCE NAV ITEMS ==='
  const navItem = `    {
      title: '${displayName}',
      href: '/${pluralName}',
      icon: ${icon},
      description: '${description ?? `Manage ${pluralName}`}',
    },`

  if (newContent.includes(navMarker)) {
    newContent = newContent.replace(navMarker, navMarker + '\n' + navItem)
  }

  writeFileSync(path, newContent)
  console.log(`  ✓ Updated ${path}`)
}
