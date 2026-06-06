const canvas = document.getElementById('cv');
const ctx = canvas.getContext('2d');
const W=480, H=420;

let xRange=8, yRange=8;
let xPos=1, hVal=1;
let showTangent=true, showDeriv=true, showNormal=false;
let activeTab='diff';
let funcStr='x^2 - 2*x - 1';
let compiledFn=null;
let hasError=false;

const CX=W/2, CY=H/2;
function toC(x,y){ return {x:CX+x/xRange*(W/2-20), y:CY-y/yRange*(H/2-20)}; }
function fromC(cx){ return (cx-CX)/(W/2-20)*xRange; }

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

/* ── Math parser ── */
function compileFn(str){
  let s=str
    .replace(/\^/g,'**')
    .replace(/\blog\b/g,'Math.log').replace(/\bln\b/g,'Math.log')
    .replace(/\bsqrt\b/g,'Math.sqrt').replace(/\babs\b/g,'Math.abs')
    .replace(/\bsin\b/g,'Math.sin').replace(/\bcos\b/g,'Math.cos')
    .replace(/\btan\b/g,'Math.tan').replace(/\bexp\b/g,'Math.exp')
    .replace(/\bpi\b/g,'Math.PI').replace(/\be\b/g,'Math.E');
  s=s.replace(/(\d)(x)/g,'$1*$2');
  return new Function('x','return '+s+';');
}
function tryCompile(str){
  try{ const fn=compileFn(str); fn(1); return fn; }catch(e){ return null; }
}
function numDeriv(fn,x,h=1e-5){ return (fn(x+h)-fn(x-h))/(2*h); }
function num2ndDeriv(fn,x,h=1e-4){ return (fn(x+h)-2*fn(x)+fn(x-h))/(h*h); }

/* ── Draw ── */
function draw(){
  const col=cc();
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle=col.bg;
  ctx.fillRect(0,0,W,H);
  drawGrid();
  if(!compiledFn) return;
  drawFunc();
  if(showDeriv) drawDerivFunc();
  if(activeTab==='diff'||activeTab==='limit'){
    if(showTangent) drawTangent();
    if(showNormal) drawNormal();
  }
  if(activeTab==='limit') drawSecant();
  if(activeTab==='info') drawFeaturePoints();
  drawPoint();
  updateInfo();
}

