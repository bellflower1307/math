const canvas=document.getElementById('cv');
const ctx=canvas.getContext('2d');
const W=460,H=460,CX=W/2,CY=H/2,R=160;
let activeTab='inscribed';
let dragging=null;

let state={
  pa:200,pb:320,pc:260,
  td:3.5,tth:20,
  ch1:80,ch1r:30,ch2:80,ch2r:150,
  qa:50,qb:140,qc:230,qd:320
};

/* ===== テーマカラー ===== */
function cc(){
  const d=document.body.classList.contains('dark');
  return {
    bg:           d?'#07101f':'#f8f9fb',
    grid:         d?'#0d1e38':'#e4eaf2',
    axis:         d?'#1e3a6e':'#c8d4e0',
    circle:       d?'#2a4a7c':'#9ab4cc',
    centerDot:    d?'#4a6a9c':'#8090a8',
    handleStroke: d?'rgba(255,255,255,0.85)':'rgba(30,40,60,0.35)'
  };
}

/* ===== ユーティリティ ===== */
function toRad(d){return d*Math.PI/180;}
function toDeg(r){return r*180/Math.PI;}
function pt(angleDeg,r=R){return{x:CX+r*Math.cos(toRad(angleDeg)),y:CY-r*Math.sin(toRad(angleDeg))};}
function fmt(v){return v.toFixed(1)+'°';}
function dist(a,b){return Math.sqrt((a.x-b.x)**2+(a.y-b.y)**2);}

/* ===== ベース描画 ===== */
function drawBase(showLabel=true){
  const c=cc();
  ctx.fillStyle=c.bg;ctx.fillRect(0,0,W,H);
  ctx.strokeStyle=c.grid;ctx.lineWidth=0.7;
  for(let i=0;i<W;i+=40){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,H);ctx.stroke();}
  for(let i=0;i<H;i+=40){ctx.beginPath();ctx.moveTo(0,i);ctx.lineTo(W,i);ctx.stroke();}
  ctx.strokeStyle=c.axis;ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(0,CY);ctx.lineTo(W,CY);ctx.stroke();
  ctx.beginPath();ctx.moveTo(CX,0);ctx.lineTo(CX,H);ctx.stroke();
  ctx.beginPath();ctx.arc(CX,CY,R,0,Math.PI*2);
  ctx.strokeStyle=c.circle;ctx.lineWidth=2;ctx.stroke();
  dot(CX,CY,c.centerDot,4);
  if(showLabel){
    ctx.fillStyle=c.centerDot;
    ctx.font='11px monospace';ctx.textAlign='left';ctx.fillText('O',CX+6,CY-6);
  }
}

/* ===== 点・線・角度ラベル ===== */
function dot(x,y,color,r=7,label='',lcolor=''){
  ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);
  ctx.fillStyle=color;ctx.fill();
  ctx.strokeStyle=cc().handleStroke;ctx.lineWidth=1.5;ctx.stroke();
  if(label){
    ctx.fillStyle=lcolor||color;
    ctx.font='bold 13px monospace';ctx.textAlign='left';
    ctx.fillText(label,x+r+3,y-r+2);
  }
}

function line(x1,y1,x2,y2,color,lw=1.5,dash=[]){
  ctx.save();ctx.strokeStyle=color;ctx.lineWidth=lw;ctx.setLineDash(dash);
  ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.restore();
}

function angleLabel(cx,cy,ax,ay,bx,by,color,label,r=28){
  const a1=Math.atan2(ay-cy,ax-cx),a2=Math.atan2(by-cy,bx-cx);
  ctx.save();
  ctx.beginPath();ctx.arc(cx,cy,r,a1,a2);
  ctx.strokeStyle=color;ctx.lineWidth=1.5;ctx.stroke();
  const mid=(a1+a2)/2;
  ctx.fillStyle=color;ctx.font='bold 11px monospace';ctx.textAlign='center';
  ctx.fillText(label,cx+(r+10)*Math.cos(mid),cy+(r+10)*Math.sin(mid));
  ctx.restore();
}

function interiorAngle(A,V,B){
  const ax=A.x-V.x,ay=A.y-V.y,bx=B.x-V.x,by=B.y-V.y;
  const cos=(ax*bx+ay*by)/(Math.sqrt(ax*ax+ay*ay)*Math.sqrt(bx*bx+by*by));
  return toDeg(Math.acos(Math.max(-1,Math.min(1,cos))));
}

