const canvas=document.getElementById('cv');
const ctx=canvas.getContext('2d');
const W=480,H=480;
let RANGE=5;
const CX=W/2,CY=H/2;

let funcStr='2*x + 1';
let compiledFn=null;
let domA=-5,domB=5;
let xPos=1;
let showMirror=true,showInv=true,showPoint=true;

/* ===== テーマカラー ===== */
function cc(){
  const d=document.body.classList.contains('dark');
  return {
    bg:           d?'#07101f':'#f8f9fb',
    grid:         d?'#111e38':'#e8edf4',
    axis:         d?'#2a3a5c':'#c0cede',
    label:        d?'#243a5a':'#9aabbe',
    axisLetter:   d?'#3a5a8c':'#8a9ab8',
    handleStroke: d?'rgba(255,255,255,0.85)':'rgba(30,40,60,0.35)'
  };
}

/* ===== 座標変換 ===== */
function sc(x){return CX+x/RANGE*(W/2-24);}
function sy(y){return CY-y/RANGE*(H/2-24);}
function fromSc(cx){return(cx-CX)/(W/2-24)*RANGE;}

/* ===== 関数コンパイル ===== */
function compileFn(s){
  s=s.trim()
    .replace(/(^|[+\-*/,(^])\s*-\s*x/g,'$1-1*x')
    .replace(/(\d)\s*x/g,'$1*x')
    .replace(/\)\s*x/g,')*x')
    .replace(/x\s*\(/g,'x*(')
    .replace(/\^/g,'**')
    .replace(/\bsin\b/g,'Math.sin')
    .replace(/\bcos\b/g,'Math.cos')
    .replace(/\btan\b/g,'Math.tan')
    .replace(/\bsqrt\b/g,'Math.sqrt')
    .replace(/\babs\b/g,'Math.abs')
    .replace(/\bexp\b/g,'Math.exp')
    .replace(/\bln\b/g,'Math.log')
    .replace(/\blog\b/g,'Math.log')
    .replace(/\bpi\b/g,'Math.PI');
  s=s.replace(/(\d+)\*\*/g,'$1**');
  try{
    const f=new Function('x','try{return ('+s+');}catch(e){return NaN;}');
    f(0);f(1);f(-1);
    return f;
  }catch(e){return null;}
}

/* ===== 数値的逆関数 ===== */
function numInverse(y,steps=300){
  if(!compiledFn)return null;
  const dx=(domB-domA)/steps;
  let best=null,bestDist=Infinity;
  for(let i=0;i<=steps;i++){
    const x=domA+i*dx;
    const fy=compiledFn(x);
    if(!isFinite(fy))continue;
    const d=Math.abs(fy-y);
    if(d<bestDist){bestDist=d;best=x;}
  }
  if(best===null)return null;
  let lo=Math.max(domA,best-dx*2),hi=Math.min(domB,best+dx*2);
  const flo=compiledFn(lo),fhi=compiledFn(hi);
  if(!isFinite(flo)||!isFinite(fhi))return best;
  let a=lo,b=hi;
  for(let i=0;i<50;i++){
    const m=(a+b)/2;
    const fm=compiledFn(m);
    if(!isFinite(fm))break;
    if((fm-y)*(compiledFn(a)-y)<=0)b=m;else a=m;
  }
  return (a+b)/2;
}

/* ===== グリッド描画 ===== */
function drawGrid(){
  const c=cc();
  ctx.fillStyle=c.bg;ctx.fillRect(0,0,W,H);
  ctx.strokeStyle=c.grid;ctx.lineWidth=0.8;
  for(let i=-RANGE;i<=RANGE;i++){
    ctx.beginPath();ctx.moveTo(sc(i),0);ctx.lineTo(sc(i),H);ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,sy(i));ctx.lineTo(W,sy(i));ctx.stroke();
  }
  ctx.strokeStyle=c.axis;ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(0,CY);ctx.lineTo(W,CY);ctx.stroke();
  ctx.beginPath();ctx.moveTo(CX,0);ctx.lineTo(CX,H);ctx.stroke();
  ctx.fillStyle=c.label;ctx.font='9px monospace';ctx.textAlign='center';
  for(let i=-RANGE;i<=RANGE;i++){
    if(i===0)continue;
    if(RANGE>5&&i%2!==0)continue;
    ctx.fillText(i,sc(i),CY+13);
    ctx.textAlign='right';ctx.fillText(i,CX-4,sy(i)+4);ctx.textAlign='center';
  }
  ctx.fillStyle=c.axisLetter;ctx.fillText('x',W-10,CY-8);
  ctx.textAlign='right';ctx.fillText('y',CX+16,12);
}

