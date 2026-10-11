#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const options = new Set(args.filter((arg) => arg.startsWith('--')));
const positionals = args.filter((arg) => !arg.startsWith('--'));

function usage() {
  console.log(`Usage: npm run version:bump -- <patch|minor|major|x.y.z> [--dry-run] [--commit] [--push]

Examples:
  npm run version:bump -- patch
  npm run version:bump -- minor --commit --push
  npm run version:bump -- 2.0.0 --dry-run

Android versionCode is incremented automatically. --push also creates a
version-only commit before pushing the current branch to origin.`);
}

function fail(message) {
  console.error(`Version bump failed: ${message}`);
  process.exit(1);
}

if (args.includes('--help') || args.includes('-h')) {
  usage();
  process.exit(0);
}

for (const option of options) {
  if (!['--dry-run', '--commit', '--push'].includes(option)) fail(`Unknown option: ${option}`);
}
if (positionals.length !== 1) {
  usage();
  process.exit(1);
}
if (options.has('--push')) options.add('--commit');

const packagePath = path.join(ROOT, 'package.json');
const packageLockPath = path.join(ROOT, 'package-lock.json');
const appPath = path.join(ROOT, 'app.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const packageLock = fs.existsSync(packageLockPath)
  ? JSON.parse(fs.readFileSync(packageLockPath, 'utf8'))
  : null;
const appJson = JSON.parse(fs.readFileSync(appPath, 'utf8'));
const currentVersion = packageJson.version;
const currentParts = currentVersion.split('.').map(Number);

if (currentParts.length !== 3 || currentParts.some((part) => !Number.isInteger(part) || part < 0)) {
  fail(`package.json version is not a numeric x.y.z version: ${currentVersion}`);
}
if (appJson.expo.version !== currentVersion) {
  fail(`package.json (${currentVersion}) and app.json (${appJson.expo.version}) versions differ`);
}

const requested = positionals[0];
let nextParts;
if (['patch', 'minor', 'major'].includes(requested)) {
  nextParts = [...currentParts];
  if (requested === 'major') nextParts = [currentParts[0] + 1, 0, 0];
  if (requested === 'minor') nextParts = [currentParts[0], currentParts[1] + 1, 0];
  if (requested === 'patch') nextParts = [currentParts[0], currentParts[1], currentParts[2] + 1];
} else if (/^\d+\.\d+\.\d+$/.test(requested)) {
  nextParts = requested.split('.').map(Number);
} else {
  fail(`Expected patch, minor, major, or an explicit x.y.z version; got: ${requested}`);
}

const nextVersion = nextParts.join('.');
if (nextParts.every((part, index) => part === currentParts[index])) {
  fail(`Version ${nextVersion} is already current`);
}

let versionCode = Number(appJson.expo.android?.versionCode);
const gradlePath = path.join(ROOT, 'android', 'app', 'build.gradle');
let gradle = fs.existsSync(gradlePath) ? fs.readFileSync(gradlePath, 'utf8') : null;
if (gradle) {
  const codeMatch = gradle.match(/\bversionCode\s+(\d+)/);
  if (!codeMatch) fail(`Could not find versionCode in ${path.relative(ROOT, gradlePath)}`);
  versionCode = Math.max(versionCode || 0, Number(codeMatch[1]));
}
if (!Number.isInteger(versionCode) || versionCode < 1) fail('app.json must define android.versionCode');
versionCode += 1;

packageJson.version = nextVersion;
if (packageLock) {
  packageLock.version = nextVersion;
  if (packageLock.packages?.['']) packageLock.packages[''].version = nextVersion;
}
appJson.expo.version = nextVersion;
appJson.expo.android = appJson.expo.android || {};
appJson.expo.android.versionCode = versionCode;

if (gradle) {
  gradle = gradle.replace(/(\bversionCode\s+)\d+/, `$1${versionCode}`);
  gradle = gradle.replace(/(\bversionName\s+)["'][^"']+["']/, `$1"${nextVersion}"`);
}

const envPath = path.join(ROOT, '.env');
let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : null;
if (envContent !== null) {
  for (const [key, value] of [['APP_VERSION_NAME', nextVersion], ['APP_VERSION_CODE', String(versionCode)]]) {
    const expression = new RegExp(`^${key}=.*$`, 'm');
    if (expression.test(envContent)) envContent = envContent.replace(expression, `${key}=${value}`);
    else envContent = `${envContent.replace(/\s*$/, '')}\n${key}=${value}\n`;
  }
}

console.log(`${currentVersion} -> ${nextVersion} (Android versionCode ${versionCode})`);
if (options.has('--dry-run')) {
  console.log('Dry run: no files changed.');
  process.exit(0);
}

fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
if (packageLock) fs.writeFileSync(packageLockPath, `${JSON.stringify(packageLock, null, 2)}\n`);
fs.writeFileSync(appPath, `${JSON.stringify(appJson, null, 2)}\n`);
if (gradle !== null) fs.writeFileSync(gradlePath, gradle);
if (envContent !== null) fs.writeFileSync(envPath, envContent);

if (options.has('--commit')) {
  const git = (gitArgs) => {
    const result = spawnSync('git', gitArgs, { cwd: ROOT, encoding: 'utf8' });
    if (result.status !== 0) fail((result.stderr || result.stdout || `git ${gitArgs.join(' ')} failed`).trim());
    return result.stdout.trim();
  };
  const branch = git(['branch', '--show-current']);
  if (!branch) fail('Cannot commit/push from a detached HEAD');
  git(['commit', '--only', '-m', `chore: bump version to ${nextVersion}`, '--', 'package.json', 'package-lock.json', 'app.json']);
  console.log(`Committed version ${nextVersion} on ${branch}.`);
  if (options.has('--push')) {
    git(['push', 'origin', branch]);
    console.log(`Pushed ${branch} to origin.`);
  }
}

console.log('Version files updated. Rebuild the APK before publishing this version.');