/* ─── 円周角 ─── */
function drawInscribed(){
  drawBase();
  const P=pt(30),Q=pt(80);
  const A=pt(state.pa),C=pt(state.pc);

  ctx.save();
  ctx.beginPath();ctx.arc(CX,CY,R,toRad(-30),toRad(-80),true);
  ctx.strokeStyle='#facc15';ctx.lineWidth=4;ctx.stroke();
  ctx.restore();

  line(CX,CY,P.x,P.y,'#facc1566',1.5,[4,3]);
  line(CX,CY,Q.x,Q.y,'#facc1566',1.5,[4,3]);
  line(A.x,A.y,P.x,P.y,'#f472b6',2);
  line(A.x,A.y,Q.x,Q.y,'#f472b6',2);
  line(C.x,C.y,P.x,P.y,'#fb923c',2);
  line(C.x,C.y,Q.x,Q.y,'#fb923c',2);

  dot(P.x,P.y,'#facc15',6,'P','#facc15');
  dot(Q.x,Q.y,'#facc15',6,'Q','#facc15');
  dot(A.x,A.y,'#f472b6',7,'A','#f472b6');
  dot(C.x,C.y,'#fb923c',7,'C','#fb923c');

  const angA=interiorAngle(P,A,Q);
  const angC=interiorAngle(P,C,Q);
  const central=toDeg(Math.acos(Math.max(-1,Math.min(1,
    ((P.x-CX)*(Q.x-CX)+(P.y-CY)*(Q.y-CY))/(R*R)))));

  angleLabel(A.x,A.y,P.x,P.y,Q.x,Q.y,'#f472b6',fmt(angA),24);
  angleLabel(C.x,C.y,P.x,P.y,Q.x,Q.y,'#fb923c',fmt(angC),24);
  angleLabel(CX,CY,P.x,P.y,Q.x,Q.y,'#facc15',fmt(central),36);

  document.getElementById('pa-lbl').textContent=state.pa+'°';
  document.getElementById('pb-lbl').textContent=state.pb+'°';
  document.getElementById('pc-lbl').textContent=state.pc+'°';
  document.getElementById('central-angle').textContent=fmt(central);
  document.getElementById('inscribed-a').textContent=fmt(angA);
  document.getElementById('inscribed-c').textContent=fmt(angC);
  const ok=Math.abs(angA-angC)<1;
  document.getElementById('double-check').textContent=ok?'✔ 等しい':'※ 同弧でないため異なる';
  document.getElementById('double-check').style.color=ok?'#4ade80':'#f472b6';
}

/* ─── 接線 ─── */
function drawTangent(){
  drawBase();
  const d=state.td,thDeg=state.tth;
  const Px=CX+d*R/2*Math.cos(toRad(thDeg));
  const Py=CY-d*R/2*Math.sin(toRad(thDeg));
  const distOP=Math.sqrt((Px-CX)**2+(Py-CY)**2);
  const dWorld=distOP/R;
  const opAngle=Math.atan2(-(Py-CY),(Px-CX));
  const halfAng=Math.acos(Math.min(1,1/dWorld));
  const tA={x:CX+R*Math.cos(opAngle+halfAng),y:CY-R*Math.sin(opAngle+halfAng)};
  const tB={x:CX+R*Math.cos(opAngle-halfAng),y:CY-R*Math.sin(opAngle-halfAng)};

  line(Px,Py,tA.x,tA.y,'#f472b6',2.5);
  line(Px,Py,tB.x,tB.y,'#38bdf8',2.5);
  line(CX,CY,tA.x,tA.y,'#f472b666',1.5,[4,3]);
  line(CX,CY,tB.x,tB.y,'#38bdf866',1.5,[4,3]);

  function rightAngleMark(ox,oy,ax,ay,bx,by,color){
    const s=12;
    const dx1=(ax-ox)/Math.sqrt((ax-ox)**2+(ay-oy)**2)*s;
    const dy1=(ay-oy)/Math.sqrt((ax-ox)**2+(ay-oy)**2)*s;
    const dx2=(bx-ox)/Math.sqrt((bx-ox)**2+(by-oy)**2)*s;
    const dy2=(by-oy)/Math.sqrt((bx-ox)**2+(by-oy)**2)*s;
    ctx.save();ctx.strokeStyle=color;ctx.lineWidth=1.5;
    ctx.beginPath();
    ctx.moveTo(ox+dx1,oy+dy1);
    ctx.lineTo(ox+dx1+dx2,oy+dy1+dy2);
    ctx.lineTo(ox+dx2,oy+dy2);
    ctx.stroke();ctx.restore();
  }
  rightAngleMark(tA.x,tA.y,CX,CY,Px,Py,'#4ade80');
  rightAngleMark(tB.x,tB.y,CX,CY,Px,Py,'#4ade80');

  dot(Px,Py,'#facc15',7,'P','#facc15');
  dot(tA.x,tA.y,'#f472b6',6,'A','#f472b6');
  dot(tB.x,tB.y,'#38bdf8',6,'B','#38bdf8');

  const lenA=Math.sqrt((Px-tA.x)**2+(Py-tA.y)**2)/R;
  const lenB=Math.sqrt((Px-tB.x)**2+(Py-tB.y)**2)/R;

  document.getElementById('td-lbl').textContent=state.td;
  document.getElementById('tth-lbl').textContent=state.tth+'°';
  document.getElementById('tan-len-a').textContent=lenA.toFixed(3);
  document.getElementById('tan-len-b').textContent=lenB.toFixed(3);
  document.getElementById('tan-angle-a').textContent='90.0°';
  const eq=Math.abs(lenA-lenB)<0.005;
  document.getElementById('tan-equal').textContent=eq?'✔ PA = PB':'計算中…';
  document.getElementById('tan-equal').style.color=eq?'#4ade80':'#facc15';
}

