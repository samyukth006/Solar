(() => {
  const canvas = document.getElementById('universe');
  const ctx = canvas.getContext('2d', { alpha: false });
  const TAU = Math.PI * 2;
  let w = 0, h = 0, dpr = 1;
  let rotation = -0.22, targetRotation = -0.22;
  let pointerX = 0, pointerY = 0, targetPX = 0, targetPY = 0;
  let dragging = false, lastX = 0, lastY = 0, dragTilt = 0;
  let lastTime = 0;

  const planets = [
    {name:'Mercury', orbit:.105, size:3.2, color:'#9b938a', glow:'#c8b7a4', speed:.42, phase:.3, lift:2.0},
    {name:'Venus',   orbit:.158, size:5.2, color:'#d9b58b', glow:'#e8c99d', speed:.30, phase:2.4, lift:2.7},
    {name:'Earth',   orbit:.218, size:5.7, color:'#4c9cdb', glow:'#70c8ff', speed:.24, phase:4.3, lift:3.0, moon:true},
    {name:'Mars',    orbit:.278, size:4.2, color:'#c96f52', glow:'#ef9870', speed:.19, phase:1.5, lift:3.2},
    {name:'Jupiter', orbit:.385, size:16, color:'#c89b78', glow:'#dfb18b', speed:.105, phase:5.1, lift:4.2, bands:true},
    {name:'Saturn',  orbit:.505, size:13, color:'#d8c49a', glow:'#f0d9ad', speed:.075, phase:3.1, lift:4.6, rings:true},
    {name:'Uranus',  orbit:.625, size:9, color:'#8acbd0', glow:'#a4f1ed', speed:.052, phase:0.7, lift:5.1, rings2:true},
    {name:'Neptune', orbit:.735, size:8.5, color:'#557de0', glow:'#719aff', speed:.041, phase:2.0, lift:5.4}
  ];

  let stars = [], dust = [];
  function resize(){
    const rect = canvas.getBoundingClientRect();
    w = rect.width; h = rect.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w*dpr); canvas.height = Math.round(h*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const count = Math.floor(Math.min(260, Math.max(110, w*h/5200)));
    stars = Array.from({length:count},(_,i)=>({
      x:Math.random()*w,y:Math.random()*h,r:Math.random()*1.15+.2,
      a:Math.random()*.5+.12,phase:Math.random()*TAU,speed:Math.random()*.6+.2,
      depth:Math.random()
    }));
    dust = Array.from({length:36},()=>({
      x:Math.random()*w,y:Math.random()*h,r:Math.random()*1.5+.4,
      a:Math.random()*.15+.04,depth:Math.random()
    }));
  }
  window.addEventListener('resize',resize,{passive:true});
  resize();

  function roundedGlow(x,y,r,color,alpha=1){
    const g=ctx.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,color);g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.globalAlpha=alpha;ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();ctx.globalAlpha=1;
  }
  function background(t){
    ctx.fillStyle='#03050b';ctx.fillRect(0,0,w,h);
    const neb=ctx.createRadialGradient(w*.52+pointerX*.18,h*.48+pointerY*.18,0,w*.52,h*.48,Math.max(w,h)*.75);
    neb.addColorStop(0,'#111326');neb.addColorStop(.42,'#090d1a');neb.addColorStop(1,'#03050b');
    ctx.fillStyle=neb;ctx.fillRect(0,0,w,h);
    // Very soft distant nebula clouds.
    roundedGlow(w*.18+pointerX*.35,h*.28+pointerY*.3,Math.max(w,h)*.25,'#20214b',.16);
    roundedGlow(w*.82+pointerX*.25,h*.7+pointerY*.25,Math.max(w,h)*.28,'#12303a',.12);
    for(const p of dust){
      const x=(p.x+pointerX*p.depth*.12+w)%w, y=(p.y+pointerY*p.depth*.12+h)%h;
      ctx.fillStyle=`rgba(150,190,220,${p.a})`;ctx.beginPath();ctx.arc(x,y,p.r,0,TAU);ctx.fill();
    }
    for(const s of stars){
      const tw=.62+.38*Math.sin(t*s.speed+s.phase);
      const x=(s.x+pointerX*s.depth*.22+w)%w, y=(s.y+pointerY*s.depth*.22+h)%h;
      ctx.globalAlpha=s.a*tw;ctx.fillStyle='#dbeaff';ctx.beginPath();ctx.arc(x,y,s.r,0,TAU);ctx.fill();
      if(s.r>1.05 && tw>.93){ctx.globalAlpha=.15;ctx.fillRect(x-4,y,x+4-x,0.5);ctx.fillRect(x,y-4,.5,8);}
    }
    ctx.globalAlpha=1;
  }

  function sphere(x,y,r,base,glow,opts={},t=0){
    roundedGlow(x,y,r*2.5,glow,.14);
    const g=ctx.createRadialGradient(x-r*.35,y-r*.42,r*.08,x+r*.15,y+r*.1,r*1.18);
    g.addColorStop(0,opts.highlight||lighten(base, .52));
    g.addColorStop(.35,base);
    g.addColorStop(1,'#080a12');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();
    ctx.save();ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.clip();
    if(opts.bands){
      for(let i=-3;i<=3;i++){
        ctx.globalAlpha=.16+(i%2===0?.1:0);
        ctx.fillStyle=i%2===0?'#f5d6b2':'#8e604e';
        ctx.fillRect(x-r,y+i*r*.34,r*2,r*.13);
      }
      ctx.globalAlpha=1;
      ctx.fillStyle='#a45f4d';ctx.globalAlpha=.65;ctx.beginPath();ctx.ellipse(x+r*.34,y+r*.18,r*.26,r*.12,-.15,0,TAU);ctx.fill();ctx.globalAlpha=1;
    }
    if(opts.earth){
      ctx.fillStyle='#73b88c';ctx.globalAlpha=.85;
      ctx.beginPath();ctx.ellipse(x-r*.12,y-r*.08,r*.24,r*.16,-.4,0,TAU);ctx.fill();
      ctx.beginPath();ctx.ellipse(x+r*.27,y+r*.2,r*.18,r*.1,.5,0,TAU);ctx.fill();ctx.globalAlpha=1;
    }
    const shade=ctx.createLinearGradient(x-r*.2,y-r,x+r,y+r);
    shade.addColorStop(0,'rgba(255,255,255,.16)');shade.addColorStop(.45,'rgba(255,255,255,0)');shade.addColorStop(1,'rgba(0,0,0,.48)');
    ctx.fillStyle=shade;ctx.fillRect(x-r,y-r,r*2,r*2);
    ctx.restore();
    ctx.strokeStyle='rgba(220,240,255,.12)';ctx.lineWidth=.7;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.stroke();
  }
  function lighten(hex,amount){
    const n=parseInt(hex.slice(1),16), r=n>>16,g=(n>>8)&255,b=n&255;
    const f=v=>Math.min(255,Math.round(v+(255-v)*amount));
    return `rgb(${f(r)},${f(g)},${f(b)})`;
  }
  function drawSun(x,y,r,t){
    roundedGlow(x,y,r*4.8,'#f7a95d',.19);
    roundedGlow(x,y,r*2.4,'#ffcf83',.24);
    const g=ctx.createRadialGradient(x-r*.25,y-r*.3,r*.08,x,y,r);
    g.addColorStop(0,'#fff2c7');g.addColorStop(.3,'#ffd18a');g.addColorStop(.72,'#f69b54');g.addColorStop(1,'#b94d39');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();
    ctx.strokeStyle='rgba(255,210,150,.16)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,r+4+Math.sin(t*.5)*1.5,0,TAU);ctx.stroke();
  }
  function orbitPath(cx,cy,rx,ry,angle){
    ctx.beginPath();
    for(let i=0;i<=180;i++){
      const a=i/180*TAU;
      const xx=Math.cos(a)*rx, yy=Math.sin(a)*ry;
      const X=cx+xx*Math.cos(angle)-yy*Math.sin(angle);
      const Y=cy+xx*Math.sin(angle)+yy*Math.cos(angle);
      if(i===0)ctx.moveTo(X,Y);else ctx.lineTo(X,Y);
    }
    ctx.closePath();
  }
  function pointOnOrbit(cx,cy,rx,ry,a,rot){
    const xx=Math.cos(a)*rx, yy=Math.sin(a)*ry;
    return {x:cx+xx*Math.cos(rot)-yy*Math.sin(rot),y:cy+xx*Math.sin(rot)+yy*Math.cos(rot)};
  }

  function render(now){
    const t=now/1000, dt=Math.min(.04,(now-lastTime)/1000||.016);lastTime=now;
    rotation += (targetRotation-rotation)*Math.min(1,dt*8);
    pointerX += (targetPX-pointerX)*Math.min(1,dt*4);
    pointerY += (targetPY-pointerY)*Math.min(1,dt*4);
    background(t);

    const scale=Math.min(w/1050,h/690);
    const cx=w*.5+pointerX*.24, cy=h*.53+pointerY*.2;
    const base=Math.min(w*.43,h*.39)*Math.min(1.08,scale*1.5);
    const tilt=.38+dragTilt;
    const rot=rotation;
    const rxBase=base, ryBase=base*tilt;

    // Orbit lines sit behind the planets.
    ctx.save();ctx.translate(pointerX*.12,pointerY*.1);
    planets.forEach((p,i)=>{
      const rx=rxBase*p.orbit, ry=ryBase*p.orbit;
      orbitPath(cx,cy,rx,ry,rot);
      ctx.strokeStyle=i%2===0?'rgba(157,190,220,.105)':'rgba(157,190,220,.075)';
      ctx.lineWidth=.75;ctx.stroke();
    });

    // Far-side planets first; near-side planets are drawn over the sun.
    const positions=planets.map((p,i)=>{
      const a=t*p.speed+p.phase;
      const pos=pointOnOrbit(cx,cy,rxBase*p.orbit,ryBase*p.orbit,a,rot);
      const lift=Math.sin(t*1.05+i*1.17)*p.lift;
      return {...p,x:pos.x+pointerX*.05,y:pos.y+lift+pointerY*.05,phase:a,depth:Math.sin(a)};
    }).sort((a,b)=>a.depth-b.depth);

    positions.forEach(p=>{
      if(p.depth<-.1) drawPlanet(p,t);
    });
    drawSun(cx,cy,Math.max(16,base*.045),t);
    positions.forEach(p=>{
      if(p.depth>=-.1) drawPlanet(p,t);
    });
    ctx.restore();
    requestAnimationFrame(render);
  }

  function drawPlanet(p,t){
    const r=Math.max(2.2,p.size*Math.min(1.1,Math.max(.62,Math.min(w,h)/720)));
    if(p.rings || p.rings2){
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(-.28+rotForRing(p.phase));
      ctx.beginPath();ctx.ellipse(0,0,r*1.85,r*.52,0,0,TAU);
      ctx.strokeStyle=p.rings?'rgba(222,199,157,.68)':'rgba(157,220,224,.42)';ctx.lineWidth=p.rings?4:2.3;ctx.stroke();
      ctx.beginPath();ctx.ellipse(0,0,r*1.48,r*.39,0,0,TAU);
      ctx.strokeStyle='rgba(245,224,185,.35)';ctx.lineWidth=1.5;ctx.stroke();
      ctx.restore();
    }
    sphere(p.x,p.y,r,p.color,p.glow,{bands:p.bands,earth:p.name==='Earth'},t);
    if(p.moon){
      const ma=t*1.8;
      const mx=p.x+Math.cos(ma)*r*1.85,my=p.y+Math.sin(ma)*r*.95;
      sphere(mx,my,r*.25,'#a7a9b2','#dce3f0',{},t);
    }
  }
  function rotForRing(a){return Math.sin(a)*.12}

  canvas.addEventListener('pointerdown',e=>{
    dragging=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove',e=>{
    const rect=canvas.getBoundingClientRect();
    if(dragging){
      const dx=e.clientX-lastX,dy=e.clientY-lastY;
      targetRotation+=dx*.006;
      dragTilt=Math.max(-.16,Math.min(.16,dragTilt+dy*.0007));
      lastX=e.clientX;lastY=e.clientY;
    }else{
      targetPX=(e.clientX-rect.left-rect.width/2)/rect.width*34;
      targetPY=(e.clientY-rect.top-rect.height/2)/rect.height*25;
    }
  });
  const stopDrag=()=>{dragging=false;};
  canvas.addEventListener('pointerup',stopDrag);
  canvas.addEventListener('pointercancel',stopDrag);
  canvas.addEventListener('pointerleave',()=>{if(!dragging){targetPX=0;targetPY=0;}});
  canvas.addEventListener('wheel',e=>{
    e.preventDefault();targetRotation+=e.deltaY*.0015;
  },{passive:false});

  requestAnimationFrame(render);
})();