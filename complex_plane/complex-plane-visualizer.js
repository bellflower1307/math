const canvas=document.getElementById('cv');
const ctx=canvas.getContext('2d');
const W=460,H=460;
let RANGE=4;
const CX=W/2,CY=H/2;
let activeTab='basic';
let currentOp='add';
let showConj=true,showCircle=true;
let dragging=null;

let zBasic={a:2,b:1};
let z1={a:2,b:1},z2={a:-1,b:2};
let zPolar={r:2,th:30};
let zPower={r:1.2,th:45,n:3};

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
function fromSy(cy){return(CY-cy)/(H/2-24)*RANGE;}
function snap(v){return Math.round(v*4)/4;}
function toRad(d){return d*Math.PI/180;}
function toDeg(r){return r*180/Math.PI;}
function fmt(v,d=3){return v.toFixed(d);}
function fmtCx(a,b){
  if(Math.abs(b)<0.001)return fmt(a,2);
  if(Math.abs(a)<0.001)return fmt(b,2)+'i';
  return fmt(a,2)+(b>=0?'+':'')+fmt(b,2)+'i';
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
    ctx.fillText(i,sc(i),CY+13);
    ctx.textAlign='right';ctx.fillText(i,CX-4,sy(i)+4);ctx.textAlign='center';
  }
  ctx.fillStyle=c.axisLetter;
  ctx.fillText('実軸',W-20,CY-8);
  ctx.textAlign='right';ctx.fillText('虚軸',CX+26,12);
}

/* ===== 矢印・点 ===== */
function arrow(x1,y1,x2,y2,color,lw=2.5,dash=[]){
  ctx.save();
  ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=lw;
  ctx.setLineDash(dash);
  const dx=x2-x1,dy=y2-y1,len=Math.sqrt(dx*dx+dy*dy);
  if(len<2){ctx.restore();return;}
  const nx=dx/len,ny=dy/len,hw=6,hl=12;
  ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2-nx*hl*0.5,y2-ny*hl*0.5);ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();ctx.moveTo(x2,y2);
  ctx.lineTo(x2-nx*hl-ny*hw,y2-ny*hl+nx*hw);
  ctx.lineTo(x2-nx*hl+ny*hw,y2-ny*hl-nx*hw);
  ctx.closePath();ctx.fill();
  ctx.restore();
}

function dot(x,y,color,r=6){
  ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);
  ctx.fillStyle=color;ctx.fill();
  ctx.strokeStyle=cc().handleStroke;ctx.lineWidth=1.5;ctx.stroke();
}

/* ===== タブ描画 ===== */
function drawBasic(){
  const {a,b}=zBasic;
  const abs=Math.sqrt(a*a+b*b);
  const arg=toDeg(Math.atan2(b,a));

  if(showCircle&&abs>0.01){
    ctx.beginPath();ctx.arc(CX,CY,abs/RANGE*(W/2-24),0,Math.PI*2);
    ctx.strokeStyle='#facc1533';ctx.lineWidth=1.2;ctx.stroke();
  }
  if(showConj){
    arrow(CX,CY,sc(a),sy(-b),'#4ade8088',2,[5,4]);
    dot(sc(a),sy(-b),'#4ade80',5);
    ctx.fillStyle='#4ade80';ctx.font='bold 11px monospace';ctx.textAlign='left';
    ctx.fillText('z̄='+fmtCx(a,-b),sc(a)+8,sy(-b)+14);
    ctx.save();ctx.setLineDash([3,3]);ctx.strokeStyle='#4ade8044';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(sc(a),sy(b));ctx.lineTo(sc(a),sy(-b));ctx.stroke();
    ctx.restore();
  }
  if(abs>0.2){
    const arcR=28;
    ctx.save();
    ctx.beginPath();ctx.arc(CX,CY,arcR,0,-toRad(arg),arg<0);
    ctx.strokeStyle='#facc1588';ctx.lineWidth=1.5;ctx.stroke();
    ctx.fillStyle='#facc15';ctx.font='10px monospace';ctx.textAlign='left';
    const midA=toRad(arg/2);
    ctx.fillText('θ',CX+(arcR+8)*Math.cos(midA),CY-(arcR+8)*Math.sin(midA));
    ctx.restore();
  }
  if(abs>0.1){
    const mx=CX+abs/RANGE*(W/2-24)*0.5,my=CY-5;
    ctx.fillStyle='#facc15';ctx.font='10px monospace';ctx.textAlign='center';
    ctx.fillText('r='+fmt(abs,2),mx,my);
  }
  arrow(CX,CY,sc(a),sy(b),'#f472b6',3);
  dot(sc(a),sy(b),'#f472b6',7);
  ctx.beginPath();ctx.arc(sc(a),sy(b),10,0,Math.PI*2);
  ctx.fillStyle='#f472b620';ctx.fill();
  ctx.fillStyle='#f472b6';ctx.font='bold 12px monospace';ctx.textAlign='left';
  ctx.fillText('z='+fmtCx(a,b),sc(a)+10,sy(b)-10);
  ctx.save();ctx.setLineDash([3,3]);ctx.strokeStyle='#f472b644';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(sc(a),sy(b));ctx.lineTo(sc(a),CY);ctx.stroke();
  ctx.beginPath();ctx.moveTo(sc(a),sy(b));ctx.lineTo(CX,sy(b));ctx.stroke();
  ctx.restore();

  document.getElementById('basic-eq').textContent='z = '+fmtCx(a,b);
  document.getElementById('basic-abs').textContent=fmt(abs,3);
  document.getElementById('basic-arg').textContent=fmt(arg,1)+'°';
  document.getElementById('basic-conj').textContent='z̄ = '+fmtCx(a,-b);
}

