const canvas=document.getElementById('cv');
const ctx=canvas.getContext('2d');
const W=480, H=400;
let xRange=6, yRange=8;
let funcStr='x^2 - 2';
let compiledFn=null;
let aVal=-2, bVal=2, nVal=10, rectType=0, antiA=0;
let activeTab='defint';
const CX=W/2, CY=H/2;

function toC(x,y){ return {x:CX+x/xRange*(W/2-24), y:CY-y/yRange*(H/2-20)}; }
function fromCx(cx){ return (cx-CX)/(W/2-24)*xRange; }

/* ── テーマ別キャンバス色 ── */
function cc(){
  const d=document.body.classList.contains('dark');
  return {
    bg:         d ? '#07101f' : '#f8f9fb',
    grid:       d ? '#111e38' : '#e8edf4',
    axis:       d ? '#2a3a5c' : '#c0cede',
    label:      d ? '#2a4a6c' : '#9aabbe',
    axisLetter: d ? '#3a5a8c' : '#8a9ab8',
  };
}

function compileFn(s){
  s=s.replace(/\^/g,'**')
    .replace(/\blog\b/g,'Math.log').replace(/\bln\b/g,'Math.log')
    .replace(/\bsqrt\b/g,'Math.sqrt').replace(/\babs\b/g,'Math.abs')
    .replace(/\bsin\b/g,'Math.sin').replace(/\bcos\b/g,'Math.cos')
    .replace(/\btan\b/g,'Math.tan').replace(/\bexp\b/g,'Math.exp')
    .replace(/\bpi\b/g,'Math.PI').replace(/\be\b/g,'Math.E')
    .replace(/(\d)(x)/g,'$1*$2');
  return new Function('x','return '+s+';');
}
function tryCompile(s){
  try{ const f=compileFn(s); f(1); return f; }catch(e){ return null; }
}

function integrate(fn,a,b,n=500){
  if(Math.abs(b-a)<1e-10) return 0;
  const m=n%2===0?n:n+1;
  const h=(b-a)/m;
  let sum=fn(a)+fn(b);
  for(let i=1;i<m;i++){
    const x=a+i*h;
    const y=fn(x);
    if(!isFinite(y)) continue;
    sum+=(i%2===0?2:4)*y;
  }
  return sum*h/3;
}

function draw(){
  const col=cc();
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle=col.bg; ctx.fillRect(0,0,W,H);
  drawGrid();
  if(!compiledFn) return;
  if(activeTab==='defint') drawFilledArea();
  if(activeTab==='riemann') drawRiemann();
  if(activeTab==='antideriv') drawAntideriv();
  drawFunc();
  updateInfo();
}

