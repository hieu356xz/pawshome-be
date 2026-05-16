# pawshome-be

NestJS 11 backend for Pawshome. PostgreSQL via TypeORM.

## Commands

```bash
npm run start:dev    # watch mode (primary dev workflow)
npm run build        # nest build → dist/
npm run lint         # eslint + prettier check
npm run lint:fix     # auto-fix
npm run test         # jest (rootDir=src, pattern=*.spec.ts)
npm run test:e2e     # e2e tests (test/jest-e2e.json)
```

## Architecture

- Entry: `src/main.ts` → `src/app.module.ts`
- Feature modules live in `src/modules/<name>/`
- Shared utilities go in `src/common/` (imported via `@common/*`).
- Config in `src/config/`

### Path Aliases (tsconfig.json)

- `@` → `./src`
- `@modules/*` → `./src/modules/*`
- `@common/*` → `./src/common/*`

Use these, never relative paths crossing module boundaries.

### Module Structure

Modules follow NestJS conventions with `@nestjs/schematics`. `nest-cli.json` sets `generateOptions.baseDir: "modules"` so `nest generate` places files under `src/modules/` by default.

A typical module contains: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `entities/`, `enums/`, `dto/`.

### Generating Files (Nest CLI)

`@nestjs/cli` is installed locally — always use `npx nest` instead of global `nest`:

```bash
npx nest generate module <name>   # → src/modules/<name>/
npx nest generate controller <name>
npx nest generate service <name>
```

Thanks to `generateOptions.baseDir: "modules"` in `nest-cli.json`, all generated files go under `src/modules/` by default.

## Database (TypeORM + PostgreSQL)

- **`synchronize: true`** — schema auto-syncs from entities on startup. No migrations exist or are needed currently.
- **`autoLoadEntities: true`** — any entity registered via `TypeOrmModule.forFeature()` is auto-discovered. No manual entity lists.
- Env vars: `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` (see `.env.example`).
- All entities use `@UpdateDateColumn` / `@CreateDateColumn` — timestamps are automatic.

## ESLint

- Flat config (`eslint.config.mjs`), type-checked (`recommendedTypeChecked`).
- `@typescript-eslint/no-explicit-any` is **off** — avoid but not enforced.
- `@typescript-eslint/no-floating-promises` is **warn**.
- Prettier errors on format violations (`endOfLine: "auto"` — handles CRLF/LF).

## Prettier

- `singleQuote: true`, `trailingComma: "all"`

## TypeScript

- `strictNullChecks: true`, `noImplicitAny: false`
- `moduleResolution: "nodenext"`, `target: ES2023`
- Decorators required: `emitDecoratorMetadata: true`, `experimentalDecorators: true`

## Testing

- Unit tests: colocated `*.spec.ts` in module dirs.
- E2E tests: `test/*.e2e-spec.ts`, separate Jest config.
- The default e2e test expects `GET /` → `Hello World!` — no root controller exists yet, this test will fail. Either remove or implement root route.
