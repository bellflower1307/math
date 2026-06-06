const W=300,H=300,CX=W/2,CY=H/2,R=108;
const GW2=520, GH2=200, GX=44, GY=16, GW=GW2-GX-14, GH=GH2-GY-28;

let angle=45, isPlaying=false, animId=null;
let A=1, B=1, C=0, showSin=true, showCos=true;
let activeTab='sin';

function toRad(d){ return d*Math.PI/180; }

function svgEl(tag, attrs={}, text=''){
  const el=document.createElementNS('http://www.w3.org/2000/svg',tag);
  for(const [k,v] of Object.entries(attrs)) el.setAttribute(k,v);
  if(text) el.textContent=text;
  return el;
}

function tc(){
  const d=document.body.classList.contains('dark');
  return {
    axis:      d ? '#2a3a5c' : '#c0cce0',
    ring:      d ? '#1e3a6e' : '#ccd8e8',
    grid:      d ? '#1a2a4a' : '#e0e8f2',
    gridZero:  d ? '#2a3a5c' : '#c4d0e0',
    label:     d ? '#3a5a8c' : '#94a3b8',
    angleDeg:  d ? '#4a6a9c' : '#94a3b8',
  };
}

function drawCircle(){
  const svg=document.getElementById('circle-svg');
  svg.innerHTML='';
  const col=tc();
  const rad=toRad(angle);
  const px=CX+R*Math.cos(rad), py=CY-R*Math.sin(rad);

  svg.appendChild(svgEl('line',{x1:CX,y1:8,x2:CX,y2:H-8,stroke:col.axis,'stroke-width':1}));
  svg.appendChild(svgEl('line',{x1:8,y1:CY,x2:W-8,y2:CY,stroke:col.axis,'stroke-width':1}));

  [0,90,180,270].forEach(d=>{
    const r2=toRad(d);
    const lx=CX+(R+16)*Math.cos(r2), ly=CY-(R+16)*Math.sin(r2);
    svg.appendChild(svgEl('text',{x:lx,y:ly,fill:col.angleDeg,'font-size':10,'text-anchor':'middle','dominant-baseline':'middle','font-family':'monospace'},d+'°'));
  });

  svg.appendChild(svgEl('circle',{cx:CX,cy:CY,r:R,fill:'none',stroke:col.ring,'stroke-width':1.5}));
  svg.appendChild(svgEl('line',{x1:CX,y1:CY,x2:px,y2:CY,stroke:'#38bdf8','stroke-width':2,'stroke-dasharray':'4,2'}));
  svg.appendChild(svgEl('line',{x1:px,y1:py,x2:px,y2:CY,stroke:'#f472b6','stroke-width':2,'stroke-dasharray':'4,2'}));
  svg.appendChild(svgEl('line',{x1:CX,y1:CY,x2:px,y2:py,stroke:'#a78bfa','stroke-width':2}));

  if(angle!==0){
    const large=angle>180?1:0;
    svg.appendChild(svgEl('path',{d:`M ${CX+26} ${CY} A 26 26 0 ${large} 0 ${CX+26*Math.cos(rad)} ${CY-26*Math.sin(rad)}`,fill:'none',stroke:'#a78bfa','stroke-width':1.5,opacity:0.6}));
  }

  svg.appendChild(svgEl('text',{x:CX+6,y:CY-R-4,fill:col.label,'font-size':9,'font-family':'monospace'},'1'));
  svg.appendChild(svgEl('text',{x:CX+6,y:CY+R+10,fill:col.label,'font-size':9,'font-family':'monospace'},'-1'));
  svg.appendChild(svgEl('text',{x:CX+R+3,y:CY+10,fill:col.label,'font-size':9,'font-family':'monospace'},'1'));
  svg.appendChild(svgEl('text',{x:CX-R-12,y:CY+10,fill:col.label,'font-size':9,'font-family':'monospace'},'-1'));

  svg.appendChild(svgEl('circle',{cx:px,cy:py,r:6,fill:'#a78bfa',stroke:'#c4b5fd','stroke-width':2}));

  const sinV=Math.sin(rad).toFixed(2), cosV=Math.cos(rad).toFixed(2);
  const lx2=px>CX+70?px-74:px+8;
  svg.appendChild(svgEl('text',{x:lx2,y:py-5,fill:'#f472b6','font-size':10,'font-family':'monospace'},'sin='+sinV));
  svg.appendChild(svgEl('text',{x:lx2,y:py+9,fill:'#38bdf8','font-size':10,'font-family':'monospace'},'cos='+cosV));
}

