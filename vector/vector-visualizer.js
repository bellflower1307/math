const canvas = document.getElementById('cv');
const ctx = canvas.getContext('2d');
const W=420, H=420, CX=W/2, CY=H/2, SCALE=36;

let va={x:3,y:2}, vb={x:-2,y:3};
let showSum=true;
let dragging=null;
let activeTab='basic';

function toCanvas(x,y){ return {x:CX+x*SCALE, y:CY-y*SCALE}; }
function fromCanvas(cx,cy){ return {x:(cx-CX)/SCALE, y:(CY-cy)/SCALE}; }

/* ── テーマ別キャンバス色 ── */
function cc(){
  const d=document.body.classList.contains('dark');
  return {
    bg:          d ? '#07101f' : '#f8f9fb',
    grid:        d ? '#111e38' : '#e8edf4',
    axis:        d ? '#2a3a5c' : '#c0cede',
    label:       d ? '#2a4a6c' : '#9aabbe',
    axisLetter:  d ? '#3a5a8c' : '#8a9ab8',
    handleStroke:d ? 'rgba(255,255,255,0.85)' : 'rgba(30,40,60,0.4)',
  };
}

/* ── Draw ── */
function draw(){
  const col=cc();
  ctx.clearRect(0,0,W,H);

  // Background
  ctx.fillStyle=col.bg;
  ctx.fillRect(0,0,W,H);

  // Grid
  ctx.strokeStyle=col.grid;
  ctx.lineWidth=1;
  for(let i=-12;i<=12;i++){
    const cx=CX+i*SCALE, cy=CY+i*SCALE;
    ctx.beginPath(); ctx.moveTo(cx,0); ctx.lineTo(cx,H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0,cy); ctx.lineTo(W,cy); ctx.stroke();
  }

  // Axes
  ctx.strokeStyle=col.axis; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(0,CY); ctx.lineTo(W,CY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(CX,0); ctx.lineTo(CX,H); ctx.stroke();

  // Axis labels
  ctx.fillStyle=col.label; ctx.font='10px monospace'; ctx.textAlign='center';
  for(let i=-5;i<=5;i++){
    if(i===0) continue;
    ctx.fillText(i, CX+i*SCALE, CY+14);
    ctx.textAlign='right';
    ctx.fillText(-i, CX-6, CY-i*SCALE+4);
    ctx.textAlign='center';
  }
  ctx.fillStyle=col.axisLetter;
  ctx.fillText('x', W-10, CY-6);
  ctx.textAlign='right';
  ctx.fillText('y', CX+16, 12);

  const pa=toCanvas(va.x,va.y);
  const pb=toCanvas(vb.x,vb.y);
  const ps=toCanvas(va.x+vb.x, va.y+vb.y);
  const o=toCanvas(0,0);

  // Parallelogram (cross product visual)
  if(activeTab==='cross'){
    ctx.beginPath();
    ctx.moveTo(o.x,o.y);
    ctx.lineTo(pa.x,pa.y);
    ctx.lineTo(ps.x,ps.y);
    ctx.lineTo(pb.x,pb.y);
    ctx.closePath();
    ctx.fillStyle='#4ade8018';
    ctx.fill();
    ctx.strokeStyle='#4ade8044';
    ctx.lineWidth=1;
    ctx.stroke();
  }

  // Projection line
  if(activeTab==='proj'){
    const magB2=vb.x*vb.x+vb.y*vb.y;
    if(magB2>0.001){
      const s=(va.x*vb.x+va.y*vb.y)/magB2;
      const px=s*vb.x, py=s*vb.y;
      const pp=toCanvas(px,py);
      ctx.setLineDash([4,3]);
      ctx.strokeStyle='#fb923c88'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(pa.x,pa.y); ctx.lineTo(pp.x,pp.y); ctx.stroke();
      ctx.setLineDash([]);
      drawArrow(o.x,o.y,pp.x,pp.y,'#fb923c',3);
      ctx.fillStyle='#fb923c'; ctx.font='bold 12px monospace'; ctx.textAlign='center';
      ctx.fillText('proj', (o.x+pp.x)/2-14, (o.y+pp.y)/2-8);
    }
  }

  // Sum vector
  if(showSum){
    ctx.setLineDash([5,4]);
    ctx.strokeStyle='#a78bfa44'; ctx.lineWidth=1.2;
    ctx.beginPath(); ctx.moveTo(pa.x,pa.y); ctx.lineTo(ps.x,ps.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pb.x,pb.y); ctx.lineTo(ps.x,ps.y); ctx.stroke();
    ctx.setLineDash([]);
    drawArrow(o.x,o.y,ps.x,ps.y,'#a78bfa',3);
    ctx.fillStyle='#a78bfa'; ctx.font='bold 13px monospace'; ctx.textAlign='left';
    ctx.fillText('a+b', ps.x+6, ps.y-6);
  }

  // Vector a
  drawArrow(o.x,o.y,pa.x,pa.y,'#f472b6',3.5);
  ctx.fillStyle='#f472b6'; ctx.font='bold 14px monospace'; ctx.textAlign='left';
  ctx.fillText('a', pa.x+7, pa.y-6);

  // Vector b
  drawArrow(o.x,o.y,pb.x,pb.y,'#38bdf8',3.5);
  ctx.fillStyle='#38bdf8'; ctx.font='bold 14px monospace';
  ctx.fillText('b', pb.x+7, pb.y-6);

  // Angle arc between a and b
  if(activeTab==='dot'){
    const magA=Math.sqrt(va.x**2+va.y**2);
    const magB=Math.sqrt(vb.x**2+vb.y**2);
    if(magA>0.1&&magB>0.1){
      const angA=Math.atan2(-va.y,va.x);
      const angB=Math.atan2(-vb.y,vb.x);
      ctx.beginPath();
      ctx.arc(o.x,o.y,30,Math.min(angA,angB),Math.max(angA,angB));
      ctx.strokeStyle='#facc1588'; ctx.lineWidth=1.5;
      ctx.stroke();
      ctx.fillStyle='#facc15'; ctx.font='10px monospace'; ctx.textAlign='center';
      const midAng=(angA+angB)/2;
      ctx.fillText('θ', o.x+40*Math.cos(midAng), o.y+40*Math.sin(midAng));
    }
  }

  updateStats();
}

function drawArrow(x1,y1,x2,y2,color,lw){
  const col=cc();
  const dx=x2-x1, dy=y2-y1;
  const len=Math.sqrt(dx*dx+dy*dy);
  if(len<2) return;
  const nx=dx/len, ny=dy/len;
  const hw=7, hl=14;
  ctx.beginPath();
  ctx.moveTo(x1,y1);
  ctx.lineTo(x2-nx*hl*0.5,y2-ny*hl*0.5);
  ctx.strokeStyle=color; ctx.lineWidth=lw;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2,y2);
  ctx.lineTo(x2-nx*hl-ny*hw, y2-ny*hl+nx*hw);
  ctx.lineTo(x2-nx*hl+ny*hw, y2-ny*hl-nx*hw);
  ctx.closePath();
  ctx.fillStyle=color; ctx.fill();
  ctx.beginPath();
  ctx.arc(x2,y2,7,0,Math.PI*2);
  ctx.fillStyle=color+'88'; ctx.fill();
  ctx.strokeStyle=col.handleStroke; ctx.lineWidth=1.5; ctx.stroke();
}

