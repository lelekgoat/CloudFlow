/* CloudFlow Chat-Widget
 * Einbindung auf der Kunden-Website (vor </body>):
 *   <script src="https://cloudflow.at/widget.js" data-company="KUNDEN-ID"></script>
 *
 * Optionale Einstellungen (alle als data-Attribute im <script>-Tag):
 *   data-name        Name des Assistenten            (Standard: "Chatbot")
 *   data-greeting    Begrüßungstext
 *   data-topics      Themen-Buttons: "Öffnungszeiten|Preise|Kontakt"
 *                    oder mit eigener Frage: "Preise=Was kostet das?|Kontakt=Wie kann ich euch erreichen?"
 *   data-primary     Hauptfarbe  (z. B. #09172E)
 *   data-accent      Akzentfarbe (z. B. #0071E3)
 *   data-chat        Chatfenster: c1 Klassisch | c2 Himmel | c3 Minimal | c4 Dunkel   (Standard: c2)
 *   data-launcher    Button: l1 Quadrat | l2 Rechteck+Text | l3 Rund | l4 Weiße Karte | l5 Verlauf (Standard: l1)
 *   data-launcher-text  Text im Button bei l2/l4
 *   data-logo        URL zu einem eigenen Logo (PNG/SVG)
 *   data-brand       Text in der Fußzeile ("Chatbot von ...", Standard: CloudFlow)
 */
