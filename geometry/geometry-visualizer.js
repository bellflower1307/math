const canvas=document.getElementById('cv');
const ctx=canvas.getContext('2d');
const W=460,H=460;
let RANGE=7;
const CX=W/2,CY=H/2;
let activeTab='circle';
let regionMode='none';
let locusMode='perp';

/* ===== テーマカラー ===== */
function cc(){
  const d=document.body.classList.contains('dark');
  return {
    bg:           d?'#07101f':'#f8f9fb',
    grid:         d?'#111e38':'#e8edf4',
    axis:         d?'#2a3a5c':'#c0cede',
    label:        d?'#243a5a':'#9aabbe',
    handleStroke: d?'rgba(255,255,255,0.85)':'rgba(30,40,60,0.35)'
  };
}

/* ===== 座標変換 ===== */
function sc(x){return CX+x/RANGE*(W/2-24);}
function sy(y){return CY-y/RANGE*(H/2-24);}
function fromSx(cx){return(cx-CX)/(W/2-24)*RANGE;}
function fromSy(cy){return(CY-cy)/(H/2-24)*RANGE;}

function v(id){return +document.getElementById(id).value;}
function lbl(id,val){document.getElementById(id).textContent=val;}

/* ===== グリッド描画 ===== */
function drawGrid(){
  const c=cc();
  ctx.fillStyle=c.bg; ctx.fillRect(0,0,W,H);
  ctx.strokeStyle=c.grid; ctx.lineWidth=0.8;
  for(let i=-RANGE;i<=RANGE;i++){
    ctx.beginPath();ctx.moveTo(sc(i),0);ctx.lineTo(sc(i),H);ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,sy(i));ctx.lineTo(W,sy(i));ctx.stroke();
  }
  ctx.strokeStyle=c.axis; ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(0,CY);ctx.lineTo(W,CY);ctx.stroke();
  ctx.beginPath();ctx.moveTo(CX,0);ctx.lineTo(CX,H);ctx.stroke();
  ctx.fillStyle=c.label; ctx.font='9px monospace'; ctx.textAlign='center';
  for(let i=-RANGE;i<=RANGE;i++){
    if(i===0)continue;
    if(RANGE>6&&i%2!==0)continue;
    ctx.fillText(i,sc(i),CY+13);
    ctx.textAlign='right';ctx.fillText(i,CX-4,sy(i)+4);ctx.textAlign='center';
  }
}

/* ===== 点を描く ===== */
function dot(x,y,color,r){
  ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);
  ctx.fillStyle=color;ctx.fill();
  ctx.strokeStyle=cc().handleStroke;ctx.lineWidth=1.5;ctx.stroke();
}

/* ===== 円タブ ===== */
function circleEqStr(a,b,r){
  const xs=a===0?'x²':(a>0?`(x−${a})²`:`(x+${Math.abs(a)})²`);
  const ys=b===0?'y²':(b>0?`(y−${b})²`:`(y+${Math.abs(b)})²`);
  return `${xs}+${ys}=${r}²`;
}

