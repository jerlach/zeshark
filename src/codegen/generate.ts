#!/usr/bin/env tsx

import { existsSync } from 'fs'
import { parseResourceSchema } from './utils/schema-parser'
import { writeGenerated, logSection, logSuccess, logError } from './utils/file-writer'
import {
  updateSchemasBarrel,
  updateCollectionsBarrel,
  updateRegistry,
  updateDbClient,
  updateNavigation,
} from './utils/barrel-updater'
import { generateCollection } from './templates/collection.template'
import { generateCollectionParquet } from './templates/collection-parquet.template'
import { generateRouteIndex } from './templates/route-index.template'
import { generateRouteNew } from './templates/route-new.template'
import { generateRouteEdit } from './templates/route-edit.template'
import { generateForm } from './templates/form.template'
import { generateColumns } from './templates/columns.template'

type GenerateOptions = {
  force?: boolean
  only?: 'collection' | 'routes' | 'form' | 'columns'
  skipWiring?: boolean
}

async function generateResource(
  resourceName: string,
  options: GenerateOptions = {}
) {
  const schemaPath = `./src/schemas/${resourceName}.schema.ts`

  if (!existsSync(schemaPath)) {
    logError(`Schema not found: ${schemaPath}`)
    console.log('Create a schema file first, for example:')
    console.log(`\n  src/schemas/${resourceName}.schema.ts\n`)
    process.exit(1)
  }

  console.log(`\n🦈 Generating ${resourceName}...`)

  // Parse the schema
  logSection('Parsing schema')
  const resource = await parseResourceSchema(schemaPath)
  const { config, resourceVarName } = resource
  console.log(`  ✓ Parsed ${resourceVarName} (${config.pluralName})`)

  // Determine which collection template to use based on dataSource
  const isParquet = config.dataSource === 'parquet'

  // Generate files
  const generators = [
    {
      name: 'collection',
      path: `./src/collections/${config.pluralName}.collection.ts`,
      generate: () => isParquet ? generateCollectionParquet(resource) : generateCollection(resource),
    },
    {
      name: 'routes',
      files: [
        {
          path: `./src/routes/_app/${config.pluralName}/index.tsx`,
          generate: () => generateRouteIndex(resource),
        },
        {
          path: `./src/routes/_app/${config.pluralName}/new.tsx`,
          generate: () => generateRouteNew(resource),
        },
        {
          path: `./src/routes/_app/${config.pluralName}/$${config.name}Id.tsx`,
          generate: () => generateRouteEdit(resource),
        },
      ],
    },
    {
      name: 'form',
      path: `./src/components/forms/${config.name}-form.tsx`,
      generate: () => generateForm(resource),
    },
    {
      name: 'columns',
      path: `./src/components/tables/${config.name}-columns.tsx`,
      generate: () => generateColumns(resource),
    },
  ]

  logSection('Generating files')
  for (const gen of generators) {
    if (options.only && gen.name !== options.only) continue

    if ('files' in gen) {
      for (const file of gen.files) {
        writeGenerated(file.path, file.generate(), { force: options.force })
      }
    } else {
      writeGenerated(gen.path, gen.generate(), { force: options.force })
    }
  }

  // Update wiring files
  if (!options.skipWiring) {
    logSection('Updating wiring')
    updateSchemasBarrel(config.name, resourceVarName)
    updateCollectionsBarrel(config.name, config.pluralName)
    updateRegistry(config.name, config.pluralName, resourceVarName)
    updateDbClient(config.name, config.pluralName)
    updateNavigation(
      config.name,
      config.pluralName,
      config.icon ?? 'Package',
      config.description
    )
  }

  logSuccess(`${config.name} generated successfully!`)
}

// CLI
const args = process.argv.slice(2)
const resourceName = args.find((a) => !a.startsWith('--'))

if (!resourceName) {
  console.log(`
🦈 Zeshark Codegen

Usage:
  pnpm generate <resource-name> [options]

Options:
  --force              Overwrite existing files
  --only=<type>        Generate only: collection, routes, form, columns
  --skip-wiring        Skip barrel/registry updates

Examples:
  pnpm generate customer
  pnpm generate invoice --force
  pnpm generate product --only=form
`)
  process.exit(1)
}

const options: GenerateOptions = {
  force: args.includes('--force'),
  only: args.find((a) => a.startsWith('--only='))?.split('=')[1] as GenerateOptions['only'],
  skipWiring: args.includes('--skip-wiring'),
}

generateResource(resourceName, options).catch((err) => {
  logError(err.message)
  process.exit(1)
})
