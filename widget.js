(function(){
  'use strict';

  // ---------- Konfiguration ----------
  var FUNCTION_URL = 'https://fdpkszhxiftsusvsvmev.supabase.co/functions/v1/chat';
  var ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkcGtzemh4aWZ0c3VzdnN2bWV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5Nzc1NzcsImV4cCI6MjEwNDU1MzU3N30.aZDp857JxHhNjFKXX3qQUm2MI4xI8LcPxep20-z_BoI';

  // ---------- Eigene Kunden-ID aus dem <script>-Tag auslesen ----------
  var currentScript = document.currentScript || (function(){
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();
  var COMPANY_ID = currentScript.getAttribute('data-company');
  var BOT_NAME = currentScript.getAttribute('data-name') || 'Assistent';

  if(!COMPANY_ID){
    console.error('CloudFlow Widget: data-company Attribut fehlt im <script>-Tag.');
    return;
  }

  // ---------- Eigenen Container mit Shadow DOM bauen (isoliert vom Host-Styling) ----------
  var host = document.createElement('div');
  host.id = 'cloudflow-widget-host';
  document.body.appendChild(host);
  var shadow = host.attachShadow({ mode: 'open' });

  var styleEl = document.createElement('style');
  styleEl.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    *{box-sizing:border-box; margin:0; padding:0; font-family:'Inter', -apple-system, "Segoe UI", sans-serif;}
    .cf-fab{
      position:fixed; bottom:24px; right:24px; z-index:2147483000;
      width:58px; height:58px; border-radius:50%;
      background:#0071E3; color:#fff; border:none; cursor:pointer;
      display:flex; align-items:center; justify-content:center;
      box-shadow:0 10px 30px -6px rgba(0,113,227,0.55);
      transition:transform .2s; font-size:1.5rem;
    }
    .cf-fab:hover{transform:scale(1.06);}
    .cf-fab .cf-icon-close{display:none;}
    .cf-fab.open .cf-icon-chat{display:none;}
    .cf-fab.open .cf-icon-close{display:block;}

    .cf-panel{
      position:fixed; bottom:94px; right:24px; z-index:2147483000;
      width:360px; max-width:calc(100vw - 32px);
      background:#fff; border-radius:20px;
      box-shadow:0 24px 60px -16px rgba(0,0,0,0.28);
      overflow:hidden; border:1px solid rgba(0,0,0,0.08);
      opacity:0; transform:translateY(16px) scale(0.97);
      pointer-events:none; transition:opacity .2s ease, transform .2s ease;
    }
    .cf-panel.open{opacity:1; transform:translateY(0) scale(1); pointer-events:auto;}

    .cf-hero{
      position:relative; background:linear-gradient(180deg, #E9F2FF 0%, #FFFFFF 100%);
      padding:26px 20px 20px; text-align:center;
    }
    .cf-close-btn{
      position:absolute; top:14px; left:14px; width:30px; height:30px; border-radius:50%;
      background:#fff; border:1px solid rgba(0,0,0,0.08); display:flex; align-items:center;
      justify-content:center; cursor:pointer; font-size:0.9rem; color:#6E6E73;
    }
    .cf-close-btn:hover{background:#F5F5F7;}
    .cf-logo-circle{
      width:56px; height:56px; border-radius:50%; margin:0 auto 10px;
      background:#fff; border:1px solid rgba(0,0,0,0.08); display:flex;
      align-items:center; justify-content:center; box-shadow:0 8px 20px -6px rgba(0,0,0,0.12);
    }
    .cf-logo-circle svg{width:26px; height:26px; color:#8E8E93;}
    .cf-hero h3{font-size:1.05rem; margin-bottom:4px; color:#1D1D1F; font-weight:600;}
    .cf-status{font-size:0.72rem; color:#1A9F5C; display:inline-flex; align-items:center; gap:5px;}
    .cf-status::before{content:""; width:6px; height:6px; border-radius:50%; background:#1A9F5C;}

    .cf-log{height:260px; overflow-y:auto; padding:18px; display:flex; flex-direction:column; gap:10px;}
    .cf-msg{max-width:78%; padding:9px 13px; border-radius:15px; font-size:0.87rem; line-height:1.4;}
    .cf-msg.bot{background:#F5F5F7; align-self:flex-start; border-bottom-left-radius:4px; color:#1D1D1F;}
    .cf-msg.user{background:#0071E3; color:#fff; align-self:flex-end; border-bottom-right-radius:4px;}

    .cf-input{display:flex; gap:8px; padding:14px 16px; border-top:1px solid rgba(0,0,0,0.08);}
    .cf-input input{
      flex:1; border:1px solid rgba(0,0,0,0.08); background:#F5F5F7; border-radius:980px;
      padding:10px 14px; font-size:0.87rem; outline:none;
    }
    .cf-input input:focus{border-color:#0071E3;}
    .cf-input button{
      background:#0071E3; color:#fff; border:none; border-radius:980px;
      padding:0 18px; font-weight:500; cursor:pointer; font-size:0.82rem;
    }
    .cf-typing{display:flex; gap:4px; align-self:flex-start; padding:9px 13px; background:#F5F5F7; border-radius:15px;}
    .cf-typing span{width:5px; height:5px; border-radius:50%; background:#A1A1A6; animation:cf-bounce 1.2s infinite;}
    .cf-typing span:nth-child(2){animation-delay:.15s;} .cf-typing span:nth-child(3){animation-delay:.3s;}
    @keyframes cf-bounce{0%,60%,100%{transform:translateY(0); opacity:.5;} 30%{transform:translateY(-4px); opacity:1;}}
  `;
  shadow.appendChild(styleEl);

  var wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <div class="cf-panel" id="cfPanel">
      <div class="cf-hero">
        <button class="cf-close-btn" id="cfClose" aria-label="Chat schließen">✕</button>
        <div class="cf-logo-circle">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>
        </div>
        <h3>${BOT_NAME}</h3>
        <span class="cf-status">Online</span>
      </div>
      <div class="cf-log" id="cfLog">
        <div class="cf-msg bot">Hallo! 👋 Wie kann ich dir helfen?</div>
      </div>
      <div class="cf-input">
        <input type="text" id="cfInput" placeholder="Nachricht schreiben …">
        <button id="cfSend">Senden</button>
      </div>
    </div>
    <button class="cf-fab" id="cfFab" aria-label="Chat öffnen">
      <span class="cf-icon-chat">💬</span>
      <span class="cf-icon-close">✕</span>
    </button>
  `;
  shadow.appendChild(wrapper);

  // ---------- Verhalten ----------
  var panel = shadow.getElementById('cfPanel');
  var fab = shadow.getElementById('cfFab');
  var closeBtn = shadow.getElementById('cfClose');
  var log = shadow.getElementById('cfLog');
  var input = shadow.getElementById('cfInput');
  var sendBtn = shadow.getElementById('cfSend');

  var chatHistory = [];

  function toggle(){
    panel.classList.toggle('open');
    fab.classList.toggle('open');
  }
  fab.addEventListener('click', toggle);
  closeBtn.addEventListener('click', toggle);

  function addMsg(text, who){
    var div = document.createElement('div');
    div.className = 'cf-msg ' + who;
    div.textContent = text;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }

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

  async function send(text){
    if(!text.trim()) return;
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
  }

  sendBtn.addEventListener('click', function(){ send(input.value); });
  input.addEventListener('keydown', function(e){ if(e.key === 'Enter') send(input.value); });
})();
