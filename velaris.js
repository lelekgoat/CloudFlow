/* CloudFlow Live-Hintergrund (WebGL-Farbverlauf, nach "Velaris")
 * Einbau: <div data-velaris> … Inhalt … </div>
 * Optional: data-colors="#A8D8FF,#5AB4FF,#0A6BD8,#050D1C" data-bg="#050D1C" data-speed="1.4" data-grain="0.3"
 * Ohne WebGL oder bei "weniger Bewegung": ruhiger CSS-Verlauf bzw. ein stehendes Bild.
 */
(function(){
  'use strict';

  var VERT = 'attribute vec2 position;varying vec2 vUv;void main(){vUv=position*0.5+0.5;gl_Position=vec4(position,0.0,1.0);}';

  var FRAG = [
    'precision highp float;',
    'varying vec2 vUv;',
    'uniform vec2 u_resolution;uniform float u_time;uniform float u_grain;uniform vec3 u_colors[4];uniform vec3 u_bg;',
    'vec3 permute(vec3 x){return mod(((x*34.0)+1.0)*x,289.0);}',
    'float snoise(vec2 v){',
    '  const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);',
    '  vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);',
    '  vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);',
    '  vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=mod(i,289.0);',
    '  vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));',
    '  vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);m=m*m;m=m*m;',
    '  vec3 x=2.0*fract(p*C.www)-1.0;vec3 h=abs(x)-0.5;vec3 ox=floor(x+0.5);vec3 a0=x-ox;',
    '  m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);',
    '  vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;return 130.0*dot(m,g);',
    '}',
    'void main(){',
    '  vec2 uv=vUv;float ratio=u_resolution.x/u_resolution.y;vec2 p=uv-0.5;p.x*=ratio;',
    '  float t=u_time*0.1;',
    '  float n1=snoise(p*0.4+vec2(t*0.2,-t*0.3));',
    '  float n2=snoise(p*0.55+vec2(-t*0.15,t*0.25)+n1*0.25);',
    '  float n3=snoise(p*0.75+vec2(t*0.1,-t*0.2)+n2*0.2);',
    '  vec3 col=u_bg;float dist=length(p)*1.5;float vignette=1.0-smoothstep(0.3,1.2,dist);',
    '  col=mix(col,u_colors[0],smoothstep(-0.2,0.5,n1)*0.85);',
    '  col=mix(col,u_colors[1],smoothstep(-0.1,0.6,n2)*0.7);',
    '  col=mix(col,u_colors[2],smoothstep(-0.3,0.4,n3)*0.6);',
    '  col=mix(col,u_colors[3],smoothstep(0.0,0.7,n1*n2)*0.5);',
    '  col+=u_colors[1]*smoothstep(0.8,0.0,dist)*0.3;',
    '  col=mix(col*0.2,col,vignette);',
    '  float grain=fract(sin(dot(uv,vec2(12.9898,78.233)))*43758.5453+u_time);',
    '  col+=(grain-0.5)*u_grain*0.1;',
    '  gl_FragColor=vec4(col,1.0);',
    '}'
  ].join('\n');

  var DEFAULT_COLORS = ['#A8D8FF', '#5AB4FF', '#0A6BD8', '#050D1C'];

  function rgb(hex){
    var h = String(hex).replace('#', '').trim();
    return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255];
  }

  function init(box){
    var colors = (box.getAttribute('data-colors') || DEFAULT_COLORS.join(',')).split(',');
    var bg = box.getAttribute('data-bg') || '#050D1C';
    var speed = parseFloat(box.getAttribute('data-speed') || '1.4');
    var grain = parseFloat(box.getAttribute('data-grain') || '0.3');
    var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var canvas = document.createElement('canvas');
    canvas.className = 'velaris-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    box.insertBefore(canvas, box.firstChild);

    var gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false });
    if(!gl){ box.classList.add('velaris-fallback'); return; }

    function shader(type, src){
      var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    }
    var vs = shader(gl.VERTEX_SHADER, VERT), fs = shader(gl.FRAGMENT_SHADER, FRAG);
    if(!vs || !fs){ box.classList.add('velaris-fallback'); return; }
    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if(!gl.getProgramParameter(prog, gl.LINK_STATUS)){ box.classList.add('velaris-fallback'); return; }
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var pos = gl.getAttribLocation(prog, 'position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    var L = {
      res: gl.getUniformLocation(prog, 'u_resolution'), time: gl.getUniformLocation(prog, 'u_time'),
      grain: gl.getUniformLocation(prog, 'u_grain'), colors: gl.getUniformLocation(prog, 'u_colors'),
      bg: gl.getUniformLocation(prog, 'u_bg')
    };
    var flat = [];
    colors.slice(0, 4).forEach(function(c){ flat = flat.concat(rgb(c)); });
    gl.uniform3fv(L.colors, new Float32Array(flat));
    var b = rgb(bg); gl.uniform3f(L.bg, b[0], b[1], b[2]);
    gl.uniform1f(L.grain, grain);

    function resize(){
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);   // 1.5 reicht für den weichen Verlauf und schont das Handy
      canvas.width = Math.max(1, Math.round(box.clientWidth * dpr));
      canvas.height = Math.max(1, Math.round(box.clientHeight * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(L.res, canvas.width, canvas.height);
      if(calm) draw(8000);
    }
    function draw(ms){
      gl.uniform1f(L.time, ms * 0.001 * speed);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    var raf = 0, visible = true, start = performance.now() - 6000;
    function loop(now){ draw(now - start); raf = requestAnimationFrame(loop); }
    function play(){ if(!raf && !calm && visible && !document.hidden) raf = requestAnimationFrame(loop); }
    function stop(){ if(raf){ cancelAnimationFrame(raf); raf = 0; } }

    if('ResizeObserver' in window) new ResizeObserver(resize).observe(box); else window.addEventListener('resize', resize);
    resize();
    if(calm){ draw(8000); box.classList.add('velaris-ready'); return; }

    // Nur rechnen, wenn der Bereich sichtbar ist (spart Akku)
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(es){
        visible = es[0].isIntersecting; visible ? play() : stop();
      }).observe(box);
    }
    document.addEventListener('visibilitychange', function(){ document.hidden ? stop() : play(); });
    play();
    box.classList.add('velaris-ready');
  }

  function boot(){ Array.prototype.forEach.call(document.querySelectorAll('[data-velaris]'), init); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
