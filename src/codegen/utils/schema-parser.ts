import { Project, SyntaxKind, Node } from 'ts-morph'
import type { ResourceConfig, FieldMeta } from '@/schemas/_resource.schema'

export type ParsedField = {
  name: string
  zodType: string
  isOptional: boolean
  meta: FieldMeta
}

export type ParsedResource = {
  config: ResourceConfig & { pluralName: string }
  fields: ParsedField[]
  resourceVarName: string
}

/**
 * Parse a schema file and extract resource configuration and fields
 */
export async function parseResourceSchema(
  schemaPath: string
): Promise<ParsedResource> {
  const project = new Project({
    tsConfigFilePath: './tsconfig.app.json',
    skipAddingFilesFromTsConfig: true,
  })

  const sourceFile = project.addSourceFileAtPath(schemaPath)

  // Find the defineResource call
  const defineResourceCall = sourceFile
    .getDescendantsOfKind(SyntaxKind.CallExpression)
    .find((call) => call.getExpression().getText() === 'defineResource')

  if (!defineResourceCall) {
    throw new Error(`No defineResource() call found in ${schemaPath}`)
  }

  // Get the variable declaration that holds the result
  const varDecl = defineResourceCall.getFirstAncestorByKind(
    SyntaxKind.VariableDeclaration
  )
  const resourceVarName = varDecl?.getName() ?? 'resource'

  // Parse the config object (first argument)
  const args = defineResourceCall.getArguments()
  if (args.length < 2) {
    throw new Error('defineResource requires config and shape arguments')
  }

  const configArg = args[0]
  const shapeArg = args[1]

  // Extract config
  const config = parseConfigObject(configArg)

  // Extract fields from shape
  const fields = parseShapeObject(shapeArg)

  return {
    config,
    fields,
    resourceVarName,
  }
}

function parseConfigObject(
  node: Node
): ResourceConfig & { pluralName: string } {
  const obj = node.asKind(SyntaxKind.ObjectLiteralExpression)
  if (!obj) {
    throw new Error('Config must be an object literal')
  }

  const config: Record<string, unknown> = {}

  for (const prop of obj.getProperties()) {
    if (Node.isPropertyAssignment(prop)) {
      const name = prop.getName()
      const init = prop.getInitializer()

      if (init) {
        config[name] = parseValue(init)
      }
    }
  }

  // Ensure required fields
  if (!config.name || typeof config.name !== 'string') {
    throw new Error('Resource config must have a name')
  }

  // Derive plural name if not set
  const pluralName =
    typeof config.pluralName === 'string'
      ? config.pluralName
      : `${config.name}s`

  return {
    ...config,
    name: config.name,
    pluralName,
  } as ResourceConfig & { pluralName: string }
}

function parseShapeObject(node: Node): ParsedField[] {
  const obj = node.asKind(SyntaxKind.ObjectLiteralExpression)
  if (!obj) {
    throw new Error('Shape must be an object literal')
  }

  const fields: ParsedField[] = []

  for (const prop of obj.getProperties()) {
    if (Node.isPropertyAssignment(prop)) {
      const name = prop.getName()
      const init = prop.getInitializer()

      if (init) {
        const field = parseZodField(name, init)
        fields.push(field)
      }
    }
  }

  return fields
}

function parseZodField(name: string, node: Node): ParsedField {
  const text = node.getText()

  // Check if optional
  const isOptional =
    text.includes('.optional()') || text.includes('.nullable()')

  // Extract the base Zod type
  const zodType = extractZodType(text)

  // Extract meta if present
  const meta = extractMeta(node)

  return {
    name,
    zodType,
    isOptional,
    meta,
  }
}

function extractZodType(text: string): string {
  // Match z.string(), z.number(), z.enum([...]), etc.
  const match = text.match(/z\.(\w+)/)
  return match ? match[1] : 'unknown'
}

function extractMeta(node: Node): FieldMeta {
  // Find .meta() call in the chain
  const metaCall = node
    .getDescendantsOfKind(SyntaxKind.CallExpression)
    .find((call) => {
      const expr = call.getExpression()
      return (
        Node.isPropertyAccessExpression(expr) && expr.getName() === 'meta'
      )
    })

  if (!metaCall) {
    return {}
  }

  const args = metaCall.getArguments()
  if (args.length === 0) {
    return {}
  }

  const metaObj = args[0].asKind(SyntaxKind.ObjectLiteralExpression)
  if (!metaObj) {
    return {}
  }

  return parseValue(metaObj) as FieldMeta
}

function parseValue(node: Node): unknown {
  // String literal
  if (Node.isStringLiteral(node)) {
    return node.getLiteralText()
  }

  // Numeric literal
  if (Node.isNumericLiteral(node)) {
    return Number(node.getLiteralText())
  }

  // Boolean literal
  if (node.getKind() === SyntaxKind.TrueKeyword) {
    return true
  }
  if (node.getKind() === SyntaxKind.FalseKeyword) {
    return false
  }

  // Array literal
  if (Node.isArrayLiteralExpression(node)) {
    return node.getElements().map(parseValue)
  }

  // Object literal
  if (Node.isObjectLiteralExpression(node)) {
    const obj: Record<string, unknown> = {}
    for (const prop of node.getProperties()) {
      if (Node.isPropertyAssignment(prop)) {
        const name = prop.getName()
        const init = prop.getInitializer()
        if (init) {
          obj[name] = parseValue(init)
        }
      }
    }
    return obj
  }

  // Fallback: return the text
  return node.getText()
}

/**
 * Get all schema files in the schemas directory
 */
export function getSchemaFiles(): string[] {
  const project = new Project({
    tsConfigFilePath: './tsconfig.app.json',
    skipAddingFilesFromTsConfig: true,
  })

  const glob = './src/schemas/*.schema.ts'
  const files = project.addSourceFilesAtPaths(glob)

  return files
    .map((f) => f.getFilePath())
    .filter((p) => !p.includes('_resource.schema.ts'))
}