function drawGrid(svg, yRange, ticks){
  const col=tc();
  const [yMin,yMax]=yRange;
  const ySpan=yMax-yMin;
  ticks.forEach(v=>{
    const yv=GY+GH-(v-yMin)/ySpan*GH;
    if(yv<GY-2||yv>GY+GH+2) return;
    svg.appendChild(svgEl('line',{x1:GX,y1:yv,x2:GX+GW,y2:yv,stroke:v===0?col.gridZero:col.grid,'stroke-width':v===0?1.5:0.7}));
    svg.appendChild(svgEl('text',{x:GX-4,y:yv+4,fill:col.label,'font-size':9,'text-anchor':'end','font-family':'monospace'},String(v)));
  });
  [{label:'0',frac:0},{label:'π/2',frac:0.125},{label:'π',frac:0.25},{label:'3π/2',frac:0.375},
   {label:'2π',frac:0.5},{label:'5π/2',frac:0.625},{label:'3π',frac:0.75},{label:'7π/2',frac:0.875},{label:'4π',frac:1}].forEach(({label,frac})=>{
    const xv=GX+frac*GW;
    svg.appendChild(svgEl('line',{x1:xv,y1:GY+GH,x2:xv,y2:GY+GH+4,stroke:col.gridZero,'stroke-width':1}));
    svg.appendChild(svgEl('text',{x:xv,y:GY+GH+14,fill:col.label,'font-size':9,'text-anchor':'middle','font-family':'monospace'},label));
  });
}

function drawWave(){
  const svg=document.getElementById('wave-svg');
  svg.innerHTML='';
  const yRange=[-Math.max(A,1.1)*1.1,Math.max(A,1.1)*1.1];
  const ySpan=yRange[1]-yRange[0];
  drawGrid(svg,yRange,[-2,-1,0,1,2].filter(v=>v>=yRange[0]&&v<=yRange[1]));

  const steps=500;
  const sinPts=[], cosPts=[];
  for(let i=0;i<=steps;i++){
    const t=(i/steps)*4*Math.PI;
    const x=GX+(i/steps)*GW;
    const sy=GY+GH-(A*Math.sin(B*t+toRad(C))-yRange[0])/ySpan*GH;
    const cy2=GY+GH-(A*Math.cos(B*t+toRad(C))-yRange[0])/ySpan*GH;
    sinPts.push(`${i===0?'M':'L'} ${x} ${sy}`);
    cosPts.push(`${i===0?'M':'L'} ${x} ${cy2}`);
  }

  if(showSin) svg.appendChild(svgEl('path',{d:sinPts.join(' '),fill:'none',stroke:'#f472b6','stroke-width':2.5}));
  if(showCos) svg.appendChild(svgEl('path',{d:cosPts.join(' '),fill:'none',stroke:'#38bdf8','stroke-width':2.5}));

  const norm=((angle%360)+360)%360;
  const tCur=toRad(norm);
  const xM=GX+(tCur/(4*Math.PI))*GW;
  if(xM>=GX&&xM<=GX+GW){
    svg.appendChild(svgEl('line',{x1:xM,y1:GY,x2:xM,y2:GY+GH,stroke:'#a78bfa','stroke-width':1.5,'stroke-dasharray':'3,2',opacity:0.7}));
    if(showSin){
      const ys=GY+GH-(A*Math.sin(B*tCur+toRad(C))-yRange[0])/ySpan*GH;
      svg.appendChild(svgEl('circle',{cx:xM,cy:ys,r:5,fill:'#f472b6',stroke:'white','stroke-width':1.5}));
    }
    if(showCos){
      const yc=GY+GH-(A*Math.cos(B*tCur+toRad(C))-yRange[0])/ySpan*GH;
      svg.appendChild(svgEl('circle',{cx:xM,cy:yc,r:5,fill:'#38bdf8',stroke:'white','stroke-width':1.5}));
    }
  }
  if(showSin){ svg.appendChild(svgEl('circle',{cx:GX+10,cy:GY+8,r:4,fill:'#f472b6'})); svg.appendChild(svgEl('text',{x:GX+18,y:GY+12,fill:'#f472b6','font-size':10,'font-family':'monospace'},'sin')); }
  if(showCos){ svg.appendChild(svgEl('circle',{cx:GX+48,cy:GY+8,r:4,fill:'#38bdf8'})); svg.appendChild(svgEl('text',{x:GX+56,y:GY+12,fill:'#38bdf8','font-size':10,'font-family':'monospace'},'cos')); }
}

