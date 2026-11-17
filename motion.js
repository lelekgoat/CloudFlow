/* CloudFlow Scroll-Animationen
 * .rv              → blendet beim Hineinscrollen weich ein (data-delay="1..4" für Staffelung)
 * [data-hx]        → Beispiele laufen beim Scrollen von links nach rechts durch
 * [data-progress]  → Linie füllt sich beim Scrollen (Ablauf); erreichte .tl-step bekommen .on (Live-Szene startet)
 * .xp              → Karte wächst beim Drüberfahren und zeigt mehr Text; am Handy per Antippen
 * Bei "weniger Bewegung" ist alles sofort sichtbar und die Beispiele lassen sich wischen.
 */
(function(){
  'use strict';
  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;
  if(!calm) root.classList.add('motion');
  var clamp = function(x, a, b){ return Math.min(b, Math.max(a, x)); };

  // Kopfzeilen-Höhe für "klebende" Bereiche
  function headerH(){
    var h = document.querySelector('header');
    var v = h ? h.offsetHeight : 0;
    root.style.setProperty('--hdr', v + 'px');
    return v;
  }

  // 1) Einblenden
  function reveal(){
    var els = document.querySelectorAll('.rv');
    if(calm || !('IntersectionObserver' in window)){
      Array.prototype.forEach.call(els, function(e){ e.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){ var t = e.target; t.classList.add('in'); io.unobserve(t); setTimeout(function(){ t.classList.add('settled'); }, 1300); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    Array.prototype.forEach.call(els, function(e){ io.observe(e); });
  }

  // 2) Seitlich laufende Beispiele
  var hxs = [];
  function setupHx(){
    Array.prototype.forEach.call(document.querySelectorAll('[data-hx]'), function(sec){
      var stage = sec.querySelector('.hx-stage'), track = sec.querySelector('.hx-track');
      if(!stage || !track) return;
      if(calm){ sec.classList.add('hx-swipe'); return; }
      hxs.push({ sec: sec, stage: stage, track: track, bar: sec.querySelector('.hx-bar i') });
    });
    sizeHx();
  }
  function sizeHx(){
    hxs.forEach(function(h){
      var dist = Math.max(0, h.track.scrollWidth - h.stage.clientWidth);
      h.dist = dist;
      h.sec.style.height = (h.stage.offsetHeight + dist) + 'px';
    });
  }
  function renderHx(){
    var top = parseFloat(getComputedStyle(root).getPropertyValue('--hdr')) || 0;
    hxs.forEach(function(h){
      var r = h.sec.getBoundingClientRect();
      var run = h.sec.offsetHeight - h.stage.offsetHeight;
      var p = run > 0 ? clamp((top - r.top) / run, 0, 1) : 0;
      h.track.style.transform = 'translate3d(' + (-p * h.dist) + 'px,0,0)';
      if(h.bar) h.bar.style.transform = 'scaleX(' + p + ')';
    });
  }

  // 3) Fortschrittslinie
  function renderProgress(){
    Array.prototype.forEach.call(document.querySelectorAll('[data-progress]'), function(el){
      var r = el.getBoundingClientRect(), vh = innerHeight;
      var p = calm ? 1 : clamp((vh * 0.75 - r.top) / (r.height || 1), 0, 1);
      el.style.setProperty('--p', p.toFixed(3));
      var steps = el.querySelectorAll('.tl-step'), n = steps.length;
      Array.prototype.forEach.call(steps, function(st, i){
        var need = n > 1 ? Math.max(0.03, i / (n - 1) * 0.95) : 0.03;
        st.classList.toggle('on', p >= need);
      });
    });
  }

  var queued = false;
  function tick(){ queued = false; renderHx(); renderProgress(); }
  function request(){ if(!queued){ queued = true; requestAnimationFrame(tick); } }

  // 4) Menü "Produkte" (Klick für Handy und Tastatur)
  function menus(){
    Array.prototype.forEach.call(document.querySelectorAll('.nav-drop > button'), function(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        var open = btn.parentNode.classList.toggle('open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });
    document.addEventListener('click', function(){
      Array.prototype.forEach.call(document.querySelectorAll('.nav-drop.open'), function(d){
        d.classList.remove('open'); d.querySelector('button').setAttribute('aria-expanded', 'false');
      });
    });
    var burger = document.querySelector('.burger');
    if(burger) burger.addEventListener('click', function(){
      var open = document.body.classList.toggle('nav-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // 5) Live-Karten: am Handy (ohne Maus) per Antippen auf- und zuklappen, mit Tastatur per Enter
  function cards(){
    var touch = window.matchMedia && window.matchMedia('(hover: none)').matches;
    Array.prototype.forEach.call(document.querySelectorAll('.xp'), function(c){
      c.setAttribute('aria-expanded', 'false');
      function flip(){
        var open = c.classList.toggle('open');
        c.setAttribute('aria-expanded', open ? 'true' : 'false');
        if(open) Array.prototype.forEach.call(document.querySelectorAll('.xp.open'), function(o){
          if(o !== c && o.parentNode === c.parentNode){ o.classList.remove('open'); o.setAttribute('aria-expanded', 'false'); }
        });
      }
      c.addEventListener('click', function(e){
        if(e.target.closest('a,button,input,textarea,select')) return;
        if(touch) flip();
      });
      c.addEventListener('keydown', function(e){
        if((e.key === 'Enter' || e.key === ' ') && e.target === c){ e.preventDefault(); flip(); }
      });
      c.addEventListener('blur', function(){ if(!touch){ c.classList.remove('open'); c.setAttribute('aria-expanded', 'false'); } });
    });
  }

  function boot(){
    headerH(); reveal(); setupHx(); menus(); cards(); tick();
    addEventListener('scroll', request, { passive: true });
    addEventListener('resize', function(){ headerH(); sizeHx(); request(); });
    addEventListener('load', function(){ sizeHx(); request(); });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