function drawArith(){
  const {a:a1,b:b1}=z1,{a:a2,b:b2}=z2;
  let re,im;
  if(currentOp==='add'){re=a1+a2;im=b1+b2;}
  else if(currentOp==='sub'){re=a1-a2;im=b1-b2;}
  else if(currentOp==='mul'){re=a1*a2-b1*b2;im=a1*b2+b1*a2;}
  else{
    const d=a2*a2+b2*b2;
    if(d<1e-10){re=NaN;im=NaN;}
    else{re=(a1*a2+b1*b2)/d;im=(b1*a2-a1*b2)/d;}
  }
  if(currentOp==='add'){
    ctx.save();ctx.setLineDash([4,3]);ctx.strokeStyle='#a78bfa33';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(sc(a1),sy(b1));ctx.lineTo(sc(re),sy(im));ctx.stroke();
    ctx.beginPath();ctx.moveTo(sc(a2),sy(b2));ctx.lineTo(sc(re),sy(im));ctx.stroke();
    ctx.restore();
  }
  arrow(CX,CY,sc(a1),sy(b1),'#f472b6',2.5);
  dot(sc(a1),sy(b1),'#f472b6',6);
  ctx.fillStyle='#f472b6';ctx.font='bold 11px monospace';ctx.textAlign='left';
  ctx.fillText('z₁='+fmtCx(a1,b1),sc(a1)+8,sy(b1)-8);
  arrow(CX,CY,sc(a2),sy(b2),'#38bdf8',2.5);
  dot(sc(a2),sy(b2),'#38bdf8',6);
  ctx.fillStyle='#38bdf8';ctx.textAlign='left';
  ctx.fillText('z₂='+fmtCx(a2,b2),sc(a2)+8,sy(b2)-8);
  if(isFinite(re)&&isFinite(im)){
    arrow(CX,CY,sc(re),sy(im),'#4ade80',3);
    dot(sc(re),sy(im),'#4ade80',7);
    ctx.fillStyle='#4ade80';ctx.font='bold 12px monospace';ctx.textAlign='left';
    ctx.fillText('結果='+fmtCx(re,im),sc(re)+10,sy(im)-10);
  }
  const ops={add:'z₁ + z₂',sub:'z₁ − z₂',mul:'z₁ × z₂',div:'z₁ ÷ z₂'};
  if(isFinite(re)&&isFinite(im)){
    document.getElementById('arith-eq').textContent=ops[currentOp]+' = '+fmtCx(re,im);
    document.getElementById('arith-re').textContent=fmt(re,3);
    document.getElementById('arith-im').textContent=fmt(im,3);
    const abs=Math.sqrt(re*re+im*im);
    document.getElementById('arith-abs').textContent=fmt(abs,3);
    document.getElementById('arith-arg').textContent=fmt(toDeg(Math.atan2(im,re)),1)+'°';
  } else {
    document.getElementById('arith-eq').textContent='ゼロ除算';
    ['arith-re','arith-im','arith-abs','arith-arg'].forEach(id=>document.getElementById(id).textContent='—');
  }
}