function drawGrid(){
  const col=cc();
  ctx.strokeStyle=col.grid; ctx.lineWidth=0.8;
  for(let x=-xRange;x<=xRange;x++){
    const p=toC(x,0);
    ctx.beginPath(); ctx.moveTo(p.x,0); ctx.lineTo(p.x,H); ctx.stroke();
  }
  for(let y=-yRange;y<=yRange;y++){
    const p=toC(0,y);
    ctx.beginPath(); ctx.moveTo(0,p.y); ctx.lineTo(W,p.y); ctx.stroke();
  }
  ctx.strokeStyle=col.axis; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(0,CY); ctx.lineTo(W,CY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(CX,0); ctx.lineTo(CX,H); ctx.stroke();
  ctx.fillStyle=col.label; ctx.font='10px monospace'; ctx.textAlign='center';
  for(let x=-xRange;x<=xRange;x++){
    if(x===0) continue;
    if(xRange>5&&x%2!==0) continue;
    ctx.fillText(x, toC(x,0).x, CY+14);
  }
  ctx.textAlign='right';
  for(let y=-yRange;y<=yRange;y++){
    if(y===0) continue;
    if(yRange>6&&y%2!==0) continue;
    ctx.fillText(y, CX-5, toC(0,y).y+4);
  }
  ctx.fillStyle=col.axisLetter;
  ctx.textAlign='center'; ctx.fillText('x',W-10,CY-8);
  ctx.textAlign='right'; ctx.fillText('y',CX+18,12);
}

function drawFunc(){
  const steps=600;
  ctx.strokeStyle='#38bdf8'; ctx.lineWidth=2.5;
  let drawing=false;
  ctx.beginPath();
  for(let i=0;i<=steps;i++){
    const x=-xRange+(2*xRange*i/steps);
    let y; try{ y=compiledFn(x); }catch(e){ drawing=false; continue; }
    if(!isFinite(y)||isNaN(y)||Math.abs(y)>yRange*3){ drawing=false; continue; }
    const p=toC(x,y);
    if(!drawing){ ctx.moveTo(p.x,p.y); drawing=true; }else ctx.lineTo(p.x,p.y);
  }
  ctx.stroke();
}

function drawFilledArea(){
  const a=Math.min(aVal,bVal), b=Math.max(aVal,bVal);
  const steps=400;
  const ax0=toC(a,0), bx0=toC(b,0);
  const pts=[];
  for(let i=0;i<=steps;i++){
    const x=a+(b-a)*i/steps;
    let y; try{ y=compiledFn(x); }catch(e){ y=0; }
    if(!isFinite(y)) y=0;
    pts.push({x, y:Math.max(-yRange*2,Math.min(yRange*2,y))});
  }
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(ax0.x,ax0.y);
  pts.forEach(p=>ctx.lineTo(toC(p.x,p.y).x,toC(p.x,p.y).y));
  ctx.lineTo(bx0.x,bx0.y); ctx.closePath();
  ctx.fillStyle='#4ade8030'; ctx.fill();
  ctx.strokeStyle='#4ade8088'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(ax0.x,0); ctx.lineTo(ax0.x,H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(bx0.x,0); ctx.lineTo(bx0.x,H); ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(ax0.x,ax0.y);
  pts.forEach(p=>ctx.lineTo(toC(p.x,p.y).x,toC(p.x,p.y).y));
  ctx.lineTo(bx0.x,bx0.y); ctx.closePath();
  ctx.clip();
  ctx.fillStyle='#f472b640';
  const y0=toC(0,0).y;
  ctx.fillRect(toC(a,0).x,y0,toC(b,0).x-toC(a,0).x,H-y0);
  ctx.restore();
  ctx.fillStyle='#38bdf8'; ctx.font='bold 12px monospace'; ctx.textAlign='center';
  ctx.fillText('a='+a.toFixed(1),ax0.x,H-6);
  ctx.fillStyle='#f472b6';
  ctx.fillText('b='+b.toFixed(1),bx0.x,H-6);
}

function drawRiemann(){
  const a=Math.min(aVal,bVal), b=Math.max(aVal,bVal);
  const n=nVal, dx=(b-a)/n;
  for(let i=0;i<n;i++){
    const x0=a+i*dx;
    const xSample=rectType===0?x0:rectType===1?x0+dx:x0+dx/2;
    let fy; try{ fy=compiledFn(xSample); }catch(e){ fy=0; }
    if(!isFinite(fy)) fy=0;
    fy=Math.max(-yRange*2,Math.min(yRange*2,fy));
    const p0=toC(x0,0), p1=toC(x0+dx,0);
    const rectH=toC(0,fy).y-CY;
    ctx.fillStyle=fy>=0?'#a78bfa30':'#f472b630';
    ctx.strokeStyle=fy>=0?'#a78bfa88':'#f472b688';
    ctx.lineWidth=0.8;
    ctx.fillRect(p0.x,Math.min(CY,CY+rectH),p1.x-p0.x,Math.abs(rectH));
    ctx.strokeRect(p0.x,Math.min(CY,CY+rectH),p1.x-p0.x,Math.abs(rectH));
  }
}

function drawAntideriv(){
  const steps=500, a=antiA;
  ctx.strokeStyle='#fb923c'; ctx.lineWidth=2.5;
  let drawing=false;
  ctx.beginPath();
  for(let i=0;i<=steps;i++){
    const x=-xRange+(2*xRange*i/steps);
    const val=integrate(compiledFn,a,x,60);
    if(!isFinite(val)||Math.abs(val)>yRange*3){ drawing=false; continue; }
    const p=toC(x,val);
    if(!drawing){ ctx.moveTo(p.x,p.y); drawing=true; }else ctx.lineTo(p.x,p.y);
  }
  ctx.stroke();
  const pa=toC(a,0);
  ctx.fillStyle='#fb923c'; ctx.font='bold 11px monospace'; ctx.textAlign='center';
  ctx.fillText('F(a)=0',pa.x,pa.y-10);
  ctx.beginPath(); ctx.arc(pa.x,pa.y,5,0,Math.PI*2);
  ctx.fillStyle='#fb923c'; ctx.fill();
  ctx.strokeStyle='white'; ctx.lineWidth=1.5; ctx.stroke();
  ctx.font='11px monospace'; ctx.textAlign='left';
  ctx.fillStyle='#38bdf8'; ctx.fillText('f(x)',10,20);
  ctx.fillStyle='#fb923c'; ctx.fillText('F(x) = ∫f(t)dt',50,20);
}

function updateInfo(){
  if(!compiledFn) return;
  const a=Math.min(aVal,bVal), b=Math.max(aVal,bVal);
  const intVal=integrate(compiledFn,a,b);
  const steps=200, dx2=(b-a)/steps;
  let pos=0, neg=0;
  for(let i=0;i<steps;i++){
    const x=a+(i+0.5)*dx2;
    let y; try{ y=compiledFn(x); }catch(e){ y=0; }
    if(!isFinite(y)) continue;
    if(y>0) pos+=y*dx2; else neg+=y*dx2;
  }
  if(activeTab==='defint'){
    document.getElementById('int-val').textContent=isFinite(intVal)?intVal.toFixed(4):'—';
    document.getElementById('pos-area').textContent=pos.toFixed(4);
    document.getElementById('neg-area').textContent=neg.toFixed(4);
    document.getElementById('abs-area').textContent=(pos-neg).toFixed(4);
    const total=pos+Math.abs(neg)||1;
    document.getElementById('pos-bar').style.flex=pos/total;
    document.getElementById('neg-bar').style.flex=Math.abs(neg)/total;
  }
  if(activeTab==='riemann'){
    const n=nVal, dxR=(b-a)/n;
    let rSum=0;
    for(let i=0;i<n;i++){
      const x0=a+i*dxR;
      const xS=rectType===0?x0:rectType===1?x0+dxR:x0+dxR/2;
      let fy; try{ fy=compiledFn(xS); }catch(e){ fy=0; }
      if(isFinite(fy)) rSum+=fy*dxR;
    }
    document.getElementById('riemann-val').textContent=rSum.toFixed(4);
    document.getElementById('riemann-true').textContent=intVal.toFixed(4);
    document.getElementById('riemann-err').textContent=Math.abs(rSum-intVal).toFixed(4);
  }
  if(activeTab==='antideriv'){
    const fVal=integrate(compiledFn,antiA,aVal);
    document.getElementById('anti-val').textContent=isFinite(fVal)?fVal.toFixed(4):'—';
  }
}

function onAB(){
  aVal=+document.getElementById('a-slider').value;
  bVal=+document.getElementById('b-slider').value;
  document.getElementById('a-lbl').textContent=aVal.toFixed(2);
  document.getElementById('b-lbl').textContent=bVal.toFixed(2);
  draw();
}
function onN(){
  nVal=+document.getElementById('n-slider').value;
  document.getElementById('n-lbl').textContent=nVal;
  draw();
}
const rectTypeLabels=['左端','右端','中点'];
function onRectType(){
  rectType=+document.getElementById('rect-type').value;
  document.getElementById('rect-type-lbl').textContent=rectTypeLabels[rectType];
  draw();
}
function onAntiA(){
  antiA=+document.getElementById('anti-a-slider').value;
  document.getElementById('anti-a-lbl').textContent=antiA.toFixed(2);
  draw();
}
function onZoom(){
  xRange=+document.getElementById('zoom').value;
  yRange=+document.getElementById('zoom-y').value;
  document.getElementById('zoom-lbl').textContent='±'+xRange;
  document.getElementById('zoom-y-lbl').textContent='±'+yRange;
  ['a-slider','b-slider','anti-a-slider'].forEach(id=>{
    const el=document.getElementById(id);
    if(el){ el.min=-xRange; el.max=xRange; }
  });
  draw();
}
function onFuncInput(){
  funcStr=document.getElementById('func-input').value;
  const fn=tryCompile(funcStr);
  const errEl=document.getElementById('error-msg');
  const inp=document.getElementById('func-input');
  if(fn){ compiledFn=fn; errEl.textContent=''; inp.classList.remove('error'); }
  else { errEl.textContent='⚠ 構文エラー。式を確認してください。'; inp.classList.add('error'); }
  draw();
}
function setPreset(s){
  document.getElementById('func-input').value=s;
  funcStr=s; compiledFn=tryCompile(s);
  document.getElementById('error-msg').textContent='';
  document.getElementById('func-input').classList.remove('error');
  draw();
}
function switchTab(t){
  activeTab=t;
  ['defint','riemann','antideriv'].forEach(n=>{
    document.getElementById('panel-'+n).classList.toggle('active',n===t);
    document.getElementById('tab-'+n).classList.toggle('active',n===t);
  });
  draw();
}

/* ── テーマ初期化 ── */
compiledFn=tryCompile(funcStr);
const _saved=localStorage.getItem('math-theme');
if(_saved==='dark') document.body.classList.add('dark');
draw();

const _themeBtn=document.getElementById('theme-toggle');
_themeBtn.textContent=document.body.classList.contains('dark')?'☀ ライト':'🌙 ダーク';
_themeBtn.addEventListener('click',()=>{
  document.body.classList.toggle('dark');
  const dark=document.body.classList.contains('dark');
  localStorage.setItem('math-theme',dark?'dark':'light');
  _themeBtn.textContent=dark?'☀ ライト':'🌙 ダーク';
  draw();
});
