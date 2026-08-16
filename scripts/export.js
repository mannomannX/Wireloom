#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const DEFAULT_EXCLUDES = new Set([
  '.claude',
  'dist',
  '.git',
  'node_modules',
]);

const BINARY_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.ico', '.webp',
  '.pdf', '.zip', '.tar', '.gz', '.7z',
  '.woff', '.woff2', '.ttf', '.eot',
  '.exe', '.bin', '.dll', '.so', '.dylib',
]);

/**
 * Checks whether a buffer represents binary content.
 * @param {Buffer} buffer
 * @returns {boolean}
 */
function isBinaryBuffer(buffer) {
  const checkLength = Math.min(buffer.length, 1024);
  for (let i = 0; i < checkLength; i++) {
    if (buffer[i] === 0) {
      return true;
    }
  }
  return false;
}

/**
 * Recursively scans directory and collects relative file paths.
 * @param {string} currentDir
 * @param {string} rootDir
 * @param {Set<string>} excludes
 * @param {string} resolvedOutputFile
 * @returns {string[]}
 */
function collectFiles(currentDir, rootDir, excludes, resolvedOutputFile) {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });
  /** @type {string[]} */
  const files = [];

  // Sort entries for deterministic output
  entries.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);
    const relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');

    if (excludes.has(entry.name) || excludes.has(relPath)) {
      continue;
    }

    if (path.resolve(fullPath) === resolvedOutputFile) {
      continue;
    }

    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath, rootDir, excludes, resolvedOutputFile));
    } else if (entry.isFile()) {
      files.push(relPath);
    }
  }

  return files;
}

/**
 * Generates an ASCII tree diagram representing the collected files.
 * @param {string[]} relativeFilePaths
 * @returns {string}
 */
function generateTree(relativeFilePaths) {
  const root = {};

  for (const relPath of relativeFilePaths) {
    const parts = relPath.split('/');
    let current = root;
    for (const part of parts) {
      current[part] = current[part] || {};
      current = current[part];
    }
  }

  /**
   * @param {Record<string, any>} node
   * @param {string} prefix
   * @returns {string[]}
   */
  function formatNode(node, prefix = '') {
    const keys = Object.keys(node).sort((a, b) => {
      const aIsDir = Object.keys(node[a]).length > 0;
      const bIsDir = Object.keys(node[b]).length > 0;
      if (aIsDir !== bIsDir) return aIsDir ? -1 : 1;
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });

    const lines = [];
    keys.forEach((key, index) => {
      const isLast = index === keys.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      const childPrefix = isLast ? '    ' : '│   ';
      const isDir = Object.keys(node[key]).length > 0;

      lines.push(`${prefix}${connector}${key}${isDir ? '/' : ''}`);
      if (isDir) {
        lines.push(...formatNode(node[key], `${prefix}${childPrefix}`));
      }
    });
    return lines;
  }

  return formatNode(root).join('\n');
}

/**
 * Exports all project files into a single structured text file.
 * @param {object} options
 * @param {string} [options.output]
 * @param {string[]} [options.excludes]
 */
export function exportProject(options = {}) {
  const outputFileName = options.output || 'project_export.txt';
  const resolvedOutputFile = path.resolve(PROJECT_ROOT, outputFileName);

  const excludes = new Set([...DEFAULT_EXCLUDES, ...(options.excludes || [])]);

  console.log(`Scanning project at: ${PROJECT_ROOT}`);
  console.log(`Excluding directories: ${Array.from(excludes).join(', ')}`);

  const files = collectFiles(PROJECT_ROOT, PROJECT_ROOT, excludes, resolvedOutputFile);

  console.log(`Found ${files.length} included files.`);

  const writeStream = fs.createWriteStream(resolvedOutputFile, { encoding: 'utf8' });

  const separator = '='.repeat(80);
  const subSeparator = '-'.repeat(80);

  // Write header
  writeStream.write(`${separator}\n`);
  writeStream.write(`PROJECT EXPORT: Wireloom\n`);
  writeStream.write(`Generated at: ${new Date().toISOString()}\n`);
  writeStream.write(`Root directory: ${PROJECT_ROOT}\n`);
  writeStream.write(`Excluded patterns: ${Array.from(excludes).join(', ')}\n`);
  writeStream.write(`Total included files: ${files.length}\n`);
  writeStream.write(`${separator}\n\n`);

  // Write directory structure overview
  writeStream.write(`DIRECTORY STRUCTURE OVERVIEW:\n`);
  writeStream.write(`${subSeparator}\n`);
  writeStream.write(generateTree(files));
  writeStream.write(`\n\n`);

  // Write file contents
  writeStream.write(`${separator}\n`);
  writeStream.write(`FILE CONTENTS\n`);
  writeStream.write(`${separator}\n\n`);

  let processedCount = 0;

  for (const relPath of files) {
    const fullPath = path.join(PROJECT_ROOT, relPath);
    const stat = fs.statSync(fullPath);
    const ext = path.extname(relPath).toLowerCase();

    writeStream.write(`${separator}\n`);
    writeStream.write(`FILE: ${relPath} (${stat.size} bytes)\n`);
    writeStream.write(`${separator}\n`);

    if (BINARY_EXTENSIONS.has(ext)) {
      writeStream.write(`[Binary file skipped: ${stat.size} bytes]\n\n`);
    } else {
      const buffer = fs.readFileSync(fullPath);
      if (isBinaryBuffer(buffer)) {
        writeStream.write(`[Binary file detected and skipped: ${stat.size} bytes]\n\n`);
      } else {
        const content = buffer.toString('utf8');
        writeStream.write(content);
        if (!content.endsWith('\n')) {
          writeStream.write('\n');
        }
        writeStream.write('\n');
      }
    }

    processedCount++;
  }

  writeStream.end();

  return new Promise((resolve, reject) => {
    writeStream.on('finish', () => {
      const outStat = fs.statSync(resolvedOutputFile);
      console.log(`Successfully exported ${processedCount} files.`);
      console.log(`Output written to: ${resolvedOutputFile} (${(outStat.size / 1024).toFixed(2)} KB)`);
      resolve(resolvedOutputFile);
    });

    writeStream.on('error', (err) => {
      reject(err);
    });
  });
}

// Direct CLI invocation check
const isCli = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isCli) {
  const userOutput = process.argv[2];
  try {
    await exportProject({ output: userOutput });
  } catch (error) {
    console.error('Export failed:', error);
    process.exit(1);
  }
}
