# Monorepo Package Management

This project uses a monorepo structure with multiple packages that depend on each other. Understanding the build process and package relationships is crucial for development.

## Package Structure

```
packages/
├── shared/     # Shared types, utilities, and business logic
├── server/     # Node.js backend server
└── client/     # React frontend application
```

## Dual Package Output

The `@botc/shared` package is built with dual output to support both Node.js (CommonJS) and browser (ES modules) environments:

- **CommonJS** (`dist/cjs/`): Used by the Node.js server
- **ESM** (`dist/esm/`): Used by the React client (via Vite)
- **Types** (`dist/types/`): TypeScript declarations for both environments

## Build Process

### Automatic Builds

The build process is set up to automatically build dependencies:

1. **Root build**: `npm run build` builds all packages in the correct order
2. **Server dev**: `npm run dev:server` automatically builds shared package first
3. **Client dev**: Uses Vite's fast refresh with the built shared package

### Manual Builds

To build specific packages:

```bash
# Build shared package (required before building other packages)
npm run build:shared

# Build server package
npm run build:server

# Build client package
npm run build:client

# Build all packages
npm run build
```

## Development Workflow

### Starting Development

1. **First time setup**:

   ```bash
   npm run setup
   ```

2. **Daily development**:
   ```bash
   npm run dev:docker  # Starts all services with Docker
   # OR
   npm run dev         # Starts server and client in parallel
   ```

### Making Changes to Shared Package

When you modify code in `packages/shared/`:

1. The changes will automatically trigger rebuilds for dependent packages
2. Server development uses `predev` hook to rebuild shared package
3. Client development watches the built shared package files

### Troubleshooting

**"Cannot find module '@botc/shared'"**

- Run `npm run build:shared` to ensure the shared package is built
- Check that `packages/shared/dist/` contains the built files

**"exports is not defined" in browser**

- This usually means the client is trying to use CommonJS modules
- Ensure the client is importing from the ESM build (`dist/esm/`)
- Check that `packages/shared/package.json` has correct `exports` field

**TypeScript errors in development**

- Ensure type declarations are built: `cd packages/shared && npm run build:types`
- Check that TypeScript paths in client/server `tsconfig.json` point to built types

## Package.json Exports Field

The shared package uses the modern `exports` field for conditional exports:

```json
{
  "exports": {
    ".": {
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.js",
      "types": "./dist/types/index.d.ts"
    }
  }
}
```

This ensures:

- Node.js applications get CommonJS modules
- Bundlers like Vite get ES modules
- TypeScript gets proper type declarations

## Best Practices

1. **Always build shared first**: Run `npm run build:shared` before working with other packages
2. **Use the root scripts**: Prefer `npm run dev` over individual package commands
3. **Clean builds**: Use `npm run clean` in packages if you encounter strange build issues
4. **Type safety**: Let TypeScript guide you - if types are wrong, the build is probably wrong
5. **Test both environments**: Shared code should work in both Node.js and browser contexts

## File Structure

```
packages/shared/
├── src/                 # TypeScript source files
├── dist/
│   ├── cjs/            # CommonJS build (for Node.js)
│   ├── esm/            # ES modules build (for browsers)
│   └── types/          # TypeScript declarations
├── tsconfig.json       # Base TypeScript config
├── tsconfig.cjs.json   # CommonJS build config
├── tsconfig.esm.json   # ES modules build config
└── tsconfig.types.json # Types-only build config
```
