#!/usr/bin/env tsx

import { basename } from 'path'
import { getSchemaFiles } from './utils/schema-parser'
import { logSection, logSuccess, logError } from './utils/file-writer'

async function generateAll() {
  console.log('\n🦈 Zeshark Codegen - Generate All\n')

  logSection('Scanning for schemas')
  const schemaFiles = getSchemaFiles()

  if (schemaFiles.length === 0) {
    console.log('  No schema files found in src/schemas/')
    console.log('  Create a schema file like: src/schemas/customer.schema.ts')
    process.exit(0)
  }

  console.log(`  Found ${schemaFiles.length} schema(s):`)
  for (const file of schemaFiles) {
    console.log(`    - ${basename(file)}`)
  }

  // Dynamically import and run the generator for each
  const { default: generate } = await import('./generate')

  for (const file of schemaFiles) {
    const resourceName = basename(file, '.schema.ts')
    console.log(`\n${'─'.repeat(50)}`)

    // Run via subprocess to avoid module caching issues
    const { execSync } = await import('child_process')
    try {
      execSync(`pnpm generate ${resourceName}`, { stdio: 'inherit' })
    } catch {
      logError(`Failed to generate ${resourceName}`)
    }
  }

  logSuccess('All resources generated!')
}

generateAll().catch((err) => {
  logError(err.message)
  process.exit(1)
})
