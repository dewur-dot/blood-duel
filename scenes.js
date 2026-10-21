/* 피의 결투 — 캔버스 장면들: 전쟁터(항해 → 상륙 → 난전 → 적장 등장), 발할라(잔치)
   모든 그림은 코드로 그림. index.html의 drawChar로 만든 전사 그림을 이미지로 바꿔 씀 */
(function(){
'use strict';
const TAU=Math.PI*2, rnd=(a,b)=>a+Math.random()*(b-a), rint=(a,b)=>Math.floor(rnd(a,b+1)), pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), lerp=(a,b,t)=>a+(b-a)*t, ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
function fitCanvas(cv){ const d=Math.min(2,window.devicePixelRatio||1), W=cv.clientWidth, H=cv.clientHeight; if(cv.width!==Math.round(W*d)||cv.height!==Math.round(H*d)){ cv.width=Math.round(W*d); cv.height=Math.round(H*d); } const c=cv.getContext('2d'); c.setTransform(d,0,0,d,0,0); return {c,W,H}; }
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
// 전사 SVG → 이미지
function svgImg(svg){ const s=svg.replace(/^<svg /,'<svg xmlns="http://www.w3.org/2000/svg" ').replace(/style="[^"]*"/,'width="200" height="258"'); const im=new Image(); im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(s); return im; }

/* ===================== 공통: 하늘을 나는 것들 ===================== */
function drawBird(c,x,y,s,flap,col){ c.save(); c.translate(x,y); c.scale(s,s); c.fillStyle=col; c.beginPath();
  const f=Math.sin(flap)*0.9; c.moveTo(0,0); c.quadraticCurveTo(-8,-6-10*f,-20,-2-12*f); c.quadraticCurveTo(-10,0,-4,3); c.lineTo(0,5); c.lineTo(4,3); c.quadraticCurveTo(10,0,20,-2-12*f); c.quadraticCurveTo(8,-6-10*f,0,0); c.fill();
  c.beginPath(); c.ellipse(0,2,2.6,5,0,0,TAU); c.fill(); c.restore(); }
function drawPegasus(c,x,y,s,flap,dir){ c.save(); c.translate(x,y); c.scale(s*dir,s); c.fillStyle='rgba(255,252,240,.95)'; c.strokeStyle='rgba(200,170,90,.8)'; c.lineWidth=1;
  // 몸통·목·머리
  c.beginPath(); c.ellipse(0,0,16,7,0,0,TAU); c.fill(); c.beginPath(); c.moveTo(12,-3); c.quadraticCurveTo(18,-14,22,-16); c.lineTo(27,-13); c.lineTo(25,-10); c.quadraticCurveTo(20,-8,16,2); c.fill();
  // 다리
  c.strokeStyle='rgba(255,252,240,.95)'; c.lineWidth=2.2; c.lineCap='round'; const g=Math.sin(flap*0.5)*4;
  [[-10,4,-14,13+g],[-6,5,-4,14-g],[8,5,12,13-g],[11,4,16,12+g]].forEach(([a,b,cx,d])=>{ c.beginPath(); c.moveTo(a,b); c.lineTo(cx,d); c.stroke(); });
  // 꼬리
  c.strokeStyle='rgba(240,220,160,.9)'; c.lineWidth=2; c.beginPath(); c.moveTo(-15,-1); c.quadraticCurveTo(-24,2,-26,10); c.stroke();
  // 날개
  const f=Math.sin(flap); c.fillStyle='rgba(255,247,215,.95)'; c.beginPath(); c.moveTo(-2,-4); c.quadraticCurveTo(-6,-22-14*f,-22,-30-10*f); c.quadraticCurveTo(-8,-20-6*f,-14,-14-6*f); c.quadraticCurveTo(-2,-14,6,-4); c.fill(); c.strokeStyle='rgba(210,180,100,.7)'; c.lineWidth=.8; c.stroke();
  c.restore(); }

/* ====================================================================
   발할라: 쓰러진 전사들의 잔치
   ==================================================================== */
function Valhalla(cv,folk,opt){
  opt=opt||{}; let alive=true, last=performance.now(), t=0, raf=0;
  const S={cv,folk:[],props:[],fx:[],birds:[],sel:-1};
  const n=folk.length, fest=n>=8, bigfest=n>=16;
  // 배경 요소 (상대 좌표 0~1)
  const trees=[[0.07,0.5,1.6],[0.17,0.46,0.8],[0.9,0.47,1.0],[0.98,0.44,0.8],[0.85,0.43,0.7],[0.24,0.44,0.6]];
  const tables=[{x:0.24,y:0.82,w:0.36},{x:0.76,y:0.82,w:0.36}];
  const flowers=Array.from({length:70},()=>({x:Math.random(),y:rnd(0.55,1),c:pick(['#ffd1e0','#fff3a8','#ffffff','#c8b6ff','#ffb98a']),r:rnd(1,2.2)}));
  for(let i=0;i<5;i++) S.birds.push({k:i<3?'eagle':'raven',x:rnd(-0.2,1.2),y:rnd(0.04,0.3),v:rnd(0.03,0.07)*(Math.random()<.5?1:-1),s:rnd(0.6,1),f:rnd(0,TAU)});
  S.birds.push({k:'peg',x:-0.2,y:0.14,v:0.035,s:1.1,f:0}); if(n>=5) S.birds.push({k:'peg',x:1.2,y:0.22,v:-0.03,s:0.8,f:2});
  const bunt=fest?Array.from({length:18},(_,i)=>i):[];
  // 잔치 손님들
  const ACTS=['run','fight','throw','drink','sing','dance','sit','cheer'];
  folk.forEach((f,i)=>{ const im=svgImg(f.svg); S.folk.push({i,im,name:f.name,info:f,x:rnd(0.06,0.94),y:rnd(0.64,0.99),tx:0,ty:0,dir:Math.random()<.5?-1:1,act:'run',until:0,ph:rnd(0,TAU),h:f.h||1,partner:null,hitT:0}); });
  const nextAct=(p,now)=>{ let a=pick(ACTS); if(a==='fight'||a==='throw'){ const o=S.folk.filter(q=>q!==p&&!q.partner&&q.act!=='fight'); if(!o.length) a='dance'; else { const q=pick(o); p.partner=q; if(a==='fight'){ q.partner=p; q.act='fight'; q.until=now+6000; p.until=now+6000; } } }
    if(a==='drink'||a==='sit'){ const tb=pick(tables); p.tx=tb.x+rnd(-tb.w/2+0.03,tb.w/2-0.03); p.ty=tb.y-0.035; } else if(a==='run'||a==='dance'||a==='sing'||a==='cheer'){ p.tx=rnd(0.05,0.95); p.ty=Math.random()<0.6?rnd(0.72,0.99):rnd(0.6,0.72); if(a!=='run'&&Math.random()<0.5){ p.tx=p.x; p.ty=p.y; } } else { p.tx=p.x; p.ty=p.y; }
    if(a!=='fight'&&a!=='throw') p.partner=null;
    p.meet=null; p.act=a; if(a!=='fight') p.until=now+rnd(3500,7500); p.thrown=false; };
  S.folk.forEach(p=>nextAct(p,performance.now()-rnd(0,3000)));
  const floatTxt=(x,y,txt,col)=>{ if(S.fx.filter(f=>f.k==='txt').length>=5) return; S.fx.push({k:'txt',x,y,txt,col,t0:t,life:1.4}); };
  // 그리기 도우미
  function sky(c,W,H){ const g=c.createLinearGradient(0,0,0,H*0.6); g.addColorStop(0,'#7cc3e8'); g.addColorStop(.55,'#cfe8e6'); g.addColorStop(1,'#f8e7b4'); c.fillStyle=g; c.fillRect(0,0,W,H);
    // 해와 빛줄기
    const sx=W*0.5, sy=H*0.2; c.save(); c.translate(sx,sy); c.rotate(t*0.03); for(let i=0;i<24;i++){ c.rotate(TAU/24); c.fillStyle=`rgba(255,226,140,${i%2?0.10:0.18})`; c.beginPath(); c.moveTo(0,0); c.lineTo(-W*0.05,-H); c.lineTo(W*0.05,-H); c.fill(); } c.restore();
    const sg=c.createRadialGradient(sx,sy,0,sx,sy,H*0.32); sg.addColorStop(0,'rgba(255,250,220,1)'); sg.addColorStop(.25,'rgba(255,225,140,.75)'); sg.addColorStop(1,'rgba(255,220,140,0)'); c.fillStyle=sg; c.fillRect(0,0,W,H);
    // 무지개 (비프로스트)
    const cols=['#ff6b6b','#ffa94d','#ffe066','#69db7c','#4dabf7','#9775fa']; c.save(); c.globalAlpha=0.42; c.lineWidth=H*0.018;
    cols.forEach((col,i)=>{ c.strokeStyle=col; c.beginPath(); c.arc(W*0.5,H*0.62,W*0.62-i*H*0.018,Math.PI*1.02,Math.PI*1.98); c.stroke(); }); c.restore();
    // 구름
    [[0.15,0.12,1],[0.78,0.08,1.2],[0.55,0.28,0.7],[0.95,0.3,0.8],[0.3,0.33,0.6]].forEach(([x,y,s],i)=>{ const cx=((x+t*0.004*(i%2?1:-1))%1.3+1.3)%1.3-0.15; cloud(c,cx*W,y*H,s*W*0.09); });
  }
  function cloud(c,x,y,r){ c.fillStyle='rgba(255,255,255,.88)'; c.beginPath(); c.arc(x,y,r*0.6,0,TAU); c.arc(x+r*0.6,y+r*0.1,r*0.5,0,TAU); c.arc(x-r*0.6,y+r*0.15,r*0.45,0,TAU); c.arc(x+r*0.15,y-r*0.3,r*0.5,0,TAU); c.fill(); }
  function mountains(c,W,H){ c.fillStyle='#a9c7d4'; c.beginPath(); c.moveTo(0,H*0.45); [[0.08,0.3],[0.2,0.4],[0.32,0.27],[0.45,0.4],[0.62,0.29],[0.75,0.38],[0.88,0.26],[1,0.4]].forEach(([x,y])=>c.lineTo(x*W,y*H)); c.lineTo(W,H*0.5); c.lineTo(0,H*0.5); c.fill();
    c.fillStyle='#f4fbff'; [[0.32,0.27],[0.62,0.29],[0.88,0.26],[0.08,0.3]].forEach(([x,y])=>{ c.beginPath(); c.moveTo(x*W,y*H); c.lineTo(x*W-W*0.035,y*H+H*0.045); c.lineTo(x*W+W*0.035,y*H+H*0.045); c.fill(); }); }
  function hall(c,W,H){ const x=W*0.5, base=H*0.475, w=W*0.56, wallH=H*0.07, roofH=H*0.13;
    const gl=c.createRadialGradient(x,base-roofH*0.5,0,x,base-roofH*0.5,w*0.8); gl.addColorStop(0,'rgba(255,230,150,.6)'); gl.addColorStop(1,'rgba(255,230,150,0)'); c.fillStyle=gl; c.fillRect(x-w,base-roofH*2.2,w*2,roofH*2.6);
    // 벽 (통나무)
    c.fillStyle='#6b4a2a'; c.fillRect(x-w/2,base-wallH,w,wallH); c.strokeStyle='rgba(40,25,10,.5)'; c.lineWidth=1; for(let k=1;k<4;k++){ c.beginPath(); c.moveTo(x-w/2,base-wallH*k/4); c.lineTo(x+w/2,base-wallH*k/4); c.stroke(); }
    // 기둥(창 자루)
    c.fillStyle='#4a3018'; for(let k=0;k<=8;k++){ c.fillRect(x-w/2+k*w/8-1.5,base-wallH,3,wallH); }
    // 지붕: 금빛 방패 비늘
    const ry=base-wallH; c.save(); c.beginPath(); c.moveTo(x-w*0.56,ry+2); c.lineTo(x-w*0.42,ry-roofH); c.lineTo(x+w*0.42,ry-roofH); c.lineTo(x+w*0.56,ry+2); c.closePath(); const rg=c.createLinearGradient(0,ry-roofH,0,ry); rg.addColorStop(0,'#f6d36b'); rg.addColorStop(1,'#b8862a'); c.fillStyle=rg; c.fill(); c.clip();
    const R=Math.max(4,W*0.012); for(let row=0;row<8;row++){ const yy=ry-roofH+row*R*1.5+R; for(let xx=x-w*0.6+(row%2)*R;xx<x+w*0.6;xx+=R*2.05){ c.fillStyle=row%3===0?'#e2b84e':'#d4a640'; c.beginPath(); c.arc(xx,yy,R,0,TAU); c.fill(); c.strokeStyle='rgba(120,80,20,.6)'; c.lineWidth=1; c.stroke(); c.fillStyle='#fff1b8'; c.beginPath(); c.arc(xx,yy,R*0.28,0,TAU); c.fill(); } }
    c.restore();
    // 용머리 박공
    [[-1],[1]].forEach(([d])=>{ const ex=x+d*w*0.42, ey=ry-roofH; c.strokeStyle='#5a3a1c'; c.lineWidth=3; c.beginPath(); c.moveTo(ex,ey+4); c.quadraticCurveTo(ex+d*6,ey-14,ex+d*16,ey-16); c.stroke(); c.fillStyle='#5a3a1c'; c.beginPath(); c.arc(ex+d*17,ey-16,3.4,0,TAU); c.fill(); c.fillStyle='#ffdd55'; c.beginPath(); c.arc(ex+d*18,ey-17,1,0,TAU); c.fill(); });
    c.fillStyle='#8a5a2b'; c.fillRect(x-w*0.42,ry-roofH-3,w*0.84,4);
    // 빛나는 문과 창
    const dw=w*0.1, dh=wallH*1.25; const dg=c.createLinearGradient(0,base-dh,0,base); dg.addColorStop(0,'#fffbe0'); dg.addColorStop(1,'#ffc94a'); c.fillStyle=dg; c.beginPath(); c.moveTo(x-dw/2,base); c.lineTo(x-dw/2,base-dh*0.7); c.quadraticCurveTo(x,base-dh*1.15,x+dw/2,base-dh*0.7); c.lineTo(x+dw/2,base); c.fill();
    const fl=0.35+0.2*Math.sin(t*2.3); c.fillStyle=`rgba(255,235,160,${fl})`; for(let k=-3;k<=3;k++){ if(!k) continue; c.fillRect(x+k*w*0.12-6,base-wallH*0.75,12,wallH*0.4); }
    // 문 앞 빛
    const lg=c.createRadialGradient(x,base,0,x,base,w*0.25); lg.addColorStop(0,'rgba(255,240,170,.55)'); lg.addColorStop(1,'rgba(255,240,170,0)'); c.fillStyle=lg; c.fillRect(x-w*0.3,base-10,w*0.6,H*0.08); }
  function ground(c,W,H){ const g=c.createLinearGradient(0,H*0.47,0,H); g.addColorStop(0,'#9fd27a'); g.addColorStop(1,'#5f9e47'); c.fillStyle=g; c.fillRect(0,H*0.47,W,H*0.53);
    flowers.forEach(f=>{ c.fillStyle=f.c; c.beginPath(); c.arc(f.x*W,f.y*H,f.r,0,TAU); c.fill(); }); }
  function river(c,W,H){ const y0=H*0.51, y1=H*0.56; c.save(); c.beginPath(); c.moveTo(0,y0+6);
    for(let x=0;x<=W;x+=12) c.lineTo(x,y0+Math.sin(x*0.02+0.6)*6); for(let x=W;x>=0;x-=12) c.lineTo(x,y1+Math.sin(x*0.018)*7); c.closePath();
    const g=c.createLinearGradient(0,y0,0,y1); g.addColorStop(0,'#7fd0f0'); g.addColorStop(1,'#3d9ad0'); c.fillStyle=g; c.fill(); c.clip();
    c.strokeStyle='rgba(255,255,255,.55)'; c.lineWidth=1.3; for(let i=0;i<14;i++){ const x=((i*W/7+t*40)%(W+80))-40, y=lerp(y0,y1,(i%4+0.5)/4)+Math.sin(x*0.02)*4; c.beginPath(); c.moveTo(x,y); c.lineTo(x+18+(i%3)*6,y); c.stroke(); }
    c.restore(); c.strokeStyle='#c8b98a'; c.lineWidth=2; c.beginPath(); for(let x=0;x<=W;x+=12) c.lineTo(x,y1+Math.sin(x*0.018)*7+2); c.stroke(); }
  function tree(c,x,y,s,gold){ c.fillStyle='#6b4423'; c.fillRect(x-3*s,y-26*s,6*s,26*s);
    if(gold){ c.fillStyle='#7a5228'; c.beginPath(); c.moveTo(x-6*s,y); c.quadraticCurveTo(x-3*s,y-20*s,x-10*s,y-40*s); c.lineTo(x+10*s,y-40*s); c.quadraticCurveTo(x+3*s,y-20*s,x+6*s,y); c.fill();
      const gg=c.createRadialGradient(x,y-60*s,0,x,y-60*s,40*s); gg.addColorStop(0,'rgba(255,240,170,.7)'); gg.addColorStop(1,'rgba(255,220,120,0)'); c.fillStyle=gg; c.beginPath(); c.arc(x,y-60*s,42*s,0,TAU); c.fill();
      [[0,-58,24,'#f2c94c'],[-20,-46,16,'#e9b949'],[20,-46,16,'#e9b949'],[-12,-74,15,'#f6d36b'],[12,-74,15,'#f6d36b'],[0,-84,12,'#fbe39a']].forEach(([dx,dy,r,col])=>{ c.fillStyle=col; c.beginPath(); c.arc(x+dx*s,y+dy*s,r*s,0,TAU); c.fill(); });
      c.fillStyle='rgba(255,255,230,.9)'; for(let k=0;k<6;k++){ const a=t*0.8+k; c.beginPath(); c.arc(x+Math.cos(a)*22*s,y-60*s+Math.sin(a*1.3)*20*s,1.4*s,0,TAU); c.fill(); } return; }
    c.fillStyle='#2f6b3c'; for(let i=0;i<3;i++){ c.beginPath(); c.moveTo(x,y-(80-i*18)*s); c.lineTo(x-(22+i*5)*s,y-(30-i*8)*s+i*0); c.lineTo(x+(22+i*5)*s,y-(30-i*8)*s); c.fill(); } }
  function table(c,W,H,tb){ const x=tb.x*W, y=tb.y*H, w=tb.w*W;
    c.fillStyle='rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(x,y+10,w*0.55,8,0,0,TAU); c.fill();
    // 의자(긴 의자) 뒤
    c.fillStyle='#7a5230'; c.fillRect(x-w/2,y-16,w,5); c.fillRect(x-w/2+4,y-11,4,9); c.fillRect(x+w/2-8,y-11,4,9);
    // 탁자
    c.fillStyle='#8a5a2b'; c.fillRect(x-w/2-4,y-8,w+8,8); c.fillStyle='#6b4220'; c.fillRect(x-w/2,y,5,12); c.fillRect(x+w/2-5,y,5,12); c.fillStyle='#a8743c'; c.fillRect(x-w/2-4,y-9,w+8,2);
    // 음식과 술잔
    for(let i=0;i<5;i++){ const fx=x-w/2+w*(i+0.5)/5;
      if(i%2===0){ c.fillStyle='#e6e0d0'; c.beginPath(); c.ellipse(fx,y-10,8,3,0,0,TAU); c.fill(); c.fillStyle='#a5562a'; c.beginPath(); c.ellipse(fx,y-13,6,4,0,0,TAU); c.fill(); c.fillStyle='#f3e6c8'; c.fillRect(fx+4,y-15,5,2); }
      else { c.fillStyle='#c98a3a'; c.fillRect(fx-3,y-18,6,9); c.fillStyle='#fffbe8'; c.fillRect(fx-3.5,y-20,7,3); c.strokeStyle='#8a5a20'; c.lineWidth=1.2; c.beginPath(); c.arc(fx+4,y-14,2.4,-1.4,1.4); c.stroke(); } }
    c.fillStyle='#d9a441'; c.beginPath(); c.arc(x-w*0.06,y-12,3.5,0,TAU); c.arc(x+w*0.08,y-12,3,0,TAU); c.fill();
    // 의자 앞
    c.fillStyle='#7a5230'; c.fillRect(x-w/2,y+12,w,5); }
  function firepit(c,W,H){ const x=W*0.5, y=H*0.66; c.fillStyle='#5a5048'; c.beginPath(); c.ellipse(x,y,22,7,0,0,TAU); c.fill();
    for(let i=0;i<3;i++){ const h=18+Math.sin(t*9+i*2)*5; const g=c.createLinearGradient(0,y-h,0,y); g.addColorStop(0,'rgba(255,240,150,0)'); g.addColorStop(.4,'#ffb030'); g.addColorStop(1,'#ff5a1a'); c.fillStyle=g; c.beginPath(); c.moveTo(x-12+i*8,y); c.quadraticCurveTo(x-14+i*8,y-h*0.6,x-8+i*8+Math.sin(t*7+i)*2,y-h); c.quadraticCurveTo(x-2+i*8,y-h*0.5,x-4+i*8,y); c.fill(); }
    // 꼬치에 꿴 멧돼지
    c.strokeStyle='#4a3020'; c.lineWidth=2; c.beginPath(); c.moveTo(x-30,y-26); c.lineTo(x+30,y-26); c.stroke(); c.beginPath(); c.moveTo(x-28,y-26); c.lineTo(x-28,y+2); c.moveTo(x+28,y-26); c.lineTo(x+28,y+2); c.stroke();
    c.save(); c.translate(x,y-26); c.rotate(t*0.6); c.fillStyle='#9a4f22'; c.beginPath(); c.ellipse(0,0,14,8,0,0,TAU); c.fill(); c.restore(); }
  function bunting(c,W,H){ if(!bunt.length) return; const y0=H*0.48; c.strokeStyle='#6b4a2a'; c.lineWidth=1; c.beginPath(); c.moveTo(W*0.03,y0-40); c.quadraticCurveTo(W*0.5,y0-5,W*0.97,y0-40); c.stroke();
    const cols=['#e23d3d','#f2b632','#3d8fe2','#3dbf6a','#b05be0']; bunt.forEach(i=>{ const u=(i+0.5)/bunt.length, x=lerp(W*0.03,W*0.97,u), y=(1-u)*(1-u)*(y0-40)+2*(1-u)*u*(y0-5)+u*u*(y0-40); const sw=Math.sin(t*3+i)*2; c.fillStyle=cols[i%5]; c.beginPath(); c.moveTo(x-5,y); c.lineTo(x+5,y); c.lineTo(x+sw,y+11); c.fill(); });
    // 등불
    for(let i=0;i<5;i++){ const u=(i+1)/6, x=lerp(W*0.03,W*0.97,u), y=(1-u)*(1-u)*(y0-40)+2*(1-u)*u*(y0-5)+u*u*(y0-40)+6; const g=c.createRadialGradient(x,y,0,x,y,14); g.addColorStop(0,'rgba(255,220,120,.9)'); g.addColorStop(1,'rgba(255,200,100,0)'); c.fillStyle=g; c.beginPath(); c.arc(x,y,14,0,TAU); c.fill(); c.fillStyle='#ffcf6a'; c.beginPath(); c.arc(x,y,3.5,0,TAU); c.fill(); } }
  // 사람 그리기 (깊이에 따라 크기)
  function person(c,W,H,p,now){ const sc=lerp(0.62,1.05,clamp((p.y-0.55)/0.42,0,1))*(0.85+0.3*clamp(p.h,0.5,2))/1.15;
    const ph=p.ph+t*6, hgt=H*0.15*sc, wid=hgt*200/258, x=p.x*W, y=p.y*H;
    let bob=0, rot=0, lift=0, armProp=null;
    let flip=1, sq=1;
    if(p.act==='run'||p.moving){ bob=Math.abs(Math.sin(ph*1.6))*hgt*0.09; rot=Math.sin(ph*1.6)*0.09; }
    else if(p.act==='dance'){ bob=Math.abs(Math.sin(ph*1.3))*hgt*0.18; rot=Math.sin(ph*0.65)*0.3; flip=Math.sin(ph*0.33)>0?1:-1; sq=1-Math.abs(Math.sin(ph*1.3))*0.06; }
    else if(p.act==='fight'){ const k=Math.sin(ph*1.8); rot=k*0.22; bob=Math.max(0,k)*hgt*0.06; armProp='fist'; }
    else if(p.act==='cheer'){ bob=Math.abs(Math.sin(ph*1.1))*hgt*0.2; armProp='mug'; }
    else if(p.act==='drink'){ rot=-0.25*(0.5+0.5*Math.sin(ph*0.5)); armProp='mugUp'; }
    else if(p.act==='sing'){ rot=Math.sin(ph*0.5)*0.1; bob=Math.abs(Math.sin(ph*0.5))*hgt*0.03; armProp='horn'; }
    else if(p.act==='throw'){ const k=p.thrown?Math.max(0,1-(t-(p.thrownAt||0))*2):Math.min(1,(1-(p.until-now)/4000)); rot=p.thrown?0.35*k:-0.3*k; armProp=p.thrown?null:'meat'; }
    else if(p.act==='sit'){ lift=-hgt*0.06; armProp=Math.sin(ph*0.3)>0?'mug':null; }
    if(p.hitT&&t-p.hitT<0.5){ rot+=(t-p.hitT<0.25?-0.3:0.1)*p.dir; }
    // 그림자
    c.fillStyle='rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(x,y,wid*0.32,hgt*0.04,0,0,TAU); c.fill();
    c.save(); c.translate(x,y-bob-lift); c.rotate(rot*p.dir); c.scale(p.dir*flip,sq);
    if(p.im.complete&&p.im.naturalWidth) c.drawImage(p.im,-wid/2,-hgt,wid,hgt); else { c.fillStyle='#c99'; c.fillRect(-wid*0.2,-hgt,wid*0.4,hgt); }
    const mz=hgt/110;
    if(armProp==='mug'||armProp==='mugUp'){ const mx=wid*0.3, my=-hgt*(armProp==='mugUp'?0.9:0.62); c.save(); c.translate(mx,my); if(armProp==='mugUp') c.rotate(-0.8); c.scale(mz,mz); c.fillStyle='#c98a3a'; c.fillRect(-5,-7,10,13); c.fillStyle='#fffbe8'; c.fillRect(-5.5,-10,11,4.5); c.strokeStyle='#8a5a20'; c.lineWidth=2; c.beginPath(); c.arc(6,-1,3,-1.4,1.4); c.stroke(); c.restore(); }
    if(armProp==='horn'){ c.save(); c.translate(wid*0.22,-hgt*0.8); c.rotate(-0.4); c.scale(mz,mz); c.fillStyle='#e8dcc0'; c.beginPath(); c.moveTo(0,0); c.quadraticCurveTo(12,-4,18,-14); c.lineTo(20,-10); c.quadraticCurveTo(14,2,0,4); c.fill(); c.restore(); }
    if(armProp==='meat'){ c.save(); c.translate(-wid*0.32,-hgt*0.85); c.scale(mz,mz); c.fillStyle='#a5562a'; c.beginPath(); c.ellipse(0,0,7,5,0,0,TAU); c.fill(); c.fillStyle='#f3e6c8'; c.fillRect(5,-1.5,6,3); c.restore(); }
    if(armProp==='fist'&&Math.sin(ph*1.8)>0.8){ c.strokeStyle='rgba(255,255,255,.95)'; c.lineWidth=2.5; c.beginPath(); c.arc(wid*0.42,-hgt*0.62,hgt*0.2,-0.9,0.4); c.stroke(); c.fillStyle='#ffe36a'; for(let k=0;k<4;k++){ const a=k*1.6+t*4; c.beginPath(); c.arc(wid*0.55+Math.cos(a)*6,-hgt*0.68+Math.sin(a)*6,1.6,0,TAU); c.fill(); } }
    c.restore();
    if(S.sel===p.i){ c.strokeStyle='#ffd76a'; c.lineWidth=2; c.beginPath(); c.ellipse(x,y,wid*0.36,hgt*0.06,0,0,TAU); c.stroke(); }
    // 이름표 (가까운 사람 / 선택된 사람)
    if(sc>0.97||S.sel===p.i){ c.font='600 10px system-ui,sans-serif'; c.textAlign='center'; const tw=c.measureText(p.name).width+8; c.fillStyle='rgba(30,20,8,.55)'; rr(c,x-tw/2,y+2,tw,13,3); c.fill(); c.fillStyle='#fff3cf'; c.fillText(p.name,x,y+12); }
    p._box=[x-wid*0.35,y-hgt,wid*0.7,hgt]; p._hgt=hgt; }
  function update(dt,now){
    S.folk.forEach(p=>{ if(now>p.until){ if(p.act==='fight'&&p.partner){ const q=p.partner; q.partner=null; if(q.act==='fight') q.until=now; } nextAct(p,now); }
      const dx=p.tx-p.x, dy=p.ty-p.y, d=Math.hypot(dx,dy); p.moving=false;
      if(p.act==='fight'&&p.partner){ const q=p.partner; if(!p.meet){ p.meet=[q.x,q.y]; q.meet=p.meet; } const mx=p.meet[0], my=p.meet[1]; p.tx=mx+(p.x<q.x?-0.04:0.04)+Math.sin(t*5+p.i)*0.012; p.ty=my; p.dir=p.x<q.x?1:-1;
        if(Math.random()<dt*0.9){ q.hitT=t; floatTxt(q.x,q.y-0.2,pick(['퍽!','쾅!','윽!','하하!','이 녀석!']),'#fff'); } }
      if(p.act==='throw'&&p.partner&&!p.thrown&&now>p.until-2500){ p.thrown=true; const q=p.partner; p.dir=q.x>p.x?1:-1; p.thrownAt=t; S.props.push({k:pick(['meat','apple','bread']),x0:p.x,y0:p.y-0.13,x1:q.x,y1:q.y-0.1,t0:t,dur:0.9,to:q}); floatTxt(p.x,p.y-0.22,pick(['받아라!','먹어라!','이거나 먹어!']),'#ffe9a8'); }
      if(d>0.004){ const sp=(p.act==='run'?0.16:0.09)*dt; p.x+=dx/d*Math.min(sp,d); p.y+=dy/d*Math.min(sp,d); p.moving=true; if(Math.abs(dx)>0.002) p.dir=dx>0?1:-1; }
      if(p.act==='sing'&&Math.random()<dt*1.6) S.fx.push({k:'note',x:p.x+rnd(-0.01,0.02),y:p.y-0.2,t0:t,life:1.8,ch:pick(['♪','♫','♬'])});
      if(p.act==='drink'&&!p.moving&&Math.random()<dt*0.4) floatTxt(p.x,p.y-0.21,pick(['벌컥벌컥','캬아!','한 잔 더!','스콜!']),'#ffe9a8');
      if(p.act==='cheer'&&Math.random()<dt*0.5) floatTxt(p.x,p.y-0.21,pick(['오딘이여!','발할라!','하하하!','스콜!']),'#fff');
    });
    S.props=S.props.filter(pr=>{ const u=(t-pr.t0)/pr.dur; if(u>=1){ if(pr.to){ pr.to.hitT=t; S.fx.push({k:'splat',x:pr.x1,y:pr.y1,t0:t,life:0.6}); floatTxt(pr.x1,pr.y1-0.12,pick(['철퍽!','으악!','뭐야!']),'#fff'); } return false; } return true; });
    S.fx=S.fx.filter(f=>t-f.t0<f.life);
    S.birds.forEach(b=>{ b.x+=b.v*dt; b.f+=dt*(b.k==='peg'?4:8); if(b.v>0&&b.x>1.25) b.x=-0.25; if(b.v<0&&b.x<-0.25) b.x=1.25; });
    if(bigfest&&Math.random()<dt*6) S.fx.push({k:'conf',x:Math.random(),y:-0.02,vx:rnd(-0.02,0.02),vy:rnd(0.05,0.12),c:pick(['#ff6b6b','#ffd43b','#69db7c','#4dabf7','#e599f7']),t0:t,life:6});
  }
  function frame(now){ if(!alive) return; raf=requestAnimationFrame(frame); if(!cv.isConnected){ stop(); return; }
    const dt=Math.min(0.05,(now-last)/1000); last=now; t+=dt; update(dt,now);
    const {c,W,H}=fitCanvas(cv);
    sky(c,W,H); mountains(c,W,H); hall(c,W,H); ground(c,W,H); river(c,W,H);
    S.birds.forEach(b=>{ const x=b.x*W, y=b.y*H+Math.sin(b.f*0.3)*6; if(b.k==='peg') drawPegasus(c,x,y,b.s*W/420,b.f,b.v>0?1:-1); else drawBird(c,x,y,b.s*W/420,b.f,b.k==='eagle'?'#5d4a35':'#232323'); });
    trees.forEach(([x,y,s],i)=>tree(c,x*W,y*H,s*W/420,i===0));
    bunting(c,W,H);
    // 깊이 순서대로: 탁자·모닥불·사람
    const items=[...tables.map(tb=>({y:tb.y,d:()=>table(c,W,H,tb)})),{y:0.665,d:()=>firepit(c,W,H)},...S.folk.map(p=>({y:p.y,d:()=>person(c,W,H,p,now)}))];
    items.sort((a,b)=>a.y-b.y).forEach(o=>o.d());
    S.props.forEach(pr=>{ const u=(t-pr.t0)/pr.dur, x=lerp(pr.x0,pr.x1,u)*W, y=lerp(pr.y0,pr.y1,u)*H-Math.sin(u*Math.PI)*H*0.12; c.save(); c.translate(x,y); c.rotate(u*10);
      if(pr.k==='meat'){ c.fillStyle='#a5562a'; c.beginPath(); c.ellipse(0,0,6,4,0,0,TAU); c.fill(); c.fillStyle='#f3e6c8'; c.fillRect(4,-1,5,2); } else if(pr.k==='apple'){ c.fillStyle='#d6332f'; c.beginPath(); c.arc(0,0,4,0,TAU); c.fill(); } else { c.fillStyle='#d9a441'; c.beginPath(); c.ellipse(0,0,6,3.5,0,0,TAU); c.fill(); } c.restore(); });
    S.fx.forEach(f=>{ const u=(t-f.t0)/f.life;
      if(f.k==='txt'){ c.globalAlpha=1-u; c.font='800 12px system-ui,sans-serif'; c.textAlign='center'; c.lineWidth=3; c.strokeStyle='rgba(40,25,5,.8)'; const y=f.y*H-u*22; c.strokeText(f.txt,f.x*W,y); c.fillStyle=f.col; c.fillText(f.txt,f.x*W,y); c.globalAlpha=1; }
      else if(f.k==='note'){ c.globalAlpha=1-u; c.font='700 15px serif'; c.fillStyle='#5a2fa0'; c.fillText(f.ch,f.x*W+Math.sin(u*8)*6,f.y*H-u*40); c.globalAlpha=1; }
      else if(f.k==='splat'){ c.globalAlpha=1-u; c.fillStyle='#c0392b'; for(let i=0;i<6;i++){ const a=i/6*TAU; c.beginPath(); c.arc(f.x*W+Math.cos(a)*u*14,f.y*H-H*0.1+Math.sin(a)*u*10,2.2,0,TAU); c.fill(); } c.globalAlpha=1; }
      else if(f.k==='conf'){ f.x+=f.vx*0.016; f.y+=f.vy*0.016; c.fillStyle=f.c; c.save(); c.translate(f.x*W,f.y*H); c.rotate(t*5+f.t0); c.fillRect(-2,-3,4,6); c.restore(); } });
  }
  function stop(){ alive=false; cancelAnimationFrame(raf); }
  cv.addEventListener('click',e=>{ const r=cv.getBoundingClientRect(), x=e.clientX-r.left, y=e.clientY-r.top; let hit=null;
    S.folk.slice().sort((a,b)=>b.y-a.y).some(p=>{ const b=p._box; if(b&&x>=b[0]&&x<=b[0]+b[2]&&y>=b[1]&&y<=b[1]+b[3]){ hit=p; return true; } return false; });
    S.sel=hit?hit.i:-1; if(opt.onSelect) opt.onSelect(hit?hit.info:null); });
  raf=requestAnimationFrame(frame);
  return {stop,S};
}

/* ====================================================================
   전쟁터: 배를 타고 건너가 해안에서 뒤엉켜 싸움
   ==================================================================== */
function War(cv,opt){
  opt=opt||{}; let alive=true, last=performance.now(), t=0, raf=0, phase='sail', phaseT=0, shake=0, flash=0;
  const sol=[], corpses=[], fx=[], arrows=[], smoke=[];
  let hero=null, heroDead=false, genOn=false, gen=null; const genIm=opt.genSvg?svgImg(opt.genSvg):null;
  // 패싸움 병사들도 게임 속 전사와 똑같은 사람 그림 (키 비율 그대로)
  const pool=[(opt.allies||[]).map(a=>({im:svgImg(a.svg),cm:a.cm})),(opt.foes||[]).map(a=>({im:svgImg(a.svg),cm:a.cm}))];
  const heroPic=opt.heroSvg?{im:svgImg(opt.heroSvg),cm:opt.heroCm||175}:null;
  const TEAM=[{tunic:['#2f5d8a'],shield:['#3c6e9e'],shieldMain:'#2f63a8',side:-1},{tunic:['#8a2f24'],shield:['#8a2f24'],shieldMain:'#a8321e',side:1}];
  function spawn(team,x,y,isHero,pic){ const T=TEAM[team]; pic=pic||(isHero?heroPic:(pool[team].length?pick(pool[team]):null)); const s={team,x,y,pic,vx:0,vy:0,dir:team===0?1:-1,hp:isHero?99:rint(2,4),state:'run',foe:null,ph:rnd(0,TAU),swing:0,hit:0,
      tunic:pick(T.tunic),sh:pick(T.shield),helm:Math.random()<0.7,weapon:pick(['axe','sword','spear','axe']),beard:Math.random()<0.6?pick(['#5a3a1a','#c9a24a','#2a2018','#a0522d','#ddd']):null,skin:pick(['#f2c9a5','#e0b08a','#c98e66','#8a5a3c']),hero:!!isHero,size:isHero?1.1:rnd(0.92,1.06)};
    if(isHero){ s.tunic='#f2c14e'; s.sh='#b8861e'; s.helm=true; s.weapon='axe'; } sol.push(s); return s; }
  // 땅 위 좌표: x 0~1, y 0~1 (0=수평선 바로 아래, 1=화면 맨 아래)
  const GY0=0.5;
  const sx=(s,W)=>s.x*W, sy=(s,H)=>H*(GY0+(1-GY0)*s.y), sc=s=>lerp(0.55,1.15,s.y)*s.size;
  const BASE=0.22; // 175cm 사람이 맨 앞에 섰을 때 화면 높이 대비
  function picH(s,H){ const cm=s.pic?s.pic.cm:175; return H*BASE*lerp(0.55,1.0,s.y)*Math.pow(clamp(cm,40,500)/175,0.85); }
  function drawWeapon(c,h,kind,a){ c.save(); c.rotate(a); c.lineCap='round';
    if(kind==='spear'){ c.strokeStyle='#6b4a2b'; c.lineWidth=h*0.025; c.beginPath(); c.moveTo(0,h*0.1); c.lineTo(0,-h*0.5); c.stroke(); c.fillStyle='#c9ced2'; c.beginPath(); c.moveTo(0,-h*0.62); c.lineTo(-h*0.03,-h*0.5); c.lineTo(h*0.03,-h*0.5); c.fill(); }
    else if(kind==='sword'){ c.strokeStyle='#dfe4e8'; c.lineWidth=h*0.028; c.beginPath(); c.moveTo(0,0); c.lineTo(0,-h*0.36); c.stroke(); c.strokeStyle='#4a4a4a'; c.lineWidth=h*0.022; c.beginPath(); c.moveTo(-h*0.05,0); c.lineTo(h*0.05,0); c.stroke(); }
    else { c.strokeStyle='#6b4a2b'; c.lineWidth=h*0.025; c.beginPath(); c.moveTo(0,h*0.05); c.lineTo(0,-h*0.3); c.stroke(); c.fillStyle='#b9c0c6'; c.beginPath(); c.moveTo(0,-h*0.3); c.quadraticCurveTo(h*0.13,-h*0.34,h*0.14,-h*0.2); c.lineTo(0,-h*0.19); c.fill(); }
    c.restore(); }
  function drawSoldier(c,W,H,s){ const x=sx(s,W), y=sy(s,H), h=picH(s,H), w=h*200/258;
    if(s.state==='dead') return;
    const run=s.state==='run'||s.state==='flee', ph=s.ph+t*(run?13:5);
    const sw=s.swing>0?Math.sin((1-s.swing)*Math.PI):0;
    c.fillStyle='rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(x,y,w*0.3,h*0.035,0,0,TAU); c.fill();
    c.save(); c.translate(x+s.dir*sw*w*0.18,y-(run?Math.abs(Math.sin(ph))*h*0.05:0)); c.rotate(s.dir*(run?0.1+Math.sin(ph)*0.05:sw*0.22)-s.dir*0.3*s.hit); c.scale(s.dir,1);
    if(s.pic&&s.pic.im.complete&&s.pic.im.naturalWidth) c.drawImage(s.pic.im,-w/2,-h,w,h); else { c.fillStyle=s.tunic; c.fillRect(-w*0.15,-h*0.8,w*0.3,h*0.8); }
    // 무기 (앞손)와 팀 방패 (팀 구분)
    c.save(); c.translate(w*0.24,-h*0.5); drawWeapon(c,h,s.weapon,-0.5+sw*2.2); c.restore();
    if(sw>0.75){ c.strokeStyle='rgba(255,255,255,.85)'; c.lineWidth=2; c.beginPath(); c.arc(w*0.25,-h*0.55,h*0.32,-1.2,0.5); c.stroke(); }
    c.restore();
    if(s.hero){ c.font=`800 ${Math.round(11*W/420)}px system-ui,sans-serif`; c.textAlign='center'; c.fillStyle='#ffd76a'; c.strokeStyle='rgba(0,0,0,.75)'; c.lineWidth=3; c.strokeText(opt.heroName||'나',x,y-h*1.06); c.fillText(opt.heroName||'나',x,y-h*1.06);
      c.fillStyle='#ffd76a'; c.beginPath(); c.moveTo(x-5,y-h*1.03); c.lineTo(x+5,y-h*1.03); c.lineTo(x,y-h*0.97); c.fill(); } }
  function drawCorpse(c,W,H,s){ const x=sx(s,W), y=sy(s,H), h=picH(s,H), w=h*200/258, u=Math.min(1,(t-s.dieT)/0.45);
    if(s.pool){ c.fillStyle=`rgba(120,10,10,${0.6*Math.min(1,(t-s.dieT))})`; c.beginPath(); c.ellipse(x-s.dir*h*0.35,y,h*0.42*Math.min(1,(t-s.dieT)*0.8),h*0.06,0,0,TAU); c.fill(); }
    c.save(); c.translate(x,y); c.scale(s.dir,1); c.rotate(-Math.PI/2*ease(u)); c.globalAlpha=Math.max(0.3,1-(t-s.dieT)/14);
    if(s.pic&&s.pic.im.complete&&s.pic.im.naturalWidth) c.drawImage(s.pic.im,-w/2,-h,w,h); c.restore(); c.globalAlpha=1; }
  function blood(x,y,n,pow){ for(let i=0;i<n;i++) fx.push({k:'b',x,y,vx:rnd(-1,1)*pow,vy:rnd(-1.6,-0.3)*pow,t0:t,life:rnd(0.5,0.9),r:rnd(1.2,2.8)}); }
  function kill(s,by){ if(s.state==='dead') return; s.state='dead'; s.dieT=t; s.pool=true; if(by) s.dir=by.x<s.x?-1:1; corpses.push(s); blood(s.x,s.y,10,1);
    if(by&&by.foe===s) by.foe=null; sol.forEach(q=>{ if(q.foe===s) q.foe=null; }); }
  function nearestFoe(s){ let best=null, bd=1e9; sol.forEach(q=>{ if(q.team===s.team||q.state==='dead'||q===s) return; const d=Math.hypot(q.x-s.x,(q.y-s.y)*1.6); if(d<bd){ bd=d; best=q; } }); return best; }
  // 장면 이벤트 (index.html에서 호출)
  const api={
    land(){ phase='land'; phaseT=t; },
    heroKill(n){ if(!hero||heroDead) return; for(let i=0;i<(n||1);i++){ let f=hero.foe&&hero.foe.state!=='dead'?hero.foe:nearestFoe(hero); if(!f){ f=spawn(1,clamp(hero.x+0.08,0,1),hero.y); } hero.swing=1; setTimeout(()=>{ kill(f,hero); shake=Math.max(shake,4); },220*i+180); } },
    heroHit(){ if(!hero||heroDead) return; hero.hit=1; blood(hero.x,hero.y,7,0.8); shake=Math.max(shake,6); flash=0.25; },
    heroDie(){ if(!hero||heroDead) return; heroDead=true; const f=nearestFoe(hero); kill(hero,f); shake=10; flash=0.6; },
    allyFall(){ const a=sol.filter(s=>s.team===0&&!s.hero&&s.state!=='dead'); if(a.length) kill(pick(a),null); },
    volley(){ for(let i=0;i<14;i++) arrows.push({x:rnd(0.65,1.05),y:rnd(-0.3,-0.05),vx:rnd(-0.55,-0.4),vy:rnd(0.15,0.3),t0:t+rnd(0,0.4)}); },
    general(){ genOn=true; gen={t0:t}; sol.forEach(s=>{ if(s.team===1&&s.state!=='dead'){ s.state='flee'; } });
      const g=spawn(1,1.08,hero?hero.y:0.6,false,genIm?{im:genIm,cm:opt.genCm||180}:null); g.isGen=true; g.weapon='axe'; g.state='idle'; gen.s=g; },
    stop(){ stop(); },
    _sol:sol
  };
  function update(dt){
    t+=dt; shake*=Math.pow(0.02,dt); flash=Math.max(0,flash-dt*1.6);
    if(phase==='land'&&t-phaseT>1.4){ phase='melee'; phaseT=t;
      hero=spawn(0,0.32,0.55,true); for(let i=0;i<9;i++) spawn(0,rnd(0.02,0.3),rnd(0.1,0.95)); for(let i=0;i<11;i++) spawn(1,rnd(0.7,1.05),rnd(0.1,0.95)); }
    if(phase==='melee'&&!genOn){ // 마구 튀어나옴
      const live=t=>sol.filter(s=>s.team===t&&s.state!=='dead').length;
      if(live(0)<12&&Math.random()<dt*2.4) spawn(0,rnd(-0.08,0.02),rnd(0.05,0.98));
      if(live(1)<14&&Math.random()<dt*2.8) spawn(1,rnd(1,1.08),rnd(0.05,0.98));
      if(Math.random()<dt*0.18) api.volley(); }
    sol.forEach(s=>{ if(s.state==='dead') return; s.swing=Math.max(0,s.swing-dt*2.2); s.hit=Math.max(0,s.hit-dt*3);
      if(s.state==='flee'){ s.dir=1; s.x+=0.22*dt; if(s.x>1.15) s.state='dead', s.gone=true; return; }
      if(s.isGen){ const tx=(hero?hero.x:0.4)+0.2; s.dir=-1; if(s.x>tx){ s.x-=0.12*dt; s.state='run'; } else s.state='idle'; return; }
      if(s.hero&&genOn){ s.foe=null; const tx=0.38; s.x+=clamp(tx-s.x,-0.1*dt,0.1*dt); s.state=Math.abs(tx-s.x)>0.01?'run':'idle'; s.dir=1; return; }
      if(genOn&&!s.hero){ // 동료들은 물러서서 둘을 둘러싸고 지켜봄
        if(s.ring==null){ s.ring=[rnd(0.02,(hero?hero.x:0.4)-0.14),Math.random()<0.5?rnd(0,0.3):rnd(0.85,1)]; }
        const dx=s.ring[0]-s.x, dy=s.ring[1]-s.y, d=Math.hypot(dx,dy); if(d>0.01){ s.state='run'; s.x+=dx/d*0.14*dt; s.y+=dy/d*0.1*dt; s.dir=dx>=0?1:-1; } else { s.state='idle'; s.dir=1; } return; }
      if(!s.foe||s.foe.state==='dead') s.foe=nearestFoe(s);
      const f=s.foe; if(!f){ s.state='idle'; return; }
      const dx=f.x-s.x, dy=f.y-s.y, d=Math.hypot(dx,dy*1.6); s.dir=dx>=0?1:-1;
      if(d>0.1){ s.state='run'; const sp=(s.hero?0.16:rnd(0.12,0.2))*dt; s.x+=dx/d*sp; s.y+=dy/d*sp*0.6; }
      else { s.state='fight'; if(s.swing<=0&&Math.random()<dt*1.8){ s.swing=1;
          if(!s.hero&&!f.hero&&Math.random()<0.45){ setTimeout(()=>{ if(s.state!=='dead'&&f.state!=='dead'){ f.hit=1; f.hp--; blood(f.x,f.y,4,0.6); if(f.hp<=0) kill(f,s); } },220); } } }
      s.y=clamp(s.y,0,1); });
    // 시체는 오래되면 치움
    for(let i=sol.length-1;i>=0;i--){ const s=sol[i]; if(s.gone||(s.state==='dead'&&t-s.dieT>16)) sol.splice(i,1); }
    fx.forEach(f=>{ f.vy+=3*dt; f.x+=f.vx*dt*0.12; f.y+=f.vy*dt*0.12; });
    for(let i=fx.length-1;i>=0;i--) if(t-fx[i].t0>fx[i].life) fx.splice(i,1);
    arrows.forEach(a=>{ if(t<a.t0) return; a.x+=a.vx*dt; a.y+=a.vy*dt; a.vy+=0.25*dt; });
    for(let i=arrows.length-1;i>=0;i--){ const a=arrows[i]; if(a.y>rnd(0.3,1)){ if(Math.random()<0.3){ const v=sol.find(s=>s.team===0&&!s.hero&&s.state!=='dead'&&Math.abs(s.x-a.x)<0.05); if(v) kill(v,null); } arrows.splice(i,1); } }
    if(Math.random()<dt*3) smoke.push({x:rnd(0.75,0.95),y:0.47,r:rnd(6,12),t0:t,life:rnd(3,5),vx:rnd(-0.01,0.01)});
    for(let i=smoke.length-1;i>=0;i--) if(t-smoke[i].t0>smoke[i].life) smoke.splice(i,1);
  }
  function drawSea(c,W,H,y0,y1,dark){ const g=c.createLinearGradient(0,y0,0,y1); g.addColorStop(0,dark?'#3b5566':'#4f7488'); g.addColorStop(1,dark?'#1c2c38':'#24394a'); c.fillStyle=g; c.fillRect(0,y0,W,y1-y0);
    c.strokeStyle='rgba(220,235,245,.35)'; c.lineWidth=1.2; for(let r=0;r<9;r++){ const yy=lerp(y0,y1,(r+0.5)/9), amp=2+r*0.8; c.beginPath(); for(let x=0;x<=W;x+=8){ const yv=yy+Math.sin(x*0.03+t*(1.5+r*0.2)+r)*amp; x?c.lineTo(x,yv):c.moveTo(x,yv); } c.stroke(); } }
  function stormSky(c,W,H,y){ const g=c.createLinearGradient(0,0,0,y); g.addColorStop(0,'#3d4752'); g.addColorStop(1,'#8c8a80'); c.fillStyle=g; c.fillRect(0,0,W,y);
    for(let i=0;i<7;i++){ const x=((i*0.19+t*0.008*(1+i%3))%1.3-0.15)*W, yy=(0.08+(i%3)*0.1)*y*2; c.fillStyle='rgba(60,66,74,.75)'; c.beginPath(); c.ellipse(x,yy,W*0.16,y*0.09,0,0,TAU); c.fill(); } }
  function longship(c,x,y,s,row){ c.save(); c.translate(x,y); c.scale(s,s);
    // 노
    c.strokeStyle='#5a3a1c'; c.lineWidth=2; for(let i=0;i<7;i++){ const ox=-46+i*15, a=Math.sin(row+i*0.2)*0.45; c.beginPath(); c.moveTo(ox,4); c.lineTo(ox+Math.sin(a)*18-8,26+Math.cos(a)*4); c.stroke(); }
    // 선체
    c.fillStyle='#6b4423'; c.beginPath(); c.moveTo(-70,-4); c.quadraticCurveTo(-74,14,-56,18); c.lineTo(52,18); c.quadraticCurveTo(70,14,72,-4); c.closePath(); c.fill();
    c.strokeStyle='#4a2c14'; c.lineWidth=1.5; c.beginPath(); c.moveTo(-68,4); c.lineTo(70,4); c.moveTo(-62,11); c.lineTo(64,11); c.stroke();
    // 용머리 뱃머리와 꼬리
    c.fillStyle='#6b4423'; c.beginPath(); c.moveTo(66,-4); c.quadraticCurveTo(84,-20,80,-42); c.quadraticCurveTo(92,-46,94,-38); c.quadraticCurveTo(88,-36,86,-32); c.quadraticCurveTo(84,-14,72,-2); c.fill();
    c.fillStyle='#ffdd55'; c.beginPath(); c.arc(88,-40,1.6,0,TAU); c.fill();
    c.fillStyle='#6b4423'; c.beginPath(); c.moveTo(-66,-4); c.quadraticCurveTo(-82,-16,-78,-34); c.quadraticCurveTo(-72,-30,-74,-16); c.quadraticCurveTo(-70,-8,-60,-2); c.fill();
    // 방패 줄
    const sc2=['#d9b44a','#3c6e9e','#e8e2d0','#8a2f24']; for(let i=0;i<9;i++){ c.fillStyle=sc2[i%4]; c.beginPath(); c.arc(-52+i*13,-3,5.5,0,TAU); c.fill(); c.fillStyle='#ccc'; c.beginPath(); c.arc(-52+i*13,-3,1.4,0,TAU); c.fill(); }
    // 돛대와 돛
    c.fillStyle='#4a2c14'; c.fillRect(-2,-78,4,76); const bw=Math.sin(t*1.5)*3;
    c.fillStyle='#e8dcc0'; c.beginPath(); c.moveTo(-34,-72); c.quadraticCurveTo(0+bw,-70,34,-72); c.lineTo(36,-20); c.quadraticCurveTo(0+bw*2,-12,-36,-20); c.closePath(); c.fill();
    c.save(); c.clip(); c.fillStyle='#a8321e'; for(let i=-3;i<4;i+=2) c.fillRect(i*10-5,-80,10,70); c.restore();
    c.fillStyle='#4a2c14'; c.fillRect(-38,-76,76,3);
    // 탄 전사들 머리
    for(let i=0;i<8;i++){ c.fillStyle=i%3?'#8f969c':'#e8c25a'; c.beginPath(); c.arc(-44+i*12,-10,4,Math.PI,0); c.fill(); }
    c.restore(); }
  function frame(now){ if(!alive) return; raf=requestAnimationFrame(frame); if(!cv.isConnected){ stop(); return; }
    const dt=Math.min(0.05,(now-last)/1000); last=now; update(dt);
    const {c,W,H}=fitCanvas(cv); c.save(); if(shake>0.3) c.translate(rnd(-shake,shake),rnd(-shake,shake));
    if(phase==='sail'||phase==='land'){ const hz=H*0.42; stormSky(c,W,H,hz);
      // 다가오는 해안
      const p=phase==='land'?1:Math.min(1,t/3.2), shoreX=lerp(W*1.15,W*0.62,ease(p));
      c.fillStyle='#4b5a3a'; c.beginPath(); c.moveTo(shoreX,hz); c.quadraticCurveTo(shoreX+W*0.1,hz-H*0.12,W*1.2,hz-H*0.16); c.lineTo(W*1.2,H); c.lineTo(shoreX+W*0.05,H); c.fill();
      c.fillStyle='#c8b98a'; c.beginPath(); c.moveTo(shoreX-W*0.04,H); c.quadraticCurveTo(shoreX-W*0.02,hz+H*0.2,shoreX,hz); c.lineTo(shoreX+W*0.06,hz); c.lineTo(shoreX+W*0.1,H); c.fill();
      // 불타는 마을 연기
      smoke.forEach(sm=>{ const u=(t-sm.t0)/sm.life; c.fillStyle=`rgba(60,60,60,${0.5*(1-u)})`; c.beginPath(); c.arc(lerp(shoreX+W*0.08,shoreX+W*0.3,(sm.x-0.75)/0.2)+u*20,hz-H*0.1-u*H*0.3,sm.r*(1+u*2),0,TAU); c.fill(); });
      drawSea(c,W,shoreX,hz,H,true);
      const bx=phase==='land'?lerp(W*0.42,W*0.52,Math.min(1,(t-phaseT)/0.6)):lerp(-W*0.25,W*0.42,ease(Math.min(1,t/3.2))), by=H*0.72+Math.sin(t*2.2)*4;
      longship(c,bx-W*0.32,by-H*0.1,W/700,t*3.2+1); longship(c,bx-W*0.12,by-H*0.16,W/900,t*3.2+2);
      longship(c,bx,by,W/380,t*3.2); c.save(); c.translate(bx,by); c.rotate(Math.sin(t*1.7)*0.02); c.restore();
      // 물보라
      c.fillStyle='rgba(235,245,250,.7)'; for(let i=0;i<6;i++){ const u=(t*1.6+i/6)%1; c.beginPath(); c.arc(bx+W*0.2-u*W*0.06,by+H*0.05-Math.sin(u*Math.PI)*12,2+u*2,0,TAU); c.fill(); }
      // 비
      c.strokeStyle='rgba(220,230,240,.35)'; c.lineWidth=1; c.beginPath(); for(let i=0;i<70;i++){ const x=((i*53.7+t*300)%(W+40))-20, y=((i*97.3+t*620)%H); c.moveTo(x,y); c.lineTo(x-4,y+12); } c.stroke();
      c.font=`900 ${Math.round(W/16)}px serif`; c.textAlign='center'; c.fillStyle='#f3e6c8'; c.strokeStyle='rgba(0,0,0,.7)'; c.lineWidth=4; const tx=phase==='land'?'상륙하라!':'노를 저어라! 적의 해안이다!'; c.globalAlpha=phase==='land'?Math.min(1,(t-phaseT)*3):Math.min(1,t*1.5); c.strokeText(tx,W/2,H*0.18); c.fillText(tx,W/2,H*0.18); c.globalAlpha=1;
    } else {
      // 전장: 하늘·바다·해안·불타는 마을
      const hz=H*GY0; stormSky(c,W,H,hz*0.75);
      drawSea(c,W*0.3,W,hz*0.75,hz,true);
      c.fillStyle='#55603f'; c.beginPath(); c.moveTo(W*0.25,hz*0.75); c.quadraticCurveTo(W*0.6,hz*0.62,W,hz*0.6); c.lineTo(W,hz); c.lineTo(W*0.22,hz); c.fill();
      // 불타는 집
      for(let i=0;i<3;i++){ const hx=W*(0.66+i*0.11), hy=hz*0.86; c.fillStyle='#3a2a1c'; c.fillRect(hx-14,hy-12,28,12); c.fillStyle='#2a1c10'; c.beginPath(); c.moveTo(hx-17,hy-12); c.lineTo(hx,hy-24); c.lineTo(hx+17,hy-12); c.fill();
        for(let k=0;k<3;k++){ const fh=12+Math.sin(t*10+k+i)*4; c.fillStyle=k%2?'#ffb030':'#ff5a1a'; c.beginPath(); c.moveTo(hx-8+k*7,hy-18); c.quadraticCurveTo(hx-9+k*7,hy-18-fh*0.6,hx-5+k*7,hy-18-fh); c.quadraticCurveTo(hx-2+k*7,hy-18-fh*0.5,hx-1+k*7,hy-18); c.fill(); } }
      smoke.forEach(sm=>{ const u=(t-sm.t0)/sm.life; c.fillStyle=`rgba(50,50,50,${0.45*(1-u)})`; c.beginPath(); c.arc(sm.x*W+u*30,hz*0.8-u*hz*0.6,sm.r*(1+u*2.5),0,TAU); c.fill(); });
      // 정박한 배 (왼쪽)
      longship(c,W*0.08,hz*0.86,W/900,t);
      // 땅
      const g=c.createLinearGradient(0,hz,0,H); g.addColorStop(0,'#7a6a48'); g.addColorStop(.3,'#6a5a3a'); g.addColorStop(1,'#4a3d28'); c.fillStyle=g; c.fillRect(0,hz,W,H-hz);
      c.fillStyle='rgba(30,20,10,.15)'; for(let i=0;i<40;i++){ const x=(i*97.3%W), y=hz+((i*53.1)%(H-hz)); c.beginPath(); c.ellipse(x,y,6+i%5*2,2,0,0,TAU); c.fill(); }
      // 시체 → 산 사람 (깊이 순)
      sol.filter(s=>s.state==='dead'&&!s.gone).sort((a,b)=>a.y-b.y).forEach(s=>drawCorpse(c,W,H,s));
      sol.filter(s=>s.state!=='dead').sort((a,b)=>a.y-b.y).forEach(s=>drawSoldier(c,W,H,s));
      // 적장 등장
      if(genOn){ const u=Math.min(1,(t-gen.t0)/1.2);
        c.globalAlpha=Math.min(1,u*1.5); c.font=`900 ${Math.round(W/13)}px serif`; c.textAlign='center'; c.fillStyle='#ff6b4a'; c.strokeStyle='rgba(0,0,0,.8)'; c.lineWidth=5; c.strokeText('적장이 나타났다!',W/2,H*0.2); c.fillText('적장이 나타났다!',W/2,H*0.2);
        if(opt.genName){ c.font=`800 ${Math.round(W/26)}px system-ui,sans-serif`; c.fillStyle='#f3e6c8'; c.lineWidth=4; c.strokeText(opt.genName,W/2,H*0.27); c.fillText(opt.genName,W/2,H*0.27); } c.globalAlpha=1; }
      // 화살
      c.strokeStyle='#2a2018'; c.lineWidth=1.3; arrows.forEach(a=>{ if(t<a.t0) return; const x=a.x*W, y=H*(GY0+(1-GY0)*Math.max(-1,a.y)); const ang=Math.atan2(a.vy,a.vx); c.beginPath(); c.moveTo(x,y); c.lineTo(x-Math.cos(ang)*12,y-Math.sin(ang)*12); c.stroke(); });
      // 피
      fx.forEach(f=>{ if(f.k!=='b') return; const u=(t-f.t0)/f.life; c.fillStyle=`rgba(170,10,10,${1-u})`; c.beginPath(); c.arc(f.x*W,H*(GY0+(1-GY0)*f.y)-H*0.12+(f.vy>0?0:0),f.r,0,TAU); c.fill(); });
      if(heroDead){ c.fillStyle='rgba(80,0,0,.35)'; c.fillRect(0,0,W,H); }
    }
    c.restore();
    if(flash>0){ c.fillStyle=`rgba(200,0,0,${flash*0.6})`; c.fillRect(0,0,W,H); }
    // 가장자리 어둡게
    const vg=c.createRadialGradient(W/2,H/2,Math.min(W,H)*0.3,W/2,H/2,Math.max(W,H)*0.75); vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,.5)'); c.fillStyle=vg; c.fillRect(0,0,W,H);
  }
  function stop(){ alive=false; cancelAnimationFrame(raf); }
  raf=requestAnimationFrame(frame);
  return api;
}
window.BDScenes={Valhalla,War};
})();
