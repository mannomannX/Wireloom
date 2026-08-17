/**
 * Wireloom Studio
 * Clean, minimalist editor & renderer matching just-lsp UX standard
 */

import wireloom from './dist/index.js';

// ---------------------------------------------------------------------------
// Storage & Default Content
// ---------------------------------------------------------------------------

const STORAGE_KEYS = {
  DOC: 'wireloom:doc',
  THEME: 'wireloom:theme',
  SPLIT: 'wireloom:split',
};

const DEFAULT_DOC = `define @MetricCard:
  panel:
    row:
      icon name="$icon" accent=$accent
      spacer
      text "$trend" accent=$accent
    text "$title" muted
    text "$value" bold size=large

window "Cloud Platform & Cluster Observability":
  header:
    row:
      text "Production Cluster: eu-central-1" bold size=large
      spacer
      chip "Cmd+K" variant=kbd
      divider orientation=vertical
      button "Deploy Service" primary

  row:
    use @MetricCard title="Total QPS" value="142.8k" trend="+14% /hr" icon="star" accent=success
    use @MetricCard title="Avg Latency" value="18.4ms" trend="-2.1ms" icon="gear" accent=research
    use @MetricCard title="Error Rate" value="0.04%" trend="Optimal" icon="check" accent=approval
    use @MetricCard title="Memory" value="84.2%" trend="Warning" icon="warning" accent=warning

  tabs:
    tab "Active Services" active:
      table striped compact:
        columns:
          column "Service Name" w=160 align=left
          column "Health Status" w=120 align=center
          column "P99 Latency" w=100 align=right
          column "Throughput" w=100 align=right
          column "Runtime" w=90 align=center
        tr:
          td "auth-service"
          status "Healthy" kind=success
          td "12ms"
          td "48.2k"
          chip "Go" variant=kbd
        tr:
          td "billing-api"
          status "Healthy" kind=success
          td "24ms"
          td "12.1k"
          chip "Rust" variant=kbd
        tr:
          td "search-indexer"
          status "Degraded" kind=warning
          td "184ms"
          td "32.0k"
          chip "Java" variant=kbd
        foot:
          td "3 Services Running (99.98% SLA)" span=3 align=left
          td "142.8k req/s" span=2 align=right

    tab "Config & Manifest":
      code lang="yaml" lines:
        text "apiVersion: apps/v1"
        text "kind: Deployment"
        text "metadata:"
        text "  name: cluster-ingress-v2"
        text "spec:"
        text "  replicas: 8"

  footer:
    row:
      status "Cluster Healthy" kind=success
      divider orientation=vertical
      text "Nodes: 16/16 Active" muted
      spacer
      button "Refresh Metrics"
      button "Export Report"`;

// ---------------------------------------------------------------------------
// DOM Elements
// ---------------------------------------------------------------------------

const el = {
  themeBtn: document.getElementById('theme-btn'),
  sunIcon: document.getElementById('theme-icon-sun'),
  moonIcon: document.getElementById('theme-icon-moon'),
  copyBtn: document.getElementById('copy-btn'),
  downloadBtn: document.getElementById('download-btn'),
  exportPngBtn: document.getElementById('export-png-btn'),
  formatBtn: document.getElementById('format-btn'),
  clearBtn: document.getElementById('clear-btn'),
  
  // Workspace & Splitter
  workspaceBox: document.getElementById('workspace-box'),
  editorPane: document.getElementById('editor-pane'),
  dragHandle: document.getElementById('drag-handle'),
  previewPane: document.getElementById('preview-pane'),

  // Editor
  gutter: document.getElementById('gutter'),
  input: document.getElementById('editor-input'),
  highlightLayer: document.getElementById('highlight-layer'),
  highlightCode: document.getElementById('highlight-code'),
  errorBar: document.getElementById('error-bar'),
  perfBadge: document.getElementById('perf-badge'),

  // Canvas Viewport
  previewBody: document.getElementById('preview-body'),
  canvasStage: document.getElementById('canvas-stage'),
  dimBadge: document.getElementById('dim-badge'),
  
  toast: document.getElementById('toast'),
};

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const state = {
  theme: localStorage.getItem(STORAGE_KEYS.THEME) || 'dark',
  splitRatio: parseFloat(localStorage.getItem(STORAGE_KEYS.SPLIT) || '0.5'),
  lastSvg: '',
  canvasWidth: 0,
  canvasHeight: 0,
};

