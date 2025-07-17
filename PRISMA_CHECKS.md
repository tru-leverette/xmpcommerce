# Prisma Build Checks

## Why We Need Prisma Checks

The Vercel deployment error occurred because:

1. **Prisma Client Not Regenerated**: After adding the ClueSet model to the schema, the Prisma client wasn't regenerated
2. **Missing Build Step**: Our local build checks didn't catch this because we were using cached types
3. **CI/CD Environment Differences**: Vercel's build environment was starting fresh without the generated client

## What the Checks Do

### 1. **Migration Status Check**
```bash
yarn prisma migrate status
```
- Verifies all migrations are applied
- Catches pending migrations that would cause runtime errors

### 2. **Client Generation Check**
```bash
yarn prisma generate
```
- Ensures Prisma client is generated
- Compares schema modification time vs client modification time
- Regenerates if schema is newer

### 3. **Model Verification**
- Dynamically imports generated Prisma client
- Verifies expected models (like ClueSet) are available
- Fails fast if models are missing

## Build Process Integration

### Local Development
```bash
yarn build          # Runs check-prisma before Next.js build
yarn check-prisma   # Manual Prisma status check
yarn quick-check    # Prisma + TypeScript + ESLint
```

### Vercel Deployment
```bash
yarn build:vercel   # Simple: prisma generate + next build
```

### Configuration Files

#### package.json
```json
{
  "scripts": {
    "build": "yarn check-prisma && next build",
    "build:vercel": "prisma generate && next build",
    "check-prisma": "node scripts/check-prisma.js"
  }
}
```

#### vercel.json
```json
{
  "buildCommand": "yarn build:vercel"
}
```

## Prevention Strategies

### 1. **Pre-commit Hooks** (Already in place via Husky)
- Runs type checking before commits
- Could be enhanced to include Prisma checks

### 2. **Pre-push Hooks** (Already in place)
- Runs full build including Prisma checks
- Catches issues before they reach CI/CD

### 3. **Development Workflow**
```bash
# After modifying schema.prisma:
yarn db:migrate      # Create and apply migration
yarn check-prisma    # Verify everything is in sync
yarn build           # Full build test
```

## Error Detection Examples

### Missing Migration
```
❌ Pending migrations detected! Run: yarn prisma migrate deploy
Following migration have not yet been applied:
20250717155900_add_clue_sets_geolocation
```

### Outdated Client
```
⚠️  Schema is newer than client, regenerating...
✅ Prisma client regenerated
```

### Missing Models
```
❌ ClueSet model not found in Prisma client - regeneration may have failed
🔄 Attempting to regenerate client...
```

## Benefits

1. **Early Detection**: Catches Prisma issues before deployment
2. **Explicit Feedback**: Clear error messages with resolution steps
3. **Automated Recovery**: Attempts to fix common issues automatically
4. **Environment Consistency**: Ensures local and production builds are identical
5. **Developer Experience**: No more mysterious "Property does not exist" errors

## Future Enhancements

1. **Database Connection Check**: Verify database is reachable
2. **Schema Validation**: Check for breaking schema changes
3. **Seed Data Verification**: Ensure required seed data exists
4. **Performance Monitoring**: Track schema migration performance