function drawPolar(){
  const {r,th}=zPolar;
  const rad=toRad(th);
  const a=r*Math.cos(rad),b=r*Math.sin(rad);
  ctx.beginPath();ctx.arc(CX,CY,r/RANGE*(W/2-24),0,Math.PI*2);
  ctx.strokeStyle='#facc1544';ctx.lineWidth=1.5;ctx.stroke();
  const arcR=32;
  ctx.save();
  ctx.beginPath();ctx.arc(CX,CY,arcR,0,-rad,th<0);
  ctx.strokeStyle='#facc1588';ctx.lineWidth=1.5;ctx.stroke();
  ctx.fillStyle='#facc15';ctx.font='10px monospace';ctx.textAlign='left';
  const ma=rad/2;
  ctx.fillText(th+'°',CX+(arcR+8)*Math.cos(ma),CY-(arcR+8)*Math.sin(ma));
  ctx.restore();
  ctx.fillStyle='#facc15';ctx.font='10px monospace';ctx.textAlign='center';
  ctx.fillText('r='+r,CX+r/RANGE*(W/2-24)*0.5*Math.cos(rad),CY-r/RANGE*(W/2-24)*0.5*Math.sin(rad)-6);
  arrow(CX,CY,sc(a),sy(b),'#facc15',3);
  dot(sc(a),sy(b),'#facc15',7);
  ctx.fillStyle='#facc15';ctx.font='bold 12px monospace';ctx.textAlign='left';
  ctx.fillText('z='+fmtCx(a,b),sc(a)+10,sy(b)-10);
  ctx.save();ctx.setLineDash([3,3]);ctx.strokeStyle='#facc1544';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(sc(a),sy(b));ctx.lineTo(sc(a),CY);ctx.stroke();
  ctx.beginPath();ctx.moveTo(sc(a),sy(b));ctx.lineTo(CX,sy(b));ctx.stroke();
  ctx.restore();
  ctx.fillStyle='#f472b6';ctx.font='10px monospace';ctx.textAlign='center';
  ctx.fillText('r cosθ',sc(a/2),CY+14);
  ctx.fillStyle='#38bdf8';ctx.textAlign='right';
  ctx.fillText('r sinθ',CX-5,(sy(b)+CY)/2);
  document.getElementById('polar-eq').textContent=`z = ${r}(cos${th}° + i sin${th}°)`;
  document.getElementById('polar-re').textContent=fmt(a,3);
  document.getElementById('polar-im').textContent=fmt(b,3);
}

function drawPower(){
  const {r,th,n}=zPower;
  const rad=toRad(th);
  for(let k=1;k<=n;k++){
    const rk=Math.pow(r,k);
    const ak=rk*Math.cos(k*rad),bk=rk*Math.sin(k*rad);
    const alpha=k===n?1:0.35;
    const col=`rgba(251,146,60,${alpha})`;
    if(k===1){
      arrow(CX,CY,sc(ak),sy(bk),col,k===n?3:1.5);
    } else {
      const rp=Math.pow(r,k-1);
      const ap=rp*Math.cos((k-1)*rad),bp=rp*Math.sin((k-1)*rad);
      arrow(sc(ap),sy(bp),sc(ak),sy(bk),col,k===n?3:1.5);
    }
    dot(sc(ak),sy(bk),k===n?'#fb923c':'#fb923c66',k===n?7:4);
    if(k===n){
      ctx.fillStyle='#fb923c';ctx.font='bold 12px monospace';ctx.textAlign='left';
      ctx.fillText('z^'+n+'='+fmtCx(ak,bk),sc(ak)+10,sy(bk)-10);
    } else {
      ctx.fillStyle='#fb923c88';ctx.font='10px monospace';ctx.textAlign='left';
      ctx.fillText('z^'+k,sc(ak)+6,sy(bk)-6);
    }
  }
  const a1=r*Math.cos(rad),b1=r*Math.sin(rad);
  arrow(CX,CY,sc(a1),sy(b1),'#fb923c',2.5);
  const arcR=30;
  ctx.save();
  ctx.beginPath();ctx.arc(CX,CY,arcR,0,-rad,th<0);
  ctx.strokeStyle='#fb923c88';ctx.lineWidth=1.2;ctx.stroke();
  ctx.fillStyle='#fb923c';ctx.font='10px monospace';ctx.textAlign='left';
  ctx.fillText(th+'°',CX+arcR+4,CY-6);
  ctx.restore();
  ctx.save();ctx.setLineDash([4,3]);
  ctx.beginPath();ctx.arc(CX,CY,W/2-24,0,Math.PI*2);
  ctx.strokeStyle='#a78bfa22';ctx.lineWidth=1;ctx.stroke();
  ctx.restore();
  const rn=Math.pow(r,n),thn=th*n;
  const re=rn*Math.cos(toRad(thn)),im=rn*Math.sin(toRad(thn));
  document.getElementById('power-eq').textContent=`z^${n} = ${r}^${n}(cos${thn}° + i sin${thn}°)`;
  document.getElementById('power-abs').textContent=fmt(rn,3);
  document.getElementById('power-arg').textContent=fmt(thn,1)+'°';
  document.getElementById('power-re').textContent=fmt(re,3);
  document.getElementById('power-im').textContent=fmt(im,3);
}