// ---------------------------------------------------------------------------
// Editor & View Synchronization
// ---------------------------------------------------------------------------

function updateEditorView() {
  const text = el.input.value;
  // Use official Wireloom core syntax highlighter
  el.highlightCode.innerHTML = wireloom.highlight ? wireloom.highlight(text) : text;

  const lines = text.split('\n');
  let gutterHtml = '';
  for (let i = 1; i <= lines.length; i++) {
    gutterHtml += `<div class="gutter-num" data-line="${i}">${i}</div>`;
  }
  el.gutter.innerHTML = gutterHtml;

  syncScroll();
}

  const lines = text.split('\n');
  let gutterHtml = '';
  for (let i = 1; i <= lines.length; i++) {
    gutterHtml += `<div class="gutter-num" data-line="${i}">${i}</div>`;
  }
  el.gutter.innerHTML = gutterHtml;

  syncScroll();
}

function syncScroll() {
  el.highlightLayer.scrollTop = el.input.scrollTop;
  el.highlightLayer.scrollLeft = el.input.scrollLeft;
  el.gutter.scrollTop = el.input.scrollTop;
}

// ---------------------------------------------------------------------------
// Theme Management (Light / Dark)
// ---------------------------------------------------------------------------

function applyTheme(theme) {
  state.theme = theme;
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    el.sunIcon.style.display = 'block';
    el.moonIcon.style.display = 'none';
  } else {
    document.documentElement.classList.remove('dark');
    el.sunIcon.style.display = 'none';
    el.moonIcon.style.display = 'block';
  }
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
}

function toggleTheme() {
  const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
  compileAndRender(true);
}

// ---------------------------------------------------------------------------
// Toast Notification
// ---------------------------------------------------------------------------

let toastTimer = null;
function showToast(message) {
  if (!el.toast) return;
  el.toast.textContent = message;
  el.toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.toast.classList.remove('visible');
  }, 1800);
}

// ---------------------------------------------------------------------------
// Render Pipeline & Benchmarking
// ---------------------------------------------------------------------------

let renderTimer = null;

async function compileAndRender(immediate = false) {
  clearTimeout(renderTimer);
  if (!immediate) {
    renderTimer = setTimeout(() => compileAndRender(true), 40);
    return;
  }

  const source = el.input.value;
  localStorage.setItem(STORAGE_KEYS.DOC, source);

  const start = performance.now();

  try {
    const renderTheme = state.theme === 'dark' ? 'dark' : 'default';
    const res = await wireloom.render('preview', source, { theme: renderTheme });

    const elapsed = (performance.now() - start).toFixed(1);
    el.perfBadge.textContent = `${elapsed}ms`;

    el.errorBar.classList.remove('visible');
    el.errorBar.textContent = '';
    clearGutterError();

    state.lastSvg = res.svg;
    el.canvasStage.innerHTML = res.svg;

    const svgEl = el.canvasStage.querySelector('svg');
    if (svgEl) {
      const w = parseFloat(svgEl.getAttribute('width')) || 0;
      const h = parseFloat(svgEl.getAttribute('height')) || 0;
      state.canvasWidth = w;
      state.canvasHeight = h;
      el.dimBadge.textContent = `${Math.round(w)} × ${Math.round(h)} px`;
    }
  } catch (err) {
    const elapsed = (performance.now() - start).toFixed(1);
    el.perfBadge.textContent = `${elapsed}ms`;

    const msg = err.message || String(err);
    el.errorBar.textContent = msg;
    el.errorBar.classList.add('visible');

    const match = msg.match(/Line (\d+)/i);
    if (match && match[1]) {
      highlightGutterError(parseInt(match[1], 10));
    }
  }
}