/* ── Stats ── */
function updateStats(){
  const magA=Math.sqrt(va.x**2+va.y**2);
  const magB=Math.sqrt(vb.x**2+vb.y**2);
  const sx=va.x+vb.x, sy=va.y+vb.y;
  const magS=Math.sqrt(sx**2+sy**2);
  const dot=va.x*vb.x+va.y*vb.y;
  const cross=va.x*vb.y-va.y*vb.x;
  const angA=Math.atan2(va.y,va.x)*180/Math.PI;
  const angB=Math.atan2(vb.y,vb.x)*180/Math.PI;
  const fmt=v=>v.toFixed(2);

  document.getElementById('mag-a').textContent=fmt(magA);
  document.getElementById('mag-b').textContent=fmt(magB);
  document.getElementById('ang-a').textContent=fmt(angA)+'°';
  document.getElementById('ang-b').textContent=fmt(angB)+'°';
  document.getElementById('sum-vec').textContent=`(${fmt(sx)}, ${fmt(sy)})`;
  document.getElementById('mag-sum').textContent=fmt(magS);

  document.getElementById('dot-val').textContent=fmt(dot);
  let theta=0;
  if(magA>0.001&&magB>0.001){
    theta=Math.acos(Math.max(-1,Math.min(1,dot/(magA*magB))))*180/Math.PI;
  }
  document.getElementById('dot-angle').textContent=fmt(theta)+'°';
  const maxDot=magA*magB||1;
  const pct=Math.round((dot/maxDot+1)/2*100);
  const bar=document.getElementById('dp-bar');
  bar.style.width=pct+'%';
  bar.style.background=dot>0.01?'#4ade80':dot<-0.01?'#f472b6':'#facc15';
  const meaning=document.getElementById('dot-meaning');
  if(Math.abs(dot)<0.05){ meaning.innerHTML='<span style="color:#facc15">直角（90°）</span>　a ⊥ b'; }
  else if(dot>0){ meaning.innerHTML=`<span style="color:#4ade80">鋭角（${fmt(theta)}°）</span>　内積 > 0`; }
  else { meaning.innerHTML=`<span style="color:#f472b6">鈍角（${fmt(theta)}°）</span>　内積 < 0`; }

  document.getElementById('cross-val').textContent=fmt(Math.abs(cross));
  document.getElementById('cross-area').textContent=fmt(Math.abs(cross));
  document.getElementById('cross-tri').textContent=fmt(Math.abs(cross)/2);

  const magB2=vb.x**2+vb.y**2;
  if(magB2>0.001){
    const s=dot/magB2;
    document.getElementById('proj-scalar').textContent=fmt(dot/(magB||1));
    document.getElementById('proj-vx').textContent=fmt(s*vb.x);
    document.getElementById('proj-vy').textContent=fmt(s*vb.y);
  }

  ['ax','ay','bx','by'].forEach(id=>{
    document.getElementById(id+'-lbl').textContent=document.getElementById(id).value;
  });
}