/* ===== 曲線描画 ===== */
function drawCurve(fn,color,lw,domainA,domainB,dash=[]){
  if(!fn)return;
  ctx.save();
  ctx.strokeStyle=color;ctx.lineWidth=lw;
  ctx.setLineDash(dash);
  const steps=600;
  let drawing=false;
  ctx.beginPath();
  for(let i=0;i<=steps;i++){
    const t=i/steps;
    const x=-RANGE+(2*RANGE*t);
    if(x<domainA-0.001||x>domainB+0.001){drawing=false;continue;}
    let y;try{y=fn(x);}catch(e){drawing=false;continue;}
    if(!isFinite(y)||isNaN(y)||Math.abs(y)>RANGE*3){drawing=false;continue;}
    if(!drawing){ctx.moveTo(sc(x),sy(y));drawing=true;}
    else ctx.lineTo(sc(x),sy(y));
  }
  ctx.stroke();
  ctx.restore();
}

function drawInverse(fn,color,lw){
  if(!fn)return;
  ctx.save();
  ctx.strokeStyle=color;ctx.lineWidth=lw;
  const steps=600;
  let drawing=false;
  ctx.beginPath();
  for(let i=0;i<=steps;i++){
    const x=domA+(domB-domA)*i/steps;
    let y;try{y=fn(x);}catch(e){drawing=false;continue;}
    if(!isFinite(y)||isNaN(y))continue;
    const px=sc(y),py=sy(x);
    if(px<-20||px>W+20||py<-20||py>H+20){drawing=false;continue;}
    if(!drawing){ctx.moveTo(px,py);drawing=true;}
    else ctx.lineTo(px,py);
  }
  ctx.stroke();
  ctx.restore();
}

function dot(x,y,color,r=6){
  ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);
  ctx.fillStyle=color;ctx.fill();
  ctx.strokeStyle=cc().handleStroke;ctx.lineWidth=1.5;ctx.stroke();
}

/* ===== 単調性チェック ===== */
function checkMonotone(){
  if(!compiledFn)return{mono:'不明',exists:false};
  const steps=200;
  const dx=(domB-domA)/steps;
  let increases=0,decreases=0;
  let prev=compiledFn(domA);
  for(let i=1;i<=steps;i++){
    const x=domA+i*dx;
    const y=compiledFn(x);
    if(!isFinite(y)||!isFinite(prev)){prev=y;continue;}
    if(y>prev+1e-9)increases++;
    else if(y<prev-1e-9)decreases++;
    prev=y;
  }
  const total=increases+decreases;
  if(total===0)return{mono:'定数関数',exists:false};
  if(decreases===0)return{mono:'単調増加 ↗',exists:true};
  if(increases===0)return{mono:'単調減少 ↘',exists:true};
  return{mono:`非単調（増${increases} 減${decreases}）`,exists:false};
}

/* ===== トグルボタン更新 ===== */
function refreshTogButtons(){
  const dark=document.body.classList.contains('dark');
  const offBg  =dark?'#0f1f3d':'#f0f4f8';
  const offBdr =dark?'#1e3a6e':'#d4dde6';
  const offClr =dark?'#4a6a9c':'#64748b';

  const b1=document.getElementById('tog-mirror');
  b1.style.background=showMirror?'#a78bfa22':offBg;
  b1.style.borderColor=showMirror?'#a78bfa':offBdr;
  b1.style.color=showMirror?'#a78bfa':offClr;

  const b2=document.getElementById('tog-inv');
  b2.style.background=showInv?'#38bdf822':offBg;
  b2.style.borderColor=showInv?'#38bdf8':offBdr;
  b2.style.color=showInv?'#38bdf8':offClr;

  const b3=document.getElementById('tog-point');
  b3.style.background=showPoint?'#fb923c22':offBg;
  b3.style.borderColor=showPoint?'#fb923c':offBdr;
  b3.style.color=showPoint?'#fb923c':offClr;
}