function drawCircleTab(){
  const a=v('ca'),b=v('cb'),r=v('cr');
  const a2=v('ca2'),b2=v('cb2'),r2=v('cr2');
  lbl('ca-lbl',a);lbl('cb-lbl',b);lbl('cr-lbl',r);
  lbl('ca2-lbl',a2);lbl('cb2-lbl',b2);lbl('cr2-lbl',r2);

  // circle 1
  ctx.beginPath();
  ctx.arc(sc(a),sy(b),r/RANGE*(W/2-24),0,Math.PI*2);
  ctx.strokeStyle='#38bdf8';ctx.lineWidth=2.5;ctx.stroke();
  ctx.fillStyle='#38bdf808';ctx.fill();
  dot(sc(a),sy(b),'#38bdf8',5);
  ctx.fillStyle='#38bdf8';ctx.font='bold 11px monospace';ctx.textAlign='left';
  ctx.fillText(`C₁(${a},${b})`,sc(a)+8,sy(b)-8);

  // circle 2
  ctx.beginPath();
  ctx.arc(sc(a2),sy(b2),r2/RANGE*(W/2-24),0,Math.PI*2);
  ctx.strokeStyle='#4ade80';ctx.lineWidth=2.5;ctx.stroke();
  ctx.fillStyle='#4ade8008';ctx.fill();
  dot(sc(a2),sy(b2),'#4ade80',5);
  ctx.fillStyle='#4ade80';ctx.font='bold 11px monospace';ctx.textAlign='left';
  ctx.fillText(`C₂(${a2},${b2})`,sc(a2)+8,sy(b2)-8);

  // distance line between centers
  ctx.setLineDash([4,3]);ctx.strokeStyle='#facc1566';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(sc(a),sy(b));ctx.lineTo(sc(a2),sy(b2));ctx.stroke();
  ctx.setLineDash([]);
  const mx=(sc(a)+sc(a2))/2,my=(sy(b)+sy(b2))/2;
  const d=Math.sqrt((a2-a)**2+(b2-b)**2);
  ctx.fillStyle='#facc15';ctx.font='10px monospace';ctx.textAlign='center';
  ctx.fillText('d='+d.toFixed(2),mx,my-6);

  lbl('circle-dist',d.toFixed(3));
  document.getElementById('circle-rsum').textContent=(r+r2).toFixed(2);
  document.getElementById('circle-rdiff').textContent=Math.abs(r-r2).toFixed(2);

  let rel='';
  const eps=0.08;
  if(d>r+r2+eps) rel='外部（共有点なし）';
  else if(Math.abs(d-(r+r2))<eps) rel='外接（共有点1つ）';
  else if(d>Math.abs(r-r2)+eps) rel='交わる（共有点2つ）';
  else if(Math.abs(d-Math.abs(r-r2))<eps) rel='内接（共有点1つ）';
  else rel='内部（共有点なし）';
  document.getElementById('circle-rel').textContent=rel;

  document.getElementById('circle-eq').textContent=circleEqStr(a,b,r);
  document.getElementById('circle-eq2').textContent=circleEqStr(a2,b2,r2);
}

/* ===== 曲線コンパイル ===== */
function compileCurve(s){
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
  try{
    const f=new Function('x','try{return ('+s+');}catch(e){return NaN;}');
    f(0);f(1);f(-1);
    return f;
  }catch(e){return null;}
}

function drawCurveOnCanvas(fn,color,lw=2.5){
  if(!fn)return;
  ctx.strokeStyle=color;ctx.lineWidth=lw;
  let drawing=false;
  ctx.beginPath();
  const steps=700;
  for(let i=0;i<=steps;i++){
    const x=-RANGE+(2*RANGE*i/steps);
    let y;
    try{y=fn(x);}catch(e){drawing=false;continue;}
    if(!isFinite(y)||isNaN(y)||Math.abs(y)>RANGE*4){drawing=false;continue;}
    const cx2=sc(x),cy2=sy(y);
    if(!drawing){ctx.moveTo(cx2,cy2);drawing=true;}
    else ctx.lineTo(cx2,cy2);
  }
  ctx.stroke();
}

const regionLabels={
  none:'なし',
  above1:'y > ①（①の上側）',
  below1:'y < ①（①の下側）',
  above2:'y > ②（②の上側）',
  below2:'y < ②（②の下側）',
  a1a2:'①の上 かつ ②の上',
  a1b2:'①の上 かつ ②の下',
  b1a2:'①の下 かつ ②の上（2曲線の間）',
  b1b2:'①の下 かつ ②の下'
};
const regionColors={
  above1:'#f472b6',below1:'#f472b6',
  above2:'#38bdf8',below2:'#38bdf8',
  a1a2:'#a78bfa',a1b2:'#fb923c',
  b1a2:'#4ade80',b1b2:'#facc15'
};

function evalSafe(fn,x){
  if(!fn)return null;
  try{const y=fn(x);return isFinite(y)&&!isNaN(y)?y:null;}catch(e){return null;}
}