/* ── Drag ── */
function getPos(e){
  const r=canvas.getBoundingClientRect();
  const t=e.touches?e.touches[0]:e;
  return {x:t.clientX-r.left, y:t.clientY-r.top};
}
function hitTest(cx,cy,vx,vy,r){
  const p=toCanvas(vx,vy);
  return Math.sqrt((cx-p.x)**2+(cy-p.y)**2)<r;
}
canvas.addEventListener('mousedown',e=>{ const {x,y}=getPos(e); if(hitTest(x,y,va.x,va.y,14)) dragging='a'; else if(hitTest(x,y,vb.x,vb.y,14)) dragging='b'; });
canvas.addEventListener('mousemove',e=>{ if(!dragging) return; const {x,y}=getPos(e); const p=fromCanvas(x,y); const snap=v=>Math.round(v*2)/2; if(dragging==='a'){va={x:snap(p.x),y:snap(p.y)};syncSliders();}else{vb={x:snap(p.x),y:snap(p.y)};syncSliders();} draw(); });
canvas.addEventListener('mouseup',()=>dragging=null);
canvas.addEventListener('mouseleave',()=>dragging=null);
canvas.addEventListener('touchstart',e=>{e.preventDefault(); const {x,y}=getPos(e); if(hitTest(x,y,va.x,va.y,18)) dragging='a'; else if(hitTest(x,y,vb.x,vb.y,18)) dragging='b';},{passive:false});
canvas.addEventListener('touchmove',e=>{e.preventDefault(); if(!dragging) return; const {x,y}=getPos(e); const p=fromCanvas(x,y); const snap=v=>Math.round(v*2)/2; if(dragging==='a'){va={x:snap(p.x),y:snap(p.y)};syncSliders();}else{vb={x:snap(p.x),y:snap(p.y)};syncSliders();} draw();},{passive:false});
canvas.addEventListener('touchend',()=>dragging=null);

function syncSliders(){
  document.getElementById('ax').value=va.x;
  document.getElementById('ay').value=va.y;
  document.getElementById('bx').value=vb.x;
  document.getElementById('by').value=vb.y;
}

function onSlider(){
  va={x:+document.getElementById('ax').value, y:+document.getElementById('ay').value};
  vb={x:+document.getElementById('bx').value, y:+document.getElementById('by').value};
  draw();
}

function resetVectors(){ va={x:3,y:2}; vb={x:-2,y:3}; syncSliders(); draw(); }

function toggleSum(){
  showSum=!showSum;
  const btn=document.getElementById('show-sum-btn');
  const dark=document.body.classList.contains('dark');
  btn.textContent=showSum?'合成ベクトル 表示中':'合成ベクトル 非表示';
  btn.style.background=showSum?'#a78bfa22':(dark?'#0f1f3d':'#e8edf2');
  draw();
}

function switchTab(t){
  activeTab=t;
  ['basic','dot','cross','proj'].forEach(n=>{
    document.getElementById('panel-'+n).classList.toggle('active',n===t);
    document.getElementById('tab-'+n).classList.toggle('active',n===t);
  });
  draw();
}

/* ── テーマ初期化 ── */
const _saved=localStorage.getItem('math-theme');
if(_saved==='dark') document.body.classList.add('dark');

draw();

const _themeBtn=document.getElementById('theme-toggle');
_themeBtn.textContent=document.body.classList.contains('dark')?'☀ ライト':'🌙 ダーク';
_themeBtn.addEventListener('click',()=>{
  document.body.classList.toggle('dark');
  const dark=document.body.classList.contains('dark');
  localStorage.setItem('math-theme', dark?'dark':'light');
  _themeBtn.textContent=dark?'☀ ライト':'🌙 ダーク';
  draw();
});
