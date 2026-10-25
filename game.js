(() => {
  'use strict';
  const W=600,H=700,LANES=4,LANE_W=100,ROAD_W=LANES*LANE_W,ROAD_X=(W-ROAD_W)/2,CAR_W=44,CAR_H=80,TRUCK_W=84,TRUCK_H=150;
  const DIFF=[
    {name:'Easy',info:'Slow traffic with plenty of space',start:2,max:6,speedup:15,spawn:35,oncoming:1,mult:1,truck:10},
    {name:'Intermediate',info:'A steady stream of cars',start:3,max:9,speedup:10,spawn:25,oncoming:2,mult:2,truck:18},
    {name:'Hard',info:'Fast traffic that speeds up quickly',start:4,max:12,speedup:8,spawn:20,oncoming:3,mult:3,truck:25},
    {name:'Very Hard',info:'Packed, flat-out traffic. Good luck!',start:5,max:16,speedup:6,spawn:15,oncoming:4,mult:5,truck:30}
  ];
  const COLORS=[
    {name:'Cyan',price:0,color:'#43e6ed'},{name:'Red',price:25,color:'#dc2828'},{name:'Blue',price:25,color:'#3264f0'},
    {name:'White',price:50,color:'#f5f5f5'},{name:'Hot Pink',price:75,color:'#ff46a0'},{name:'Gold',price:100,color:'#ffc828'},{name:'Violet',price:150,color:'#963cff'}
  ];
  const THEMES=[
    {name:'Highway',price:0,grass:'#227832',decor:'#145523',road:'#3c3c41',lines:'#fff',kind:'bush',weather:'none',dark:0},
    {name:'Desert Road',price:100,grass:'#debe78',decor:'#2e7d32',road:'#695f5a',lines:'#faf0c8',kind:'cactus',weather:'none',dark:0},
    {name:'Rainy Road',price:150,grass:'#1e503c',decor:'#0f3728',road:'#282c36',lines:'#d2d7e1',kind:'bush',weather:'rain',dark:60},
    {name:'Snowy Road',price:200,grass:'#ebf0fa',decor:'#1e6446',road:'#555a64',lines:'#fff',kind:'pine',weather:'snow',dark:0},
    {name:'Night Drive',price:250,grass:'#0f2d23',decor:'#0a1e19',road:'#23242d',lines:'#e6e6e6',kind:'bush',weather:'none',dark:130}
  ];
  const TRAFFIC=['#ffe34d','#ff9f43','#d6dce6','#43d36a','#965a28','#7878ff'];
  const TRUCKS=['#c83232','#285ac8','#1e8246','#ff9f22','#78787d'];
  const $=id=>document.getElementById(id), canvas=$('game'),ctx=canvas.getContext('2d'),overlay=$('overlay'),panel=$('panel');
  const freshSave=()=>({highScores:[0,0,0,0],difficulty:1,coins:0,ownedColors:[0],ownedThemes:[0],color:0,theme:0});
  function loadSave(){try{const s=JSON.parse(localStorage.getItem('roadDodgeSave')||'null');if(!s)return freshSave();const d={...freshSave(),...s};d.highScores=Array.from({length:4},(_,i)=>Number(d.highScores?.[i])||0);d.ownedColors=Array.isArray(d.ownedColors)?[...new Set([0,...d.ownedColors.map(Number).filter(n=>n>=0&&n<COLORS.length)])]:[0];d.ownedThemes=Array.isArray(d.ownedThemes)?[...new Set([0,...d.ownedThemes.map(Number).filter(n=>n>=0&&n<THEMES.length)])]:[0];d.difficulty=clampInt(d.difficulty,0,3,1);d.color=d.ownedColors.includes(Number(d.color))?Number(d.color):0;d.theme=d.ownedThemes.includes(Number(d.theme))?Number(d.theme):0;d.coins=Math.max(0,Number(d.coins)||0);return d;}catch{return freshSave();}}
  let save=loadSave(),state='MENU',menuCursor=0,diffCursor=save.difficulty,shopCursor=0,message='',messageUntil=0,score=0,speed=3,spawnTimer=0,roadOffset=0,coinsEarned=0,newHigh=false,traffic=[],left=false,right=false,up=false,down=false,lastFrame=0,elapsed=0;
  let player={x:laneCenter(2)-CAR_W/2,y:H-CAR_H-30,w:CAR_W,h:CAR_H};
  const particles=Array.from({length:120},()=>({x:Math.random()*W,y:Math.random()*H,s:1+Math.random()*3,drift:Math.random()*2-1}));
  function clampInt(n,min,max,fallback){n=Number(n);return Number.isInteger(n)&&n>=min&&n<=max?n:fallback;}
  function laneCenter(lane){return ROAD_X+lane*LANE_W+LANE_W/2;}
  function persist(){try{localStorage.setItem('roadDodgeSave',JSON.stringify(save));}catch{showMessage('Browser storage unavailable');}updateWallet();}
  function updateWallet(){$('walletCoins').textContent=save.coins;}
  function showMessage(t){message=t;messageUntil=performance.now()+1800;}
  function setState(s){state=s;overlay.classList.toggle('hidden',s==='PLAYING');renderPanel();}
  function resetRound(){player={x:laneCenter(2)-CAR_W/2,y:H-CAR_H-30,w:CAR_W,h:CAR_H};traffic=[];score=0;spawnTimer=0;speed=DIFF[save.difficulty].start;newHigh=false;left=right=up=down=false;}
  function startRun(){resetRound();setState('PLAYING');}
  function finishRun(){coinsEarned=score*DIFF[save.difficulty].mult;save.coins+=coinsEarned;persist();}
  function endGame(){finishRun();setState('GAME_OVER');}
  function renderPanel(){if(state==='PLAYING'){overlay.classList.add('hidden');return;}overlay.classList.remove('hidden');let html='';
    if(state==='MENU'){
      html=`<div class="eyebrow">ARCADE DRIVE</div><h1>ROAD<br>DODGE</h1><p>Dodge the traffic, build your score, and unlock new rides and roads.</p><div class="stats"><div class="stat">YOUR COINS<b>${save.coins}</b></div><div class="stat">BEST SCORE<b>${Math.max(...save.highScores)}</b></div></div><div class="menu-list"><button class="menu-btn primary" data-action="play">▶ &nbsp; PLAY<span class="hint">Choose your difficulty</span></button><button class="menu-btn" data-action="garage">◈ &nbsp; GARAGE<span class="hint">${COLORS[save.color].name} car equipped</span></button><button class="menu-btn" data-action="maps">▤ &nbsp; MAPS<span class="hint">${THEMES[save.theme].name} selected</span></button></div><p>Keyboard: arrows / WASD · Select: Enter</p>`;
    }else if(state==='DIFFICULTY'){
      html=`<div class="eyebrow">PICK YOUR CHALLENGE</div><h1>SELECT<br>DIFFICULTY</h1><p>Higher difficulty earns more coins per car dodged.</p><div class="menu-list">${DIFF.map((d,i)=>`<button class="menu-btn ${i===diffCursor?'primary':''}" data-action="difficulty" data-index="${i}">${d.name.toUpperCase()}<span class="hint">${d.info} · Coins ×${d.mult} · Best ${save.highScores[i]}</span></button>`).join('')}</div><button class="action-btn" data-action="back">← BACK</button>`;
    }else if(state==='GARAGE'||state==='MAPS'){
      const garage=state==='GARAGE',items=garage?COLORS:THEMES,owned=garage?save.ownedColors:save.ownedThemes,equipped=garage?save.color:save.theme;
      html=`<div class="eyebrow">CUSTOMIZE YOUR DRIVE</div><h1>${garage?'GARAGE':'ROAD MAPS'}</h1><p>${garage?'Unlock a color for your car.':'Choose a road theme. Some maps have weather or night effects.'}</p><div class="item-list">${items.map((it,i)=>{const isOwned=owned.includes(i),isEquipped=i===equipped,swatch=garage?it.color:it.grass;return `<button class="item ${i===shopCursor?'selected':''}" data-action="item" data-index="${i}"><span class="swatch" style="background:${swatch}"></span><span class="item-main"><strong>${it.name}</strong><small>${isEquipped?'Currently equipped':isOwned?'Owned':(garage?'Car color':'Road theme')}</small></span><span class="item-price">${isEquipped?'✓ EQUIPPED':isOwned?'OWNED':`◆ ${it.price}`}</span></button>`;}).join('')}</div><div class="status">${messageUntil>performance.now()?message:'Use ↑ / ↓ to browse, Enter to buy or equip.'}</div><div class="two-col"><button class="action-btn primary" data-action="buy">BUY / EQUIP</button><button class="action-btn" data-action="back">← BACK</button></div>`;
    }else if(state==='GAME_OVER'){
      html=`<div class="eyebrow">RUN COMPLETE</div><h1>CRASH!</h1><p>${newHigh?'NEW PERSONAL BEST!':'Traffic got you this time.'}</p><div class="stats"><div class="stat">FINAL SCORE<b>${score}</b></div><div class="stat">COINS EARNED<b>+${coinsEarned}</b></div><div class="stat">TOTAL COINS<b>${save.coins}</b></div></div><div class="menu-list"><button class="menu-btn primary" data-action="again">↻ &nbsp; PLAY AGAIN</button><button class="menu-btn" data-action="back">⌂ &nbsp; MAIN MENU</button></div><p>Press Enter or Space to play again.</p>`;
    }
    panel.innerHTML=html;
  }
  function handleAction(action,index){if(action==='play'){diffCursor=save.difficulty;setState('DIFFICULTY');}else if(action==='difficulty'){save.difficulty=index;persist();startRun();}else if(action==='garage'||action==='maps'){shopCursor=action==='garage'?save.color:save.theme;setState(action==='garage'?'GARAGE':'MAPS');}else if(action==='back'){setState('MENU');}else if(action==='again'){startRun();}else if(action==='item'){shopCursor=index;renderPanel();}else if(action==='buy')buyOrEquip();}
  function buyOrEquip(){const garage=state==='GARAGE',items=garage?COLORS:THEMES,owned=garage?save.ownedColors:save.ownedThemes,i=shopCursor;if(owned.includes(i)){if(garage)save.color=i;else save.theme=i;showMessage('Equipped!');}else if(save.coins<items[i].price){showMessage('Not enough coins!');renderPanel();return;}else{save.coins-=items[i].price;owned.push(i);if(garage)save.color=i;else save.theme=i;showMessage('Purchased and equipped!');}persist();renderPanel();}
  panel.addEventListener('click',e=>{const b=e.target.closest('button[data-action]');if(!b)return;handleAction(b.dataset.action,b.dataset.index===undefined?undefined:Number(b.dataset.index));});
  function keyDown(e){const k=e.key.toLowerCase();if(['arrowleft','arrowright','arrowup','arrowdown',' ','enter'].includes(k))e.preventDefault();if(k==='arrowleft'||k==='a')left=true;if(k==='arrowright'||k==='d')right=true;if(k==='arrowup'||k==='w')up=true;if(k==='arrowdown'||k==='s')down=true;if(e.repeat)return;
    if(state==='PLAYING'){if(k==='escape'){finishRun();setState('MENU');}return;}
    if(state==='MENU'){if(k==='arrowup'||k==='w')menuCursor=(menuCursor+2)%3;if(k==='arrowdown'||k==='s')menuCursor=(menuCursor+1)%3;if(k==='enter'||k===' '){handleAction(['play','garage','maps'][menuCursor]);} }
    else if(state==='DIFFICULTY'){if(k==='arrowup'||k==='w')diffCursor=(diffCursor+3)%4;if(k==='arrowdown'||k==='s')diffCursor=(diffCursor+1)%4;if(k==='enter'||k===' '){handleAction('difficulty',diffCursor);}if(k==='escape')setState('MENU');renderPanel();}
    else if(state==='GARAGE'||state==='MAPS'){const n=state==='GARAGE'?COLORS.length:THEMES.length;if(k==='arrowup'||k==='w')shopCursor=(shopCursor+n-1)%n;if(k==='arrowdown'||k==='s')shopCursor=(shopCursor+1)%n;if(k==='enter'||k===' ')buyOrEquip();if(k==='escape')setState('MENU');renderPanel();}
    else if(state==='GAME_OVER'){if(k==='enter'||k===' '){startRun();}else if(k==='escape')setState('MENU');}
  }
  function keyUp(e){const k=e.key.toLowerCase();if(k==='arrowleft'||k==='a')left=false;if(k==='arrowright'||k==='d')right=false;if(k==='arrowup'||k==='w')up=false;if(k==='arrowdown'||k==='s')down=false;}
  window.addEventListener('keydown',keyDown,{passive:false});window.addEventListener('keyup',keyUp);window.addEventListener('blur',()=>{left=right=up=down=false;});
  document.querySelectorAll('[data-control]').forEach(btn=>{const c=btn.dataset.control;const set=(value)=>{if(c==='left')left=value;else if(c==='right')right=value;else if(c==='up')up=value;else down=value;};const down=e=>{e.preventDefault();set(true);btn.classList.add('pressed');try{btn.setPointerCapture(e.pointerId);}catch{}};const up=e=>{e.preventDefault();set(false);btn.classList.remove('pressed');};btn.addEventListener('pointerdown',down);btn.addEventListener('pointerup',up);btn.addEventListener('pointercancel',up);btn.addEventListener('lostpointercapture',up);});
  function currentTheme(){return THEMES[save.theme]||THEMES[0];}
  function update(dt){const d=DIFF[save.difficulty];roadOffset=(roadOffset+speed*dt/16.67)%240;if(left)player.x-=7*dt/16.67;if(right)player.x+=7*dt/16.67;if(up)player.y-=7*dt/16.67;if(down)player.y+=7*dt/16.67;player.x=Math.max(ROAD_X,Math.min(ROAD_X+ROAD_W-CAR_W,player.x));player.y=Math.max(0,Math.min(H-CAR_H,player.y));
    spawnTimer+=dt/16.67;if(spawnTimer>=d.spawn){spawnTimer=0;spawnVehicle();}
    for(let i=traffic.length-1;i>=0;i--){const v=traffic[i];v.y+=(speed+d.oncoming)*dt/16.67;if(hitbox(v).intersects(hitbox(player))){endGame();return;}if(v.y>H){traffic.splice(i,1);score++;if(score>save.highScores[save.difficulty]){save.highScores[save.difficulty]=score;newHigh=true;}if(score%d.speedup===0&&speed<d.max)speed++;}}
    const theme=currentTheme();if(theme.weather!=='none')particles.forEach(p=>{if(theme.weather==='rain'){p.y+=18*dt/16.67;p.x-=3*dt/16.67;}else{p.y+=3*dt/16.67;p.x+=p.drift*dt/16.67;}p.x=(p.x+W)%W;if(p.y>H){p.y=-20;p.x=Math.random()*W;}});
  }
  function spawnVehicle(){const d=DIFF[save.difficulty],truck=Math.random()*100<d.truck,w=truck?TRUCK_W:CAR_W,h=truck?TRUCK_H:CAR_H,color=truck?TRUCKS[Math.floor(Math.random()*TRUCKS.length)]:TRAFFIC.filter(c=>c.toLowerCase()!==COLORS[save.color].color.toLowerCase())[Math.floor(Math.random()*TRAFFIC.filter(c=>c.toLowerCase()!==COLORS[save.color].color.toLowerCase()).length)];const first=Math.floor(Math.random()*LANES);for(let n=0;n<LANES;n++){const lane=(first+n)%LANES,slot={x:ROAD_X+lane*LANE_W,y:-h-30,w:LANE_W,h:h+60};if(!traffic.some(v=>rects(v,slot))){traffic.push({x:laneCenter(lane)-w/2,y:-h,w,h,color,truck});return;}}}
  function rects(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
  function hitbox(r){return{x:r.x+5,y:r.y+5,w:r.w-10,h:r.h-10};}
  function draw(){const t=currentTheme();ctx.clearRect(0,0,W,H);ctx.fillStyle=t.grass;ctx.fillRect(0,0,W,H);for(let y=-120+roadOffset%120;y<H;y+=120){drawDecor(30,y,t);drawDecor(W-70,y+60,t);}ctx.fillStyle=t.road;ctx.fillRect(ROAD_X,0,ROAD_W,H);ctx.fillStyle=t.lines;ctx.fillRect(ROAD_X+4,0,4,H);ctx.fillRect(ROAD_X+ROAD_W-8,0,4,H);for(let i=1;i<LANES;i++){ctx.fillStyle=t.lines;for(let y=-80+roadOffset%80;y<H;y+=80)ctx.fillRect(ROAD_X+i*LANE_W-2,y,4,40);}
    if(state==='PLAYING'||state==='GAME_OVER'){if(t.dark>=100)drawHeadlights(player);traffic.forEach(v=>v.truck?drawTruck(v):drawCar(v,false));drawCar(player,true);drawScoreboard();if(state==='GAME_OVER'){ctx.fillStyle='#0009';ctx.fillRect(0,0,W,H);}}
    else {drawCar({x:laneCenter(2)-CAR_W/2,y:535,w:CAR_W,h:CAR_H,color:COLORS[save.color].color},true);}
    drawWeather(t);if(state==='PLAYING'&&messageUntil>performance.now()){ctx.fillStyle='#0009';ctx.fillRect(140,90,320,42);ctx.fillStyle='#ffe66b';ctx.font='bold 18px system-ui';ctx.textAlign='center';ctx.fillText(message,W/2,117);}
  }
  function drawDecor(x,y,t){ctx.fillStyle=t.decor;if(t.kind==='cactus'){ctx.fillRoundRect?ctx.fillRoundRect(x+13,y,14,52,10,10):roundRect(x+13,y,14,52,6);roundRect(x,y+20,16,7,3);roundRect(x,y+10,7,17,3);roundRect(x+24,y+28,16,7,3);roundRect(x+33,y+16,7,19,3);}else if(t.kind==='pine'){ctx.beginPath();ctx.moveTo(x+20,y);ctx.lineTo(x+4,y+30);ctx.lineTo(x+36,y+30);ctx.fill();ctx.beginPath();ctx.moveTo(x+20,y+14);ctx.lineTo(x,y+50);ctx.lineTo(x+40,y+50);ctx.fill();ctx.fillStyle='#644628';ctx.fillRect(x+17,y+50,6,8);}else{ctx.beginPath();ctx.ellipse(x+20,y+20,20,20,0,0,Math.PI*2);ctx.fill();}}
  function roundRect(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
  function drawCar(r,facingUp){ctx.fillStyle='#05070b';[r.y+10,r.y+r.h-26].forEach(wy=>{roundRect(r.x-3,wy,6,16,3);roundRect(r.x+r.w-3,wy,6,16,3);});ctx.fillStyle=r.color;roundRect(r.x,r.y,r.w,r.h,10);ctx.fillStyle='#283d59';roundRect(r.x+6,r.y+(facingUp?16:r.h-34),r.w-12,18,5);roundRect(r.x+6,r.y+(facingUp?r.h-26:16),r.w-12,10,4);ctx.fillStyle='#ffe66b';ctx.fillRect(r.x+8,r.y+(facingUp?3:r.h-7),8,4);ctx.fillRect(r.x+r.w-16,r.y+(facingUp?3:r.h-7),8,4);ctx.fillStyle='#ff333b';ctx.fillRect(r.x+8,r.y+(facingUp?r.h-7:3),8,4);ctx.fillRect(r.x+r.w-16,r.y+(facingUp?r.h-7:3),8,4);}
  function drawTruck(r){const cabH=48,cabY=r.y+r.h-cabH,trailerH=r.h-cabH-4;ctx.fillStyle='#05070b';[r.y+12,r.y+34,cabY+12].forEach(y=>{roundRect(r.x-3,y,7,18,3);roundRect(r.x+r.w-4,y,7,18,3);});ctx.fillStyle='#e1e1e6';roundRect(r.x+2,r.y,r.w-4,trailerH,5);ctx.fillStyle='#0002';for(let y=r.y+12;y<r.y+trailerH-6;y+=14)ctx.fillRect(r.x+8,y,r.w-16,2);ctx.fillStyle=r.color;roundRect(r.x+6,cabY,r.w-12,cabH,8);ctx.fillStyle='#283d59';roundRect(r.x+12,cabY+24,r.w-24,14,4);ctx.fillStyle='#ffe66b';ctx.fillRect(r.x+12,cabY+cabH-6,10,4);ctx.fillRect(r.x+r.w-22,cabY+cabH-6,10,4);ctx.fillStyle='#ff333b';ctx.fillRect(r.x+8,r.y+3,10,4);ctx.fillRect(r.x+r.w-18,r.y+3,10,4);}
  function drawHeadlights(r){const cx=r.x+r.w/2,g=ctx.createLinearGradient(cx,r.y,cx,r.y-260);g.addColorStop(0,'#ffffaa80');g.addColorStop(1,'#ffffaa00');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(cx-14,r.y);ctx.lineTo(cx+14,r.y);ctx.lineTo(cx+80,r.y-260);ctx.lineTo(cx-80,r.y-260);ctx.fill();}
  function drawWeather(t){if(t.weather==='rain'){ctx.strokeStyle='#becdff99';ctx.lineWidth=1.5;ctx.beginPath();particles.forEach(p=>{ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-2,p.y+14);});ctx.stroke();}else if(t.weather==='snow'){ctx.fillStyle='#ffffffdd';particles.forEach(p=>{ctx.beginPath();ctx.arc(p.x,p.y,2,0,Math.PI*2);ctx.fill();});}if(t.dark>0){ctx.fillStyle=`rgba(5,10,40,${t.dark/255})`;ctx.fillRect(0,0,W,H);}}
  function drawScoreboard(){ctx.fillStyle='#0009';ctx.fillRect(0,0,W,66);ctx.font='bold 20px system-ui';ctx.fillStyle='#fff';ctx.textAlign='left';ctx.fillText(`Score: ${score}`,15,30);ctx.textAlign='right';ctx.fillText(`Best: ${save.highScores[save.difficulty]}`,W-15,30);ctx.textAlign='center';ctx.fillStyle='#ffd700';ctx.fillText(`Coins: ${save.coins+score*DIFF[save.difficulty].mult}`,W/2,30);ctx.textAlign='left';ctx.font='bold 14px system-ui';ctx.fillStyle=['#5adc6e','#ffe34d','#ff9f43','#ff5050'][save.difficulty];ctx.fillText(`${DIFF[save.difficulty].name}  (coins x${DIFF[save.difficulty].mult})`,15,56);}
  function frame(now){const dt=Math.min(40,now-(lastFrame||now));lastFrame=now;if(state==='PLAYING')update(dt);else roadOffset=(roadOffset+2*dt/16.67)%240;draw();requestAnimationFrame(frame);}
  // Re-render menus after browsing with keyboard; keep the overlay synchronized.
  const originalKeyDown=keyDown;
  // Small extra hook: menu keyboard navigation is handled by keyDown and repainting the menu here.
  window.addEventListener('keydown',e=>{if(['MENU','DIFFICULTY','GARAGE','MAPS'].includes(state)&&['ArrowUp','ArrowDown','w','W','s','S'].includes(e.key))renderPanel();});
  updateWallet();setState('MENU');requestAnimationFrame(frame);
})();
