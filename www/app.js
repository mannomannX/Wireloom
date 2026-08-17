/**
 * Wireloom Studio Application
 * Clean, minimalist editor & renderer matching modern devtools UX standard
 */

import wireloom from './dist/index.js';
import { STORAGE_KEYS, DEFAULT_DOC } from './constants.js';

// ---------------------------------------------------------------------------
// DOM Elements
// ---------------------------------------------------------------------------

const el = {
  themeBtn: document.getElementById('theme-btn'),
  sunIcon: document.getElementById('theme-icon-sun'),
  moonIcon: document.getElementById('theme-icon-moon'),
  copyMdBtn: document.getElementById('copy-md-btn'),
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
  infoBtn: document.getElementById('info-btn'),
  infoModal: document.getElementById('info-modal'),
  modalCloseBtn: document.getElementById('modal-close-btn'),
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
  compileAndRender();
}

function toggleTheme() {
  applyTheme(state.theme === 'dark' ? 'light' : 'dark');
}

// ---------------------------------------------------------------------------
// Splitter Dragging
// ---------------------------------------------------------------------------

let isDragging = false;

function initSplitter() {
  applySplitRatio(state.splitRatio);

  el.dragHandle.addEventListener('mousedown', (e) => {
    isDragging = true;
    document.body.style.cursor = window.innerWidth > 768 ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const rect = el.workspaceBox.getBoundingClientRect();
    let ratio;
    if (window.innerWidth > 768) {
      ratio = (e.clientX - rect.left) / rect.width;
    } else {
      ratio = (e.clientY - rect.top) / rect.height;
    }
    ratio = Math.max(0.2, Math.min(0.8, ratio));
    applySplitRatio(ratio);
  });

  window.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      localStorage.setItem(STORAGE_KEYS.SPLIT, state.splitRatio.toString());
    }
  });
}

function applySplitRatio(ratio) {
  state.splitRatio = ratio;
  el.workspaceBox.style.setProperty('--split-ratio', `${ratio * 100}%`);
}

// ---------------------------------------------------------------------------
// Live Compilation & Rendering
// ---------------------------------------------------------------------------

let debounceTimer = null;

function scheduleCompile() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    compileAndRender();
  }, 50);
}

async function compileAndRender() {
  const source = el.input.value;
  localStorage.setItem(STORAGE_KEYS.DOC, source);

  // Clear previous error styles
  el.errorBar.classList.remove('visible');
  el.errorBar.textContent = '';
  document.querySelectorAll('.gutter-num.error').forEach(n => n.classList.remove('error'));

  if (!source.trim()) {
    el.canvasStage.innerHTML = '';
    el.perfBadge.textContent = '0.0ms';
    el.dimBadge.textContent = '0 × 0 px';
    state.lastSvg = '';
    return;
  }

  const t0 = performance.now();
  try {
    const themeName = state.theme === 'dark' ? 'dark' : 'default';
    const result = await wireloom.render('preview-id', source, { theme: themeName });
    const t1 = performance.now();
    const renderTime = (t1 - t0).toFixed(1);

    el.perfBadge.textContent = `${renderTime}ms`;
    state.lastSvg = result.svg;
    el.canvasStage.innerHTML = result.svg;

    // Read SVG dimensions
    const svgEl = el.canvasStage.querySelector('svg');
    if (svgEl) {
      const width = svgEl.getAttribute('width') || svgEl.viewBox?.baseVal?.width || 0;
      const height = svgEl.getAttribute('height') || svgEl.viewBox?.baseVal?.height || 0;
      state.canvasWidth = Math.round(parseFloat(width));
      state.canvasHeight = Math.round(parseFloat(height));
      el.dimBadge.textContent = `${state.canvasWidth} × ${state.canvasHeight} px`;
    }
  } catch (err) {
    const t1 = performance.now();
    el.perfBadge.textContent = `${(t1 - t0).toFixed(1)}ms`;

    const errorMsg = err.message || String(err);
    el.errorBar.textContent = errorMsg;
    el.errorBar.classList.add('visible');

    // Highlight line in gutter if line info exists
    if (err.line) {
      const gutterEl = document.querySelector(`.gutter-num[data-line="${err.line}"]`);
      if (gutterEl) gutterEl.classList.add('error');
    }
  }
}

// ---------------------------------------------------------------------------
// Source Formatter
// ---------------------------------------------------------------------------

function formatWireloomSource(source) {
  try {
    // 1. AST-based canonical serialization
    if (wireloom.parse && wireloom.serialize) {
      return wireloom.serialize(wireloom.parse(source));
    }
  } catch (err) {
    // 2. Pre-clean token spacing and indentation if parse fails
    try {
      const lines = source.split('\n');
      const formattedLines = [];
      let indentStack = [0];
      
      for (const line of lines) {
        if (!line.trim()) {
          formattedLines.push('');
          continue;
        }
        
        const rawIndent = line.search(/\S/);
        const trimmed = line.trim().replace(/\s*([=:])\s*/g, '$1');
        
        while (indentStack.length > 1 && rawIndent < indentStack[indentStack.length - 1]) {
          indentStack.pop();
        }
        
        if (rawIndent > indentStack[indentStack.length - 1]) {
          indentStack.push(rawIndent);
        }
        
        const level = indentStack.length - 1;
        const indentStr = '  '.repeat(level);
        formattedLines.push(indentStr + trimmed);
      }
      
      const normalized = formattedLines.join('\n');
      if (wireloom.parse && wireloom.serialize) {
        return wireloom.serialize(wireloom.parse(normalized));
      }
      return normalized;
    } catch {
      // Fallback
    }
  }
  return source;
}