function drawGrid(){
  const col=cc();
  ctx.strokeStyle=col.grid; ctx.lineWidth=0.8;
  for(let x=-xRange;x<=xRange;x++){
    const cx=toC(x,0).x;
    ctx.beginPath(); ctx.moveTo(cx,0); ctx.lineTo(cx,H); ctx.stroke();
  }
  for(let y=-yRange;y<=yRange;y++){
    const cy=toC(0,y).y;
    ctx.beginPath(); ctx.moveTo(0,cy); ctx.lineTo(W,cy); ctx.stroke();
  }
  ctx.strokeStyle=col.axis; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(0,CY); ctx.lineTo(W,CY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(CX,0); ctx.lineTo(CX,H); ctx.stroke();
  ctx.fillStyle=col.label; ctx.font='10px monospace'; ctx.textAlign='center';
  for(let x=-xRange;x<=xRange;x++){
    if(x===0) continue;
    if(xRange>6 && x%2!==0) continue;
    ctx.fillText(x, toC(x,0).x, CY+14);
  }
  ctx.textAlign='right';
  for(let y=-yRange;y<=yRange;y++){
    if(y===0) continue;
    if(yRange>6 && y%2!==0) continue;
    ctx.fillText(y, CX-5, toC(0,y).y+4);
  }
  ctx.fillStyle=col.axisLetter; ctx.textAlign='center';
  ctx.fillText('x', W-10, CY-8);
  ctx.textAlign='right';
  ctx.fillText('y', CX+18, 12);
}

function drawCurve(fn, color, lw, dash=[]){
  ctx.save();
  ctx.strokeStyle=color; ctx.lineWidth=lw;
  ctx.setLineDash(dash);
  const steps=600;
  let drawing=false;
  ctx.beginPath();
  for(let i=0;i<=steps;i++){
    const x=-xRange+(2*xRange*i/steps);
    let y; try{ y=fn(x); }catch(e){ drawing=false; continue; }
    if(!isFinite(y)||isNaN(y)||Math.abs(y)>yRange*3){ drawing=false; continue; }
    const p=toC(x,y);
    if(!drawing){ ctx.moveTo(p.x,p.y); drawing=true; }
    else ctx.lineTo(p.x,p.y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawFunc(){ drawCurve(compiledFn,'#38bdf8',2.5); }
function drawDerivFunc(){ drawCurve(x=>numDeriv(compiledFn,x),'#fb923c',2,[6,4]); }

function drawTangent(){
  const fx=compiledFn(xPos);
  const dfx=numDeriv(compiledFn,xPos);
  if(!isFinite(fx)||!isFinite(dfx)) return;
  drawCurve(x=>dfx*(x-xPos)+fx,'#f472b6',2);
}

function drawNormal(){
  const fx=compiledFn(xPos);
  const dfx=numDeriv(compiledFn,xPos);
  if(!isFinite(fx)||!isFinite(dfx)||Math.abs(dfx)<1e-10) return;
  drawCurve(x=>(-1/dfx)*(x-xPos)+fx,'#a78bfa',1.5,[4,3]);
}

function drawSecant(){
  const fx=compiledFn(xPos);
  const fxh=compiledFn(xPos+hVal);
  if(!isFinite(fx)||!isFinite(fxh)) return;
  const slope=(fxh-fx)/hVal;
  drawCurve(x=>slope*(x-xPos)+fx,'#4ade80',2,[5,3]);
  const ph=toC(xPos+hVal,fxh);
  ctx.beginPath(); ctx.arc(ph.x,ph.y,5,0,Math.PI*2);
  ctx.fillStyle='#4ade80'; ctx.fill();
  ctx.strokeStyle='white'; ctx.lineWidth=1.5; ctx.stroke();
  const p0=toC(xPos+hVal,0), p1=toC(xPos+hVal,fxh);
  ctx.setLineDash([3,3]); ctx.strokeStyle='#4ade8066'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(p0.x,p0.y); ctx.lineTo(p1.x,p1.y); ctx.stroke();
  ctx.setLineDash([]);
}

function drawFeaturePoints(){
  const fn=compiledFn;
  const steps=300, dx=2*xRange/steps;
  const features=[];
  for(let i=1;i<steps-1;i++){
    const x=-xRange+i*dx;
    const d0=numDeriv(fn,x-dx), d1=numDeriv(fn,x), d2=numDeriv(fn,x+dx);
    const dd=num2ndDeriv(fn,x);
    if(d0*d1<0||d1*d2<0){
      const type=d1<0||d2<0?'極小':'極大';
      const fy=fn(x);
      if(isFinite(fy)) features.push({x,y:fy,type,color:d1>0||d0>0?'#f472b6':'#38bdf8'});
    }
    if(i>1){
      const dd_prev=num2ndDeriv(fn,x-dx);
      if(dd_prev*dd<0){
        const fy=fn(x);
        if(isFinite(fy)) features.push({x,y:fy,type:'変曲点',color:'#facc15'});
      }
    }
  }
  const deduped=[];
  features.forEach(f=>{
    if(!deduped.some(g=>Math.abs(g.x-f.x)<dx*3&&g.type===f.type)) deduped.push(f);
  });
  deduped.forEach(f=>{
    const p=toC(f.x,f.y);
    ctx.beginPath(); ctx.arc(p.x,p.y,6,0,Math.PI*2);
    ctx.fillStyle=f.color; ctx.fill();
    ctx.strokeStyle='white'; ctx.lineWidth=1.5; ctx.stroke();
  });

  const dark=document.body.classList.contains('dark');
  const list=document.getElementById('feature-list');
  list.innerHTML='';
  if(deduped.length===0){
    list.innerHTML=`<div style="color:${dark?'#3a5a8c':'#94a3b8'};font-size:11px">表示範囲内に特徴点なし</div>`;
    return;
  }
  deduped.slice(0,8).forEach(f=>{
    const box=document.createElement('div');
    box.style.cssText=`background:${dark?'#0f1f3d':'#f0f4f8'};border-radius:8px;padding:7px 12px;border:1px solid ${dark?'#1e3a6e':'#d4dde6'};display:flex;justify-content:space-between;align-items:center`;
    box.innerHTML=`<span style="color:${f.color};font-size:11px;font-weight:700">${f.type}</span><span style="color:${dark?'#94a3b8':'#64748b'};font-size:11px">x = ${f.x.toFixed(2)}　f(x) = ${f.y.toFixed(2)}</span>`;
    list.appendChild(box);
  });
}

function drawPoint(){
  if(!compiledFn) return;
  const fx=compiledFn(xPos);
  if(!isFinite(fx)) return;
  const p=toC(xPos,fx), px=toC(xPos,0);
  ctx.setLineDash([3,3]); ctx.strokeStyle='#f472b644'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(px.x,px.y); ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath(); ctx.arc(p.x,p.y,7,0,Math.PI*2);
  ctx.fillStyle='#f472b6'; ctx.fill();
  ctx.strokeStyle='white'; ctx.lineWidth=2; ctx.stroke();
  ctx.fillStyle='#f472b6'; ctx.font='bold 11px monospace'; ctx.textAlign='left';
  ctx.fillText(`(${xPos.toFixed(1)}, ${fx.toFixed(2)})`, p.x+10, p.y-8);
}

/* ── Update info ── */
function updateInfo(){
  if(!compiledFn){ clearInfo(); return; }
  const fx=compiledFn(xPos);
  const dfx=numDeriv(compiledFn,xPos);
  if(!isFinite(fx)||!isFinite(dfx)){ clearInfo(); return; }
  document.getElementById('fx-val').textContent=fx.toFixed(4);
  document.getElementById('dfx-val').textContent=dfx.toFixed(4);
  const b=fx-dfx*xPos;
  const bStr=b>=0?`+ ${b.toFixed(2)}`:`− ${Math.abs(b).toFixed(2)}`;
  document.getElementById('tangent-eq').textContent=`y = ${dfx.toFixed(2)}x ${bStr}`;
  const fxh=compiledFn(xPos+hVal);
  if(isFinite(fxh)){
    const dq=(fxh-compiledFn(xPos))/hVal;
    document.getElementById('diff-quot').textContent=dq.toFixed(4);
    document.getElementById('true-deriv').textContent=dfx.toFixed(4);
    document.getElementById('deriv-error').textContent=Math.abs(dq-dfx).toFixed(4);
  }
}

function clearInfo(){
  ['fx-val','dfx-val','tangent-eq','diff-quot','true-deriv','deriv-error'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.textContent='—';
  });
}

/* ── Events ── */
canvas.addEventListener('mousemove',e=>{
  const r=canvas.getBoundingClientRect();
  xPos=Math.max(-xRange,Math.min(xRange,fromC(e.clientX-r.left)));
  document.getElementById('x-slider').value=xPos;
  document.getElementById('x-lbl').textContent=xPos.toFixed(2);
  draw();
});
canvas.addEventListener('touchmove',e=>{
  e.preventDefault();
  const r=canvas.getBoundingClientRect();
  xPos=Math.max(-xRange,Math.min(xRange,fromC(e.touches[0].clientX-r.left)));
  document.getElementById('x-slider').value=xPos;
  document.getElementById('x-lbl').textContent=xPos.toFixed(2);
  draw();
},{passive:false});

function onXSlider(){
  xPos=+document.getElementById('x-slider').value;
  document.getElementById('x-lbl').textContent=xPos.toFixed(2);
  draw();
}
function onHSlider(){
  hVal=+document.getElementById('h-slider').value;
  document.getElementById('h-lbl').textContent=hVal.toFixed(2);
  draw();
}
function onZoom(){
  xRange=+document.getElementById('zoom').value;
  yRange=+document.getElementById('zoom-y').value;
  document.getElementById('zoom-lbl').textContent='±'+xRange;
  document.getElementById('zoom-y-lbl').textContent='±'+yRange;
  document.getElementById('x-slider').min=-xRange;
  document.getElementById('x-slider').max=xRange;
  draw();
}
function onFuncInput(){
  funcStr=document.getElementById('func-input').value;
  const fn=tryCompile(funcStr);
  const errEl=document.getElementById('error-msg');
  const inp=document.getElementById('func-input');
  if(fn){ compiledFn=fn; hasError=false; errEl.textContent=''; inp.classList.remove('error'); }
  else { hasError=true; errEl.textContent='⚠ 構文エラー。式を確認してください。'; inp.classList.add('error'); }
  draw();
}
function setPreset(str){
  document.getElementById('func-input').value=str;
  funcStr=str; compiledFn=tryCompile(str);
  document.getElementById('error-msg').textContent='';
  document.getElementById('func-input').classList.remove('error');
  draw();
}

const togState={tangent:true, deriv:true, normal:false};
const togColors={tangent:'#f472b6', deriv:'#fb923c', normal:'#a78bfa'};
const togLabels={tangent:'接線', deriv:"f'(x)", normal:'法線'};

function refreshTogButtons(){
  const dark=document.body.classList.contains('dark');
  const offBg=dark?'#0f1f3d':'#f0f4f8';
  const offBdr=dark?'#1e3a6e':'#d4dde6';
  const offClr=dark?'#3a5a8c':'#94a3b8';
  Object.keys(togState).forEach(key=>{
    const btn=document.getElementById('tog-'+key);
    const on=togState[key];
    btn.style.background=on?togColors[key]+'22':offBg;
    btn.style.borderColor=on?togColors[key]:offBdr;
    btn.style.color=on?togColors[key]:offClr;
    btn.textContent=togLabels[key]+(on?' 表示':' 非表示');
  });
}

function toggle(key){
  togState[key]=!togState[key];
  if(key==='tangent') showTangent=togState[key];
  if(key==='deriv') showDeriv=togState[key];
  if(key==='normal') showNormal=togState[key];
  refreshTogButtons();
  draw();
}

function switchTab(t){
  activeTab=t;
  ['diff','limit','info'].forEach(n=>{
    document.getElementById('panel-'+n).classList.toggle('active',n===t);
    document.getElementById('tab-'+n).classList.toggle('active',n===t);
  });
  draw();
}

/* ── テーマ初期化 ── */
compiledFn=tryCompile(funcStr);
const _saved=localStorage.getItem('math-theme');
if(_saved==='dark') document.body.classList.add('dark');
refreshTogButtons();
draw();

const _themeBtn=document.getElementById('theme-toggle');
_themeBtn.textContent=document.body.classList.contains('dark')?'☀ ライト':'🌙 ダーク';
_themeBtn.addEventListener('click',()=>{
  document.body.classList.toggle('dark');
  const dark=document.body.classList.contains('dark');
  localStorage.setItem('math-theme',dark?'dark':'light');
  _themeBtn.textContent=dark?'☀ ライト':'🌙 ダーク';
  refreshTogButtons();
  draw();
});
