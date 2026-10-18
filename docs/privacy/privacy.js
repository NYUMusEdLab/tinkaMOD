/* Local, optional analytics preferences. No third-party code runs before opt-in. */
'use strict';
(() => {
  // One owner per document, even if a template includes this file twice.
  if (window.musedlabReachPreferences) return;
  window.musedlabReachPreferences = true;
  const key = 'musedlab.privacy.v1';
  const tag = document.querySelector('meta[name="musedlab-analytics"]');
  const id = tag && tag.content;
  const meta = name => document.querySelector('meta[name="' + name + '"]')?.content || '';
  const publicLocation = meta('musedlab-analytics-page');
  const publicTitle = meta('musedlab-analytics-title');
  // Only static, reviewed production page metadata is eligible. Never infer a
  // location/title from URLs, activity names, the editor, or a participant record.
  const configured = /^G-[A-Z0-9]+$/.test(id || '') &&
    /^https:\/\/[^?#]+$/.test(publicLocation) && Boolean(publicTitle);
  const zh = /^zh/i.test(document.documentElement.lang) || new URLSearchParams(location.search).get('lang') === 'zh';
  const label = (en, cn) => zh ? cn : en;
  let panel = document.querySelector('#privacy-panel');
  let open = document.querySelector('#privacy-preferences');
  const toolControls = !panel || !open;
  if (!panel || !open) {
    open = document.createElement('button');
    open.id = 'privacy-preferences'; open.type = 'button';
    open.textContent = label('Privacy preferences', '隐私设置');
    open.setAttribute('aria-controls', 'privacy-panel');
    panel = document.createElement('section'); panel.id = 'privacy-panel';
    panel.setAttribute('aria-labelledby', 'privacy-title');
    panel.innerHTML = '<h2 id="privacy-title"></h2><p data-privacy-description></p><p data-privacy-status role="status"></p><div class="privacy-actions"><button type="button" data-privacy-reject></button><button type="button" data-privacy-accept></button><button type="button" data-privacy-close></button></div>';
    panel.querySelector('#privacy-title').textContent = label('Optional analytics', '可选访问统计');
    panel.querySelector('[data-privacy-description]').textContent = label('Allow Google Analytics to measure visits, approximate region, device type, and time spent? Names, recordings, text you enter, and your creative work are not included. You can use the tools with analytics off and change this choice here.', '是否允许 Google Analytics 统计访问次数、大致地区、设备类型和使用时长？姓名、录音、输入的文字和创作内容不包含在统计中。关闭统计也可以使用工具，并可随时在此更改选择。');
    panel.querySelector('[data-privacy-accept]').textContent = label('Accept analytics', '允许统计');
    panel.querySelector('[data-privacy-close]').textContent = label('Close', '关闭');
    document.body.appendChild(panel);
    document.body.appendChild(open);
  }
  let choice = null, loaded = false, previousFocus = null;
  try { const stored = localStorage.getItem(key); if (stored === 'accepted' || stored === 'rejected' || stored === 'dismissed') choice = stored; } catch (_) {}
  const status = panel.querySelector('[data-privacy-status]');
  function describe(extra = '') {
    panel.querySelector('[data-privacy-reject]').textContent = choice === 'accepted' ? label('Withdraw analytics', '撤回统计许可') : label('Reject analytics', '拒绝统计');
    status.textContent = (choice === 'accepted' ? label('Optional analytics are accepted.', '已允许可选访问统计。') : label('Optional analytics are off.', '可选访问统计已关闭。')) + extra;
  }
  const queue = function () { window.musedlabReachLayer.push(arguments); };
  function analytics() {
    if (!configured || choice !== 'accepted') return;
    window['ga-disable-' + id] = false;
    if (loaded) {
      queue('consent', 'update', {analytics_storage: 'granted'});
      return;
    }
    loaded = true;
    // A dedicated queue keeps legacy app event helpers separate from reach data.
    window.musedlabReachLayer = [];
    queue('consent', 'default', {analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'});
    queue('js', new Date());
    const page = {page_location: publicLocation, page_title: publicTitle, page_referrer: ''};
    queue('set', page);
    queue('config', id, {...page, send_page_view: false,
      allow_google_signals: false, allow_ad_personalization_signals: false,
      cookie_domain: 'none', cookie_expires: 15552000, cookie_flags: 'SameSite=Lax;Secure',
      ignore_referrer: true, campaign_id: '', campaign_name: '', campaign_source: '',
      campaign_medium: '', campaign_term: '', campaign_content: ''});
    queue('event', 'page_view', {...page, send_to: id});
    const script = document.createElement('script');
    script.id = 'optional-analytics'; script.async = true;
    script.referrerPolicy = 'no-referrer';
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id) + '&l=musedlabReachLayer';
    document.head.appendChild(script);
  }
  function clearAnalyticsCookies() {
    const parts = location.hostname.split('.');
    const domains = [''];
    for (let i = 0; i < parts.length - 1; i++) domains.push(parts.slice(i).join('.'), '.' + parts.slice(i).join('.'));
    const paths = ['/'];
    const segments = location.pathname.split('/');
    for (let i = 1; i < segments.length; i++) paths.push(segments.slice(0, i).join('/') || '/');
    document.cookie.split(';').forEach(cookie => {
      const name = cookie.split('=')[0].trim();
      if (!/^(_ga($|_)|_gid$|_gat)/.test(name)) return;
      domains.forEach(domain => paths.forEach(path => { document.cookie = name + '=; Max-Age=0; path=' + path + (domain ? '; domain=' + domain : '') + '; SameSite=Lax'; }));
    });
  }
  function resetEmbeds() {
    document.querySelectorAll('[data-embed]').forEach(box => {
      const iframe = box.querySelector('iframe'); if (iframe) iframe.remove();
      box.querySelector('[data-load-embed]').hidden = false;
    });
  }
  function setChoice(next) {
    choice = next;
    let persisted = true;
    try { localStorage.setItem(key, next); } catch (_) { persisted = false; }
    if (next === 'accepted') analytics();
    else {
      if (id) window['ga-disable-' + id] = true;
      clearAnalyticsCookies(); resetEmbeds();
      // The GA disable switch stops subsequent measurement without reloading an
      // editor, interrupting audio, or discarding unsaved work.
    }
    describe(persisted ? '' : ' Your browser could not save this preference; it applies to this visit only.');
    if (persisted) { panel.hidden = true; open.setAttribute('aria-expanded', 'false'); if (previousFocus) previousFocus.focus(); }
  }
  let footer = document.querySelector('[data-privacy-footer]');
  if (!footer) {
    footer = document.createElement('div'); footer.className = 'privacy-footer';
    if (toolControls) footer.classList.add('privacy-tool-footer');
    document.body.appendChild(footer);
  }
  footer.appendChild(open);
  open.hidden = false;
  open.addEventListener('click', () => {
    previousFocus = open; panel.hidden = !panel.hidden;
    open.setAttribute('aria-expanded', String(!panel.hidden));
    if (!panel.hidden) { describe(); panel.querySelector('button').focus(); }
  });
  panel.querySelector('[data-privacy-accept]').addEventListener('click', () => setChoice('accepted'));
  panel.querySelector('[data-privacy-reject]').addEventListener('click', () => setChoice('rejected'));
  function dismiss() {
    if (choice === null) { choice = 'dismissed'; try { localStorage.setItem(key, choice); } catch (_) {} }
    panel.hidden = true; open.setAttribute('aria-expanded', 'false');
    if (previousFocus) open.focus();
  }
  panel.querySelector('[data-privacy-close]').addEventListener('click', dismiss);
  panel.addEventListener('keydown', event => {
    // Preference controls should not trigger the instrument's global shortcuts.
    event.stopPropagation();
    if (event.key === 'Escape') dismiss();
  });
  open.addEventListener('keydown', event => event.stopPropagation());
  document.querySelectorAll('[data-embed]').forEach(box => {
    const button = box.querySelector('[data-load-embed]'); button.hidden = false;
    button.addEventListener('click', () => {
      if (box.querySelector('iframe')) return;
      const iframe = document.createElement('iframe');
      iframe.title = box.dataset.title || 'Embedded content'; iframe.src = box.dataset.embed;
      iframe.allowFullscreen = true; iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.allow = 'fullscreen; picture-in-picture';
      box.insertBefore(iframe, box.firstChild); button.hidden = true;
      iframe.focus();
    });
  });
  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    choice = event.key !== null && event.newValue === 'accepted' ? 'accepted' : 'rejected';
    if (choice === 'accepted') analytics();
    else { if (id) window['ga-disable-' + id] = true; clearAnalyticsCookies(); resetEmbeds(); }
    describe();
  });
  describe(); panel.hidden = choice !== null || !configured;
  open.setAttribute('aria-expanded', String(!panel.hidden));
  if (choice === 'accepted') analytics(); else { if (id) window['ga-disable-' + id] = true; clearAnalyticsCookies(); }
})();