/* ===== 領域ボタンの更新 ===== */
function refreshRegionButtons(){
  const dark=document.body.classList.contains('dark');
  const offBg  =dark?'#0f1f3d':'#f0f4f8';
  const offBdr =dark?'#1e3a6e':'#d4dde6';
  const offClr =dark?'#4a6a9c':'#64748b';
  const colMap={
    none:'#a78bfa',
    above1:'#f472b6',below1:'#f472b6',
    above2:'#38bdf8',below2:'#38bdf8',
    a1a2:'#a78bfa',a1b2:'#fb923c',
    b1a2:'#4ade80',b1b2:'#facc15'
  };
  ['none','above1','below1','above2','below2','a1a2','a1b2','b1a2','b1b2'].forEach(k=>{
    const btn=document.getElementById('reg-'+k);
    if(!btn)return;
    const on=k===regionMode;
    const col=colMap[k]||'#a78bfa';
    btn.style.background=on?col+'22':offBg;
    btn.style.borderColor=on?col:offBdr;
    btn.style.color=on?col:offClr;
  });
}

/* ===== 軌跡ボタンの更新 ===== */
function refreshLocusButtons(){
  const dark=document.body.classList.contains('dark');
  const offBg  =dark?'#0f1f3d':'#f0f4f8';
  const offBdr =dark?'#1e3a6e':'#d4dde6';
  const offClr =dark?'#4a6a9c':'#64748b';
  ['perp','apoll'].forEach(k=>{
    const btn=document.getElementById('loc-'+k);
    if(!btn)return;
    const on=k===locusMode;
    btn.style.background=on?'#fb923c22':offBg;
    btn.style.borderColor=on?'#fb923c':offBdr;
    btn.style.color=on?'#fb923c':offClr;
  });
}

/* ===== 直線・領域タブ ===== */
function drawLineTab(){
  const s1=document.getElementById('curve1-input').value;
  const s2=document.getElementById('curve2-input').value;
  const fn1=compileCurve(s1);
  const fn2=compileCurve(s2);

  if(regionMode!=='none'){
    const col=regionColors[regionMode]||'#a78bfa';
    const step=3;
    for(let px=0;px<W;px+=step){
      for(let py=0;py<H;py+=step){
        const wx=fromSx(px+step/2),wy=fromSy(py+step/2);
        const y1=evalSafe(fn1,wx);
        const y2=evalSafe(fn2,wx);
        let fill=false;
        const above1=y1!==null&&wy>y1;
        const below1=y1!==null&&wy<y1;
        const above2=y2!==null&&wy>y2;
        const below2=y2!==null&&wy<y2;
        if(regionMode==='above1') fill=above1;
        else if(regionMode==='below1') fill=below1;
        else if(regionMode==='above2') fill=above2;
        else if(regionMode==='below2') fill=below2;
        else if(regionMode==='a1a2') fill=above1&&above2;
        else if(regionMode==='a1b2') fill=above1&&below2;
        else if(regionMode==='b1a2') fill=below1&&above2;
        else if(regionMode==='b1b2') fill=below1&&below2;
        if(fill){ctx.fillStyle=col+'2a';ctx.fillRect(px,py,step,step);}
      }
    }
  }

  drawCurveOnCanvas(fn1,'#f472b6',2.5);
  drawCurveOnCanvas(fn2,'#38bdf8',2.5);

  ctx.font='bold 11px monospace';ctx.textAlign='left';
  const labelX=RANGE*0.8;
  if(fn1){const ey=evalSafe(fn1,labelX);if(ey!==null&&Math.abs(ey)<RANGE){ctx.fillStyle='#f472b6';ctx.fillText('①',sc(labelX)+4,sy(ey)-6);}}
  if(fn2){const ey=evalSafe(fn2,labelX);if(ey!==null&&Math.abs(ey)<RANGE){ctx.fillStyle='#38bdf8';ctx.fillText('②',sc(labelX)+4,sy(ey)+14);}}

  document.getElementById('region-desc').textContent=regionLabels[regionMode]||'なし';
}

function setC1(s){document.getElementById('curve1-input').value=s;redraw();}
function setC2(s){document.getElementById('curve2-input').value=s;redraw();}