function drawTabSin(){
  const svg=document.getElementById('tab-sin-svg');
  svg.innerHTML='';
  drawGrid(svg,[-1.4,1.4],[-1,-0.5,0,0.5,1]);
  const steps=500, pts=[];
  for(let i=0;i<=steps;i++){
    const t=(i/steps)*4*Math.PI;
    const x=GX+(i/steps)*GW;
    const y=GY+GH-(Math.sin(t)+1.4)/2.8*GH;
    pts.push(`${i===0?'M':'L'} ${x} ${y}`);
  }
  svg.appendChild(svgEl('path',{d:pts.join(' '),fill:'none',stroke:'#f472b6','stroke-width':3}));
  const norm=((angle%360)+360)%360;
  const tCur=toRad(norm);
  const xM=GX+(tCur/(4*Math.PI))*GW;
  if(xM>=GX&&xM<=GX+GW){
    svg.appendChild(svgEl('line',{x1:xM,y1:GY,x2:xM,y2:GY+GH,stroke:'#a78bfa','stroke-width':1.5,'stroke-dasharray':'3,2',opacity:0.7}));
    const yM=GY+GH-(Math.sin(tCur)+1.4)/2.8*GH;
    svg.appendChild(svgEl('circle',{cx:xM,cy:yM,r:6,fill:'#f472b6',stroke:'white','stroke-width':2}));
  }
  svg.appendChild(svgEl('text',{x:GX+8,y:GY+12,fill:'#f472b6','font-size':11,'font-family':'monospace','font-weight':700},'y = sin(x)'));
}

function drawTabCos(){
  const svg=document.getElementById('tab-cos-svg');
  svg.innerHTML='';
  drawGrid(svg,[-1.4,1.4],[-1,-0.5,0,0.5,1]);
  const steps=500, pts=[];
  for(let i=0;i<=steps;i++){
    const t=(i/steps)*4*Math.PI;
    const x=GX+(i/steps)*GW;
    const y=GY+GH-(Math.cos(t)+1.4)/2.8*GH;
    pts.push(`${i===0?'M':'L'} ${x} ${y}`);
  }
  svg.appendChild(svgEl('path',{d:pts.join(' '),fill:'none',stroke:'#38bdf8','stroke-width':3}));
  const norm=((angle%360)+360)%360;
  const tCur=toRad(norm);
  const xM=GX+(tCur/(4*Math.PI))*GW;
  if(xM>=GX&&xM<=GX+GW){
    svg.appendChild(svgEl('line',{x1:xM,y1:GY,x2:xM,y2:GY+GH,stroke:'#a78bfa','stroke-width':1.5,'stroke-dasharray':'3,2',opacity:0.7}));
    const yM=GY+GH-(Math.cos(tCur)+1.4)/2.8*GH;
    svg.appendChild(svgEl('circle',{cx:xM,cy:yM,r:6,fill:'#38bdf8',stroke:'white','stroke-width':2}));
  }
  svg.appendChild(svgEl('text',{x:GX+8,y:GY+12,fill:'#38bdf8','font-size':11,'font-family':'monospace','font-weight':700},'y = cos(x)'));
}

function drawTabTan(){
  const svg=document.getElementById('tab-tan-svg');
  svg.innerHTML='';
  const yClamp=4;
  drawGrid(svg,[-yClamp,yClamp],[-3,-2,-1,0,1,2,3]);

  [0.125,0.375,0.625,0.875].forEach(frac=>{
    const xv=GX+frac*GW;
    svg.appendChild(svgEl('line',{x1:xv,y1:GY,x2:xv,y2:GY+GH,stroke:'#4ade8033','stroke-width':1.5,'stroke-dasharray':'5,3'}));
  });

  const segs=[[0,0.124],[0.126,0.374],[0.376,0.624],[0.626,0.874],[0.876,1]];
  segs.forEach(([fStart,fEnd])=>{
    const steps=200, pts=[];
    for(let i=0;i<=steps;i++){
      const frac=fStart+(fEnd-fStart)*(i/steps);
      const t=frac*4*Math.PI;
      const tv=Math.tan(t);
      if(Math.abs(tv)>yClamp*1.5) continue;
      const x=GX+frac*GW;
      const y=GY+GH-Math.max(0,Math.min(GH,(tv+yClamp)/(2*yClamp)*GH));
      pts.push(`${pts.length===0?'M':'L'} ${x} ${y}`);
    }
    if(pts.length>1) svg.appendChild(svgEl('path',{d:pts.join(' '),fill:'none',stroke:'#4ade80','stroke-width':3}));
  });

  const norm=((angle%360)+360)%360;
  const tCur=toRad(norm);
  const xM=GX+(tCur/(4*Math.PI))*GW;
  const tv=Math.tan(tCur);
  if(xM>=GX&&xM<=GX+GW&&Math.abs(tv)<=yClamp){
    svg.appendChild(svgEl('line',{x1:xM,y1:GY,x2:xM,y2:GY+GH,stroke:'#a78bfa','stroke-width':1.5,'stroke-dasharray':'3,2',opacity:0.7}));
    const yM=GY+GH-(tv+yClamp)/(2*yClamp)*GH;
    svg.appendChild(svgEl('circle',{cx:xM,cy:yM,r:6,fill:'#4ade80',stroke:'white','stroke-width':2}));
  }
  svg.appendChild(svgEl('text',{x:GX+8,y:GY+12,fill:'#4ade80','font-size':11,'font-family':'monospace','font-weight':700},'y = tan(x)'));
  svg.appendChild(svgEl('text',{x:GX+0.125*GW+3,y:GY+20,fill:'#4ade8066','font-size':9,'font-family':'monospace'},'π/2'));
  svg.appendChild(svgEl('text',{x:GX+0.375*GW+3,y:GY+20,fill:'#4ade8066','font-size':9,'font-family':'monospace'},'3π/2'));
}

