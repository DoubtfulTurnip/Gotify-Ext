#!/usr/bin/env node
/**
 * Build script for packaging Gotify Markdown extension as .xpi
 * Works on both Windows and Linux.
 *
 * Usage:
 *   node build-xpi.js
 *
 * Prerequisites:
 *   - Run `ng build --prod` first (or `npm run build -- --prod`)
 *   - Output must be in dist/gotify-ext/
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const DIST_DIR = path.join(__dirname, "dist", "gotify-ext");
const MANIFEST_PROD = path.join(__dirname, "src", "manifest.prod.json");
const DIST_MANIFEST = path.join(DIST_DIR, "manifest.json");
const OUTPUT_XPI = path.join(__dirname, "dist", "gotify-markdown.xpi");

function printInstructions() {
  console.log("\nInstallation instructions:");
  console.log("  1. Open LibreWolf/Firefox");
  console.log("  2. Go to about:config, set xpinstall.signatures.required = false");
  console.log("  3. Go to about:addons (Ctrl+Shift+A)");
  console.log('  4. Click gear icon > "Install Add-on From File..."');
  console.log("  5. Select: " + OUTPUT_XPI);
  console.log("\n  After installing, check about:debugging#/runtime/this-firefox for the");
  console.log("  extension's Internal UUID and add it to your Gotify docker-compose config:");
  console.log("    GOTIFY_SERVER_STREAM_ALLOWEDORIGINS: add the UUID");
  console.log("    GOTIFY_SERVER_CORS_ALLOWORIGINS: add moz-extension://<UUID>");
}

/**
 * Create a zip file using Python (handles forward-slash paths correctly on Windows).
 * Falls back to system zip on Linux.
 */
function createZip(sourceDir, outputPath) {
  var isWin = process.platform === "win32";

  if (isWin) {
    // Write a temp Python script to avoid shell quoting issues
    // Python's zipfile uses forward slashes, unlike PowerShell's Compress-Archive
    var tmpScript = path.join(__dirname, "dist", "_pack.py");
    var pyCode = [
      "import zipfile, os, sys",
      "dist = sys.argv[1]",
      "xpi = sys.argv[2]",
      "with zipfile.ZipFile(xpi, 'w', zipfile.ZIP_DEFLATED) as zf:",
      "    for root, dirs, files in os.walk(dist):",
      "        for f in files:",
      "            full = os.path.join(root, f)",
      "            arcname = os.path.relpath(full, dist).replace(os.sep, '/')",
      "            zf.write(full, arcname)",
      "            print('  + ' + arcname)",
      ""
    ].join("\n");
    fs.writeFileSync(tmpScript, pyCode);
    try {
      execSync('python "' + tmpScript + '" "' + sourceDir + '" "' + outputPath + '"', { stdio: "inherit" });
    } finally {
      fs.unlinkSync(tmpScript);
    }
  } else {
    execSync('cd "' + sourceDir + '" && zip -r "' + outputPath + '" ./*', { stdio: "inherit" });
  }
}

// Check dist exists
if (!fs.existsSync(DIST_DIR)) {
  console.error("Error: dist/gotify-ext/ not found. Run 'ng build --prod' first.");
  process.exit(1);
}

// Copy prod manifest to dist
console.log("Copying production manifest...");
var manifest = fs.readFileSync(MANIFEST_PROD, "utf8");

// Replace version placeholder with package.json version
var pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "package.json"), "utf8"));
manifest = manifest.replace("{|vers|}", pkg.version);

fs.writeFileSync(DIST_MANIFEST, manifest);
console.log("  Version: " + pkg.version);

// Remove old xpi if exists
if (fs.existsSync(OUTPUT_XPI)) {
  fs.unlinkSync(OUTPUT_XPI);
}

// Create the .xpi package
console.log("Creating .xpi package...");
createZip(DIST_DIR, OUTPUT_XPI);

var stats = fs.statSync(OUTPUT_XPI);
console.log("\nPackaged: " + OUTPUT_XPI + " (" + (stats.size / 1024).toFixed(1) + " KB)");
printInstructions();