function highlightGutterError(lineNum) {
  clearGutterError();
  const lineEl = el.gutter.querySelector(`[data-line="${lineNum}"]`);
  if (lineEl) {
    lineEl.classList.add('error');
  }
}

function clearGutterError() {
  const items = el.gutter.querySelectorAll('.gutter-num.error');
  items.forEach(i => i.classList.remove('error'));
}

// ---------------------------------------------------------------------------
// Actions: Copy / Download / Export
// ---------------------------------------------------------------------------

async function copySvg() {
  if (!state.lastSvg) return;
  try {
    await navigator.clipboard.writeText(state.lastSvg);
    showToast('SVG copied to clipboard');
  } catch {
    showToast('Copy failed');
  }
}

function downloadSvg() {
  if (!state.lastSvg) return;
  const blob = new Blob([state.lastSvg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wireframe-${Date.now()}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Downloaded SVG');
}

async function exportPng() {
  if (!state.lastSvg) return;
  const svgEl = el.canvasStage.querySelector('svg');
  if (!svgEl) return;

  const w = state.canvasWidth || 800;
  const h = state.canvasHeight || 600;
  const scale = 2; // 2x retina

  const canvas = document.createElement('canvas');
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext('2d');

  const img = new Image();
  const blob = new Blob([state.lastSvg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  img.onload = () => {
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);

    canvas.toBlob((pngBlob) => {
      if (!pngBlob) return;
      const pngUrl = URL.createObjectURL(pngBlob);
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `wireframe-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(pngUrl);
      showToast('Exported PNG (2x)');
    }, 'image/png');
  };

  img.src = url;
}

// ---------------------------------------------------------------------------
// Editor Tabbing & Shortcuts
// ---------------------------------------------------------------------------

function setupEditor() {
  el.input.addEventListener('keydown', (e) => {
    const { key, shiftKey } = e;

    if (key === 'Tab') {
      e.preventDefault();
      const start = el.input.selectionStart;
      const end = el.input.selectionEnd;
      const val = el.input.value;

      if (start === end) {
        if (!shiftKey) {
          el.input.setRangeText('  ', start, end, 'end');
        } else {
          if (start >= 2 && val.slice(start - 2, start) === '  ') {
            el.input.setRangeText('', start - 2, start, 'end');
          }
        }
      } else {
        const startLineIdx = val.lastIndexOf('\n', start - 1) + 1;
        const endLineIdx = val.indexOf('\n', end);
        const effectiveEnd = endLineIdx === -1 ? val.length : endLineIdx;
        const block = val.substring(startLineIdx, effectiveEnd);
        const lines = block.split('\n');

        let modified;
        if (!shiftKey) {
          modified = lines.map(line => '  ' + line).join('\n');
        } else {
          modified = lines.map(line => line.startsWith('  ') ? line.slice(2) : (line.startsWith(' ') ? line.slice(1) : line)).join('\n');
        }

        el.input.setRangeText(modified, startLineIdx, effectiveEnd, 'select');
      }
      updateEditorView();
      compileAndRender();
      return;
    }

    if (key === 'Enter') {
      e.preventDefault();
      const start = el.input.selectionStart;
      const val = el.input.value;
      const lineStart = val.lastIndexOf('\n', start - 1) + 1;
      const currentLine = val.substring(lineStart, start);
      const matchIndent = currentLine.match(/^(\s*)/);
      let indent = matchIndent ? matchIndent[1] : '';

      if (currentLine.trim().endsWith(':')) {
        indent += '  ';
      }

      el.input.setRangeText('\n' + indent, start, start, 'end');
      updateEditorView();
      compileAndRender();
      return;
    }
  });

  el.input.addEventListener('input', () => {
    updateEditorView();
    compileAndRender();
  });

  el.input.addEventListener('scroll', syncScroll);
}

// ---------------------------------------------------------------------------
// Resizable Splitter
// ---------------------------------------------------------------------------

function setupSplitter() {
  let dragging = false;

  function onMouseDown() {
    dragging = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }

  function onMouseMove(e) {
    if (!dragging) return;
    const containerW = el.workspaceBox.offsetWidth;
    const offsetLeft = el.workspaceBox.getBoundingClientRect().left;
    const mouseX = e.clientX - offsetLeft;

    const ratio = Math.max(0.2, Math.min(0.8, mouseX / containerW));
    state.splitRatio = ratio;
    el.workspaceBox.style.setProperty('--split-ratio', `${ratio * 100}%`);
    localStorage.setItem(STORAGE_KEYS.SPLIT, ratio.toString());
  }

  function onMouseUp() {
    if (!dragging) return;
    dragging = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }

  el.dragHandle.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);

  el.workspaceBox.style.setProperty('--split-ratio', `${state.splitRatio * 100}%`);
}

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

function formatWireloomSource(source) {
  const rawLines = source.split('\n');
  const indentStack = [0];
  const formattedLines = [];

  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i];
    const trimmed = rawLine.trim();
    if (!trimmed) {
      formattedLines.push('');
      continue;
    }

    // Normalize spacing between tokens outside strings
    let cleaned = '';
    const strRegex = /"([^"\\]|\\.)*"/g;
    let lastIdx = 0;
    let m;
    while ((m = strRegex.exec(trimmed)) !== null) {
      const nonStr = trimmed.slice(lastIdx, m.index);
      cleaned += nonStr.replace(/\s+/g, ' ');
      cleaned += m[0];
      lastIdx = m.index + m[0].length;
    }
    cleaned += trimmed.slice(lastIdx).replace(/\s+/g, ' ');
    cleaned = cleaned.replace(/\s+:/g, ':');

    const rawIndent = (rawLine.match(/^(\s*)/) || [''])[0].replace(/\t/g, '  ').length;

    if (trimmed.startsWith('window') || trimmed.startsWith('define') || trimmed.startsWith('annotation')) {
      indentStack.length = 1;
      indentStack[0] = rawIndent;
      formattedLines.push(cleaned);
      if (cleaned.endsWith(':')) {
        indentStack.push(rawIndent + 2);
      }
      continue;
    }

    while (indentStack.length > 1 && rawIndent < indentStack[indentStack.length - 1]) {
      indentStack.pop();
    }

    const depth = Math.max(1, indentStack.length - 1);
    const targetIndent = '  '.repeat(depth);
    formattedLines.push(targetIndent + cleaned);

    if (cleaned.endsWith(':')) {
      indentStack.push(rawIndent + 2);
    }
  }

  const result = formattedLines.join('\n');

  try {
    const ast = wireloom.parse(result);
    return wireloom.serialize(ast);
  } catch {
    return result;
  }
}

function init() {
  applyTheme(state.theme);
  
  el.themeBtn.addEventListener('click', toggleTheme);
  el.copyBtn.addEventListener('click', copySvg);
  el.downloadBtn.addEventListener('click', downloadSvg);
  el.exportPngBtn.addEventListener('click', exportPng);

  el.clearBtn.addEventListener('click', () => {
    el.input.value = 'window "Mockup":\n  text "Start sketching here…"';
    updateEditorView();
    compileAndRender(true);
  });

  el.formatBtn.addEventListener('click', () => {
    const formatted = formatWireloomSource(el.input.value);
    el.input.value = formatted;
    updateEditorView();
    compileAndRender(true);
    showToast('Code formatted');
  });

  setupEditor();
  setupSplitter();

  const saved = localStorage.getItem(STORAGE_KEYS.DOC);
  el.input.value = saved || DEFAULT_DOC;

  updateEditorView();
  compileAndRender(true);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
