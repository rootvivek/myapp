#!/usr/bin/env node
/**
 * Release Android APK script:
 *   1. Builds signed release APK (./gradlew assembleRelease)
 *   2. Uploads APK to Supabase Storage bucket "app-releases"
 *   3. Inserts/updates row in `app_versions` table
 *   4. Prints the public download URL
 *
 * Prerequisites (add to backend/.env or environment):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   ANDROID_KEYSTORE_PASSWORD (from keystore.properties)
 *   ANDROID_KEY_ALIAS (from keystore.properties)
 *
 * Optional:
 *   CHANGELOG_FILE        path to markdown file with release notes (default: CHANGELOG.md)
 *   IS_FORCE_UPDATE       "true" | "false" (default: false)
 *
 * Usage:
 *   node scripts/release-android.js
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const ANDROID_DIR = path.join(ROOT, 'android');
const APP_DIR = path.join(ANDROID_DIR, 'app');

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[t.slice(0, eq).trim()] = v;
  }
  return out;
}

const fileEnv = {
  ...loadEnvFile(path.join(ROOT, '.env')),
  ...loadEnvFile(path.join(ROOT, 'backend', '.env')),
  ...loadEnvFile(path.join(ANDROID_DIR, 'keystore.properties')),
};
const env = (key, fallback) => process.env[key] ?? fileEnv[key] ?? fallback;
const required = (key) => {
  const v = env(key);
  if (!v) {
    console.error(`✗ Missing required value: ${key}`);
    process.exit(1);
  }
  return v;
};

const SUPABASE_URL = required('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = required('SUPABASE_SERVICE_ROLE_KEY');
const KEYSTORE_PASSWORD = required('storePassword') || required('ANDROID_KEYSTORE_PASSWORD');
const KEY_ALIAS = required('keyAlias') || required('ANDROID_KEY_ALIAS');

// GitHub Release config (optional - for large APKs > 50MB)
const GITHUB_TOKEN = env('GITHUB_TOKEN');
const GITHUB_REPO = env('GITHUB_REPO', 'rootvivek/myapp');

const CHANGELOG_FILE = env('CHANGELOG_FILE', path.join(ROOT, 'CHANGELOG.md'));
const IS_FORCE_UPDATE = env('IS_FORCE_UPDATE', 'false').toLowerCase() === 'true';
const STORAGE_BUCKET = 'app-releases';
const TABLE_NAME = 'app_versions';
const MAX_SUPABASE_FILE_MB = 50; // Supabase free tier limit

function run(cmd, args, opts = {}) {
  console.log(`  $ ${cmd} ${args.join(' ')}`);
  const res = spawnSync(cmd, args, { stdio: 'inherit', shell: true, cwd: opts.cwd ?? ROOT, ...opts });
  if (res.status !== 0) {
    throw new Error(`Command failed: ${cmd} ${args.join(' ')} (exit ${res.status})`);
  }
}

async function uploadToSupabaseStorage(apkPath, fileName) {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const fileBuffer = fs.readFileSync(apkPath);
  const fileSizeMB = fileBuffer.length / 1024 / 1024;
  const storagePath = `android/${fileName}`;

  console.log(`↑ Uploading ${fileName} (${fileSizeMB.toFixed(2)} MB) to Supabase Storage…`);

  // Use multipart upload for files > 6MB (Supabase recommends for large files)
  if (fileSizeMB > 6) {
    console.log(`  Using multipart upload (file > 6MB)…`);
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: 'application/vnd.android.package-archive',
        upsert: true,
        // multipart upload options
        cacheControl: '3600',
      });
    if (error) throw new Error(`Storage upload failed: ${error.message}`);
  } else {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: 'application/vnd.android.package-archive',
        upsert: true,
      });
    if (error) throw new Error(`Storage upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);
  if (!urlData?.publicUrl) throw new Error('Failed to get public URL');

  console.log(`  ✓ Uploaded: ${urlData.publicUrl}`);
  return urlData.publicUrl;
}

async function uploadToGitHubRelease(apkPath, fileName, versionName, versionCode, changelog) {
  if (!GITHUB_TOKEN) {
    console.log('  ⚠ GITHUB_TOKEN not set, skipping GitHub Release upload');
    return null;
  }

  console.log(`↑ Uploading ${fileName} to GitHub Releases…`);

  const tagName = `v${versionName}`;
  const releaseName = `MCA Phone Wala v${versionName} (Build ${versionCode})`;

  // Check if release exists, create if not
  const checkRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/tags/${tagName}`, {
    headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' },
  });

  let releaseId;
  if (checkRes.status === 404) {
    // Create new release
    const createRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases`, {
      method: 'POST',
      headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' },
      body: JSON.stringify({
        tag_name: tagName,
        name: releaseName,
        body: changelog || 'Bug fixes and improvements.',
        draft: false,
        prerelease: false,
      }),
    });
    if (!createRes.ok) throw new Error(`Failed to create GitHub release: ${await createRes.text()}`);
    const release = await createRes.json();
    releaseId = release.id;
    console.log(`  ✓ Created release: ${tagName}`);
  } else if (checkRes.ok) {
    const release = await checkRes.json();
    releaseId = release.id;
    console.log(`  ✓ Using existing release: ${tagName}`);

    // Delete existing asset with same name if exists
    const assetsRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/${releaseId}/assets`, {
      headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' },
    });
    if (assetsRes.ok) {
      const assets = await assetsRes.json();
      const existingAsset = assets.find((a) => a.name === fileName);
      if (existingAsset) {
        console.log(`  ♻ Deleting existing asset: ${fileName}`);
        const delRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/assets/${existingAsset.id}`, {
          method: 'DELETE',
          headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' },
        });
        if (!delRes.ok) console.warn(`  ⚠ Failed to delete existing asset: ${await delRes.text()}`);
      }
    }
  } else {
    throw new Error(`Failed to check release: ${await checkRes.text()}`);
  }

  // Upload asset
  const fileBuffer = fs.readFileSync(apkPath);
  const uploadUrl = `https://uploads.github.com/repos/${GITHUB_REPO}/releases/${releaseId}/assets?name=${encodeURIComponent(fileName)}`;
  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/vnd.android.package-archive',
      'Content-Length': fileBuffer.length,
    },
    body: fileBuffer,
  });

  if (!uploadRes.ok) throw new Error(`Failed to upload asset: ${await uploadRes.text()}`);
  const asset = await uploadRes.json();
  console.log(`  ✓ Uploaded to GitHub: ${asset.browser_download_url}`);
  return asset.browser_download_url;
}

async function uploadAPK(apkPath, fileName, versionName, versionCode, changelog) {
  const fileSizeMB = fs.statSync(apkPath).size / 1024 / 1024;

  // For large files (>50MB), prefer GitHub Releases
  if (fileSizeMB > MAX_SUPABASE_FILE_MB && GITHUB_TOKEN) {
    console.log(`  File size (${fileSizeMB.toFixed(2)}MB) exceeds Supabase limit (${MAX_SUPABASE_FILE_MB}MB), using GitHub Releases…`);
    const githubUrl = await uploadToGitHubRelease(apkPath, fileName, versionName, versionCode, changelog);
    if (githubUrl) return githubUrl;
    console.log('  GitHub upload failed, falling back to Supabase…');
  }

  // Try Supabase (with multipart for large files)
  try {
    return await uploadToSupabaseStorage(apkPath, fileName);
  } catch (e) {
    if (GITHUB_TOKEN && !e.message.includes('exceeded the maximum allowed size')) {
      throw e; // Non-size error, rethrow
    }
    console.log('  Supabase upload failed (size limit), trying GitHub Releases…');
    const githubUrl = await uploadToGitHubRelease(apkPath, fileName, versionName, versionCode, changelog);
    if (githubUrl) return githubUrl;
    throw new Error(`Both Supabase and GitHub uploads failed: ${e.message}`);
  }
}

async function upsertAppVersion(supabase, versionCode, versionName, apkUrl, changelog) {
  console.log(`📝 Upserting ${TABLE_NAME} (version_code=${versionCode})…`);

  // First check if row exists
  const { data: existing } = await supabase
    .from(TABLE_NAME)
    .select('id')
    .eq('version_code', versionCode)
    .maybeSingle();

  const payload = {
    version_code: versionCode,
    version_name: versionName,
    apk_url: apkUrl,
    changelog: changelog || 'Bug fixes and improvements.',
    is_force_update: IS_FORCE_UPDATE,
    updated_at: new Date().toISOString(),
  };

  let result;
  if (existing) {
    result = await supabase.from(TABLE_NAME).update(payload).eq('version_code', versionCode);
  } else {
    payload.created_at = new Date().toISOString();
    result = await supabase.from(TABLE_NAME).insert(payload);
  }

  if (result.error) throw new Error(`DB upsert failed: ${result.error.message}`);
  console.log(`  ✓ ${existing ? 'Updated' : 'Inserted'} ${TABLE_NAME} row`);
}

function readVersionFromGradle() {
  const gradlePath = path.join(APP_DIR, 'build.gradle');
  const content = fs.readFileSync(gradlePath, 'utf8');
  const versionCodeMatch = content.match(/versionCode\s+(\d+)/);
  const versionNameMatch = content.match(/versionName\s+["']([^"']+)["']/);
  if (!versionCodeMatch || !versionNameMatch) {
    throw new Error('Could not read versionCode/versionName from app/build.gradle');
  }
  return {
    versionCode: parseInt(versionCodeMatch[1], 10),
    versionName: versionNameMatch[1],
  };
}

function readChangelog() {
  if (fs.existsSync(CHANGELOG_FILE)) {
    return fs.readFileSync(CHANGELOG_FILE, 'utf8').trim();
  }
  return '';
}

async function main() {
  try {
    console.log('\n🚀 Starting Android release build & deploy…\n');

    // 1. Read version from build.gradle
    const { versionCode, versionName } = readVersionFromGradle();
    console.log(`📦 Version: ${versionName} (code ${versionCode})`);

    // 2. Read changelog
    const changelog = readChangelog();
    if (changelog) console.log(`📋 Changelog loaded (${changelog.length} chars)`);

    // 3. Build signed release APK
    console.log('\n🔨 Building signed release APK…');
    const gradlewPath = path.join(ANDROID_DIR, 'gradlew');
    // Ensure gradlew is executable
    try { fs.chmodSync(gradlewPath, 0o755); } catch {}
    run(gradlewPath, ['assembleRelease'], { cwd: ANDROID_DIR });

    // 4. Locate the generated APK
    const outputDir = path.join(APP_DIR, 'build', 'outputs', 'apk', 'release');
    const files = fs.readdirSync(outputDir).filter((f) => f.endsWith('.apk'));
    if (!files.length) throw new Error('No APK found in build/outputs/apk/release');

    // Prefer the "release" variant without flavor suffix
    const apkFile = files.find((f) => f === 'app-release.apk') || files[0];
    const apkPath = path.join(outputDir, apkFile);
    console.log(`  ✓ Found APK: ${apkFile}`);

    // 5. Generate final filename with version
    const finalFileName = `app-v${versionName}-${versionCode}.apk`;

    // 6. Upload APK (auto-selects GitHub Releases for large files, Supabase otherwise)
    const downloadUrl = await uploadAPK(apkPath, finalFileName, versionName, versionCode, changelog);

    // 7. Upsert app_versions table
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    await upsertAppVersion(supabase, versionCode, versionName, downloadUrl, changelog);

    // 8. Also copy APK with versioned name locally for GitHub Releases etc.
    const localVersionedPath = path.join(outputDir, finalFileName);
    fs.copyFileSync(apkPath, localVersionedPath);
    console.log(`\n📁 Local copy: ${localVersionedPath}`);

    console.log('\n✅ Release complete!');
    console.log(`   Version:      ${versionName} (code ${versionCode})`);
    console.log(`   Download URL: ${downloadUrl}`);
    console.log(`   Force update: ${IS_FORCE_UPDATE}`);
    console.log('\n   The app will now show "Update Available" to users on older versions.\n');

  } catch (err) {
    console.error('\n✗ Release failed:', err.message);
    process.exit(1);
  }
}

main();