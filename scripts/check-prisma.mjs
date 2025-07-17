#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Check if Prisma client needs to be regenerated or migrations need to be applied
 */
async function checkPrismaStatus() {
  console.log('🔍 Checking Prisma status...');
  
  try {
    // Check if schema.prisma exists
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    if (!fs.existsSync(schemaPath)) {
      console.error('❌ prisma/schema.prisma not found');
      process.exit(1);
    }

    // Check migration status
    console.log('📋 Checking migration status...');
    try {
      const migrateStatus = execSync('yarn prisma migrate status', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      if (migrateStatus.includes('Following migration have not yet been applied')) {
        console.error('❌ Pending migrations detected! Run: yarn prisma migrate deploy');
        console.log(migrateStatus);
        process.exit(1);
      }
      
      if (migrateStatus.includes('Database schema is up to date!')) {
        console.log('✅ All migrations are applied');
      }
    } catch (error) {
      console.error('❌ Migration status check failed:', error.stdout || error.message);
      process.exit(1);
    }

    // Check if Prisma client is generated and up to date
    console.log('🔄 Checking Prisma client status...');
    const clientPath = path.join(process.cwd(), 'node_modules', '.prisma', 'client');
    const schemaModifiedTime = fs.statSync(schemaPath).mtime;
    
    if (!fs.existsSync(clientPath)) {
      console.log('⚠️  Prisma client not found, generating...');
      execSync('yarn prisma generate', { stdio: 'inherit' });
      console.log('✅ Prisma client generated');
    } else {
      const clientModifiedTime = fs.statSync(clientPath).mtime;
      
      if (schemaModifiedTime > clientModifiedTime) {
        console.log('⚠️  Schema is newer than client, regenerating...');
        execSync('yarn prisma generate', { stdio: 'inherit' });
        console.log('✅ Prisma client regenerated');
      } else {
        console.log('✅ Prisma client is up to date');
      }
    }

    // Verify that models are accessible in the generated client
    console.log('🧪 Verifying Prisma client models...');
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      // Check if ClueSet model exists
      if (!prisma.clueSet) {
        console.error('❌ ClueSet model not found in Prisma client - regeneration may have failed');
        process.exit(1);
      }
      
      console.log('✅ All expected models are available in Prisma client');
      await prisma.$disconnect();
    } catch (error) {
      console.error('❌ Prisma client verification failed:', error.message);
      console.log('🔄 Attempting to regenerate client...');
      execSync('yarn prisma generate', { stdio: 'inherit' });
      console.log('✅ Client regenerated - please run the build again');
      process.exit(1);
    }

    console.log('🎉 Prisma status check completed successfully!');
    
  } catch (error) {
    console.error('❌ Prisma status check failed:', error.message);
    process.exit(1);
  }
}

checkPrismaStatus().catch(console.error);