(function(){
  'use strict';
  var currentScript = document.currentScript || (function(){
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();
  var _cid = currentScript.getAttribute('data-company') || '';
  var _started = false;
  var _ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrYm9ja2RyaHhtcHZ4dWdrbXJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxOTgzNjIsImV4cCI6MjEwMjc3NDM2Mn0.0AEyPvayW8NKlriAGz3zvDVsz2itHeVLQUO3ea6MDOE';
  function _go(R){ if(_started) return; _started = true; start(R || {}); }
  if(!_cid){ _go({}); return; }
  // Gespeichertes Design des Kunden laden (max. 2,5 s), data-Attribute im Script-Tag haben Vorrang
  setTimeout(function(){ _go({}); }, 2500);
  try{
    fetch('https://rkbockdrhxmpvxugkmrt.supabase.co/rest/v1/rpc/get_widget_config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': _ANON, 'Authorization': 'Bearer ' + _ANON },
      body: JSON.stringify({ company: _cid })
    }).then(function(r){ return r.ok ? r.json() : {}; }).then(function(j){ _go(j && typeof j === 'object' ? j : {}); }).catch(function(){ _go({}); });
  }catch(e){ _go({}); }

  function start(R){

  // ---------- Konfiguration ----------
  var FUNCTION_URL = 'https://rkbockdrhxmpvxugkmrt.supabase.co/functions/v1/chat';
  var ANON_KEY = _ANON;

  // ---------- Einstellungen aus dem <script>-Tag ----------
  function attr(n, d){
    var v = currentScript.getAttribute('data-' + n);
    if(v) return v;
    var k = n === 'launcher-text' ? 'launcherText' : n;
    return (R[k] && typeof R[k] === 'string') ? R[k] : d;
  }
  var COMPANY_ID = attr('company', '');
  var BOT_NAME   = attr('name', 'Chatbot');
  var GREETING   = attr('greeting', 'Hallo! 👋 Wie kann ich dir helfen?');
  var BRAND      = attr('brand', 'CloudFlow');
  var CHAT       = /^c[1-4]$/.test(attr('chat','')) ? attr('chat') : 'c2';
  var LAUNCHER   = /^l[1-5]$/.test(attr('launcher','')) ? attr('launcher') : 'l1';
  var LOGO_URL   = attr('logo', '');
  var PRIMARY    = /^#[0-9a-fA-F]{6}$/.test(attr('primary','')) ? attr('primary') : '#09172E';
  var ACCENT     = /^#[0-9a-fA-F]{6}$/.test(attr('accent','')) ? attr('accent') : '#0071E3';
  var LAUNCH_TXT = attr('launcher-text', LAUNCHER === 'l4' ? 'Chat' : 'Frag uns!');
  var TOPICS = attr('topics', 'Öffnungszeiten=Wie sind eure Öffnungszeiten?|Preise=Was kostet das?|Kontakt=Wie kann ich euch erreichen?')
    .split('|').map(function(t){ var p = t.split('='); return { label: p[0].trim(), q: (p[1] || p[0]).trim() }; })
    .filter(function(t){ return t.label; });

  if(!COMPANY_ID){
    console.error('CloudFlow Widget: data-company Attribut fehlt im <script>-Tag.');
    return;
  }

  function lum(hex){
    var c = [1,3,5].map(function(i){ return parseInt(hex.slice(i,i+2),16)/255; })
      .map(function(v){ return v <= .03928 ? v/12.92 : Math.pow((v+.055)/1.055, 2.4); });
    return .2126*c[0] + .7152*c[1] + .0722*c[2];
  }
  function onColor(hex){ return lum(hex) > .5 ? '#09172E' : '#FFFFFF'; }

  // ---------- Eigener Container mit Shadow DOM (isoliert vom Host-Styling) ----------
  var host = document.createElement('div');
  host.id = 'cloudflow-widget-host';
  document.body.appendChild(host);
  var shadow = host.attachShadow({ mode: 'open' });

  var styleEl = document.createElement('style');
  styleEl.textContent = `
    :host{all:initial;}
    /* ---------- CloudFlow Chat-Komponente (Fenster + Button) ---------- */
.cf-win,.cf-win *,.cf-fab,.cf-fab *{box-sizing:border-box;}
.cf-win{
  position:relative; width:400px; max-width:calc(100vw - 32px); height:620px; max-height:calc(100vh - 130px);
  display:flex; flex-direction:column; background:#fff; border:1px solid rgba(9,23,46,.14);
  box-shadow:0 40px 80px -24px rgba(9,23,46,.5); overflow:hidden; text-align:left; color:#161B26;
  font-family:'Open Sans','Segoe UI',Arial,sans-serif; font-size:16px; line-height:1.5;
}
.cf-hero{position:relative; flex-shrink:0; display:flex; flex-direction:column; align-items:center; text-align:center; padding:26px 20px 24px; overflow:hidden;}
.cf-hero > *{position:relative; z-index:1;}
.cf-close{position:absolute !important; top:12px; right:12px; width:34px; height:34px; border:0; cursor:pointer; background:rgba(255,255,255,.75); color:#09172E; font-size:1rem; display:flex; align-items:center; justify-content:center; font-family:inherit;}
.cf-close:hover{background:#fff;}
.cf-logo{width:58px; height:58px; margin-bottom:10px; display:flex; align-items:center; justify-content:center; background:var(--p,#09172E); color:var(--onp,#FFFFFF); box-shadow:0 14px 30px -12px rgba(9,23,46,.55);}
.cf-logo svg{width:30px; height:30px;} .cf-logo img{width:38px; height:38px; object-fit:contain;}
.cf-name{font-size:1.2rem; font-weight:800; letter-spacing:-.01em; line-height:1.25;}
.cf-status{font-size:.78rem; display:flex; align-items:center; gap:6px; opacity:.85; margin-top:3px;}
.cf-status::before{content:""; width:7px; height:7px; background:#22C55E;}
.cf-log{flex:1; min-height:0; overflow-y:auto; padding:8px 20px 14px; display:flex; flex-direction:column; gap:14px;}
.cf-msg{max-width:88%; font-size:.93rem; line-height:1.5;}
.cf-msg .t{padding:11px 14px; white-space:pre-wrap; word-break:break-word;}
.cf-msg time{display:block; font-size:.7rem; color:#8A93A6; margin-top:4px;}
.cf-msg.bot{align-self:flex-start;} .cf-msg.bot .t{background:#F1F4F9; border-left:3px solid var(--a,#0071E3);}
.cf-msg.user{align-self:flex-end; text-align:right;} .cf-msg.user .t{background:var(--a,#0071E3); color:var(--ona,#FFFFFF); text-align:left;}
.cf-topics{border:1px solid rgba(9,23,46,.14); background:#fff; padding:14px; box-shadow:0 14px 30px -20px rgba(9,23,46,.45);}
.cf-topics p{font-weight:700; font-size:.88rem; margin-bottom:10px; color:var(--p,#09172E);}
.cf-chips{display:flex; flex-wrap:wrap; gap:8px;}
.cf-chip{border:1.5px solid var(--a,#0071E3); background:#fff; color:var(--a,#0071E3); font-family:inherit; font-weight:700; font-size:.84rem; padding:8px 14px; cursor:pointer; transition:background .15s,color .15s;}
.cf-chip:hover{background:var(--a,#0071E3); color:var(--ona,#FFFFFF);}
.cf-typing{display:flex; gap:4px; align-self:flex-start; padding:13px 14px; background:#F1F4F9; border-left:3px solid var(--a,#0071E3);}
.cf-typing span{width:6px; height:6px; border-radius:50%; background:#9AA3B2; animation:cfbounce 1.2s infinite;}
.cf-typing span:nth-child(2){animation-delay:.15s;} .cf-typing span:nth-child(3){animation-delay:.3s;}
@keyframes cfbounce{0%,60%,100%{transform:translateY(0);opacity:.5;} 30%{transform:translateY(-4px);opacity:1;}}
.cf-bar{position:relative; flex-shrink:0; display:flex; align-items:stretch; margin:0 16px; border:1.5px solid var(--a,#0071E3); background:#fff;}
.cf-menu{width:40px; display:flex; align-items:center; justify-content:center; border:0; background:none; cursor:pointer; font-size:1.3rem; font-weight:800; color:#5B6475; font-family:inherit;}
.cf-menu:hover{color:var(--a,#0071E3);}
.cf-bar input{flex:1; min-width:0; border:0; outline:0; padding:14px 6px 14px 2px; font-family:inherit; font-size:.95rem; background:transparent; color:inherit;}
.cf-send{width:50px; border:0; background:var(--a,#0071E3); color:var(--ona,#FFFFFF); cursor:pointer; display:flex; align-items:center; justify-content:center;}
.cf-send svg{width:20px; height:20px;}
.cf-pop{position:absolute; left:-1.5px; bottom:calc(100% + 8px); display:none; background:#fff; border:1px solid rgba(9,23,46,.18); box-shadow:0 18px 40px -18px rgba(9,23,46,.5); z-index:5;}
.cf-pop.show{display:block;}
.cf-pop button{display:block; width:100%; border:0; background:none; padding:11px 20px; font-family:inherit; font-weight:600; font-size:.9rem; cursor:pointer; white-space:nowrap; text-align:left; color:#161B26;}
.cf-pop button:hover{background:#F1F4F9;}
.cf-foot{flex-shrink:0; text-align:center; font-size:.72rem; color:#8A93A6; padding:10px 0 12px;} .cf-foot b{color:#5B6475;}

/* Chat-Designs */
.cf-c1 .cf-hero{background:var(--p,#09172E); color:var(--onp,#FFFFFF);}
.cf-c1 .cf-logo{background:var(--a,#0071E3); color:var(--ona,#FFFFFF);}
.cf-c1 .cf-close{background:rgba(255,255,255,.16); color:var(--onp,#FFFFFF);} .cf-c1 .cf-close:hover{background:rgba(255,255,255,.3);}
.cf-c2 .cf-hero{color:var(--p,#09172E); background:linear-gradient(180deg,color-mix(in srgb,var(--a,#0071E3) 42%,#fff) 0%,color-mix(in srgb,var(--a,#0071E3) 16%,#fff) 62%,#fff 100%); padding-bottom:30px;}
.cf-c2 .cf-hero::before{content:""; position:absolute; width:260px; height:200px; left:-70px; top:-90px; border-radius:50%; background:color-mix(in srgb,var(--a,#0071E3) 55%,#fff); filter:blur(46px); opacity:.55;}
.cf-c2 .cf-hero::after{content:""; position:absolute; width:240px; height:180px; right:-70px; top:10px; border-radius:50%; background:#fff; filter:blur(44px); opacity:.85;}
.cf-c3 .cf-hero{background:#fff; color:var(--p,#09172E); border-bottom:2px solid var(--p,#09172E); padding-bottom:20px;}
.cf-c3 .cf-close{background:#fff; border:1px solid var(--p,#09172E); color:var(--p,#09172E);}
.cf-c3 .cf-msg.bot .t{background:#fff; border:1px solid #C9CFDA; border-left:3px solid var(--p,#09172E);}
.cf-c3 .cf-msg.user .t{background:#fff; border:1px solid var(--p,#09172E); color:var(--p,#09172E); font-weight:600;}
.cf-c3 .cf-chip{border-color:var(--p,#09172E); color:var(--p,#09172E);} .cf-c3 .cf-chip:hover{background:var(--p,#09172E); color:var(--onp,#FFFFFF);}
.cf-c3 .cf-bar{border-color:var(--p,#09172E);} .cf-c3 .cf-send{background:var(--p,#09172E); color:var(--onp,#FFFFFF);} .cf-c3 .cf-typing{background:#fff; border:1px solid #C9CFDA;}
.cf-c4{background:color-mix(in srgb,var(--p,#09172E) 78%,#000); border-color:color-mix(in srgb,var(--p,#09172E) 78%,#000); color:#E6EEFB;}
.cf-c4 .cf-hero{background:color-mix(in srgb,var(--p,#09172E) 45%,#000); color:#fff;}
.cf-c4 .cf-logo{background:var(--a,#0071E3); color:var(--ona,#FFFFFF);}
.cf-c4 .cf-close{background:rgba(255,255,255,.14); color:#fff;}
.cf-c4 .cf-msg.bot .t{background:color-mix(in srgb,var(--p,#09172E) 62%,#fff 12%); color:#E6EEFB;}
.cf-c4 .cf-msg time,.cf-c4 .cf-foot,.cf-c4 .cf-foot b{color:#9AA7C0;}
.cf-c4 .cf-topics{background:color-mix(in srgb,var(--p,#09172E) 45%,#000); border-color:color-mix(in srgb,var(--p,#09172E) 62%,#fff 12%);} .cf-c4 .cf-topics p{color:#fff;}
.cf-c4 .cf-chip{background:transparent; color:#fff; border-color:var(--a,#0071E3);} .cf-c4 .cf-chip:hover{background:var(--a,#0071E3); color:var(--ona,#FFFFFF);}
.cf-c4 .cf-bar{background:color-mix(in srgb,var(--p,#09172E) 45%,#000);} .cf-c4 .cf-bar input{color:#fff;} .cf-c4 .cf-menu{color:#9AA7C0;}
.cf-c4 .cf-typing{background:color-mix(in srgb,var(--p,#09172E) 62%,#fff 12%);}
.cf-c4 .cf-pop{background:color-mix(in srgb,var(--p,#09172E) 45%,#000); border-color:color-mix(in srgb,var(--p,#09172E) 62%,#fff 12%);} .cf-c4 .cf-pop button{color:#fff;} .cf-c4 .cf-pop button:hover{background:color-mix(in srgb,var(--p,#09172E) 62%,#fff 12%);}

/* Fest unten rechts auf der Website */
.cf-win.cf-fixed{position:fixed; right:26px; bottom:104px; z-index:299; opacity:0; transform:translateY(14px); pointer-events:none; transition:opacity .2s,transform .2s;}
.cf-win.cf-fixed.open{opacity:1; transform:none; pointer-events:auto;}

/* Buttons unten rechts */
.cf-fab{display:inline-flex; align-items:center; justify-content:center; gap:9px; position:relative; border:0; cursor:pointer; font-family:'Open Sans','Segoe UI',Arial,sans-serif; font-weight:700; color:#fff; transition:transform .15s;}
.cf-fab:hover{transform:scale(1.05);}
.cf-fab svg{width:26px; height:26px; flex-shrink:0;} .cf-fab b{font-size:.95rem;} .cf-fab img{width:34px; height:34px; object-fit:contain;}
.cf-fab .x{display:none; width:24px; height:24px;}
.cf-fab.open > svg:not(.x),.cf-fab.open > img,.cf-fab.open > b{display:none;} .cf-fab.open .x{display:block;}
.cf-fab.open.cf-l2,.cf-fab.open.cf-l4{padding:0; width:56px;}
.cf-fab.cf-fixed{position:fixed; right:26px; bottom:26px; z-index:300;}
.cf-l1{width:60px; height:60px; background:var(--p,#09172E); color:var(--onp,#FFFFFF); box-shadow:0 14px 30px -10px rgba(9,23,46,.6);}
.cf-l2{height:56px; padding:0 22px; background:var(--a,#0071E3); color:var(--ona,#FFFFFF); box-shadow:0 14px 30px -10px rgba(9,23,46,.5);} .cf-l2 svg{width:22px; height:22px;}
.cf-l3{width:60px; height:60px; border-radius:50%; background:var(--a,#0071E3); color:var(--ona,#FFFFFF); box-shadow:0 14px 30px -8px rgba(9,23,46,.5);}
.cf-l4{height:56px; padding:0 20px 0 18px; background:#fff; color:var(--p,#09172E); border:2px solid var(--p,#09172E); box-shadow:0 12px 26px -12px rgba(9,23,46,.5);} .cf-l4 svg{width:22px; height:22px; color:var(--a,#0071E3);}
.cf-l4 .dot{position:absolute; top:-6px; left:-6px; width:13px; height:13px; background:#22C55E; border:2px solid #fff;}
.cf-l5{width:62px; height:62px; background:linear-gradient(160deg,var(--a,#0071E3),color-mix(in srgb,var(--a,#0071E3) 55%,#fff)); color:var(--ona,#FFFFFF); box-shadow:0 16px 32px -10px rgba(9,23,46,.45);}
.cf-l5 .dot{position:absolute; top:-5px; right:-5px; width:14px; height:14px; background:#22C55E; border:2px solid #fff;}
@media (max-width:520px){
  .cf-win.cf-fixed{right:0; left:0; bottom:0; width:100%; max-width:100%; height:100%; max-height:100%; border:0;}
  .cf-fab.cf-fixed.open{display:none;}
}

  /* ---------- Weiche Ecken ---------- */
.cf-win{border-radius:20px;}
.cf-logo{border-radius:16px;}
.cf-close{border-radius:12px;}
.cf-msg .t{border-radius:16px;}
.cf-msg.bot .t{border-left:0; border-bottom-left-radius:6px;}
.cf-msg.user .t{border-bottom-right-radius:6px;}
.cf-topics{border-radius:16px;}
.cf-chip{border-radius:999px; padding:8px 16px;}
.cf-bar{border-radius:16px;}
.cf-send{border-radius:0 14px 14px 0;}
.cf-pop{border-radius:12px; overflow:hidden;}
.cf-l1{border-radius:18px;} .cf-l2{border-radius:16px;} .cf-l4{border-radius:16px;} .cf-l5{border-radius:20px;}
`;
  shadow.appendChild(styleEl);

  var SVG_LOGO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>';
  var SVG_CHAT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/></svg>';
  var SVG_SEND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  var SVG_X = '<svg class="x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';

  function logoHTML(svg){ return LOGO_URL ? '<img src="" alt="" data-logo>' : svg; }

  var wrapper = document.createElement('div');
  wrapper.style.setProperty('--p', PRIMARY);
  wrapper.style.setProperty('--a', ACCENT);
  wrapper.style.setProperty('--onp', onColor(PRIMARY));
  wrapper.style.setProperty('--ona', onColor(ACCENT));

  var fabInner = {
    l1: logoHTML(SVG_LOGO),
    l2: SVG_CHAT + '<b data-launch-text></b>',
    l3: SVG_CHAT,
    l4: '<i class="dot"></i>' + logoHTML(SVG_LOGO) + '<b data-launch-text></b>',
    l5: SVG_CHAT + '<i class="dot"></i>'
  }[LAUNCHER];

  wrapper.innerHTML =
    '<div class="cf-win cf-' + CHAT + ' cf-fixed" id="cfPanel">' +
      '<div class="cf-hero">' +
        '<button class="cf-close" id="cfClose" aria-label="Chat schließen">✕</button>' +
        '<span class="cf-logo">' + logoHTML(SVG_LOGO) + '</span>' +
        '<b class="cf-name" data-name></b>' +
        '<span class="cf-status">Online · antwortet sofort</span>' +
      '</div>' +
      '<div class="cf-log" id="cfLog"></div>' +
      '<div class="cf-bar">' +
        '<div class="cf-pop" id="cfPop"><button type="button" id="cfReset">Neues Gespräch</button></div>' +
        '<button class="cf-menu" type="button" id="cfMenu" aria-label="Menü">⋮</button>' +
        '<input type="text" id="cfInput" placeholder="Nachricht schreiben …" autocomplete="off">' +
        '<button class="cf-send" type="button" id="cfSend" aria-label="Senden">' + SVG_SEND + '</button>' +
      '</div>' +
      '<div class="cf-foot">KI-Assistent · Chatbot von <b data-brand></b></div>' +
    '</div>' +
    '<button class="cf-fab cf-' + LAUNCHER + ' cf-fixed" id="cfFab" aria-label="Chat öffnen">' + fabInner + SVG_X + '</button>';
  shadow.appendChild(wrapper);

  // Texte sicher einsetzen (kein HTML aus Attributen)
  wrapper.querySelector('[data-name]').textContent = BOT_NAME;
  wrapper.querySelector('[data-brand]').textContent = BRAND;
  wrapper.querySelectorAll('[data-launch-text]').forEach(function(el){ el.textContent = LAUNCH_TXT; });
  wrapper.querySelectorAll('img[data-logo]').forEach(function(el){ el.src = LOGO_URL; });

  // ---------- Verhalten ----------
  var panel = shadow.getElementById('cfPanel');
  var fab = shadow.getElementById('cfFab');
  var closeBtn = shadow.getElementById('cfClose');
  var log = shadow.getElementById('cfLog');
  var input = shadow.getElementById('cfInput');
  var sendBtn = shadow.getElementById('cfSend');
  var menuBtn = shadow.getElementById('cfMenu');
  var pop = shadow.getElementById('cfPop');
  var resetBtn = shadow.getElementById('cfReset');

  var chatHistory = [];

  function toggle(){
    panel.classList.toggle('open');
    fab.classList.toggle('open');
    fab.setAttribute('aria-expanded', panel.classList.contains('open') ? 'true' : 'false');
  }
  fab.setAttribute('aria-expanded', 'false');
  fab.addEventListener('click', toggle);
  shadow.addEventListener('keydown', function(e){ if(e.key === 'Escape' && panel.classList.contains('open')) toggle(); });
  closeBtn.addEventListener('click', toggle);

  function nowStr(){ return new Date().toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' }); }

  function addMsg(text, who){
    var d = document.createElement('div'); d.className = 'cf-msg ' + who;
    var b = document.createElement('div'); b.className = 't'; b.textContent = text;
    var t = document.createElement('time'); t.textContent = nowStr();
    d.appendChild(b); d.appendChild(t);
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
  }

  var topicsEl = null;
  function buildStart(){
    log.innerHTML = '';
    addMsg(GREETING, 'bot');
    if(!TOPICS.length){ topicsEl = null; return; }
    topicsEl = document.createElement('div'); topicsEl.className = 'cf-topics';
    var p = document.createElement('p'); p.textContent = 'Wähle ein Thema oder schreib uns direkt.';
    var chips = document.createElement('div'); chips.className = 'cf-chips';
    TOPICS.forEach(function(t){
      var c = document.createElement('button'); c.type = 'button'; c.className = 'cf-chip'; c.textContent = t.label;
      c.addEventListener('click', function(){ send(t.q); });
      chips.appendChild(c);
    });
    var free = document.createElement('button'); free.type = 'button'; free.className = 'cf-chip'; free.textContent = 'Eine Frage stellen …';
    free.addEventListener('click', function(){ input.focus(); });
    chips.appendChild(free);
    topicsEl.appendChild(p); topicsEl.appendChild(chips);
    log.appendChild(topicsEl);
  }
  buildStart();

  menuBtn.addEventListener('click', function(e){ e.stopPropagation(); pop.classList.toggle('show'); });
  shadow.addEventListener('click', function(){ pop.classList.remove('show'); });
  resetBtn.addEventListener('click', function(){ chatHistory = []; input.value = ''; buildStart(); });

  async function botReply(text){
    try{
      var res = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + ANON_KEY,
          'apikey': ANON_KEY
        },
        body: JSON.stringify({ company_id: COMPANY_ID, message: text, history: chatHistory })
      });
      var data = await res.json();
      if(data.reply){
        chatHistory.push({ role: 'user', content: text });
        chatHistory.push({ role: 'assistant', content: data.reply });
        return data.reply;
      }
      return 'Entschuldigung, da ist etwas schiefgelaufen. Versuch es gleich nochmal.';
    } catch(e){
      return 'Der Chatbot ist gerade nicht erreichbar. Versuch es in ein paar Sekunden nochmal.';
    }
  }

  var busy = false;
  async function send(text){
    if(busy || !text.trim()) return;
    busy = true;
    if(topicsEl){ topicsEl.style.display = 'none'; }
    addMsg(text, 'user');
    input.value = '';
    var typing = document.createElement('div');
    typing.className = 'cf-typing';
    typing.innerHTML = '<span></span><span></span><span></span>';
    log.appendChild(typing);
    log.scrollTop = log.scrollHeight;

    var reply = await botReply(text);
    typing.remove();
    addMsg(reply, 'bot');
    busy = false;
  }

  sendBtn.addEventListener('click', function(){ send(input.value); });
  input.addEventListener('keydown', function(e){ if(e.key === 'Enter' && !e.isComposing) send(input.value); });
  }
})();