function drawActiveTab(){
  if(activeTab==='sin') drawTabSin();
  else if(activeTab==='cos') drawTabCos();
  else drawTabTan();
}

function switchTab(t){
  activeTab=t;
  ['sin','cos','tan'].forEach(n=>{
    document.getElementById('panel-'+n).classList.toggle('active',n===t);
    const btn=document.getElementById('tab-'+n);
    btn.className='tab-btn'+(n===t?' active-'+n:'');
  });
  drawActiveTab();
}

function updateValues(){
  const rad=toRad(angle);
  const s=Math.sin(rad), c=Math.cos(rad), tn=Math.tan(rad);
  const sv=s.toFixed(3), cv=c.toFixed(3), tv=Math.abs(tn)>99?'∞':tn.toFixed(3);
  document.getElementById('sin-val').textContent=sv;
  document.getElementById('cos-val').textContent=cv;
  document.getElementById('tan-val').textContent=tv;
  document.getElementById('tab-sin-val').textContent=sv;
  document.getElementById('tab-cos-val').textContent=cv;
  document.getElementById('tab-tan-val').textContent=tv;
  document.getElementById('angle-label').textContent=angle+'°';
  document.getElementById('angle-slider').value=angle;
}

function updateFormula(){
  document.getElementById('formula').innerHTML=
    `<span style="color:#f472b6">y = ${A}</span><span style="color:#94a3b8"> · sin(</span><span style="color:#fb923c">${B}</span><span style="color:#94a3b8">x + </span><span style="color:#facc15">${C}°</span><span style="color:#94a3b8">)</span>`;
}

function render(){
  drawCircle();
  drawWave();
  drawActiveTab();
  updateValues();
}

function step(){
  angle=(angle+1.2)%360;
  render();
  animId=requestAnimationFrame(step);
}

document.getElementById('play-btn').addEventListener('click',()=>{
  isPlaying=!isPlaying;
  const btn=document.getElementById('play-btn');
  if(isPlaying){ btn.textContent='⏸ 一時停止'; btn.classList.add('paused'); animId=requestAnimationFrame(step); }
  else { btn.textContent='▶ アニメーション'; btn.classList.remove('paused'); cancelAnimationFrame(animId); }
});

document.getElementById('angle-slider').addEventListener('input',e=>{ angle=Number(e.target.value); render(); });

document.getElementById('A-slider').addEventListener('input',e=>{ A=Number(e.target.value); document.getElementById('A-label').textContent=A; updateFormula(); drawWave(); });
document.getElementById('B-slider').addEventListener('input',e=>{ B=Number(e.target.value); document.getElementById('B-label').textContent=B; updateFormula(); drawWave(); });
document.getElementById('C-slider').addEventListener('input',e=>{ C=Number(e.target.value); document.getElementById('C-label').textContent=C; updateFormula(); drawWave(); });

document.getElementById('sin-toggle').addEventListener('click',()=>{
  showSin=!showSin;
  const btn=document.getElementById('sin-toggle');
  btn.style.background=showSin?'#f472b222':'#0f1f3d';
  btn.style.border=`1px solid ${showSin?'#f472b6':'#1e3a6e'}`;
  btn.style.color=showSin?'#f472b6':'#4a6a9c';
  drawWave();
});
document.getElementById('cos-toggle').addEventListener('click',()=>{
  showCos=!showCos;
  const btn=document.getElementById('cos-toggle');
  btn.style.background=showCos?'#38bdf822':'#0f1f3d';
  btn.style.border=`1px solid ${showCos?'#38bdf8':'#1e3a6e'}`;
  btn.style.color=showCos?'#38bdf8':'#4a6a9c';
  drawWave();
});

// テーマ復元 → 初期描画
const _saved = localStorage.getItem('math-theme');
if (_saved === 'dark') document.body.classList.add('dark');

render();

// テーマ切り替えボタン
const _themeBtn = document.getElementById('theme-toggle');
_themeBtn.textContent = document.body.classList.contains('dark') ? '☀ ライト' : '🌙 ダーク';
_themeBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const dark = document.body.classList.contains('dark');
  localStorage.setItem('math-theme', dark ? 'dark' : 'light');
  _themeBtn.textContent = dark ? '☀ ライト' : '🌙 ダーク';
  render();
});
