// QA helper: downloads the exact CDN files we pin (from the npm registry, since
// jsdelivr is not reachable from this sandbox) into .qa/vendor/ so the test
// harness can serve them locally as stand-ins for the CDN.
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const WANT = [
  ['mammoth', '1.13.0', 'package/mammoth.browser.min.js', 'mammoth.browser.min.js'],
  ['html2pdf.js', '0.14.0', 'package/dist/html2pdf.bundle.min.js', 'html2pdf.bundle.min.js'],
  ['xlsx', '0.18.5', 'package/dist/xlsx.full.min.js', 'xlsx.full.min.js'],
  ['jspdf', '3.0.4', 'package/dist/jspdf.umd.min.js', 'jspdf.umd.min.js'],
  ['jspdf-autotable', '5.0.8', 'package/dist/jspdf.plugin.autotable.min.js', 'jspdf.plugin.autotable.min.js'],
  ['pdf-lib', '1.17.1', 'package/dist/pdf-lib.min.js', 'pdf-lib.min.js'],
  ['pdfjs-dist', '3.11.174', 'package/legacy/build/pdf.min.js', 'pdf.min.js'],
  ['pdfjs-dist', '3.11.174', 'package/legacy/build/pdf.worker.min.js', 'pdf.worker.min.js'],
  ['jszip', '3.10.2', 'package/dist/jszip.min.js', 'jszip.min.js'],
  ['qrcode-generator', '2.0.4', 'package/dist/qrcode.js', 'qrcode.js'],
];

const out = path.resolve('vendor');
const tmp = path.resolve('tmpdl');
fs.mkdirSync(out, { recursive: true });
fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(tmp, { recursive: true });

for (const [pkg, ver, file, dest] of WANT) {
  const destPath = path.join(out, dest);
  if (fs.existsSync(destPath)) continue;
  const tgz = path.join(tmp, `${pkg.replace(/\//g, '_')}-${ver}.tgz`);
  execSync(`curl -sS "https://registry.npmjs.org/${pkg}/-/${pkg}-${ver}.tgz" -o "${tgz}" --max-time 120`);
  execSync(`tar -xzf "${tgz}" -C "${tmp}" "${file}"`);
  fs.copyFileSync(path.join(tmp, file), destPath);
  console.log('ok', dest, fs.statSync(destPath).size);
}
fs.rmSync(tmp, { recursive: true, force: true });
