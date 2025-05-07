import fs from 'fs/promises';
import path from 'path';
import toml from 'toml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tomlPath = path.resolve(__dirname, 'shopify.app.toml');
const envPath = path.resolve(__dirname, '.env');

async function getApplicationUrl() {
  try {
    const content = await fs.readFile(tomlPath, 'utf-8');
    const parsed = toml.parse(content);
    if (parsed.application_url) {
      console.log(`✅ Found application_url: ${parsed.application_url}`);
      return parsed.application_url;
    } else {
      console.error('❌ application_url not found in shopify.app.toml');
      return null;
    }
  } catch (err) {
    console.error('❌ Error reading shopify.app.toml:', err.message);
    return null;
  }
}

async function updateEnv(key, value) {
  let envContent = '';
  try {
    envContent = await fs.readFile(envPath, 'utf-8');
  } catch (err) {
    // File might not exist yet — that's okay
  }

  const regex = new RegExp(`^${key}=.*`, 'm');

  if (regex.test(envContent)) {
    envContent = envContent.replace(regex, `${key}=${value}`);
    console.log(`🔁 Updated ${key} in .env`);
  } else {
    if (envContent && !envContent.endsWith('\n')) {
      envContent += '\n';
    }
    envContent += `${key}=${value}\n`;
    console.log(`➕ Added ${key} to .env`);
  }

  await fs.writeFile(envPath, envContent);
}

const appUrl = await getApplicationUrl();

if (appUrl) {
  await updateEnv('APP_URL', appUrl);
} else {
  console.error('❌ Failed to update .env');
}
