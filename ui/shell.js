(() => {
  const toggle = document.querySelector('.lsp-menu-toggle');
  if (!toggle) return;
  const root = document.documentElement;
  const mobile = matchMedia('(max-width: 760px)');
  const sidebar = document.querySelector('.lsp-sidebar');
  const backdrop = document.querySelector('.lsp-drawer-backdrop');
  let collapsed = false;
  try { collapsed = localStorage.getItem('lsp.sidebar.collapsed') === 'true'; } catch {}
  let opened = false;
  function render() {
    root.classList.toggle('lsp-nav-collapsed', !mobile.matches && collapsed);
    root.classList.toggle('lsp-nav-open', mobile.matches && opened);
    sidebar.inert = mobile.matches && !opened;
    backdrop.hidden = !mobile.matches || !opened;
    toggle.setAttribute('aria-expanded', String(mobile.matches ? opened : !collapsed));
    const label = mobile.matches ? (opened ? 'Cerrar menú' : 'Abrir menú') : (collapsed ? 'Expandir menú' : 'Contraer menú');
    toggle.setAttribute('aria-label', label);
    toggle.title = label;
  }
  function close() { opened = false; render(); toggle.focus(); }
  toggle.addEventListener('click', () => {
    if (mobile.matches) opened = !opened;
    else { collapsed = !collapsed; try { localStorage.setItem('lsp.sidebar.collapsed', String(collapsed)); } catch {} }
    render();
  });
  backdrop.addEventListener('click', close);
  document.addEventListener('keydown', event => {
    if (!mobile.matches || !opened) return;
    if (event.key === 'Escape') close();
    if (event.key === 'Tab') {
      const items = [backdrop, ...sidebar.querySelectorAll('a')].filter(item => item.getClientRects().length);
      const index = items.indexOf(document.activeElement);
      if (event.shiftKey && index <= 0) { event.preventDefault(); items.at(-1).focus(); }
      else if (!event.shiftKey && (index === items.length - 1 || index === -1)) { event.preventDefault(); backdrop.focus(); }
    }
  });
  mobile.addEventListener('change', () => { opened = false; render(); });
  render();
})();