/* ===== メイン描画 ===== */
function draw(){
  ctx.clearRect(0,0,W,H);
  drawGrid();
  if(!compiledFn)return;

  if(showMirror){
    ctx.save();
    ctx.setLineDash([6,4]);
    ctx.strokeStyle='#a78bfa55';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(sc(-RANGE),sy(-RANGE));ctx.lineTo(sc(RANGE),sy(RANGE));
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle='#a78bfa88';ctx.font='11px monospace';ctx.textAlign='left';
    ctx.fillText('y = x',sc(RANGE*0.6)+4,sy(RANGE*0.6)-8);
  }

  ctx.save();
  ctx.fillStyle='#f472b608';
  const da=sc(domA),db=sc(domB);
  ctx.fillRect(da,0,db-da,H);
  ctx.setLineDash([3,3]);ctx.strokeStyle='#4ade8044';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(da,0);ctx.lineTo(da,H);ctx.stroke();
  ctx.beginPath();ctx.moveTo(db,0);ctx.lineTo(db,H);ctx.stroke();
  ctx.restore();

  if(showInv) drawInverse(compiledFn,'#38bdf8',2.5);

  drawCurve(compiledFn,'#f472b6',2.5,domA,domB);
  drawCurve(compiledFn,'#f472b622',1.5,-RANGE,domA);
  drawCurve(compiledFn,'#f472b622',1.5,domB,RANGE);

  ctx.font='bold 12px monospace';ctx.textAlign='left';
  ctx.fillStyle='#f472b6';ctx.fillText('f(x)',sc(Math.min(domB,RANGE)*0.7)+4,sy(compiledFn(Math.min(domB,RANGE)*0.7)||0)-10);
  if(showInv){
    ctx.fillStyle='#38bdf8';
    try{
      const tx=Math.min(domB,RANGE)*0.6;
      const ty=compiledFn(tx);
      if(isFinite(ty)) ctx.fillText('f⁻¹(x)',sc(ty)+6,sy(tx)+4);
    }catch(e){}
  }

  if(showPoint&&compiledFn){
    const x=xPos;
    if(x>=domA&&x<=domB){
      let fx;try{fx=compiledFn(x);}catch(e){fx=null;}
      if(fx!==null&&isFinite(fx)){
        const px=sc(x),py=sy(fx);
        const qx=sc(fx),qy=sy(x);
        ctx.save();
        ctx.setLineDash([3,3]);ctx.strokeStyle='#fb923c66';ctx.lineWidth=1.2;
        const mid=sc((x+fx)/2);
        ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(mid,mid===sc((x+fx)/2)?sy((x+fx)/2):py);ctx.stroke();
        ctx.strokeStyle='#fb923c99';
        ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(qx,qy);ctx.stroke();
        ctx.restore();
        dot(px,py,'#f472b6',6);
        dot(qx,qy,'#38bdf8',6);
        ctx.font='bold 11px monospace';ctx.fillStyle='#f472b6';ctx.textAlign='left';
        ctx.fillText(`(${x.toFixed(1)}, ${fx.toFixed(2)})`,px+9,py-7);
        ctx.fillStyle='#38bdf8';
        ctx.fillText(`(${fx.toFixed(2)}, ${x.toFixed(1)})`,qx+9,qy-7);
      }
    }
  }

  updateInfo();
}

