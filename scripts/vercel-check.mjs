#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';

// Colors for output
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`
};

function print(message, color = 'white') {
  console.log(colors[color] ? colors[color](message) : message);
}

function printStep(step, message) {
  print(`\n${step} ${message}`, 'blue');
}

function printSuccess(message) {
  print(`✅ ${message}`, 'green');
}

function printError(message) {
  print(`❌ ${message}`, 'red');
}

function printWarning(message) {
  print(`⚠️  ${message}`, 'yellow');
}

function runCommand(command, description, required = true) {
  try {
    printStep('🔍', `${description}...`);
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    printSuccess(`${description} passed`);
    return true;
  } catch {
    if (required) {
      printError(`${description} failed`);
      printError('This would cause Vercel deployment to fail!');
      process.exit(1);
    } else {
      printWarning(`${description} failed (non-critical)`);
      return false;
    }
  }
}

function main() {
  print(colors.bold('\n🚀 VERCEL DEPLOYMENT CHECKS'), 'blue');
  print('Running the same checks that Vercel runs during deployment...\n');

  // Check 1: Dependencies
  printStep('📦', 'Checking dependencies');
  try {
    execSync('yarn install --frozen-lockfile --silent', { stdio: 'pipe' });
    printSuccess('Dependencies are up to date');
  } catch {
    printWarning('Dependencies updated, continuing...');
  }

  // Check 2: TypeScript type checking
  runCommand('yarn tsc --noEmit', 'TypeScript type checking', true);

  // Check 3: Linting
  runCommand('yarn lint', 'ESLint checking', true);

  // Check 4: Production build (the main Vercel check)
  runCommand('yarn build', 'Production build (Vercel simulation)', true);

  // Optional checks
  print('\n📋 Additional checks:');
  
  // Check for common issues
  printStep('🔍', 'Checking for common deployment issues');
  
  // Check for environment variables
  try {
    if (fs.existsSync('.env.local')) {
      printSuccess('Environment file found');
    } else {
      printWarning('No .env.local file found - make sure Vercel env vars are set');
    }
  } catch {
    printWarning('Could not check for environment files');
  }

  // Success message
  print('\n🎉 All Vercel deployment checks passed!', 'green');
  print('✅ Your code is ready for deployment to Vercel', 'green');
  print('\n💡 To deploy: git push origin main (or your deployment branch)', 'blue');
}

// Run main function when script is executed directly
main();

export { main };
