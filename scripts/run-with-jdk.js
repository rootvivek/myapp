/**
 * Sets JAVA_HOME + PATH from project-root jdk.home, then runs a command.
 * gradlew needs this — it runs java before Gradle reads local.properties.
 *
 * Usage:
 *   node scripts/run-with-jdk.js npx expo run:android --variant release
 *   node scripts/run-with-jdk.js ./gradlew assembleRelease   (cwd = android)
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { loadDotenv } = require('./load-dotenv');

const root = path.resolve(__dirname, '..');
loadDotenv(root);
const jdkFile = path.join(root, 'jdk.home');

function readJdkHome() {
  if (!fs.existsSync(jdkFile)) {
    console.error('Missing jdk.home. Add your JDK path, then: npm run sync:jdk');
    process.exit(1);
  }
  const raw = fs.readFileSync(jdkFile, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    return t.replace(/^["']|["']$/g, '');
  }
  console.error('jdk.home has no path line.');
  process.exit(1);
}

const jdk = readJdkHome();
const javaBin = path.join(jdk, 'bin', process.platform === 'win32' ? 'java.exe' : 'java');
if (!fs.existsSync(javaBin)) {
  console.error(`Invalid JDK in jdk.home (no bin/java): ${jdk}`);
  process.exit(1);
}

const env = { ...process.env, JAVA_HOME: jdk };
const sep = path.delimiter;
env.PATH = `${path.join(jdk, 'bin')}${sep}${env.PATH || ''}`;

const argv = process.argv.slice(2);
if (argv.length === 0) {
  console.error('Usage: node scripts/run-with-jdk.js <command> [args...]');
  process.exit(1);
}

const [cmd, ...args] = argv;
const isGradle = cmd === './gradlew' || cmd === 'gradlew';
const opts = {
  stdio: 'inherit',
  env,
  shell: false,
};
if (isGradle) {
  opts.cwd = path.join(root, 'android');
}

const result = spawnSync(cmd, args, opts);
process.exit(result.status === null ? 1 : result.status);