function updateInfo(){
  if(!compiledFn)return;
  const x=xPos;
  let fx=null;
  try{fx=compiledFn(x);}catch(e){}
  document.getElementById('x-lbl').textContent=x.toFixed(2);
  document.getElementById('x-slider').value=x;

  if(fx!==null&&isFinite(fx)){
    document.getElementById('fx-val').textContent=fx.toFixed(4);
    const inv=numInverse(fx);
    document.getElementById('inv-val').textContent=inv!==null?inv.toFixed(4):'—';
    document.getElementById('corr-val').textContent=
      `f(${x.toFixed(2)}) = ${fx.toFixed(2)}　→　f⁻¹(${fx.toFixed(2)}) = ${inv!==null?inv.toFixed(2):'—'}`;
  } else {
    document.getElementById('fx-val').textContent='定義外';
    document.getElementById('inv-val').textContent='—';
    document.getElementById('corr-val').textContent='この x は定義域外です';
  }

  document.getElementById('eq-f').textContent='f(x) = '+funcStr;
  document.getElementById('eq-inv').textContent='f⁻¹(x)：数値近似（グラフは y=x で折り返し）';

  const {mono,exists}=checkMonotone();
  const mEl=document.getElementById('monotone-val');
  mEl.textContent=mono;
  mEl.style.color=exists?'#4ade80':'#f472b6';
  const iEl=document.getElementById('inv-exists');
  iEl.textContent=exists?'✔ 存在する（定義域内で一対一）':'✘ 単調でないため逆関数は一意に定まらない';
  iEl.style.color=exists?'#4ade80':'#f472b6';
}

/* ===== イベント ===== */
canvas.addEventListener('mousemove',e=>{
  const r=canvas.getBoundingClientRect();
  xPos=Math.max(-RANGE,Math.min(RANGE,fromSc(e.clientX-r.left)));
  draw();
});
canvas.addEventListener('touchmove',e=>{
  e.preventDefault();
  const r=canvas.getBoundingClientRect();
  xPos=Math.max(-RANGE,Math.min(RANGE,fromSc(e.touches[0].clientX-r.left)));
  draw();
},{passive:false});

function onXSlider(){xPos=+document.getElementById('x-slider').value;draw();}

function onDomain(){
  domA=+document.getElementById('dom-a').value;
  domB=+document.getElementById('dom-b').value;
  if(domA>=domB){domB=domA+0.5;document.getElementById('dom-b').value=domB;}
  document.getElementById('dom-a-lbl').textContent=domA;
  document.getElementById('dom-b-lbl').textContent=domB;
  document.getElementById('x-slider').min=domA;
  document.getElementById('x-slider').max=domB;
  draw();
}

function onZoom(){
  RANGE=+document.getElementById('zoom').value;
  document.getElementById('zoom-lbl').textContent=RANGE;
  draw();
}

function onFuncInput(){
  funcStr=document.getElementById('func-input').value;
  const fn=compileFn(funcStr);
  const err=document.getElementById('error-msg');
  const inp=document.getElementById('func-input');
  if(fn){compiledFn=fn;err.textContent='';inp.classList.remove('error');}
  else{err.textContent='⚠ 構文エラー。式を確認してください。';inp.classList.add('error');}
  draw();
}

function setPreset(s){
  document.getElementById('func-input').value=s;
  funcStr=s;compiledFn=compileFn(s);
  document.getElementById('error-msg').textContent='';
  document.getElementById('func-input').classList.remove('error');
  draw();
}

document.getElementById('func-input').addEventListener('input',onFuncInput);

function toggleMirror(){
  showMirror=!showMirror;
  document.getElementById('tog-mirror').textContent='y=x '+(showMirror?'表示中':'非表示');
  refreshTogButtons();
  draw();
}
function toggleInv(){
  showInv=!showInv;
  document.getElementById('tog-inv').textContent='f⁻¹(x) '+(showInv?'表示中':'非表示');
  refreshTogButtons();
  draw();
}
function togglePoint(){
  showPoint=!showPoint;
  document.getElementById('tog-point').textContent='対応点 '+(showPoint?'表示中':'非表示');
  refreshTogButtons();
  draw();
}

/* ===== テーマ初期化 ===== */
compiledFn=compileFn(funcStr);
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