/* ===== 軌跡タブ ===== */
function drawLocusTab(){
  const ax=v('lax'),ay=v('lay'),bx=v('lbx'),by=v('lby');
  lbl('lax-lbl',ax);lbl('lay-lbl',ay);lbl('lbx-lbl',bx);lbl('lby-lbl',by);
  const m=v('lm');lbl('lm-lbl',m);

  dot(sc(ax),sy(ay),'#f472b6',6);
  dot(sc(bx),sy(by),'#38bdf8',6);
  ctx.font='bold 12px monospace';ctx.textAlign='left';
  ctx.fillStyle='#f472b6';ctx.fillText('A',sc(ax)+8,sy(ay)-8);
  ctx.fillStyle='#38bdf8';ctx.fillText('B',sc(bx)+8,sy(by)-8);

  if(locusMode==='perp'){
    const mx=(ax+bx)/2,my=(ay+by)/2;
    const dx=bx-ax,dy=by-ay;
    dot(sc(mx),sy(my),'#fb923c',5);
    if(Math.abs(dx)<0.01&&Math.abs(dy)<0.01){
      document.getElementById('locus-result').textContent='A=Bのため軌跡なし';
      return;
    }
    ctx.strokeStyle='#fb923c';ctx.lineWidth=2.5;
    ctx.beginPath();
    if(Math.abs(dx)<0.01){
      ctx.moveTo(sc(-RANGE),sy(my));ctx.lineTo(sc(RANGE),sy(my));
    } else if(Math.abs(dy)<0.01){
      ctx.moveTo(sc(mx),sy(-RANGE));ctx.lineTo(sc(mx),sy(RANGE));
    } else {
      const slope=-dx/dy;
      const intercept=my-slope*mx;
      ctx.moveTo(sc(-RANGE),sy(slope*(-RANGE)+intercept));
      ctx.lineTo(sc(RANGE),sy(slope*RANGE+intercept));
    }
    ctx.stroke();

    const C=bx*bx-ax*ax+by*by-ay*ay;
    const A2=2*dx,B2=2*dy;
    document.getElementById('locus-result').textContent=`${A2}x + ${B2}y = ${C}　（垂直二等分線）`;
    document.getElementById('locus-eq').textContent='PA = PB の軌跡（垂直二等分線）';
  } else {
    const m2=m*m;
    const A2=1-m2,B2=1-m2;
    const Cx2=-2*ax+2*m2*bx,Cy2=-2*ay+2*m2*by;
    const D=ax*ax+ay*ay-m2*(bx*bx+by*by);
    if(Math.abs(m-1)<0.1){
      ctx.strokeStyle='#fb923c';ctx.lineWidth=2.5;
      const dx=bx-ax,dy=by-ay,mx2=(ax+bx)/2,my2=(ay+by)/2;
      if(Math.abs(dx)<0.01){ctx.beginPath();ctx.moveTo(sc(-RANGE),sy(my2));ctx.lineTo(sc(RANGE),sy(my2));ctx.stroke();}
      else if(Math.abs(dy)<0.01){ctx.beginPath();ctx.moveTo(sc(mx2),0);ctx.lineTo(sc(mx2),H);ctx.stroke();}
      else{const sl=-dx/dy,int2=my2-sl*mx2;ctx.beginPath();ctx.moveTo(sc(-RANGE),sy(sl*(-RANGE)+int2));ctx.lineTo(sc(RANGE),sy(sl*RANGE+int2));ctx.stroke();}
      document.getElementById('locus-result').textContent='m=1 のため垂直二等分線';
    } else {
      const cx3=-Cx2/(2*A2),cy3=-Cy2/(2*A2);
      const r2=cx3*cx3+cy3*cy3-D/A2;
      if(r2>0){
        const r3=Math.sqrt(r2);
        ctx.beginPath();
        ctx.arc(sc(cx3),sy(cy3),r3/RANGE*(W/2-24),0,Math.PI*2);
        ctx.strokeStyle='#fb923c';ctx.lineWidth=2.5;ctx.stroke();
        ctx.fillStyle='#fb923c10';ctx.fill();
        dot(sc(cx3),sy(cy3),'#fb923c',4);
        document.getElementById('locus-result').textContent=`中心(${cx3.toFixed(2)}, ${cy3.toFixed(2)}) 半径${r3.toFixed(2)}`;
      }
      document.getElementById('locus-eq').textContent=`PA:PB = ${m}:1 の軌跡（アポロニウスの円）`;
    }
  }
}