/* ─── 弦・弧 ─── */
function drawChord(){
  drawBase();
  const halfAng1=state.ch1/2,rot1=state.ch1r;
  const halfAng2=state.ch2/2,rot2=state.ch2r;
  const A1=pt(rot1+halfAng1),B1=pt(rot1-halfAng1);
  const A2=pt(rot2+halfAng2),B2=pt(rot2-halfAng2);

  line(A1.x,A1.y,B1.x,B1.y,'#f472b6',2.5);
  const mx1=(A1.x+B1.x)/2,my1=(A1.y+B1.y)/2;
  line(CX,CY,mx1,my1,'#f472b666',1.5,[4,3]);
  const len1=dist(A1,B1)/R;
  const d1px=Math.sqrt((mx1-CX)**2+(my1-CY)**2)/R;

  line(A2.x,A2.y,B2.x,B2.y,'#38bdf8',2.5);
  const mx2=(A2.x+B2.x)/2,my2=(A2.y+B2.y)/2;
  line(CX,CY,mx2,my2,'#38bdf866',1.5,[4,3]);
  const len2=dist(A2,B2)/R;
  const d2px=Math.sqrt((mx2-CX)**2+(my2-CY)**2)/R;

  function perpMark(mx,my,color){
    const s=8;
    const ex=-(my-CY)/Math.sqrt((mx-CX)**2+(my-CY)**2)*s;
    const ey=(mx-CX)/Math.sqrt((mx-CX)**2+(my-CY)**2)*s;
    const fx=(mx-CX)/Math.sqrt((mx-CX)**2+(my-CY)**2)*s;
    const fy=(my-CY)/Math.sqrt((mx-CX)**2+(my-CY)**2)*s;
    ctx.save();ctx.strokeStyle=color;ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(mx+ex,my+ey);ctx.lineTo(mx+ex+fx,my+ey+fy);ctx.lineTo(mx+fx,my+fy);ctx.stroke();ctx.restore();
  }
  perpMark(mx1,my1,'#4ade80');
  perpMark(mx2,my2,'#4ade80');

  dot(A1.x,A1.y,'#f472b6',5);dot(B1.x,B1.y,'#f472b6',5);
  dot(mx1,my1,'#f472b666',4);
  dot(A2.x,A2.y,'#38bdf8',5);dot(B2.x,B2.y,'#38bdf8',5);
  dot(mx2,my2,'#38bdf866',4);

  ctx.save();
  ctx.beginPath();ctx.arc(CX,CY,24,toRad(-(rot1+halfAng1)),toRad(-(rot1-halfAng1)),false);
  ctx.strokeStyle='#f472b688';ctx.lineWidth=2;ctx.stroke();
  ctx.beginPath();ctx.arc(CX,CY,32,toRad(-(rot2+halfAng2)),toRad(-(rot2-halfAng2)),false);
  ctx.strokeStyle='#38bdf888';ctx.lineWidth=2;ctx.stroke();
  ctx.restore();

  document.getElementById('ch1-lbl').textContent=state.ch1+'°';
  document.getElementById('ch1r-lbl').textContent=state.ch1r+'°';
  document.getElementById('ch2-lbl').textContent=state.ch2+'°';
  document.getElementById('ch2r-lbl').textContent=state.ch2r+'°';
  document.getElementById('chord1-len').textContent=len1.toFixed(3);
  document.getElementById('chord2-len').textContent=len2.toFixed(3);
  document.getElementById('chord1-dist').textContent=d1px.toFixed(3);
  document.getElementById('chord2-dist').textContent=d2px.toFixed(3);
  const sameAng=Math.abs(state.ch1-state.ch2)<1;
  document.getElementById('chord-equal').textContent=sameAng
    ?'✔ 弦の長さ・中心距離が等しい'
    :'中心角が異なると弦の長さも異なる';
  document.getElementById('chord-equal').style.color=sameAng?'#4ade80':'#facc15';
}

