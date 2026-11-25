/**
 * MarkPDF Studio - Application Core Logic
 * Handles real-time parsing, multi-sheet rendering, math protection,
 * dynamic print rules, resizable panes, and direct PDF downloads.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const markdownInput = document.getElementById('markdownInput');
  const documentContainer = document.getElementById('documentContainer');
  const previewScrollWrapper = document.getElementById('previewScrollWrapper');
  const dynamicPrintStyle = document.getElementById('dynamicPrintStyle');

  // Selectors & Controls
  const themeSelect = document.getElementById('themeSelect');
  const quickDarkToggle = document.getElementById('quickDarkToggle');
  const pageSizeSelect = document.getElementById('pageSizeSelect');
  const marginsSelect = document.getElementById('marginsSelect');
  const templateSelect = document.getElementById('templateSelect');

  // Code Dropdown
  const codeDropdownBtn = document.getElementById('codeDropdownBtn');
  const codeDropdownMenu = document.getElementById('codeDropdownMenu');

  // Action Buttons
  const printBtn = document.getElementById('printBtn');
  const downloadPdfBtn = document.getElementById('downloadPdfBtn');
  const floatingPrintBtn = document.getElementById('floatingPrintBtn');
  const exportMdBtn = document.getElementById('exportMdBtn');
  const importBtn = document.getElementById('importBtn');
  const fileInput = document.getElementById('fileInput');
  const clearBtn = document.getElementById('clearBtn');

  // Stats & Toast
  const wordCountEl = document.getElementById('wordCount');
  const charCountEl = document.getElementById('charCount');
  const pageCountText = document.getElementById('pageCountText');
  const toastEl = document.getElementById('toast');

  // Initialize Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Initialize Mermaid Diagram Engine (pure SVG labels so html2canvas & PDF export work cleanly)
  const mermaidSandbox = document.getElementById('mermaidSandbox');

  function configureMermaidForTheme(themeName) {
    if (!window.mermaid) return;
    const isDark = themeName === 'theme-dark';
    window.mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? 'dark' : 'default',
      securityLevel: 'loose',
      htmlLabels: false,
      themeVariables: isDark
        ? {
          darkMode: true,
          background: '#242f42',
          fontFamily: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          fontSize: '13px',
          primaryColor: '#334155',
          primaryBorderColor: '#64748b',
          primaryTextColor: '#f8fafc',
          secondaryColor: '#293548',
          tertiaryColor: '#1e293b',
          lineColor: '#94a3b8',
          textColor: '#e2e8f0',
          noteBkgColor: '#2d3a50',
          noteTextColor: '#f1f5f9',
          noteBorderColor: '#64748b',
          actorBkg: '#334155',
          actorBorder: '#64748b',
          actorTextColor: '#f8fafc',
          actorLineColor: '#64748b',
          signalColor: '#cbd5e1',
          signalTextColor: '#f1f5f9',
          labelBoxBkgColor: '#293548',
          labelBoxBorderColor: '#64748b',
          labelTextColor: '#f1f5f9',
          loopTextColor: '#cbd5e1',
          activationBkgColor: '#334155',
          activationBorderColor: '#818cf8'
        }
        : {
          fontFamily: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          fontSize: '13px'
        },
      flowchart: { htmlLabels: false, useMaxWidth: true },
      sequence: { useMaxWidth: true, wrap: false },
      state: { useMaxWidth: true }
    });
  }

  configureMermaidForTheme('theme-modern');

  // Language labels for ChatGPT-style code header
  const LANG_LABELS = {
    'json': 'json',
    'bash': 'bash',
    'sh': 'sh',
    'shell': 'shell',
    'terminal': 'terminal',
    'zsh': 'zsh',
    'powershell': 'powershell',
    'sql': 'sql',
    'javascript': 'javascript',
    'js': 'javascript',
    'typescript': 'typescript',
    'ts': 'typescript',
    'python': 'python',
    'py': 'python',
    'html': 'html',
    'xml': 'xml',
    'css': 'css',
    'yaml': 'yaml',
    'yml': 'yaml',
    'go': 'go',
    'rust': 'rust',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'plaintext': 'text',
    'text': 'text'
  };

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Refine Highlight.js tokens to match VS Code Dark+ (control keywords in purple #c586c0, types/classes in teal #4ec9b0)
  const VSCODE_CONTROL_KEYWORDS = new Set([
    'from', 'import', 'as', 'if', 'elif', 'else', 'for', 'while', 'do',
    'return', 'yield', 'raise', 'throw', 'try', 'except', 'catch', 'finally',
    'with', 'pass', 'break', 'continue', 'await', 'async', 'export', 'default',
    'switch', 'case', 'not', 'or', 'and', 'assert'
  ]);

  // Languages that should receive PascalCase class/type token coloring
  const CODE_TYPED_LANGS = new Set([
    'python', 'py', 'typescript', 'ts', 'javascript', 'js',
    'java', 'c', 'cpp', 'go', 'rust', 'csharp', 'cs'
  ]);

  const PLAIN_TEXT_LANGS = new Set([
    'text', 'plaintext', 'txt', 'tree', 'ascii', 'dir', 'log'
  ]);

  function applyVsCodeTokenRefinements(html, rawLang) {
    // 1. Split control-flow keywords (#c586c0) from declaration keywords (#569cd6)
    let refined = html.replace(
      /<span class="hljs-keyword">([a-zA-Z_]+)<\/span>/g,
      (full, kw) => VSCODE_CONTROL_KEYWORDS.has(kw) ? `<span class="hljs-kw-control">${kw}</span>` : full
    );

    // 2. Highlight un-wrapped PascalCase classes/types & builtin type hints in teal (#4ec9b0)
    //    only on programming languages (never on text, markdown, json, bash, yaml, html, css)
    if (CODE_TYPED_LANGS.has(rawLang)) {
      refined = refined.replace(
        /(<span\b[^>]*>[\s\S]*?<\/span>)|\b([A-Z][a-zA-Z0-9_]*[a-z][a-zA-Z0-9_]*|UUID|str|int|float|bool|dict|list|tuple|set|bytes|datetime|Callable|Any|Optional|Union|Literal)\b/g,
        (match, existingSpan, typeName) => existingSpan ? existingSpan : `<span class="hljs-type">${typeName}</span>`
      );
    }

    return refined;
  }

  // Dedicated formatter for text / directory-tree blocks (never miscolors English words as code classes)
  function highlightPlainTextOrTree(codeText) {
    const isTree = /[├└│─]/.test(codeText);
    return codeText.split(/\r?\n/).map(line => {
      // Full-line comment
      if (/^\s*#\s/.test(line)) {
        return `<span class="hljs-comment">${escapeHtml(line)}</span>`;
      }

      // Split trailing inline comment (# ... or // ...)
      let mainPart = line;
      let commentPart = '';
      const commentMatch = line.match(/^([\s\S]*?)(\s+#\s+.*|\/#\s+.*|\s+\/\/\s+.*)$/);
      if (commentMatch) {
        if (commentMatch[2].startsWith('/#')) {
          mainPart = commentMatch[1] + '/';
          commentPart = commentMatch[2].slice(1);
        } else {
          mainPart = commentMatch[1];
          commentPart = commentMatch[2];
        }
      }

      let formattedMain = '';
      if (isTree) {
        // Highlight tree branches, folder names (ending in /), and filenames cleanly
        formattedMain = escapeHtml(mainPart)
          .replace(/([├└│─┬┼]+|--+|\|\s*)/g, '<span class="hljs-tree-branch">$1</span>')
          .replace(/([A-Za-z0-9_.\-]+\/)/g, '<span class="hljs-tree-folder">$1</span>');
      } else {
        formattedMain = escapeHtml(mainPart);
      }

      const formattedComment = commentPart
        ? `<span class="hljs-comment">${escapeHtml(commentPart)}</span>`
        : '';

      return formattedMain + formattedComment;
    }).join('\n');
  }

  // Compute an auto-fitted font size (in pt) so wide lines (80-125 chars, like directory trees)
  // stay on a single line in BOTH Live Preview and Print/PDF without wrapping to the next line.
  function computeCodeFontSizePt(codeText) {
    const lines = codeText.split(/\r?\n/);
    let maxLen = 0;
    for (let i = 0; i < lines.length; i++) {
      const expandedLen = lines[i].replace(/\t/g, '  ').length;
      if (expandedLen > maxLen) maxLen = expandedLen;
    }
    if (maxLen <= 80) return 8.6;
    // Scale down smoothly between 8.6pt (80 chars) and 5.5pt (~125 chars)
    return Math.max(5.5, Math.min(8.6, +(700 / maxLen).toFixed(2)));
  }

  // Configure Custom Marked Renderer (Mermaid Diagrams + ChatGPT Code Blocks)
  const renderer = new marked.Renderer();

  renderer.code = function (token, language) {
    let codeText = '';
    let lang = '';

    if (typeof token === 'object' && token !== null) {
      codeText = token.text || '';
      lang = token.lang || '';
    } else {
      codeText = typeof token === 'string' ? token : '';
      lang = typeof language === 'string' ? language : '';
    }

    const rawLang = lang.toLowerCase().trim();

    // Render Mermaid fenced blocks as diagram placeholders
    if (rawLang === 'mermaid') {
      return `
        <div class="mermaid-block">
          <div class="mermaid-diagram" data-mermaid="${encodeURIComponent(codeText)}">
            <span class="mermaid-loading">Rendering diagram...</span>
          </div>
        </div>
      `;
    }

    const isPlainOrTree = PLAIN_TEXT_LANGS.has(rawLang) || (!rawLang && /[├└│─]/.test(codeText));
    const langLabel = isPlainOrTree ? (rawLang || 'text') : (LANG_LABELS[rawLang] || (rawLang || 'code'));
    const codeFontPt = computeCodeFontSizePt(codeText);

    let highlighted = '';
    try {
      if (isPlainOrTree) {
        highlighted = highlightPlainTextOrTree(codeText);
      } else if (rawLang && window.hljs && window.hljs.getLanguage(rawLang)) {
        highlighted = window.hljs.highlight(codeText, { language: rawLang }).value;
        highlighted = applyVsCodeTokenRefinements(highlighted, rawLang);
      } else if (window.hljs) {
        const autoRes = window.hljs.highlightAuto(codeText);
        highlighted = applyVsCodeTokenRefinements(autoRes.value, autoRes.language || '');
      } else {
        highlighted = escapeHtml(codeText);
      }
    } catch (err) {
      console.warn('Highlight.js notice:', err);
      highlighted = escapeHtml(codeText);
    }

    return `
      <div class="code-block-wrapper">
        <div class="code-block-header">
          <div class="code-header-left">
            <span class="lang-label">${escapeHtml(langLabel)}</span>
          </div>
          <div class="code-header-right">
            <button type="button" class="copy-code-btn" title="Copy code">
              <i data-lucide="copy"></i> Copy code
            </button>
          </div>
        </div>
        <pre style="--code-font-size: ${codeFontPt}pt"><code class="hljs language-${escapeHtml(rawLang || 'plaintext')}">${highlighted}</code></pre>
      </div>
    `;
  };

  marked.setOptions({
    renderer: renderer,
    breaks: true,
    gfm: true
  });

  // Protect LaTeX math expressions from Marked emphasis/escape parsing (while skipping fenced code blocks)
  function parseMarkdownWithMath(md) {
    const mathBlocks = [];
    const codePlaceholders = [];

    // 1. Temporarily mask fenced code blocks so math regex never touches code
    let protectedMd = md.replace(/```[\s\S]*?```/g, (match) => {
      const idx = codePlaceholders.length;
      codePlaceholders.push(match);
      return `@@CODEBLOCK_${idx}@@`;
    });

    // 2. Mask display & inline math expressions
    const saveMath = (match) => {
      const idx = mathBlocks.length;
      mathBlocks.push(match);
      return `@@MATHBLOCK_${idx}@@`;
    };

    protectedMd = protectedMd
      .replace(/\$\$[\s\S]+?\$\$/g, saveMath)
      .replace(/\\\[[\s\S]+?\\\]/g, saveMath)
      .replace(/\\\([\s\S]+?\\\)/g, saveMath);

    // 3. Restore fenced code blocks before Marked parses
    protectedMd = protectedMd.replace(/@@CODEBLOCK_(\d+)@@/g, (_, idx) => codePlaceholders[Number(idx)]);

    // 4. Parse Markdown
    let html = marked.parse(protectedMd);

    // 5. Restore math expressions for KaTeX auto-render
    html = html.replace(/@@MATHBLOCK_(\d+)@@/g, (_, idx) => escapeHtml(mathBlocks[Number(idx)]));

    return html;
  }

  // Callouts: [!NOTE], [!TIP], [!WARNING], [!CAUTION]
  const CALLOUT_META = {
    NOTE: { cls: 'note', icon: 'info', label: 'Note' },
    TIP: { cls: 'tip', icon: 'lightbulb', label: 'Tip' },
    WARNING: { cls: 'warning', icon: 'alert-triangle', label: 'Warning' },
    CAUTION: { cls: 'caution', icon: 'octagon-alert', label: 'Caution' }
  };

  function processCallouts(html) {
    return html.replace(
      /<blockquote>\s*<p>\[!(NOTE|TIP|WARNING|CAUTION)\](?:<br\s*\/?>|\s)*([\s\S]*?)<\/blockquote>/gi,
      (_, rawType, bodyHtml) => {
        const meta = CALLOUT_META[rawType.toUpperCase()];
        const cleaned = bodyHtml.trim();
        const inner = cleaned.startsWith('<p>') ? cleaned : `<p>${cleaned}`;
        return `<div class="callout ${meta.cls}"><div class="callout-title"><i data-lucide="${meta.icon}"></i><span>${meta.label}</span></div>${inner}</div>`;
      }
    );
  }

  // Update Stats (Word & Character Count)
  function updateStats(text) {
    const chars = text.length;
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    wordCountEl.textContent = `${words.toLocaleString()} words`;
    charCountEl.textContent = `${chars.toLocaleString()} chars`;
  }

  // Render Mermaid diagrams asynchronously into crisp vector SVGs
  let currentRenderVersion = 0;

  function sanitizeMermaidSource(source) {
    const trimmed = source.trimStart();
    if (/^sequenceDiagram\b/i.test(trimmed)) {
      // Mermaid v10 treats ';' as a statement separator in sequenceDiagram;
      // replace ';' inside message/note text (after ':') so valid prose like "a; b" parses cleanly.
      return source.split(/\r?\n/).map(line => {
        if (/^\s*%%/.test(line)) return line;
        const colonIdx = line.indexOf(':');
        if (colonIdx === -1) return line;
        return line.slice(0, colonIdx + 1) + line.slice(colonIdx + 1).replace(/;/g, ',');
      }).join('\n');
    }
    if (/^(flowchart|graph)\b/i.test(trimmed)) {
      return source.replace(/<br\s*\/?>/gi, '\\n');
    }
    return source;
  }

  async function renderMermaidDiagrams(version) {
    const targets = documentContainer.querySelectorAll('.mermaid-diagram[data-mermaid]');
    if (!targets.length) return;

    if (!window.mermaid) {
      targets.forEach(el => {
        const src = decodeURIComponent(el.getAttribute('data-mermaid') || '');
        el.innerHTML = `<div class="mermaid-error"><strong>Diagram engine unavailable offline</strong><pre>${escapeHtml(src)}</pre></div>`;
      });
      return;
    }

    for (let i = 0; i < targets.length; i++) {
      if (version !== currentRenderVersion) return;
      const el = targets[i];
      const rawSource = decodeURIComponent(el.getAttribute('data-mermaid') || '');
      const cleanSource = sanitizeMermaidSource(rawSource);
      const diagramId = `mmd_${version}_${i}`;

      try {
        const { svg } = await window.mermaid.render(diagramId, cleanSource, mermaidSandbox);
        if (version !== currentRenderVersion) return;
        el.innerHTML = svg;
        el.removeAttribute('data-mermaid');

        const svgEl = el.querySelector('svg');
        if (svgEl) {
          if (!svgEl.getAttribute('viewBox')) {
            const w = parseFloat(svgEl.getAttribute('width')) || svgEl.getBoundingClientRect().width;
            const h = parseFloat(svgEl.getAttribute('height')) || svgEl.getBoundingClientRect().height;
            if (w && h) svgEl.setAttribute('viewBox', `0 0 ${w} ${h}`);
          }
          svgEl.removeAttribute('style');
          svgEl.style.maxWidth = '100%';
          svgEl.style.height = 'auto';
          svgEl.style.display = 'block';
          svgEl.style.margin = '0 auto';
        }
      } catch (err) {
        console.warn('Mermaid syntax notice:', err);
        const stray = document.getElementById('d' + diagramId);
        if (stray) stray.remove();
        const straySvg = document.getElementById(diagramId);
        if (straySvg && !el.contains(straySvg)) straySvg.remove();
        el.innerHTML = `<div class="mermaid-error"><strong>Mermaid syntax notice:</strong> ${escapeHtml(err.message || String(err))}<pre>${escapeHtml(rawSource)}</pre></div>`;
      } finally {
        if (mermaidSandbox) mermaidSandbox.innerHTML = '';
      }
    }
  }

  // Render Multi-Sheet Document
  function renderDocument() {
    currentRenderVersion += 1;
    const renderVersion = currentRenderVersion;

    try {
      const rawMarkdown = markdownInput.value;

      localStorage.setItem('markpdf_content', rawMarkdown);
      updateStats(rawMarkdown);

      // Split markdown into pages on <!-- pagebreak -->
      const pageBreakRegex = /<!--\s*pagebreak\s*-->/gi;
      const pages = rawMarkdown.split(pageBreakRegex);

      const totalPages = pages.length;
      if (pageCountText) {
        pageCountText.textContent = `${totalPages} ${totalPages === 1 ? 'Page' : 'Pages'}`;
      }

      documentContainer.innerHTML = '';

      pages.forEach((pageMarkdown, index) => {
        let pageHtml = parseMarkdownWithMath(pageMarkdown.trim());
        pageHtml = processCallouts(pageHtml);

        const sheet = document.createElement('article');
        sheet.className = 'sheet-page';
        sheet.innerHTML = pageHtml;
        documentContainer.appendChild(sheet);

        if (index < pages.length - 1) {
          const divider = document.createElement('div');
          divider.className = 'page-divider no-print';
          divider.innerHTML = `
            <div class="divider-pill">
              <i data-lucide="scissors"></i> Page ${index + 2} Break
            </div>
          `;
          documentContainer.appendChild(divider);
        }
      });

      // Render KaTeX Math Equations inside all sheets
      if (window.renderMathInElement) {
        try {
          renderMathInElement(documentContainer, {
            delimiters: [
              { left: '$$', right: '$$', display: true },
              { left: '$', right: '$', display: false },
              { left: '\\(', right: '\\)', display: false },
              { left: '\\[', right: '\\]', display: true }
            ],
            throwOnError: false
          });
        } catch (mathErr) {
          console.warn('KaTeX render notice:', mathErr);
        }
      }

      attachCopyHandlers();

      if (window.lucide) {
        window.lucide.createIcons();
      }

      // Render Mermaid flowcharts / sequence / state diagrams
      renderMermaidDiagrams(renderVersion);
    } catch (renderError) {
      console.error('Render error:', renderError);
      documentContainer.innerHTML = `
        <div style="background: #1e293b; color: #f87171; padding: 1.5rem; border-radius: 8px; margin: 2rem;">
          <h3 style="margin-bottom: 0.5rem;">Rendering Notice</h3>
          <p>${escapeHtml(renderError.message)}</p>
        </div>
      `;
    }
  }

  // Attach clipboard copy events to code blocks
  function attachCopyHandlers() {
    documentContainer.querySelectorAll('.copy-code-btn').forEach(button => {
      button.addEventListener('click', () => {
        const pre = button.closest('.code-block-wrapper').querySelector('pre code');
        if (pre) {
          navigator.clipboard.writeText(pre.innerText).then(() => {
            button.innerHTML = '<i data-lucide="check"></i> Copied';
            if (window.lucide) window.lucide.createIcons();
            setTimeout(() => {
              button.innerHTML = '<i data-lucide="copy"></i> Copy code';
              if (window.lucide) window.lucide.createIcons();
            }, 1800);
          }).catch(() => { });
        }
      });
    });
  }

  // Keep native @page print size, margins, and dark background synchronized
  const MARGIN_MM = { 'margin-compact': 15, 'margin-normal': 22, 'margin-relaxed': 30 };

  function updatePrintStyle() {
    if (!dynamicPrintStyle) return;
    const size = pageSizeSelect.value === 'letter' ? 'letter portrait' : 'A4 portrait';
    const marginMm = MARGIN_MM[marginsSelect.value] || 22;
    const isDark = document.body.classList.contains('theme-dark');

    if (isDark) {
      dynamicPrintStyle.textContent = `
        @media print {
          @page { size: ${size}; margin: 0; }
          html, body, .app-shell, .preview-pane, .preview-scroll-wrapper, .document-container {
            background: #1e293b !important;
            color: #e2e8f0 !important;
          }
          .sheet-page {
            background: #1e293b !important;
            padding: ${marginMm}mm !important;
          }
        }
      `;
    } else {
      dynamicPrintStyle.textContent = `@media print { @page { size: ${size}; margin: ${marginMm}mm; } }`;
    }
  }

  // Debounced input handler for fluid typing performance
  let debounceTimeout = null;
  markdownInput.addEventListener('input', () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(renderDocument, 40);
  });

  // Theme Switcher & Quick Dark Slate Toggle
  let lastLightTheme = 'theme-modern';

  function applyTheme(selectedTheme, shouldRender = true) {
    if (selectedTheme !== 'theme-dark') {
      lastLightTheme = selectedTheme;
    }
    themeSelect.value = selectedTheme;
    document.body.className = selectedTheme;
    localStorage.setItem('markpdf_theme', selectedTheme);

    if (quickDarkToggle) {
      const isDark = selectedTheme === 'theme-dark';
      quickDarkToggle.classList.toggle('active', isDark);
      quickDarkToggle.innerHTML = isDark ? '<i data-lucide="sun"></i>' : '<i data-lucide="moon"></i>';
      quickDarkToggle.title = isDark ? 'Switch back to light theme' : 'Switch to Dark Slate theme (preview & PDF)';
      if (window.lucide) window.lucide.createIcons();
    }

    configureMermaidForTheme(selectedTheme);
    updatePrintStyle();
    if (shouldRender) renderDocument();
    scheduleFit();
  }

  themeSelect.addEventListener('change', (e) => applyTheme(e.target.value, true));

  if (quickDarkToggle) {
    quickDarkToggle.addEventListener('click', () => {
      const next = document.body.classList.contains('theme-dark') ? lastLightTheme : 'theme-dark';
      applyTheme(next, true);
    });
  }

  // Page Size Switcher (A4 vs US Letter)
  pageSizeSelect.addEventListener('change', (e) => {
    const size = e.target.value;
    documentContainer.classList.remove('page-a4', 'page-letter');
    documentContainer.classList.add(`page-${size}`);
    localStorage.setItem('markpdf_pagesize', size);
    updatePrintStyle();
    scheduleFit();
  });

  // Margin Switcher
  marginsSelect.addEventListener('change', (e) => {
    const margin = e.target.value;
    documentContainer.classList.remove('margin-normal', 'margin-compact', 'margin-relaxed');
    documentContainer.classList.add(margin);
    localStorage.setItem('markpdf_margin', margin);
    updatePrintStyle();
  });

  // Template Loader (resets select after loading so user can re-load same template anytime)
  templateSelect.addEventListener('change', (e) => {
    const templateKey = e.target.value;
    if (TEMPLATES[templateKey]) {
      markdownInput.value = TEMPLATES[templateKey];
      renderDocument();
      showToast(`Loaded "${e.target.options[e.target.selectedIndex].text}" template`);
      templateSelect.selectedIndex = 0;
    }
  });

  // Code Dropdown Toggle
  codeDropdownBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    codeDropdownMenu.classList.toggle('show');
  });

  document.addEventListener('click', () => {
    codeDropdownMenu.classList.remove('show');
  });

  // Code Inserters (JS, JSON, BASH, SQL, PYTHON)
  document.querySelectorAll('.dropdown-item[data-code]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const codeType = item.getAttribute('data-code');
      insertCodeBlock(codeType);
      codeDropdownMenu.classList.remove('show');
    });
  });

  function insertCodeBlock(type) {
    let snippet = '';
    switch (type) {
      case 'json':
        snippet = `\n\`\`\`json\n{\n  "service": "cache-service",\n  "status": "healthy",\n  "connections": 1024,\n  "retryAttempts": 3\n}\n\`\`\`\n`;
        break;
      case 'bash':
        snippet = `\n\`\`\`bash\n# Run service health check and start cluster\ncurl -X GET http://localhost:8080/health\nquantum-cli cluster start --nodes=3\n\`\`\`\n`;
        break;
      case 'sql':
        snippet = `\n\`\`\`sql\nSELECT user_id, email, count(orders.id) AS total_orders\nFROM users\nJOIN orders ON users.id = orders.user_id\nWHERE orders.created_at >= '2026-01-01'\nGROUP BY user_id, email;\n\`\`\`\n`;
        break;
      case 'python':
        snippet = `\n\`\`\`python\ndef calculate_throughput(records, time_elapsed_sec):\n    """Calculates processed items per second."""\n    return round(len(records) / time_elapsed_sec, 2)\n\`\`\`\n`;
        break;
      case 'mermaid':
        snippet = `\n\`\`\`mermaid\nsequenceDiagram\n    participant C as Client\n    participant GW as API Gateway\n    participant S as Service\n    C->>GW: POST /api/v1/resource\n    GW->>S: Forward request\n    S-->>C: 201 Created\n\`\`\`\n`;
        break;
      case 'js':
      default:
        snippet = `\n\`\`\`typescript\ninterface CacheConfig {\n  host: string;\n  port: number;\n  maxRetries: number;\n}\n\nexport function connect(config: CacheConfig): void {\n  console.log(\`Connected to \${config.host}:\${config.port}\`);\n}\n\`\`\`\n`;
        break;
    }

    const start = markdownInput.selectionStart;
    const end = markdownInput.selectionEnd;
    markdownInput.setRangeText(snippet, start, end, 'end');
    markdownInput.focus();
    renderDocument();
  }

  // Editor Toolbar Actions
  document.querySelectorAll('.tool-btn[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.getAttribute('data-action');
      insertMarkdownSyntax(action);
    });
  });

  function insertMarkdownSyntax(action) {
    const start = markdownInput.selectionStart;
    const end = markdownInput.selectionEnd;
    const text = markdownInput.value;
    const selection = text.substring(start, end);

    let replacement = '';

    switch (action) {
      case 'h1':
        replacement = `# ${selection || 'Heading 1'}`;
        break;
      case 'h2':
        replacement = `## ${selection || 'Heading 2'}`;
        break;
      case 'bold':
        replacement = `**${selection || 'bold text'}**`;
        break;
      case 'italic':
        replacement = `*${selection || 'italic text'}*`;
        break;
      case 'table':
        replacement = `\n| Column 1 | Column 2 | Column 3 |\n| :--- | :--- | :--- |\n| Item A | Description 1 | $100 |\n| Item B | Description 2 | $250 |\n`;
        break;
      case 'quote':
        replacement = `> ${selection || 'Important quote or emphasis'}`;
        break;
      case 'callout':
        replacement = `> [!NOTE]\n> ${selection || 'Enter important notification or callout text here.'}`;
        break;
      case 'pagebreak':
        replacement = `\n<!-- pagebreak -->\n`;
        break;
      default:
        return;
    }

    markdownInput.setRangeText(replacement, start, end, 'end');
    markdownInput.focus();
    renderDocument();
  }

  // Keyboard Shortcuts (Ctrl+B, Ctrl+I, Ctrl+P, Ctrl+S, Tab)
  markdownInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      insertMarkdownSyntax('bold');
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      insertMarkdownSyntax('italic');
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
      e.preventDefault();
      triggerPrint();
    } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      downloadPdf();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const start = markdownInput.selectionStart;
      const end = markdownInput.selectionEnd;
      markdownInput.setRangeText('  ', start, end, 'end');
      renderDocument();
    }
  });

  // Print / PDF Export
  function triggerPrint() {
    updatePrintStyle();
    window.print();
  }

  printBtn.addEventListener('click', triggerPrint);
  floatingPrintBtn.addEventListener('click', () => downloadPdf());

  // ======================================================
  // Toast helper
  // ======================================================
  let toastTimer = null;
  function showToast(message, ms = 2600) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms);
  }

  // ======================================================
  // Draggable pane resizer
  // ======================================================
  const workspace = document.querySelector('.studio-workspace');
  const editorPane = document.querySelector('.editor-pane');
  const paneResizer = document.getElementById('paneResizer');
  const DEFAULT_EDITOR_PCT = 45;

  function setEditorWidth(pct) {
    const clamped = Math.min(80, Math.max(15, pct));
    editorPane.style.flexBasis = `${clamped}%`;
    localStorage.setItem('markpdf_editor_pct', String(clamped));
    scheduleFit();
  }

  paneResizer.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    paneResizer.setPointerCapture(e.pointerId);
    paneResizer.classList.add('dragging');
    document.body.classList.add('is-resizing');

    const onMove = (ev) => {
      const rect = workspace.getBoundingClientRect();
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setEditorWidth(pct);
    };
    const onUp = () => {
      paneResizer.classList.remove('dragging');
      document.body.classList.remove('is-resizing');
      paneResizer.removeEventListener('pointermove', onMove);
      paneResizer.removeEventListener('pointerup', onUp);
      paneResizer.removeEventListener('pointercancel', onUp);
    };
    paneResizer.addEventListener('pointermove', onMove);
    paneResizer.addEventListener('pointerup', onUp);
    paneResizer.addEventListener('pointercancel', onUp);
  });

  paneResizer.addEventListener('dblclick', () => setEditorWidth(DEFAULT_EDITOR_PCT));

  // ======================================================
  // Layout toggle: editor only / split / preview only
  // ======================================================
  const layoutButtons = document.querySelectorAll('.seg-btn[data-layout]');
  function setLayout(layout) {
    const valid = ['editor', 'split', 'preview'].includes(layout) ? layout : 'split';
    workspace.classList.remove('layout-editor', 'layout-split', 'layout-preview');
    workspace.classList.add(`layout-${valid}`);
    layoutButtons.forEach(b => b.classList.toggle('active', b.dataset.layout === valid));
    localStorage.setItem('markpdf_layout', valid);
    scheduleFit();
  }
  layoutButtons.forEach(btn => btn.addEventListener('click', () => setLayout(btn.dataset.layout)));

  // ======================================================
  // Preview zoom (Fit to width by default)
  // ======================================================
  const zoomInBtn = document.getElementById('zoomInBtn');
  const zoomOutBtn = document.getElementById('zoomOutBtn');
  const zoomFitBtn = document.getElementById('zoomFitBtn');
  let zoomMode = 'fit';
  let zoomLevel = 1;

  function sheetWidthPx() {
    const mm = documentContainer.classList.contains('page-letter') ? 215.9 : 210;
    return mm * 96 / 25.4;
  }

  function applyZoom(level) {
    zoomLevel = Math.min(2, Math.max(0.3, level));
    documentContainer.style.zoom = zoomLevel;
    zoomFitBtn.textContent = zoomMode === 'fit' ? 'Fit' : `${Math.round(zoomLevel * 100)}%`;
    zoomFitBtn.classList.toggle('active', zoomMode === 'fit');
  }

  function fitToWidth() {
    const available = previewScrollWrapper.clientWidth - 40;
    if (available <= 0) return;
    applyZoom(Math.min(1, available / sheetWidthPx()));
  }

  let fitRaf = null;
  function scheduleFit() {
    if (zoomMode !== 'fit') return;
    cancelAnimationFrame(fitRaf);
    fitRaf = requestAnimationFrame(fitToWidth);
  }

  zoomFitBtn.addEventListener('click', () => { zoomMode = 'fit'; fitToWidth(); });
  zoomInBtn.addEventListener('click', () => { zoomMode = 'manual'; applyZoom(zoomLevel + 0.1); });
  zoomOutBtn.addEventListener('click', () => { zoomMode = 'manual'; applyZoom(zoomLevel - 0.1); });

  if (window.ResizeObserver) {
    new ResizeObserver(scheduleFit).observe(previewScrollWrapper);
  } else {
    window.addEventListener('resize', scheduleFit);
  }

  // ======================================================
  // Direct PDF Download (html2pdf.js)
  // ======================================================
  function getDocumentFilename() {
    const firstH1 = documentContainer.querySelector('h1');
    const base = (firstH1 ? firstH1.textContent : 'document')
      .trim()
      .replace(/[\\/:*?"<>|]+/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 60) || 'document';
    return `${base}.pdf`;
  }

  async function downloadPdf() {
    if (typeof window.html2pdf === 'undefined') {
      showToast('PDF library unavailable offline. Opening Print dialog instead.');
      triggerPrint();
      return;
    }

    const isLetter = documentContainer.classList.contains('page-letter');
    const pageWidthMm = isLetter ? 215.9 : 210;
    const marginClass = Object.keys(MARGIN_MM).find(c => documentContainer.classList.contains(c)) || 'margin-normal';
    const marginMm = MARGIN_MM[marginClass];

    // Ensure any pending Mermaid diagrams have finished rendering
    await renderMermaidDiagrams(currentRenderVersion);

    // Preserve active document theme class so all fonts, borders, and colors render accurately
    const isDarkTheme = document.body.classList.contains('theme-dark');
    const sheetBg = isDarkTheme ? '#1e293b' : '#ffffff';
    const contentWidthMm = pageWidthMm - marginMm * 2;
    const contentWidthPx = contentWidthMm * 96 / 25.4;
    const exportRoot = document.createElement('div');
    exportRoot.className = document.body.className;
    exportRoot.style.width = `${contentWidthMm}mm`;
    exportRoot.style.background = sheetBg;

    const sheets = documentContainer.querySelectorAll('.sheet-page');
    sheets.forEach((sheet, i) => {
      const clone = sheet.cloneNode(true);
      clone.querySelectorAll('.copy-code-btn').forEach(b => b.remove());
      Object.assign(clone.style, {
        width: '100%',
        minHeight: '0',
        padding: '0',
        margin: '0',
        background: sheetBg,
        boxShadow: 'none',
        borderRadius: '0'
      });
      clone.querySelectorAll('.code-block-wrapper pre').forEach(pre => {
        pre.style.whiteSpace = 'pre-wrap';
        pre.style.wordBreak = 'break-word';
        pre.style.overflowWrap = 'anywhere';
        pre.style.overflow = 'visible';
      });
      // Set explicit pixel dimensions on Mermaid SVGs so html2canvas renders them crisply
      clone.querySelectorAll('.mermaid-diagram svg').forEach(svg => {
        const vb = svg.getAttribute('viewBox');
        if (vb) {
          const parts = vb.trim().split(/[\s,]+/).map(Number);
          if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
            const targetW = Math.min(parts[2], contentWidthPx - 28);
            const targetH = Math.round(targetW * (parts[3] / parts[2]));
            svg.setAttribute('width', `${Math.round(targetW)}`);
            svg.setAttribute('height', `${targetH}`);
            svg.style.width = `${Math.round(targetW)}px`;
            svg.style.height = `${targetH}px`;
          }
        }
      });
      exportRoot.appendChild(clone);
      if (i < sheets.length - 1) {
        const br = document.createElement('div');
        br.className = 'html2pdf__page-break';
        exportRoot.appendChild(br);
      }
    });

    const originalLabel = downloadPdfBtn.innerHTML;
    downloadPdfBtn.disabled = true;
    downloadPdfBtn.innerHTML = '<i data-lucide="loader-2"></i><span>Generating...</span>';
    if (window.lucide) window.lucide.createIcons();

    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      const filename = getDocumentFilename();
      const worker = window.html2pdf()
        .set({
          margin: marginMm,
          filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: sheetBg, letterRendering: true },
          jsPDF: { unit: 'mm', format: isLetter ? 'letter' : 'a4', orientation: 'portrait' },
          pagebreak: {
            mode: ['css', 'legacy'],
            avoid: ['.code-block-wrapper', '.mermaid-block', 'table', 'tr', '.callout', 'blockquote', 'h1', 'h2', 'h3', 'img', '.katex-display']
          }
        })
        .from(exportRoot)
        .toPdf();

      if (isDarkTheme) {
        const canvas = await worker.get('canvas');
        const pdf = await worker.get('pdf');
        const total = pdf.internal.getNumberOfPages();
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const innerW = pageW - marginMm * 2;
        const innerH = pageH - marginMm * 2;
        const totalImgH = canvas ? (canvas.height / canvas.width) * innerW : total * innerH;

        for (let p = 1; p <= total; p++) {
          pdf.setPage(p);
          pdf.setFillColor(30, 41, 59); // #1e293b greyish slate fill
          pdf.rect(0, 0, pageW, marginMm + 0.5, 'F');
          pdf.rect(0, pageH - marginMm - 0.5, pageW, marginMm + 0.5, 'F');
          pdf.rect(0, 0, marginMm + 0.5, pageH, 'F');
          pdf.rect(pageW - marginMm - 0.5, 0, marginMm + 0.5, pageH, 'F');

          if (p === total && canvas) {
            const usedH = Math.max(0, Math.min(innerH, totalImgH - (total - 1) * innerH));
            const fillY = marginMm + usedH - 0.5;
            if (fillY < pageH) {
              pdf.rect(0, fillY, pageW, pageH - fillY, 'F');
            }
          }
        }
      }

      await worker.save();
      showToast(`Downloaded ${filename}`);
    } catch (err) {
      console.error('PDF generation failed:', err);
      showToast('PDF generation failed - falling back to Print dialog.');
      triggerPrint();
    } finally {
      downloadPdfBtn.disabled = false;
      downloadPdfBtn.innerHTML = originalLabel;
      if (window.lucide) window.lucide.createIcons();
    }
  }

  downloadPdfBtn.addEventListener('click', () => downloadPdf());

  // Export Markdown File
  exportMdBtn.addEventListener('click', () => {
    const text = markdownInput.value;
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `document-${new Date().toISOString().slice(0, 10)}.md`;
    link.click();
    URL.revokeObjectURL(url);
  });

  // Import Markdown File
  importBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      markdownInput.value = event.target.result;
      renderDocument();
      fileInput.value = '';
    };
    reader.readAsText(file);
  });

  // Clear / Reset Editor
  clearBtn.addEventListener('click', () => {
    if (confirm('Clear the entire editor?')) {
      markdownInput.value = '';
      renderDocument();
    }
  });

  // Restore saved state or initialize with default template
  function initializeApp() {
    const savedContent = localStorage.getItem('markpdf_content');
    const savedTheme = localStorage.getItem('markpdf_theme') || 'theme-modern';
    const savedPageSize = localStorage.getItem('markpdf_pagesize') || 'a4';
    const savedMargin = localStorage.getItem('markpdf_margin') || 'margin-normal';

    pageSizeSelect.value = savedPageSize;
    documentContainer.classList.add(`page-${savedPageSize}`);

    marginsSelect.value = savedMargin;
    documentContainer.classList.add(savedMargin);

    applyTheme(savedTheme, false);

    if (savedContent && savedContent.trim() !== '') {
      markdownInput.value = savedContent;
    } else {
      markdownInput.value = TEMPLATES['tech-spec'];
    }

    renderDocument();

    // Restore pane width & always default to split if layout wasn't explicitly preview
    const savedPct = parseFloat(localStorage.getItem('markpdf_editor_pct'));
    if (!isNaN(savedPct)) editorPane.style.flexBasis = `${savedPct}%`;
    const savedLayout = localStorage.getItem('markpdf_layout');
    setLayout(savedLayout || 'split');
    scheduleFit();
  }

  initializeApp();
});