function redraw(){
  ctx.clearRect(0,0,W,H);
  drawGrid();
  if(activeTab==='basic') drawBasic();
  else if(activeTab==='arith') drawArith();
  else if(activeTab==='polar') drawPolar();
  else if(activeTab==='power') drawPower();
}

/* ===== スライダー同期 ===== */
function onSlider(){
  zBasic={a:+document.getElementById('za').value,b:+document.getElementById('zb').value};
  z1={a:+document.getElementById('z1a').value,b:+document.getElementById('z1b').value};
  z2={a:+document.getElementById('z2a').value,b:+document.getElementById('z2b').value};
  zPolar={r:+document.getElementById('pr').value,th:+document.getElementById('pth').value};
  zPower={r:+document.getElementById('wr').value,th:+document.getElementById('wth').value,n:+document.getElementById('wn').value};
  syncLabels();
  redraw();
}

function syncLabels(){
  document.getElementById('za-lbl').textContent=document.getElementById('za').value;
  document.getElementById('zb-lbl').textContent=document.getElementById('zb').value;
  document.getElementById('z1a-lbl').textContent=document.getElementById('z1a').value;
  document.getElementById('z1b-lbl').textContent=document.getElementById('z1b').value;
  document.getElementById('z2a-lbl').textContent=document.getElementById('z2a').value;
  document.getElementById('z2b-lbl').textContent=document.getElementById('z2b').value;
  document.getElementById('pr-lbl').textContent=document.getElementById('pr').value;
  document.getElementById('pth-lbl').textContent=document.getElementById('pth').value+'°';
  document.getElementById('wr-lbl').textContent=document.getElementById('wr').value;
  document.getElementById('wth-lbl').textContent=document.getElementById('wth').value+'°';
  document.getElementById('wn-lbl').textContent=document.getElementById('wn').value;
}

/* ===== ドラッグ ===== */
function hitTest(cx,cy,zx,zy,r){
  return Math.sqrt((cx-sc(zx))**2+(cy-sy(zy))**2)<r;
}
function getPos(e){
  const r=canvas.getBoundingClientRect();
  const t=e.touches?e.touches[0]:e;
  return{x:t.clientX-r.left,y:t.clientY-r.top};
}
canvas.addEventListener('mousedown',e=>{
  const {x,y}=getPos(e);
  if(activeTab==='basic'&&hitTest(x,y,zBasic.a,zBasic.b,14)) dragging='zBasic';
  else if(activeTab==='arith'){
    if(hitTest(x,y,z1.a,z1.b,14)) dragging='z1';
    else if(hitTest(x,y,z2.a,z2.b,14)) dragging='z2';
  }
});
canvas.addEventListener('mousemove',e=>{
  if(!dragging)return;
  const {x,y}=getPos(e);
  const nx=snap(fromSc(x)),ny=snap(fromSy(y));
  if(dragging==='zBasic'){
    zBasic={a:nx,b:ny};
    document.getElementById('za').value=nx;
    document.getElementById('zb').value=ny;
  } else if(dragging==='z1'){
    z1={a:nx,b:ny};
    document.getElementById('z1a').value=nx;
    document.getElementById('z1b').value=ny;
  } else if(dragging==='z2'){
    z2={a:nx,b:ny};
    document.getElementById('z2a').value=nx;
    document.getElementById('z2b').value=ny;
  }
  syncLabels();redraw();
});
canvas.addEventListener('mouseup',()=>dragging=null);
canvas.addEventListener('mouseleave',()=>dragging=null);
canvas.addEventListener('touchstart',e=>{
  e.preventDefault();
  const {x,y}=getPos(e);
  if(activeTab==='basic'&&hitTest(x,y,zBasic.a,zBasic.b,18)) dragging='zBasic';
  else if(activeTab==='arith'){
    if(hitTest(x,y,z1.a,z1.b,18)) dragging='z1';
    else if(hitTest(x,y,z2.a,z2.b,18)) dragging='z2';
  }
},{passive:false});
canvas.addEventListener('touchmove',e=>{
  e.preventDefault();
  if(!dragging)return;
  const {x,y}=getPos(e);
  const nx=snap(fromSc(x)),ny=snap(fromSy(y));
  if(dragging==='zBasic'){zBasic={a:nx,b:ny};document.getElementById('za').value=nx;document.getElementById('zb').value=ny;}
  else if(dragging==='z1'){z1={a:nx,b:ny};document.getElementById('z1a').value=nx;document.getElementById('z1b').value=ny;}
  else if(dragging==='z2'){z2={a:nx,b:ny};document.getElementById('z2a').value=nx;document.getElementById('z2b').value=ny;}
  syncLabels();redraw();
},{passive:false});
canvas.addEventListener('touchend',()=>dragging=null);