/* ─── 円に内接する四角形 ─── */
function drawCyclic(){
  drawBase();
  const angles=[state.qa,state.qb,state.qc,state.qd].sort((a,b)=>a-b);
  const pts=angles.map(a=>pt(a));
  const colors=['#f472b6','#38bdf8','#4ade80','#fb923c'];
  const labels=['A','B','C','D'];

  ctx.save();
  ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);
  for(let i=1;i<4;i++)ctx.lineTo(pts[i].x,pts[i].y);
  ctx.closePath();
  ctx.fillStyle='#a78bfa0a';ctx.fill();
  ctx.strokeStyle='#a78bfa55';ctx.lineWidth=1.5;ctx.stroke();
  ctx.restore();

  pts.forEach((p,i)=>{
    const prev=pts[(i+3)%4],next=pts[(i+1)%4];
    const ang=interiorAngle(prev,p,next);
    angleLabel(p.x,p.y,prev.x,prev.y,next.x,next.y,colors[i],ang.toFixed(0)+'°',20);
    dot(p.x,p.y,colors[i],7,labels[i],colors[i]);
  });

  const angA=interiorAngle(pts[3],pts[0],pts[1]);
  const angB=interiorAngle(pts[0],pts[1],pts[2]);
  const angC=interiorAngle(pts[1],pts[2],pts[3]);
  const angD=interiorAngle(pts[2],pts[3],pts[0]);

  document.getElementById('qa-lbl').textContent=state.qa+'°';
  document.getElementById('qb-lbl').textContent=state.qb+'°';
  document.getElementById('qc-lbl').textContent=state.qc+'°';
  document.getElementById('qd-lbl').textContent=state.qd+'°';
  document.getElementById('qa-angle').textContent=fmt(angA);
  document.getElementById('qb-angle').textContent=fmt(angB);
  document.getElementById('qc-angle').textContent=fmt(angC);
  document.getElementById('qd-angle').textContent=fmt(angD);
  document.getElementById('qac-sum').textContent=fmt(angA+angC);
  document.getElementById('qbd-sum').textContent=fmt(angB+angD);
}

/* ===== メイン ===== */
function redraw(){
  ['pa','pb','pc','td','tth','ch1','ch1r','ch2','ch2r','qa','qb','qc','qd'].forEach(id=>{
    if(document.getElementById(id)) state[id]=+document.getElementById(id).value;
  });
  if(activeTab==='inscribed') drawInscribed();
  else if(activeTab==='tangent') drawTangent();
  else if(activeTab==='chord') drawChord();
  else if(activeTab==='cyclic') drawCyclic();
}

function switchTab(t){
  activeTab=t;
  ['inscribed','tangent','chord','cyclic'].forEach(n=>{
    document.getElementById('panel-'+n).classList.toggle('active',n===t);
    document.getElementById('tab-'+n).classList.toggle('active',n===t);
  });
  redraw();
}

/* ===== テーマ初期化 ===== */
const _saved=localStorage.getItem('math-theme');
if(_saved==='dark') document.body.classList.add('dark');

redraw();

const _themeBtn=document.getElementById('theme-toggle');
_themeBtn.textContent=document.body.classList.contains('dark')?'☀ ライト':'🌙 ダーク';

_themeBtn.addEventListener('click',()=>{
  document.body.classList.toggle('dark');
  const dark=document.body.classList.contains('dark');
  localStorage.setItem('math-theme',dark?'dark':'light');
  _themeBtn.textContent=dark?'☀ ライト':'🌙 ダーク';
  redraw();
});
