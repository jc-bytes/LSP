/* Presentation only. Authentication, recording, and persistence stay in their runtimes. */
(() => {
  const pending = [];
  const config = () => window.__BUILDER_NAVIGATION__;
  const practiceCache = new Map();
  const formatDate = value => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Fecha no disponible' : new Intl.DateTimeFormat('es-PA', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Panama' }).format(date);
  };
  const referenceReady = record => {
    let ref = record.mediapipe_reference;
    if (typeof ref === 'string') { try { ref = JSON.parse(ref); } catch { ref = null; } }
    return !!([2, 4].includes(ref?.version) && (Array.isArray(ref.landmarkFrames) && ref.landmarkFrames.length >= 4 || Array.isArray(ref.frames) && ref.frames.length >= 4) || /^https?:\/\//.test(record.media_url || ''));
  };
  const isComparisonReady = detail => detail?.sourceId === "js-lab" && Number.isFinite(detail.value?.score_overall);
  const practiceHref = id => 'detalle.html?context-record=' + encodeURIComponent(JSON.stringify({ dataSourceId: 'supabase-table_practices', recordId: String(id) }));
  async function getPractice(id) {
    if (!id) return null;
    if (!practiceCache.has(id)) {
      const auth = config()?.authentication;
      if (!auth) return null;
      const url = new URL(auth.projectUrl + '/rest/v1/practices');
      url.searchParams.set('select', 'id,title,media_url');
      url.searchParams.set('id', 'eq.' + id);
      practiceCache.set(id, fetch(url, { headers: { apikey: auth.publishableKey } }).then(async r => r.ok ? (await r.json())[0] || null : null).catch(() => null));
    }
    return practiceCache.get(id);
  }
  function link(text, href) {
    const el = document.createElement('a'); el.className = 'button secondary'; el.textContent = text; el.href = href; return el;
  }
  function decorateRecord(root, record, mediaUrl) {
    if (!root.isConnected || root.dataset.lspDecorated) return;
    root.dataset.lspDecorated = 'true';
    root.querySelectorAll('[data-builder-bind-field="created_at"]').forEach(el => { el.textContent = formatDate(record.created_at); });
    if (root.matches('.catalog-card')) {
      const image = document.createElement(mediaUrl ? 'video' : 'div');
      image.className = 'practice-thumbnail';
      if (mediaUrl) { image.src = mediaUrl; image.muted = true; image.playsInline = true; image.preload = 'metadata'; image.setAttribute('aria-hidden', 'true'); image.addEventListener('loadedmetadata', () => { if (Number.isFinite(image.duration) && image.duration > 0) image.currentTime = Math.min(0.1, image.duration / 2); }, { once: true }); image.addEventListener('error', () => { const fallback = document.createElement('div'); fallback.className = 'practice-thumbnail'; fallback.textContent = 'LSP'; fallback.setAttribute('aria-hidden', 'true'); image.replaceWith(fallback); }, { once: true }); }
      else { image.textContent = 'LSP'; image.setAttribute('aria-hidden', 'true'); }
      root.prepend(image);
      const description = root.querySelector('p');
      if (description && description.textContent.trim().toLowerCase() === (record.title || '').trim().toLowerCase()) description.textContent = 'Observa la demostración y practica esta seña.';
      const button = root.querySelector('button'); if (button) button.setAttribute('aria-label', 'Practicar ' + record.title);
      // The button is the single keyboard and pointer action for the card.
      root.removeAttribute('data-builder-flow-action'); root.removeAttribute('data-builder-flow-target');
    }
    if (root.matches('.teacher-practice-card')) {
      const status = document.createElement('div'); status.className = 'practice-status';
      const badge = document.createElement('span'); badge.className = 'pill'; badge.textContent = record.published ? 'Publicada' : 'Borrador';
      const ready = document.createElement('small'); ready.textContent = referenceReady(record) ? 'Referencia disponible' : 'Falta preparar la referencia';
      status.append(badge, ready); root.prepend(status);
      if (record.published) root.append(link('Ver práctica', practiceHref(record.id)));
    }
    if (root.matches('.progress-card,.home-activity')) {
      const title = root.matches('.home-activity') ? root.querySelector('div:nth-child(2)>strong') : root.querySelector('div>strong');
      if (title) title.textContent = 'Cargando nombre de la seña…';
      getPractice(record.practice_id).then(practice => {
        if (title) title.textContent = practice?.title || 'Práctica no disponible';
        if (practice && root.isConnected) root.append(link('Practicar de nuevo', practiceHref(practice.id)));
      });
    }
  }
  document.addEventListener('lsp:record-rendered', event => {
    if (document.readyState === 'loading') pending.push([event.target, event.detail.record, event.detail.mediaUrl]);
    else decorateRecord(event.target, event.detail.record, event.detail.mediaUrl);
  });
  document.addEventListener('DOMContentLoaded', () => {
    pending.forEach(args => decorateRecord(...args));
    const homeActions = document.querySelector('.home-actions');
    const welcome = document.querySelector('.home-welcome');
    if (homeActions && welcome) welcome.append(homeActions);
    const practice = document.querySelector('.page-detalle');
    if (practice) {
      const score = practice.querySelector('.score-section');
      const save = practice.querySelector('.save-attempt-card');
      if (score) score.hidden = true;
      if (save) save.classList.add('awaiting-comparison');
      const motion = practice.querySelector('[data-motion-activity]');
      if (motion) {
        const toolbar = document.createElement('label'); toolbar.className = 'landmark-choice';
        const check = document.createElement('input'); check.type = 'checkbox';
        toolbar.append(check, document.createTextNode('Mostrar guía de movimiento'));
        motion.append(toolbar);
        check.addEventListener('change', () => practice.classList.toggle('show-landmarks', check.checked));
        motion.addEventListener('motion:analysis', () => { if (score) score.hidden = true; });
        motion.addEventListener('motion:error', () => { if (score) score.hidden = true; });
      }
      // A populated score reveals results; failed or missing comparisons keep the explanation visible.
      document.addEventListener('builder:runtime-value', event => {
        if (isComparisonReady(event.detail) && score) score.hidden = false;
      });
      if (save) {
        const button = save.querySelector('[data-save-attempt]');
        const observer = new MutationObserver(() => { save.classList.toggle('awaiting-comparison', !button || button.disabled); });
        if (button) observer.observe(button, { attributes: true, attributeFilter: ['disabled'] });
      }
    }
    const editor = document.querySelector('.page-editor-practica');
    if (editor) {
      const area = editor.querySelector('.motion-stage-editor');
      if (area) {
        const details = document.createElement('details'); details.className = 'advanced-options';
        const summary = document.createElement('summary'); summary.textContent = 'Opciones avanzadas · etapas del movimiento';
        area.before(details); details.append(summary, area);
      }
    }
  });
  window.LspPresentation = { formatDate, referenceReady, practiceHref, isComparisonReady };
})();