function handleFormat() {
  const current = el.input.value;
  const formatted = formatWireloomSource(current);
  if (formatted !== current) {
    el.input.value = formatted;
    updateEditorView();
    compileAndRender();
    showToast('Formatted source');
  } else {
    showToast('Already formatted');
  }
}

// ---------------------------------------------------------------------------
// Actions & Exporting
// ---------------------------------------------------------------------------

function showToast(msg) {
  el.toast.textContent = msg;
  el.toast.classList.add('visible');
  setTimeout(() => {
    el.toast.classList.remove('visible');
  }, 2000);
}

function copyMarkdown() {
  const source = el.input.value;
  if (!source.trim()) {
    showToast('No code to copy');
    return;
  }
  const mdBlock = '```wireloom\n' + source.trim() + '\n```';
  navigator.clipboard.writeText(mdBlock).then(() => {
    showToast('Markdown block copied');
  }).catch(() => {
    showToast('Failed to copy Markdown');
  });
}

function copySvg() {
  if (!state.lastSvg) {
    showToast('No rendered SVG to copy');
    return;
  }
  navigator.clipboard.writeText(state.lastSvg).then(() => {
    showToast('SVG copied to clipboard');
  }).catch(() => {
    showToast('Failed to copy SVG');
  });
}

function downloadSvg() {
  if (!state.lastSvg) {
    showToast('No rendered SVG to download');
    return;
  }
  const blob = new Blob([state.lastSvg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'wireloom-mockup.svg';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Downloaded SVG');
}

function exportPng() {
  if (!state.lastSvg) {
    showToast('No rendered SVG to export');
    return;
  }
  
  const svgEl = el.canvasStage.querySelector('svg');
  if (!svgEl) return;

  const svgData = new XMLSerializer().serializeToString(svgEl);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();

  const scale = 2; // 2x Retina Export
  const w = (state.canvasWidth || 800) * scale;
  const h = (state.canvasHeight || 600) * scale;

  canvas.width = w;
  canvas.height = h;

  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  img.onload = () => {
    ctx.fillStyle = state.theme === 'dark' ? '#09090b' : '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    URL.revokeObjectURL(url);

    const pngUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = pngUrl;
    a.download = 'wireloom-mockup.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Exported PNG (2x)');
  };

  img.src = url;
}

// ---------------------------------------------------------------------------
// Event Listeners & Keyboard Shortcuts
// ---------------------------------------------------------------------------

function initEvents() {
  el.themeBtn.addEventListener('click', toggleTheme);
  if (el.copyMdBtn) el.copyMdBtn.addEventListener('click', copyMarkdown);
  el.copyBtn.addEventListener('click', copySvg);
  el.downloadBtn.addEventListener('click', downloadSvg);
  el.exportPngBtn.addEventListener('click', exportPng);
  el.formatBtn.addEventListener('click', handleFormat);
  el.clearBtn.addEventListener('click', () => {
    el.input.value = '';
    updateEditorView();
    compileAndRender();
    el.input.focus();
  });

  el.input.addEventListener('input', () => {
    updateEditorView();
    scheduleCompile();
  });

  el.input.addEventListener('scroll', syncScroll);

  // Tab key handling and shortcuts
  el.input.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = el.input.selectionStart;
      const end = el.input.selectionEnd;

      if (e.shiftKey) {
        // Unindent 2 spaces
        const lines = el.input.value.substring(0, start).split('\n');
        const currentLine = lines[lines.length - 1];
        if (currentLine.startsWith('  ')) {
          el.input.setRangeText('', start - 2, start, 'end');
        }
      } else {
        // Insert 2 spaces
        el.input.setRangeText('  ', start, end, 'end');
      }
      updateEditorView();
      scheduleCompile();
    } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      downloadSvg();
    } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'F' || e.key === 'f')) {
      e.preventDefault();
      handleFormat();
    }
  });

  // Info Modal Dialog
  if (el.infoBtn && el.infoModal) {
    el.infoBtn.addEventListener('click', () => {
      el.infoModal.classList.add('visible');
    });

    if (el.modalCloseBtn) {
      el.modalCloseBtn.addEventListener('click', () => {
        el.infoModal.classList.remove('visible');
      });
    }

    el.infoModal.addEventListener('click', (e) => {
      if (e.target === el.infoModal) {
        el.infoModal.classList.remove('visible');
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && el.infoModal.classList.contains('visible')) {
        el.infoModal.classList.remove('visible');
      }
    });
  }

  window.addEventListener('resize', () => {
    syncScroll();
  });
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

function init() {
  const savedDoc = localStorage.getItem(STORAGE_KEYS.DOC);
  el.input.value = savedDoc !== null ? savedDoc : DEFAULT_DOC;

  initSplitter();
  applyTheme(state.theme);
  initEvents();
  updateEditorView();
  compileAndRender();
}

// Boot
window.addEventListener('DOMContentLoaded', init);
