/** @module patch-build
 *  Post-build script to write build info and perform other build patching tasks
 *  Replaces the previous gulp-based build patching
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getBuildInfoText } from './gulp-helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = dirname(dirname(__filename));

async function writeBuildInfo() {
  const buildInfoText = getBuildInfoText();
  // eslint-disable-next-line no-console
  console.log('Build info:\n' + buildInfoText);
  
  const buildDir = `${projectRoot}/build`;
  // Ensure build directory exists
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }
  
  const buildInfoPath = `${buildDir}/build.txt`;
  fs.writeFileSync(buildInfoPath, buildInfoText, 'utf8');
  // eslint-disable-next-line no-console
  console.log(`Build info written to ${buildInfoPath}`);
}

// Main function
async function patchBuild() {
  try {
    await writeBuildInfo();
    // Add other patch tasks here if needed in the future
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error in patch-build:', error);
    process.exit(1);
  }
}

patchBuild();