/* ===== 点と距離タブ ===== */
function drawDistTab(){
  const px2=v('px'),py2=v('py');
  const a=v('da'),b=v('db'),c=v('dc');
  lbl('px-lbl',px2);lbl('py-lbl',py2);
  lbl('da-lbl',a);lbl('db-lbl',b);lbl('dc-lbl',c);

  if(Math.abs(b)>0.01){
    const y1=(-a*(-RANGE)-c)/b,y2=(-a*RANGE-c)/b;
    ctx.beginPath();ctx.moveTo(sc(-RANGE),sy(y1));ctx.lineTo(sc(RANGE),sy(y2));
    ctx.strokeStyle='#f472b6';ctx.lineWidth=2.5;ctx.stroke();
  } else if(Math.abs(a)>0.01){
    const x0=-c/a;
    ctx.beginPath();ctx.moveTo(sc(x0),0);ctx.lineTo(sc(x0),H);
    ctx.strokeStyle='#f472b6';ctx.lineWidth=2.5;ctx.stroke();
  }

  dot(sc(px2),sy(py2),'#4ade80',7);
  ctx.fillStyle='#4ade80';ctx.font='bold 12px monospace';ctx.textAlign='left';
  ctx.fillText(`P(${px2},${py2})`,sc(px2)+10,sy(py2)-8);

  const denom=a*a+b*b;
  if(denom>0.001){
    const t=-(a*px2+b*py2+c)/denom;
    const fx=px2+a*t,fy=py2+b*t;
    ctx.setLineDash([4,3]);ctx.strokeStyle='#4ade8088';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(sc(px2),sy(py2));ctx.lineTo(sc(fx),sy(fy));ctx.stroke();
    ctx.setLineDash([]);
    dot(sc(fx),sy(fy),'#facc15',5);
    ctx.fillStyle='#facc15';ctx.font='10px monospace';ctx.textAlign='left';
    ctx.fillText('H',sc(fx)+6,sy(fy)-6);

    const dist=Math.abs(a*px2+b*py2+c)/Math.sqrt(denom);
    document.getElementById('pt-dist').textContent=dist.toFixed(4);
    document.getElementById('dist-formula').textContent=`|${a}×${px2}+${b}×${py2}+${c}| / √(${a}²+${b}²) = ${dist.toFixed(3)}`;
  }
  document.getElementById('dist-eq').textContent=`点(${px2},${py2})と ${a}x+${b}y+${c}=0 の距離`;
}

/* ===== メイン描画 ===== */
function redraw(){
  ctx.clearRect(0,0,W,H);
  drawGrid();
  if(activeTab==='circle') drawCircleTab();
  else if(activeTab==='line') drawLineTab();
  else if(activeTab==='locus') drawLocusTab();
  else if(activeTab==='dist') drawDistTab();
}

function switchTab(t){
  activeTab=t;
  ['circle','line','locus','dist'].forEach(n=>{
    document.getElementById('panel-'+n).classList.toggle('active',n===t);
    document.getElementById('tab-'+n).classList.toggle('active',n===t);
  });
  redraw();
}

function setRegion(m){
  regionMode=m;
  refreshRegionButtons();
  redraw();
}

function setLocus(m){
  locusMode=m;
  document.getElementById('apoll-row').style.display=m==='apoll'?'block':'none';
  refreshLocusButtons();
  redraw();
}

function onZoom(){
  RANGE=+document.getElementById('zoom').value;
  document.getElementById('zoom-lbl').textContent=RANGE;
  redraw();
}

/* ===== テーマ初期化 ===== */
const _saved=localStorage.getItem('math-theme');
if(_saved==='dark') document.body.classList.add('dark');

refreshRegionButtons();
refreshLocusButtons();
redraw();

const _themeBtn=document.getElementById('theme-toggle');
_themeBtn.textContent=document.body.classList.contains('dark')?'☀ ライト':'🌙 ダーク';

_themeBtn.addEventListener('click',()=>{
  document.body.classList.toggle('dark');
  const dark=document.body.classList.contains('dark');
  localStorage.setItem('math-theme',dark?'dark':'light');
  _themeBtn.textContent=dark?'☀ ライト':'🌙 ダーク';
  refreshRegionButtons();
  refreshLocusButtons();
  redraw();
});