/* ===== トグルボタン更新 ===== */
function refreshTogButtons(){
  const dark=document.body.classList.contains('dark');
  const offBg  =dark?'#0f1f3d':'#f0f4f8';
  const offBdr =dark?'#1e3a6e':'#d4dde6';
  const offClr =dark?'#4a6a9c':'#64748b';

  const b1=document.getElementById('tog-conj');
  b1.style.background=showConj?'#4ade8022':offBg;
  b1.style.borderColor=showConj?'#4ade80':offBdr;
  b1.style.color=showConj?'#4ade80':offClr;

  const b2=document.getElementById('tog-circle');
  b2.style.background=showCircle?'#facc1522':offBg;
  b2.style.borderColor=showCircle?'#facc15':offBdr;
  b2.style.color=showCircle?'#facc15':offClr;
}

/* ===== 演算ボタン更新 ===== */
function refreshOpButtons(){
  const dark=document.body.classList.contains('dark');
  const offBg  =dark?'#0f1f3d':'#f0f4f8';
  const offBdr =dark?'#1e3a6e':'#d4dde6';
  const offClr =dark?'#4a6a9c':'#64748b';
  const col='#4ade80';
  ['add','sub','mul','div'].forEach(k=>{
    const btn=document.getElementById('op-'+k);
    const on=k===currentOp;
    btn.style.background=on?col+'22':offBg;
    btn.style.borderColor=on?col:offBdr;
    btn.style.color=on?col:offClr;
  });
}

function setOp(op){
  currentOp=op;
  refreshOpButtons();
  redraw();
}

function switchTab(t){
  activeTab=t;
  ['basic','arith','polar','power'].forEach(n=>{
    document.getElementById('panel-'+n).classList.toggle('active',n===t);
    document.getElementById('tab-'+n).classList.toggle('active',n===t);
  });
  redraw();
}

function toggleConj(){
  showConj=!showConj;
  document.getElementById('tog-conj').textContent='z̄ '+(showConj?'表示中':'非表示');
  refreshTogButtons();
  redraw();
}
function toggleCircle(){
  showCircle=!showCircle;
  document.getElementById('tog-circle').textContent='|z|の円 '+(showCircle?'表示中':'非表示');
  refreshTogButtons();
  redraw();
}

function onZoom(){
  RANGE=+document.getElementById('zoom').value;
  document.getElementById('zoom-lbl').textContent=RANGE;
  ['za','zb','z1a','z1b','z2a','z2b'].forEach(id=>{
    document.getElementById(id).min=-RANGE;
    document.getElementById(id).max=RANGE;
  });
  document.getElementById('pr').max=RANGE;
  redraw();
}

/* ===== テーマ初期化 ===== */
const _saved=localStorage.getItem('math-theme');
if(_saved==='dark') document.body.classList.add('dark');

syncLabels();
refreshTogButtons();
refreshOpButtons();
redraw();

const _themeBtn=document.getElementById('theme-toggle');
_themeBtn.textContent=document.body.classList.contains('dark')?'☀ ライト':'🌙 ダーク';

_themeBtn.addEventListener('click',()=>{
  document.body.classList.toggle('dark');
  const dark=document.body.classList.contains('dark');
  localStorage.setItem('math-theme',dark?'dark':'light');
  _themeBtn.textContent=dark?'☀ ライト':'🌙 ダーク';
  refreshTogButtons();
  refreshOpButtons();
  redraw();
});
