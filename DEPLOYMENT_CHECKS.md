# 🚀 Deployment Check Commands

This project includes several npm/yarn scripts to run the same checks that Vercel performs during deployment.

## Available Commands

### 🎯 Main Deployment Check
```bash
yarn vercel-check
```
**Runs the exact same checks as Vercel:**
1. TypeScript type checking (`tsc --noEmit`)
2. ESLint linting (`next lint`)
3. Production build (`next build`)

This is the **complete verification** that your code will deploy successfully to Vercel.

### ⚡ Quick Checks (Fast)
```bash
yarn quick-check
```
**Runs fast checks only:**
- TypeScript type checking
- ESLint linting
(Skips the build for speed)

### 🔍 Individual Checks
```bash
yarn type-check    # TypeScript only
yarn lint          # ESLint only  
yarn build         # Production build only
```

## Usage Workflow

### Before Every Push:
```bash
yarn vercel-check
```
If this passes, Vercel deployment will succeed! ✅

### During Development:
```bash
yarn quick-check
```
Fast feedback on TypeScript and linting issues.

### Troubleshooting Failed Deployments:
If Vercel deployment fails, run:
```bash
yarn vercel-check
```
This will show you the exact same error locally.

## What Each Check Does

| Check | Purpose | Vercel Equivalent |
|-------|---------|------------------|
| `type-check` | Validates TypeScript types | Vercel's TypeScript compilation |
| `lint` | Checks code style/quality | Vercel's ESLint step |
| `build` | Creates production build | Vercel's main build process |

## Pro Tips 💡

1. **Always run `yarn vercel-check` before pushing to main/deploy branches**
2. **Use `yarn quick-check` during development for fast feedback**
3. **If builds are slow, run `yarn type-check` first to catch TypeScript errors quickly**
4. **Failed Vercel deployment? Run `yarn vercel-check` to debug locally**

---

*These commands ensure your code passes the same validation pipeline that Vercel uses, preventing deployment failures.*
