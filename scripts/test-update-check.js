#!/usr/bin/env node
/**
 * Test the update check endpoint
 * Run: node scripts/test-update-check.js
 */

const fetch = require('node-fetch');

const BASE_URL = process.env.UPDATE_API_URL || 'http://localhost:3001';
const ENDPOINT = '/app/update/check';

async function testUpdateCheck() {
  console.log(`Testing ${BASE_URL}${ENDPOINT}...\n`);

  const testCases = [
    {
      name: 'Old version (should have update)',
      body: {
        platform: 'android',
        currentVersionCode: 5,
        currentVersionName: '1.0.4',
        packageName: 'com.myapp',
      },
    },
    {
      name: 'Current version (no update)',
      body: {
        platform: 'android',
        currentVersionCode: 6,
        currentVersionName: '1.0.5',
        packageName: 'com.myapp',
      },
    },
    {
      name: 'Future version (no update)',
      body: {
        platform: 'android',
        currentVersionCode: 10,
        currentVersionName: '2.0.0',
        packageName: 'com.myapp',
      },
    },
    {
      name: 'iOS platform',
      body: {
        platform: 'ios',
        currentVersionCode: 5,
        currentVersionName: '1.0.4',
        packageName: 'com.myapp',
      },
    },
  ];

  for (const tc of testCases) {
    console.log(`📋 ${tc.name}`);
    try {
      const response = await fetch(`${BASE_URL}${ENDPOINT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tc.body),
      });

      const data = await response.json();
      console.log(`   Status: ${response.status}`);
      console.log(`   Response:`, JSON.stringify(data, null, 2));
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    console.log('');
  }
}

testUpdateCheck().catch(console.error);