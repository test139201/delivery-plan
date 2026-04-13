/* ============================================================
 * site-editor.js — Adds inline contenteditable editing + RAG
 * highlight to static blocker HTML pages.
 * Self-contained: injects its own CSS, no other changes needed.
 * Double-click cell → edit in place. Select text → RAG toolbar.
 * Saves to localStorage; reset restores original page content.
 * ============================================================ */
(function () {
  'use strict';

  var table = document.querySelector('.card table');
  if (!table) return;

  var pageKey = 'site-edit-' + location.pathname.split('/').pop().replace('.html', '');
  var originalTableHTML = table.innerHTML;

  /* ══════ Inject CSS ══════ */
  var css = document.createElement('style');
  css.textContent =
    /* Editable cell hover hint */
    'table th,table td:not(.section-header td){transition:background .15s ease}' +
    'table tr:not(.section-header)>th:hover,table tr:not(.section-header)>td:hover{' +
    '  background:rgba(37,99,235,.04);outline:1px dashed rgba(37,99,235,.2);outline-offset:-1px;border-radius:2px;cursor:text}' +
    /* Editing state */
    '.cell-editing{background:rgba(37,99,235,.05)!important;outline:2px solid #2563eb!important;outline-offset:-2px;border-radius:2px;min-height:1.4em}' +
    '[contenteditable="true"]:focus{outline:2px solid #2563eb;outline-offset:-2px}' +
    /* Toolbar */
    '.site-ed-bar{display:flex;justify-content:flex-end;align-items:center;gap:.5rem;margin-bottom:.6rem;font-size:.82rem}' +
    '.site-ed-bar .ed-hint{margin-right:auto;color:#9ca3af;font-style:italic;font-size:.75rem}' +
    '.site-ed-bar button{padding:4px 12px;border:1px solid #d1d5db;border-radius:6px;background:#fff;cursor:pointer;font-size:.78rem;color:#374151;transition:all .15s}' +
    '.site-ed-bar button:hover:not(:disabled){background:#f3f4f6;border-color:#9ca3af}' +
    '.site-ed-bar button:disabled{opacity:.35;cursor:default}' +
    '.site-ed-bar .ed-reset{color:#dc2626;border-color:rgba(220,38,38,.3)}' +
    '.site-ed-bar .ed-reset:hover{background:#fef2f2}' +
    /* RAG marks */
    'mark.rag-r{background:#fecaca;border-radius:2px;padding:0 1px;color:#991b1b}' +
    'mark.rag-a{background:#fef3c7;border-radius:2px;padding:0 1px;color:#92400e}' +
    'mark.rag-g{background:#dcfce7;border-radius:2px;padding:0 1px;color:#166534}' +
    /* RAG floating toolbar */
    '.rag-toolbar{position:fixed;display:flex;align-items:center;gap:6px;padding:5px 10px;background:#fff;' +
    '  border:1px solid #e5e7eb;border-radius:20px;box-shadow:0 4px 16px rgba(0,0,0,.12),0 1px 3px rgba(0,0,0,.06);' +
    '  z-index:9999;user-select:none;animation:rag-pop .15s ease}' +
    '@keyframes rag-pop{from{opacity:0;transform:translateY(4px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}' +
    '.rag-btn{width:22px;height:22px;border-radius:50%;border:2px solid transparent;cursor:pointer;' +
    '  transition:transform .12s,box-shadow .12s;padding:0;display:flex;align-items:center;justify-content:center;font-size:0;line-height:1}' +
    '.rag-btn:hover{transform:scale(1.2);box-shadow:0 0 0 3px rgba(0,0,0,.08)}' +
    '.rag-btn:active{transform:scale(.95)}' +
    '.rag-btn-r{background:#ef4444;border-color:#fca5a5}' +
    '.rag-btn-a{background:#f59e0b;border-color:#fcd34d}' +
    '.rag-btn-g{background:#22c55e;border-color:#86efac}' +
    '.rag-btn-clear{background:#f3f4f6;border:1.5px solid #d1d5db;font-size:11px;color:#6b7280}' +
    '.rag-btn-clear:hover{background:#e5e7eb}' +
    '.rag-sep{width:1px;height:16px;background:#e5e7eb;margin:0 2px}' +
    /* Print: hide editor UI */
    '@media print{.site-ed-bar,.rag-toolbar{display:none!important}}';
  document.head.appendChild(css);

  /* ══════ Restore saved edits ══════ */
  var saved = localStorage.getItem(pageKey);
  if (saved) table.innerHTML = saved;

  /* ══════ Top toolbar (hint + reset) ══════ */
  var bar = document.createElement('div');
  bar.className = 'site-ed-bar';
  bar.innerHTML =
    '<span class="ed-hint">双击编辑 · 选中文字可标注 RAG 颜色</span>' +
    '<button data-act="undo" disabled title="撤销 Ctrl+Z">\u21B6</button>' +
    '<button data-act="redo" disabled title="重做 Ctrl+Y">\u21B7</button>' +
    (saved ? '<button class="ed-reset" data-act="reset">\u21A9 重置</button>' : '');
  var card = document.querySelector('.card');
  card.parentNode.insertBefore(bar, card);

  function ensureResetBtn() {
    if (bar.querySelector('[data-act="reset"]')) return;
    var btn = document.createElement('button');
    btn.className = 'ed-reset';
    btn.setAttribute('data-act', 'reset');
    btn.textContent = '\u21A9 重置';
    btn.onclick = resetAll;
    bar.appendChild(btn);
  }

  function resetAll() {
    if (!confirm('重置为原始内容？本地编辑将丢失。')) return;
    localStorage.removeItem(pageKey);
    table.innerHTML = originalTableHTML;
    lastSavedHTML = originalTableHTML;
    undoStack.length = 0;
    redoStack.length = 0;
    updateUndoButtons();
    var rb = bar.querySelector('[data-act="reset"]');
    if (rb) rb.remove();
  }

  var rb = bar.querySelector('[data-act="reset"]');
  if (rb) rb.onclick = resetAll;

  /* ══════ State ══════ */
  var activeCell = null;
  var savedCellHtml = '';

  /* ══════ Undo / Redo ══════ */
  var undoStack = [];
  var redoStack = [];
  var lastSavedHTML = table.innerHTML;
  var MAX_UNDO = 50;

  function updateUndoButtons() {
    var u = bar.querySelector('[data-act="undo"]');
    var r = bar.querySelector('[data-act="redo"]');
    if (u) u.disabled = !undoStack.length;
    if (r) r.disabled = !redoStack.length;
  }

  function doUndo() {
    if (!undoStack.length) return;
    if (activeCell) cancelEdit();
    hideRagToolbar();
    redoStack.push(lastSavedHTML);
    lastSavedHTML = undoStack.pop();
    table.innerHTML = lastSavedHTML;
    localStorage.setItem(pageKey, lastSavedHTML);
    updateUndoButtons();
    ensureResetBtn();
  }

  function doRedo() {
    if (!redoStack.length) return;
    if (activeCell) cancelEdit();
    hideRagToolbar();
    undoStack.push(lastSavedHTML);
    lastSavedHTML = redoStack.pop();
    table.innerHTML = lastSavedHTML;
    localStorage.setItem(pageKey, lastSavedHTML);
    updateUndoButtons();
  }

  bar.querySelector('[data-act="undo"]').onclick = doUndo;
  bar.querySelector('[data-act="redo"]').onclick = doRedo;

  /* ══════ Is cell editable? (not a section-header cell) ══════ */
  function isEditable(cell) {
    if (!cell) return false;
    var tr = cell.closest('tr');
    if (!tr) return false;
    return !tr.classList.contains('section-header');
  }

  /* ══════ Save table to localStorage ══════ */
  function saveTable() {
    undoStack.push(lastSavedHTML);
    if (undoStack.length > MAX_UNDO) undoStack.shift();
    redoStack.length = 0;
    lastSavedHTML = table.innerHTML;
    localStorage.setItem(pageKey, lastSavedHTML);
    ensureResetBtn();
    updateUndoButtons();
  }

  /* ══════ Contenteditable editing ══════ */
  function startEdit(cell) {
    if (activeCell) finishEdit();
    hideRagToolbar();
    savedCellHtml = cell.innerHTML;
    activeCell = cell;
    cell.contentEditable = 'true';
    cell.classList.add('cell-editing');
    cell.focus();
    /* Cursor at end */
    var range = document.createRange();
    range.selectNodeContents(cell);
    range.collapse(false);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function finishEdit() {
    if (!activeCell) return;
    activeCell.contentEditable = 'false';
    activeCell.classList.remove('cell-editing');
    /* Normalize: strip browser artefacts */
    activeCell.innerHTML = cleanHtml(activeCell);
    activeCell = null;
    savedCellHtml = '';
    saveTable();
  }

  function cancelEdit() {
    if (!activeCell) return;
    activeCell.contentEditable = 'false';
    activeCell.classList.remove('cell-editing');
    activeCell.innerHTML = savedCellHtml;
    activeCell = null;
    savedCellHtml = '';
  }

  /* ── Normalize cell HTML (strip contenteditable artefacts) ── */
  function cleanHtml(el) {
    function walk(node) {
      if (node.nodeType === 3) {
        return node.textContent
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
      }
      if (node.nodeType !== 1) return '';
      var tag = node.tagName.toLowerCase();
      var inner = Array.prototype.map.call(node.childNodes, walk).join('');
      switch (tag) {
        case 'b': case 'strong': return '<b>' + inner + '</b>';
        case 'i': case 'em': return '<i>' + inner + '</i>';
        case 'code': return '<code>' + inner + '</code>';
        case 'br': return '<br>';
        case 'mark': return '<mark class="' + (node.className || '') + '">' + inner + '</mark>';
        case 'div': case 'p': return '<br>' + inner;
        default: return inner;
      }
    }
    var result = Array.prototype.map.call(el.childNodes, walk).join('');
    if (result.indexOf('<br>') === 0) result = result.substring(4);
    return result;
  }

  /* ══════ RAG Toolbar ══════ */
  var ragToolbar = document.createElement('div');
  ragToolbar.className = 'rag-toolbar';
  ragToolbar.style.display = 'none';
  ragToolbar.innerHTML =
    '<button class="rag-btn rag-btn-r" data-rag="r" title="紧急 Red"></button>' +
    '<button class="rag-btn rag-btn-a" data-rag="a" title="关注 Amber"></button>' +
    '<button class="rag-btn rag-btn-g" data-rag="g" title="正常 Green"></button>' +
    '<span class="rag-sep"></span>' +
    '<button class="rag-btn rag-btn-clear" data-rag="clear" title="清除高亮">\u2715</button>';
  document.body.appendChild(ragToolbar);

  var ragTargetCell = null;

  function showRagToolbar(rect) {
    var tw = 152, th = 36;
    var x = rect.left + rect.width / 2 - tw / 2;
    var y = rect.top - th - 8;
    x = Math.max(8, Math.min(x, window.innerWidth - tw - 8));
    if (y < 8) y = rect.bottom + 8;
    ragToolbar.style.left = x + 'px';
    ragToolbar.style.top = y + 'px';
    ragToolbar.style.display = 'flex';
  }

  function hideRagToolbar() {
    ragToolbar.style.display = 'none';
    ragTargetCell = null;
  }

  /* ── RAG apply / clear ── */
  ragToolbar.addEventListener('mousedown', function (e) {
    e.preventDefault();
    e.stopPropagation();
    var btn = e.target.closest('[data-rag]');
    if (!btn || !ragTargetCell) return;
    var rag = btn.dataset.rag;

    var sel = window.getSelection();
    if (!sel || !sel.rangeCount) { hideRagToolbar(); return; }
    var range = sel.getRangeAt(0);

    if (rag === 'clear') {
      var marks = ragTargetCell.querySelectorAll('mark');
      for (var i = marks.length - 1; i >= 0; i--) {
        if (range.intersectsNode(marks[i])) {
          var p = marks[i].parentNode;
          while (marks[i].firstChild) p.insertBefore(marks[i].firstChild, marks[i]);
          p.removeChild(marks[i]);
        }
      }
      ragTargetCell.normalize();
    } else {
      var anc = range.commonAncestorContainer;
      if (anc.nodeType === 3) anc = anc.parentElement;
      var existing = anc.closest ? anc.closest('mark') : null;
      if (existing && ragTargetCell.contains(existing)) {
        existing.className = 'rag-' + rag;
      } else {
        var mark = document.createElement('mark');
        mark.className = 'rag-' + rag;
        try { range.surroundContents(mark); }
        catch (ex) { var frag = range.extractContents(); mark.appendChild(frag); range.insertNode(mark); }
      }
    }

    saveTable();
    sel.removeAllRanges();
    hideRagToolbar();
  });

  /* ══════ Event listeners ══════ */

  /* Double-click → enter edit */
  table.addEventListener('dblclick', function (e) {
    var cell = e.target.closest('th, td');
    if (!isEditable(cell)) return;
    if (cell === activeCell) return;
    e.preventDefault();
    startEdit(cell);
  });

  /* Click-outside → save; hide RAG */
  document.addEventListener('mousedown', function (e) {
    if (ragToolbar.contains(e.target)) return;
    hideRagToolbar();
    if (activeCell && !activeCell.contains(e.target)) finishEdit();
  });

  /* Keyboard: Undo/Redo (when idle), Escape cancel, Enter → <br> */
  document.addEventListener('keydown', function (e) {
    if (!activeCell && (e.ctrlKey || e.metaKey)) {
      if (e.key === 'z' && !e.shiftKey) { doUndo(); e.preventDefault(); return; }
      if (e.key === 'z' && e.shiftKey)  { doRedo(); e.preventDefault(); return; }
      if (e.key === 'y')                { doRedo(); e.preventDefault(); return; }
    }
    if (!activeCell) return;
    if (e.key === 'Escape') { cancelEdit(); e.preventDefault(); return; }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      var sel = window.getSelection();
      if (!sel.rangeCount) return;
      var range = sel.getRangeAt(0);
      range.deleteContents();
      var br = document.createElement('br');
      range.insertNode(br);
      range.setStartAfter(br);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  });

  /* Paste → plain text only */
  document.addEventListener('paste', function (e) {
    if (!activeCell) return;
    e.preventDefault();
    var text = (e.clipboardData || window.clipboardData).getData('text/plain');
    var sel = window.getSelection();
    if (!sel.rangeCount) return;
    var range = sel.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(text));
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  });

  /* RAG selection detection */
  document.addEventListener('mouseup', function () {
    setTimeout(function () {
      var sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) return;
      var selText = sel.toString().trim();
      if (!selText) return;
      var range = sel.getRangeAt(0);
      var node = range.startContainer;
      if (node.nodeType === 3) node = node.parentNode;
      var cell = node.closest ? node.closest('th, td') : null;
      if (!cell || !isEditable(cell)) return;
      if (!table.contains(cell)) return;
      ragTargetCell = cell;
      var rect = range.getBoundingClientRect();
      showRagToolbar(rect);
    }, 20);
  });
})();
