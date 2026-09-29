const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const base = (process.env.BASE_PATH || '').replace(/\/$/, '');
if (base && !/^\/[A-Za-z0-9_.-]+$/.test(base)) throw new Error('Invalid BASE_PATH');
const out = path.join(root, '_site');
fs.mkdirSync(out, { recursive: true });
function copy(dir, dest) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const src = path.join(dir, entry.name), target = path.join(dest, entry.name);
    if (entry.isDirectory()) { fs.mkdirSync(target, { recursive: true }); copy(src, target); continue; }
    if (!/\.(html|css|js)$/.test(entry.name) || src.includes(path.sep + 'vendor' + path.sep)) { fs.copyFileSync(src, target); continue; }
    let text = fs.readFileSync(src, 'utf8');
    // Only URL-bearing syntax changes; route comparisons keep their local paths.
    text = text.replace(/\b(href|src)=(['"])\/(?!\/)/g, (_, attr, quote) => `${attr}=${quote}${base}/`);
    text = text.replace(/url\((['"]?)\/(?!\/)/g, (_, quote) => `url(${quote}${base}/`);
    text = text.replace(/\b(import\(|loadAsync\()(['"])\/(?!\/)/g, (_, fn, quote) => `${fn}${quote}${base}/`);
    text = text.replace(/(\bfrom\s+)(['"])\/(?!\/)/g, (_, from, quote) => `${from}${quote}${base}/`);
    text = text.replace(/(\bcta\('[^']*',\s*')\/(?!\/)/g, (_, start) => `${start}${base}/`);
    if (entry.name === 'app.js' || entry.name === 'intro.js') {
      text = text.replaceAll('location.pathname', `(location.pathname.startsWith(${JSON.stringify(base + '/')}) ? location.pathname.slice(${base.length}) : location.pathname)`);
    }
    fs.writeFileSync(target, text);
  }
}
copy(path.join(root, 'dist'), out);
fs.writeFileSync(path.join(out, '.nojekyll'), '');
console.log('GitHub Pages output: _site, base path: ' + (base || '/'));
