#!/usr/bin/env node

/**
 * Vercel build script that ensures Prisma is properly set up
 * This runs before the Next.js build in Vercel
 */

import { execSync } from 'child_process';

function runCommand(command, description) {
  console.log(`🔄 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    process.exit(1);
  }
}

async function vercelBuild() {
  console.log('🚀 Starting Vercel build process...');
  
  // Generate Prisma client first
  runCommand('prisma generate', 'Generating Prisma client');
  
  // Run Next.js build
  runCommand('next build', 'Building Next.js application');
  
  console.log('🎉 Vercel build completed successfully!');
}

vercelBuild().catch(console.error);