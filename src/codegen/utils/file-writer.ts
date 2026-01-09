import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { dirname } from 'path'

export type WriteOptions = {
  force?: boolean
}

/**
 * Write content to a file, creating directories as needed
 */
export function writeGenerated(
  filePath: string,
  content: string,
  options: WriteOptions = {}
): boolean {
  const dir = dirname(filePath)

  // Create directory if it doesn't exist
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  // Check if file exists and skip if not forcing
  if (existsSync(filePath) && !options.force) {
    console.log(`  ⊘ Skipped (exists): ${filePath}`)
    return false
  }

  writeFileSync(filePath, content, 'utf-8')
  console.log(`  ✓ Generated: ${filePath}`)
  return true
}

/**
 * Log a section header
 */
export function logSection(title: string): void {
  console.log(`\n${title}`)
  console.log('─'.repeat(40))
}

/**
 * Log success message
 */
export function logSuccess(message: string): void {
  console.log(`\n✓ ${message}\n`)
}

/**
 * Log error message
 */
export function logError(message: string): void {
  console.error(`\n✗ ${message}\n`)
}
