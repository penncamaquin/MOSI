// Headless tests for the Study mode in evacuation_sim.html.  Run:  node check_study.js [path/to/evacuation_sim.html]
const fs=require('fs'),vm=require('vm');
const file=process.argv[2]||'evacuation_sim.html';
const html=fs.readFileSync(file,'utf-8'),m=html.match(/<script id="appjs">([\s\S]*?)<\/script>/);
if(!m){console.log('NO SCRIPT FOUND');process.exit(1);}
const ctxStub=new Proxy({},{get(){return()=>{};}});
function makeEl(){return{style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return false;}},value:'0',checked:false,textContent:'',innerHTML:'',children:[],appendChild(){},addEventListener(){},setAttribute(){},getAttribute(){return null;},querySelectorAll(){return[];},insertAdjacentHTML(){},getBoundingClientRect(){return{left:0,top:0,width:1300,height:820};},getContext(){return ctxStub;}};}
const els={};const getEl=id=>els[id]||(els[id]=makeEl());
const sandbox={document:{getElementById:getEl,createElement:()=>makeEl(),querySelector:()=>makeEl(),addEventListener(){}},window:{addEventListener(){},app:null},Math,console,performance,setTimeout,requestAnimationFrame:()=>0,JSON,Map,Set,Float64Array,Int32Array,Int16Array,Uint8Array,Array,Object,Infinity,isFinite,Number,String,Promise,Date};
sandbox.__exp={};vm.createContext(sandbox);
vm.runInContext(m[1]+'\n;Object.assign(__exp,{state,STUDY,stBuildWorld,stMakeAgents,stSimulate,stNearest,stReroute,stRun,stWilcoxon,stDemoMap,stSummary,stPaired,stCsv,HIST,histPush,histUndo,histRedo,histSnap,Particle,clearMap,psoStep,moveCrossesWall,setMode,resetSim,stMarkStale,buildRoom,removeObject,roomMembers,stReplayBuild,inExitRect,stCollegeMap,stPenChoose,simAssign,simRunOnce,simExperiment,applyBoids,simStartPoints,SIMX,simGeo,simChooseExit,snapPoint,snapDelta,lockExitToWall,dropDots});',sandbox,{filename:'app.js'});
const X=sandbox.__exp;let fails=0;
const ok=(c,msg)=>{console.log((c?'PASS':'FAIL')+': '+msg);if(!c)fails++;};
const close=(a,b,t=1e-6)=>Math.abs(a-b)<=t;
// test fixture (formerly the app's "Dots demo"): walls, 2 exits, 2 safe zones, 16 random dots
function demoLayout(){X.clearMap();const st=X.state;
  st.walls.push({x1:300,y1:200,x2:300,y2:620},{x1:450,y1:150,x2:700,y2:150},{x1:700,y1:150,x2:700,y2:670},{x1:300,y1:620,x2:900,y2:620});
  st.exits.push({x:20,y:330,w:25,h:160},{x:1255,y:330,w:25,h:160});st.safes.push({x:480,y:720,w:120,h:60},{x:1100,y:140,w:60,h:100});
  for(let i=0;i<16;i++)st.particles.push(new X.Particle(100+Math.random()*1000,100+Math.random()*520));}
const mulberry=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
(async()=>{
  // 1. door throughput hand calculation: 100 agents reach a 2 m door together
  const n=100,ag={n,E:1,dist:new Float64Array(n).fill(13),speed:new Float64Array(n).fill(1.3),delay:new Float64Array(n),group:new Int16Array(n)};
  let r=X.stSimulate(ag,new Int32Array(n),[2]);
  ok(close(r.makespan,10+100/(1.3*2)),'100 agents through a 2 m door finish at 10 + 100/2.6 = '+r.makespan.toFixed(3)+' s');
  ok(r.maxQueue===99&&r.nEvac===100,'peak queue is 99 and everyone gets out');
  r=X.stSimulate({...ag,dist:Float64Array.from({length:10},(_,i)=>13*(i+1)),speed:new Float64Array(10).fill(1.3),delay:new Float64Array(10),n:10},new Int32Array(10),[2]);
  ok(r.maxQueue===0,'no queue when arrivals are spread out');
  // 2. Wilcoxon exact
  ok(close(X.stWilcoxon([1,2,3,4,5,6,7,8,9,10]),2/1024,1e-9),'Wilcoxon exact p for 10 positive differences = 2/1024');
  ok(X.stWilcoxon([0,0,0])===1,'Wilcoxon with no differences gives p = 1');
  // 3. demo map + world
  X.stDemoMap();const W=X.stBuildWorld(20,8);
  ok(W.E===3&&W.nGroups===undefined&&W.centroids===undefined,'demo map: 3 exits (no region grouping any more)');
  ok(W.g.exits.every(e=>close(e.widthM,2)),'every demo exit is a 2 m door');
  let finite=true;for(let j=0;j<W.cells.length;j++){let any=false;for(let e=0;e<W.E;e++)if(isFinite(W.cellDist[j*W.E+e]))any=true;if(!any)finite=false;}
  ok(finite,'every start cell can reach an exit ('+W.cells.length+' start cells)');
  const a3=X.stMakeAgents(W,300,1001),near=X.stNearest(a3,[0,1,2]),nm=X.stSimulate(a3,near,W.g.exits.map(e=>e.widthM));
  ok(nm.loads[1]>nm.loads[0]&&nm.loads[1]>nm.loads[2],'nearest-exit overloads exit B: loads '+nm.loads.join('/'));
  const rer=X.stReroute(a3,[0,1,2],[2,2,2]);
  ok(X.stSimulate(a3,rer,[2,2,2]).maxQueue<nm.maxQueue,'reroute shortens the worst queue vs nearest');
  ok(!Array.from(X.stReroute(a3,[0,2],[2,2,2])).includes(1),'reroute never uses a blocked exit');
  // 4. full study, determinism
  const P={pxPerM:20,n:300,seeds:15,groups:8,particles:20,iters:30,qw:0,alsoBlock:true,psoSeed:0};
  const s1=await X.stRun(P),s2=await X.stRun(P);
  const strip=s=>JSON.stringify(s.conds.map(c=>({n:c.name,p:c.plan,h:c.hist,r:['nearest','reroute','pso'].map(m=>c.rows[m].map(x=>[x.avg,x.maxQueue,x.nEvac]))})));
  ok(strip(s1)===strip(s2),'study is deterministic for fixed seeds');
  ok(s1.conds.length===2,'two scenarios ran: '+s1.conds.map(c=>c.name).join(' | '));
  for(const c of s1.conds){
    const S=m=>X.stSummary(c.rows[m].map(x=>x.avg)).mean,Q=m=>X.stSummary(c.rows[m].map(x=>x.maxQueue)).mean;
    console.log('  '+c.name+': avg time nearest/reroute/pso = '+S('nearest').toFixed(1)+' / '+S('reroute').toFixed(1)+' / '+S('pso').toFixed(1)+' ; max queue = '+Q('nearest').toFixed(0)+' / '+Q('reroute').toFixed(0)+' / '+Q('pso').toFixed(0));
    ok(c.hist[c.hist.length-1]<=c.zeroCost+1e-9,c.name+': on the training crowds PSO is never worse than the shortest-route rule (all penalties 0)');
    ok(c.open.every(e=>c.plan[e]>=0&&c.plan[e]<=50),c.name+': penalties stay within 0 to 50 m');
    ok(c.hist[c.hist.length-1]<=c.hist[0],c.name+': PSO fitness never gets worse');}
  {const c=s1.conds[0],a=m=>X.stSummary(c.rows[m].map(x=>x.avg)).mean;ok(a('pso')<a('nearest')&&X.stPaired(c,'nearest','avg').better===15,'demo map, 300 people: PSO average time beats nearest exit in 15 of 15 seeds');}
  ok(s1.conds[1].blocked.length===1&&!s1.conds[1].open.includes(1),'blocked scenario removed the most-used exit (B)');
  const csv=X.stCsv(s1).split('\n');ok(csv.length===1+2*3*15,'CSV has '+(csv.length-1)+' rows (2 scenarios x 3 methods x 15 seeds)');

  // 6. undo / redo
  X.clearMap();X.HIST.undo.length=0;X.HIST.redo.length=0;
  const st=X.state;st.mode='edit';
  X.histPush();st.walls.push({x1:0,y1:0,x2:100,y2:0});
  X.histPush();st.exits.push({x:10,y:10,w:30,h:30});
  X.histPush();st.starts.push({x:50,y:50,w:100,h:100});
  X.histPush();const pp=new X.Particle(200,200);st.particles.push(pp);
  ok(st.walls.length===1&&st.exits.length===1&&st.starts.length===1&&st.particles.length===1,'built a layout with one of each element');
  X.histUndo();ok(st.particles.length===0,'undo removes the last placed particle');
  X.histUndo();ok(st.starts.length===0,'undo removes the start zone');
  X.histUndo();ok(st.exits.length===0,'undo removes the exit');
  X.histUndo();ok(st.walls.length===0,'undo removes the wall');
  const before=X.HIST.undo.length;X.histUndo();ok(X.HIST.undo.length===before&&st.walls.length===0,'undo with an empty history does nothing');
  X.histRedo();X.histRedo();X.histRedo();X.histRedo();
  ok(st.walls.length===1&&st.exits.length===1&&st.starts.length===1&&st.particles.length===1,'redo x4 restores everything');
  ok(st.particles[0].pos.x===200&&st.particles[0].pos.y===200,'redo puts the particle back where it was');
  X.histPush();st.particles.length=0;X.histUndo();ok(st.particles.length===1&&st.particles[0].pos.x===200,'undo of a delete brings the particle back');
  X.histPush();X.clearMap();ok(st.walls.length===0,'clear map empties the layout');X.histUndo();X.histUndo();ok(st.walls.length===1&&st.exits.length===1,'undo restores a cleared map');
  X.histPush();st.exits[0].blocked=true;X.histUndo();ok(!st.exits[0].blocked,'undo reverts a blocked-exit toggle');
  X.histPush();st.walls.push({x1:1,y1:1,x2:2,y2:2});ok(X.HIST.redo.length===0,'a new edit clears the redo history');
  st.mode='study';const n0=X.HIST.undo.length;X.histUndo();ok(X.HIST.undo.length===n0,'undo is ignored outside Edit mode');st.mode='edit';

  // 7. Simulate mode: walls are solid and dots find their way around them
  const runSim=(label,maxIt)=>{const st=X.state;st.mode='sim';let crossings=0,it=0;
    while(it<maxIt&&st.particles.some(p=>!p.evacuated)){const before=st.particles.map(p=>({x:p.pos.x,y:p.pos.y}));X.psoStep(1);it++;
      st.particles.forEach((p,i)=>{if(X.moveCrossesWall(before[i],p.pos))crossings++;});}
    const out=st.particles.filter(p=>p.evacuated).length;st.mode='edit';
    ok(crossings===0,label+': no dot ever passed through a wall');
    ok(out===st.particles.length,label+': all '+st.particles.length+' dots got out ('+out+' in '+it+' iterations)');};
  const mk=(walls,exit,pts)=>{X.clearMap();const st=X.state;st.walls.push(...walls);st.exits.push(exit);for(const [x,y] of pts)st.particles.push(new X.Particle(x,y));};
  mk([{x1:600,y1:40,x2:600,y2:760}],{x:900,y:380,w:40,h:60},Array.from({length:12},(_,i)=>[320+(i%4)*50,320+Math.floor(i/4)*60]));
  runSim('long wall between dots and exit',600);
  mk([{x1:500,y1:300,x2:700,y2:300},{x1:700,y1:300,x2:700,y2:500},{x1:500,y1:500,x2:700,y2:500}],{x:1100,y:370,w:40,h:60},[[650,400],[620,360],[620,440],[560,400]]);
  runSim('dots trapped in a cup facing away from the exit',600);
  for(let rep=0;rep<5;rep++){demoLayout();runSim('demo layout, run '+(rep+1),600);}
  mk([{x:560,y:150,w:80,h:500}],{x:1000,y:380,w:40,h:60},[[400,400],[420,300],[420,500],[380,620]]);
  runSim('solid rectangle wall in the way',600);
  demoLayout();X.state.mode='edit';X.histPush();X.state.walls.push({x1:1,y1:1,x2:2,y2:2});X.histUndo();X.histRedo();X.histUndo();
  runSim('demo layout after undo/redo (rebuilt exits)',600);

  // 8. Study uses the particles you placed as the evacuees
  {X.stDemoMap();const st=X.state;st.mode='edit';
    const pts=[];for(let i=0;i<60;i++)pts.push([130+(i%10)*25,130+Math.floor(i/10)*25]);for(let i=0;i<40;i++)pts.push([830+(i%10)*30,130+Math.floor(i/10)*40]);
    for(const [x,y] of pts)st.particles.push(new X.Particle(x,y));
    st.particles.push(new X.Particle(400,200)); // sits on the wall between rooms 1 and 2
    st.walls.push({x1:1240,y1:700,x2:1290,y2:700},{x1:1290,y1:700,x2:1290,y2:750},{x1:1290,y1:750,x2:1240,y2:750},{x1:1240,y1:750,x2:1240,y2:700});
    st.particles.push(new X.Particle(1265,725));   // sealed inside a closed box: cannot reach an exit
    const W2=X.stBuildWorld(20,8);
    ok(W2.fixed&&W2.cells.length===101&&W2.skipped===1,'placed particles become evacuees: 101 used, 1 sealed in a closed box left out ('+W2.cells.length+' used, '+W2.skipped+' left out)');
    const a1=X.stMakeAgents(W2,999,1001),a2=X.stMakeAgents(W2,999,1002);
    ok(a1.n===101,'evacuee count comes from the particles, not the Evacuees box ('+a1.n+')');
    ok(Array.from(a1.cell).every((c,i)=>c===a2.cell[i]),'every seed starts each evacuee at the same placed spot');
    const C=10;ok(Array.from(a1.cell).slice(0,100).every((c,i)=>{const x=(c%W2.g.W+.5)*C,y=(Math.floor(c/W2.g.W)+.5)*C;return Math.hypot(x-pts[i][0],y-pts[i][1])<=C;}),'each evacuee starts in the grid cell of its particle');
    ok(Array.from(a1.speed).some((v,i)=>v!==a2.speed[i])&&Array.from(a1.delay).some((v,i)=>v!==a2.delay[i]),'walking speed and reaction delay still vary between seeds (Monte Carlo)');
    const room3=Array.from(W2.cells).slice(60,100).map(c=>c%W2.g.W*C);ok(room3.every(x=>x>800),'right-room particles stay in the right room');
    const S=await X.stRun({pxPerM:20,n:200,seeds:15,groups:8,particles:20,iters:30,qw:1,alsoBlock:true,psoSeed:0});
    ok(S.params.n===101&&S.conds[0].rows.pso.every(r=>r.nEvac+0<=101),'study ran on the 101 placed evacuees');
    const sum=m=>X.stSummary(S.conds[0].rows[m].map(x=>x.maxQueue)).mean;
    console.log('  placed-particle study, as drawn: max queue nearest/reroute/pso = '+sum('nearest').toFixed(1)+' / '+sum('reroute').toFixed(1)+' / '+sum('pso').toFixed(1));
    ok(X.stCsv(S).split('\n').length===1+S.conds.length*3*15,'CSV still has one row per scenario, method and seed');
    // running Simulate first must not change where Study puts people
    st.particles.length=0;for(const [x,y] of pts)st.particles.push(new X.Particle(x,y));
    const before=JSON.stringify(Array.from(X.stBuildWorld(20,8).cells));
    st.mode='sim';st.iter=0;for(let i=0;i<40;i++)X.psoStep(1);
    ok(st.particles.some((p,i)=>Math.hypot(p.pos.x-pts[i][0],p.pos.y-pts[i][1])>20),'Simulate moved the dots');
    ok(JSON.stringify(Array.from(X.stBuildWorld(20,8).cells))===before,'Study still uses the placed positions after Simulate ran');
    X.setMode('study');ok(st.particles.every((p,i)=>p.pos.x===pts[i][0]&&p.pos.y===pts[i][1]),'leaving Simulate puts the dots back where they were placed');
    st.mode='edit';
    // no particles: Start zones as before
    X.stDemoMap();ok(!X.stBuildWorld(20,8).fixed,'with no particles placed, Study uses the Start zones');}

  // 9. Room tool
  {const st=X.state,O=(t,b,l,r,type='open',doorM=1.5)=>({top:t,bottom:b,left:l,right:r,doorM,scale:20,type});
    let R=X.buildRoom(100,100,200,150,O(0,1,0,0));
    ok(R.walls.length===5&&R.exits.length===0,'room with 1 bottom opening = 5 wall pieces, no exits');
    const bot=R.walls.filter(w=>w.y1===250&&w.y2===250).sort((a,b)=>a.x1-b.x1);ok(bot.length===2&&Math.abs((bot[1].x1-bot[0].x2)-30)<1e-6&&Math.abs((bot[0].x2+bot[1].x1)/2-200)<1e-6,'bottom door is a 1.5 m (30 px) gap centred on the side');
    ok(R.walls.every(w=>w.room===R.id),'every wall is tagged with the room id');
    R=X.buildRoom(100,100,300,200,O(2,0,1,0));ok(R.walls.length===3+1+2+1,'2 top doors + 1 left door = 7 wall pieces');
    R=X.buildRoom(100,100,300,200,O(0,0,0,2,'exit',2));ok(R.exits.length===2&&R.exits.every(e=>Math.max(e.w,e.h)===40),'exit doors become 2 m building exits');
    R=X.buildRoom(100,100,90,90,O(4,0,0,0));ok(R.walls.filter(w=>w.y1===100&&w.y2===100&&w.x1!==w.x2).length===3&&R.walls.filter(w=>w.y1===100&&w.y2===100&&w.x1!==w.x2).every(w=>w.x2-w.x1>=10-1e-9)&&R.notes.some(n=>n.includes('fits only 2')),'too many doors for a short side: limited to 2, with a wall piece between them, and a note');
    R=X.buildRoom(100,100,200,200,O(1,0,0,0,'open',0.8));ok(R.notes.some(n=>n.includes('widened')),'doors narrower than the grid allows are widened, with a note');
    // a closed room traps people; one door lets them out (Study)
    X.clearMap();st.walls.push({x1:40,y1:40,x2:1260,y2:40},{x1:40,y1:780,x2:1260,y2:780},{x1:40,y1:40,x2:40,y2:780},{x1:1260,y1:40,x2:1260,y2:360},{x1:1260,y1:400,x2:1260,y2:780});
    st.exits.push({x:1250,y:360,w:20,h:40});
    const room=X.buildRoom(300,200,300,250,O(0,0,0,0));st.walls.push(...room.walls);
    for(let i=0;i<10;i++)st.particles.push(new X.Particle(350+i*20,320));
    let threw=false;try{X.stBuildWorld(20,4);}catch(e){threw=true;}ok(threw,'a room with no doors: nobody inside can reach the exit (Study refuses to run)');
    X.removeObject(st.walls.find(w=>w.room===room.id));ok(!st.walls.some(w=>w.room===room.id),'deleting one wall deletes the whole room');
    const room2=X.buildRoom(300,200,300,250,O(0,0,0,1));st.walls.push(...room2.walls);
    const Wr=X.stBuildWorld(20,4);ok(Wr.cells.length===10&&Wr.skipped===0,'add a right-side door: all 10 people inside can reach the exit');
    const S9=await X.stRun({pxPerM:20,n:0,seeds:5,groups:4,particles:10,iters:10,qw:1,alsoBlock:false,psoSeed:0});
    ok(S9.conds[0].rows.nearest.every(r=>r.nEvac===10),'Study: everyone gets out of the room through its door');
    // walking distance goes through the door: the path must be longer than the straight line
    const ag=X.stMakeAgents(Wr,0,1),c0=Wr.cells[0],x0=(c0%Wr.g.W+.5)*10,y0=(Math.floor(c0/Wr.g.W)+.5)*10;
    ok(ag.dist[0]>Math.hypot(1260-x0,380-y0)/20,'walking distance goes around the room walls, not through them');
    // Simulate: dots leave through the door without crossing a wall
    st.mode='sim';st.iter=0;let cross=0,it=0;while(it<1500&&st.particles.some(p=>!p.evacuated)){const b=st.particles.map(p=>({x:p.pos.x,y:p.pos.y}));X.psoStep(1);it++;st.particles.forEach((p,i)=>{if(X.moveCrossesWall(b[i],p.pos))cross++;});}
    ok(cross===0&&st.particles.every(p=>p.evacuated),'Simulate: all 10 dots leave the room through its door, none through a wall ('+it+' iterations)');
    X.resetSim();st.mode='edit';
    // undo brings a deleted room back; exits in a room keep particles' targets valid
    X.HIST.undo.length=0;X.histPush();X.removeObject(st.walls.find(w=>w.room===room2.id));X.histUndo();
    ok(st.walls.filter(w=>w.room===room2.id).length===room2.walls.length,'undo restores the whole deleted room');
    const room3=X.buildRoom(700,200,200,200,O(0,0,0,1,'exit',2));st.walls.push(...room3.walls);st.exits.push(...room3.exits);const pp=new X.Particle(800,300);pp.targetObj=room3.exits[0];st.particles.push(pp);
    X.removeObject(room3.exits[0]);ok(pp.targetObj===null&&!st.exits.some(e=>e.room===room3.id),'deleting a room resets particles that were heading for its exit');}


  // 10. Simulate: building with 4 classrooms (rooms with doors), dots in every room all get out
  {const st=X.state,O=(t,b,l,r,type,d)=>({top:t,bottom:b,left:l,right:r,doorM:d,scale:20,type});
    X.clearMap();let R=X.buildRoom(60,60,1180,700,O(0,0,0,1,'exit',2));st.walls.push(...R.walls);st.exits.push(...R.exits);
    for(const x of [120,460,800]){R=X.buildRoom(x,100,300,280,O(0,1,0,0,'open',1.5));st.walls.push(...R.walls);}
    R=X.buildRoom(300,480,600,240,O(0,2,0,0,'open',1.5));st.walls.push(...R.walls);
    for(const [x0,y0] of [[150,130],[490,130],[830,130],[330,510]])for(let i=0;i<40;i++)st.particles.push(new X.Particle(x0+(i%10)*24,y0+Math.floor(i/10)*40));
    st.mode='sim';st.iter=0;let cross=0,it=0;while(it<2000&&st.particles.some(p=>!p.evacuated)){const b=st.particles.map(p=>({x:p.pos.x,y:p.pos.y}));X.psoStep(1);it++;st.particles.forEach((p,i)=>{if(X.moveCrossesWall(b[i],p.pos))cross++;});}
    ok(cross===0,'classroom building: no dot passed through a wall');
    ok(st.particles.every(p=>p.evacuated),'classroom building: all 160 dots got out of their rooms and the building ('+st.particles.filter(p=>p.evacuated).length+' in '+it+' iterations)');
    X.resetSim();st.mode='edit';}

  // 11. Earthquake drill: destination is the safe zone (assembly area), reached through an exit
  {const st=X.state;
    // hand calculation: same 100 agents as test 1, plus a 10 m outdoor walk at 1.3 m/s
    const n=100,ag={n,E:1,dist:new Float64Array(n).fill(13),speed:new Float64Array(n).fill(1.3),delay:new Float64Array(n),group:new Int16Array(n),post:new Float64Array([10])};
    const r=X.stSimulate(ag,new Int32Array(n),[2]);
    ok(close(r.makespan,10+100/2.6+10/1.3)&&r.maxQueue===99,'hand check: last person reaches the safe zone at 10 + 100/2.6 + 10/1.3 = '+r.makespan.toFixed(3)+' s; queue unchanged (99)');
    ok(close(r.doorFinish[0]+10/1.3,r.finish[0]),'arrival = leaving the door + outdoor walk');
    // a building with exit on the LEFT and the safe zone on the RIGHT: the outdoor walk must go around the outside
    X.clearMap();st.walls.push({x1:300,y1:200,x2:900,y2:200},{x1:300,y1:600,x2:900,y2:600},{x1:900,y1:200,x2:900,y2:600},{x1:300,y1:200,x2:300,y2:380},{x1:300,y1:420,x2:300,y2:600});
    st.exits.push({x:290,y:380,w:20,h:40});st.safes.push({x:1000,y:350,w:150,h:150});st.starts.push({x:350,y:250,w:500,h:300});
    let W=X.stBuildWorld(20,4);
    ok(W.post[0]>(1000-300)/20+10,'outdoor walk goes around the building, not back through it ('+W.post[0].toFixed(1)+' m vs '+((1000-300)/20).toFixed(1)+' m straight line)');
    ok(W.destNotes.length===0,'closed building: no warnings');
    // a gap in the wall (no exit) lets people skip the exit: warn
    st.walls[2]={x1:900,y1:200,x2:900,y2:350};st.walls.push({x1:900,y1:450,x2:900,y2:600});
    W=X.stBuildWorld(20,4);ok(W.nOutdoor===W.cells.length&&W.destNotes.some(t=>t.includes('outside the building')),'building with a gap: people who can walk out through the gap count as outside, with a note');
    // an exit that opens into a closed yard with no safe zone is not used
    X.clearMap();st.walls.push({x1:300,y1:200,x2:900,y2:200},{x1:300,y1:600,x2:900,y2:600},{x1:900,y1:200,x2:900,y2:380},{x1:900,y1:420,x2:900,y2:600},{x1:300,y1:200,x2:300,y2:380},{x1:300,y1:420,x2:300,y2:600},
      {x1:900,y1:300,x2:1000,y2:300},{x1:900,y1:500,x2:1000,y2:500},{x1:1000,y1:300,x2:1000,y2:500});
    st.exits.push({x:290,y:380,w:20,h:40},{x:890,y:380,w:20,h:40});st.safes.push({x:50,y:350,w:150,h:150});st.starts.push({x:350,y:250,w:500,h:300});
    W=X.stBuildWorld(20,4);ok(isFinite(W.post[0])&&!isFinite(W.post[1])&&W.destNotes.some(t=>t.includes('Exit B')),'exit B opens into a closed yard: flagged');
    const Sy=await X.stRun({pxPerM:20,n:60,seeds:3,groups:4,particles:8,iters:5,qw:1,alsoBlock:false,psoSeed:0});
    ok(['nearest','reroute','pso'].every(m=>Sy.conds[0].rows[m].every(x=>x.loads[1]===0&&x.nEvac===60)),'nobody is sent through exit B, and all 60 reach the safe zone');
    // demo map: the assembly area is below the building, closest to exit B
    X.stDemoMap();W=X.stBuildWorld(20,8);
    ok(st.safes.length===1&&W.post[1]<W.post[0]&&W.post[1]<W.post[2],'demo map: exit B is closest to the assembly area (A/B/C = '+Array.from(W.post).map(v=>v.toFixed(1)).join(' / ')+' m)');
    const Sd=await X.stRun({pxPerM:20,n:200,seeds:5,groups:8,particles:20,iters:20,qw:0,alsoBlock:false,psoSeed:0});
    ok(Sd.toSafe&&['nearest','reroute','pso'].every(m=>Sd.conds[0].rows[m].every(x=>x.nEvac===200)),'demo map: all 200 reach the safe zone with every method');
    const rp=X.stReplayBuild(Sd,Sd.conds[0],'pso',0),z=st.safes[0];
    ok(rp.spot.every(p=>p&&p[0]>=z.x&&p[0]<=z.x+z.w&&p[1]>=z.y&&p[1]<=z.y+z.h),'replay: everyone ends up standing inside the assembly area');
    ok(rp.outPath.every(op=>{if(!op)return false;const e=op.pts[op.pts.length-1];return e[0]>=z.x-10&&e[0]<=z.x+z.w+10&&e[1]>=z.y-10&&e[1]<=z.y+z.h+10;}),'replay: every exit has an outdoor path that ends at the assembly area');}

  // 12. People who start OUTSIDE walk straight to the safe zone, never through an exit
  {const st=X.state;
    const building=()=>{X.clearMap();st.walls.push({x1:300,y1:200,x2:900,y2:200},{x1:300,y1:600,x2:900,y2:600},{x1:900,y1:200,x2:900,y2:600},{x1:300,y1:200,x2:300,y2:600});
      st.exits.push({x:290,y:380,w:20,h:40}); // exit drawn ON TOP of a continuous wall (no gap): it is the door
      st.safes.push({x:1000,y:350,w:150,h:150});};
    building();
    const inside=[[400,300],[500,400],[600,500],[700,300],[800,450]],outside=[[960,250],[1200,600],[950,700],[200,100],[1100,150]];
    for(const [x,y] of [...inside,...outside])st.particles.push(new X.Particle(x,y));
    const W=X.stBuildWorld(20,4);
    ok(W.nOutdoor===5&&Array.from(W.outdoor).slice(0,5).every(v=>!v)&&Array.from(W.outdoor).slice(5).every(v=>v),'Study: 5 people inside, 5 outside are told apart');
    const S=await X.stRun({pxPerM:20,n:0,seeds:5,groups:3,particles:8,iters:5,qw:0,alsoBlock:false,psoSeed:0});
    ok(['nearest','reroute','pso'].every(m=>S.conds[0].rows[m].every(r=>r.loads[0]===5&&r.nEvac===10)),'Study: only the 5 inside use the exit; all 10 reach the safe zone');
    const ag=X.stMakeAgents(W,0,1001),sim=X.stSimulate(ag,new Int32Array(10),[2]);
    ok([5,6,7,8,9].every(i=>close(sim.finish[i],ag.delay[i]+ag.direct[i]/ag.speed[i])),'Study: outside arrival time = reaction delay + direct walk');
    ok(ag.direct[5]<8&&sim.finish[5]<sim.finish[0],'Study: someone standing next to the safe zone arrives almost at once, before anyone inside');
    const rp=X.stReplayBuild(S,S.conds[0],'nearest',0);
    ok([5,6,7,8,9].every(i=>rp.paths[i].pts.every(q=>!X.inExitRect(q[0],q[1],0))),'Study replay: outside people never walk through the exit');
    ok([5,6,7,8,9].every(i=>{const q=rp.spot[i],z=st.safes[0];return q[0]>=z.x&&q[0]<=z.x+z.w&&q[1]>=z.y&&q[1]<=z.y+z.h;}),'Study replay: outside people end up in the safe zone');
    // a START zone that sticks out of the building
    X.clearMap();building();st.starts.push({x:700,y:300,w:400,h:200});
    const W2=X.stBuildWorld(20,4);ok(W2.nOutdoor>0&&W2.nOutdoor<W2.cells.length&&W2.destNotes.some(t=>t.includes('START zone is outside')),'Study: a START zone partly outside the building is flagged');
    // Simulate: same layout. Goal is the safe zone; the exit drawn over a wall is a usable door
    building();for(const [x,y] of [...inside,...outside])st.particles.push(new X.Particle(x,y));
    st.mode='sim';st.iter=0;let cross=0,it=0,outsideInExit=0;
    while(it<1500&&st.particles.some(p=>!p.evacuated)){const b=st.particles.map(p=>({x:p.pos.x,y:p.pos.y}));X.psoStep(1);it++;
      st.particles.forEach((p,i)=>{if(X.moveCrossesWall(b[i],p.pos))cross++;if(i>=5&&X.inExitRect(p.pos.x,p.pos.y,0))outsideInExit++;});}
    ok(st.particles.every(p=>st.safes.includes(p.targetObj)),'Simulate: with a safe zone drawn, every dot heads for the safe zone (not an exit)');
    ok(st.particles.every(p=>p.evacuated)&&cross===0,'Simulate: all 10 dots reach the safe zone, insiders through the door, nobody through a wall ('+it+' iterations)');
    ok(outsideInExit===0,'Simulate: dots that start outside never go through the exit');
    X.resetSim();st.mode='edit';}

  // 13. College preset, from the ground-floor escape plans
  {const st=X.state;X.stCollegeMap();const W=X.stBuildWorld(9,8);
    ok(W.g.exits.map(e=>e.name).join(',')==='NW,NE,S,E,N-court,S-court'&&[1,1,4,4,3,4].every((m,k)=>Math.abs(W.g.exits[k].widthM-m)<0.01),'college: 6 exits with the agreed widths (NW, NE 1 m; S, E, S-court 4 m; N-court 3 m)');
    ok(st.starts.length===24&&st.safes.length===6,'college: 24 rooms and 6 assembly areas (incl. west and east)');
    const C=10,inRoom=z=>W.cells.filter(i=>{const x=(i%W.g.W+.5)*C,y=(Math.floor(i/W.g.W)+.5)*C;return x>=z.x&&x<=z.x+z.w&&y>=z.y&&y<=z.y+z.h;}).length;
    ok(st.starts.every(z=>inRoom(z)>0)&&W.nOutdoor===0,'college: every room has a way out through its door; nobody starts outside');
    ok(W.post[4]<5&&W.post[5]<5,'college: the court openings lead straight onto the quadrangle assembly area');
    const q=st.safes[0],qc=Math.floor((q.y+q.h/2)/C)*W.g.W+Math.floor((q.x+q.w/2)/C);
    ok(W.safeField[qc]===0,'college: the quadrangle is an assembly area');
    // without the three court openings, the quadrangle cannot be reached
    const keep=st.exits.slice(0,4);st.exits.length=0;st.exits.push(...keep);const W2=X.stBuildWorld(9,8);
    ok(Array.from(W2.post).every((v,k)=>v>=W.post[k]-1e-9),'college: without the court openings, nobody can use the quadrangle');
    X.stCollegeMap();const S6=await X.stRun({pxPerM:9,n:600,seeds:15,groups:8,particles:20,iters:30,qw:0,alsoBlock:false,psoSeed:0}),c6=S6.conds[0];
    ok(['nearest','reroute','pso'].every(m=>c6.rows[m].every(r=>r.nEvac===600)),'college, 600 people: everyone reaches an assembly point with every method');
    ok(X.stPaired(c6,'nearest','avg').better===15,'college, 600 people: PSO beats nearest exit on average time in 15 of 15 seeds');
    // Simulate on the college: 3 dots in every room all reach an assembly point through the doors (doorways used to trap dots)
    let worst=0,allOut=true,cross=0;for(let rep=0;rep<4;rep++){X.stCollegeMap();for(const z of st.starts)for(const q of X.dropDots({x:z.x+z.w/2,y:z.y+z.h/2},3,25))st.particles.push(new X.Particle(q.x,q.y));
      st.mode='sim';st.iter=0;let it=0;while(it<1500&&st.particles.some(p=>!p.evacuated)){const b=st.particles.map(p=>({x:p.pos.x,y:p.pos.y}));X.psoStep(1);it++;st.particles.forEach((p,i)=>{if(X.moveCrossesWall(b[i],p.pos))cross++;});}
      worst=Math.max(worst,it);if(!st.particles.every(p=>p.evacuated))allOut=false;X.resetSim();st.mode='edit';}
    ok(allOut&&cross===0,'college, Simulate: all 72 dots leave their rooms and reach an assembly point in 4 of 4 runs, none through a wall (slowest '+worst+' iterations)');}
  // 14. Exit-penalty PSO
  {const st=X.state;X.stDemoMap();const W=X.stBuildWorld(20,8),ag=X.stMakeAgents(W,200,1001);
    const zero=X.stPenChoose(ag,[0,1,2],[0,0,0]);
    ok(Array.from(zero).every((e,i)=>[0,1,2].every(f=>ag.dist[i*3+e]+ag.post[e]<=ag.dist[i*3+f]+ag.post[f]+1e-9)),'all penalties 0: everyone takes their shortest route to safety');
    const pB=X.stPenChoose(ag,[0,1,2],[0,1000,0]);ok(!Array.from(pB).includes(1),'a huge penalty on B: nobody uses B');
    const small=X.stPenChoose(ag,[0,1,2],[0,25,0]),moved=Array.from(small).filter((e,i)=>e!==zero[i]);
    ok(moved.length>0&&moved.length<Array.from(zero).filter(e=>e===1).length,'a small penalty on B moves only some of B\'s users ('+moved.length+' people)');
    const pc=X.stPenChoose(ag,[0,2],[0,0,0]);ok(!Array.from(pc).includes(1),'a closed exit is never chosen');
    }

  // 15. Snapping and multi-dot drop
  {const st=X.state;getEl('snapObj').checked=true;getEl('snapGrid').checked=false;
    X.clearMap();st.walls.push({x1:100,y1:100,x2:500,y2:100},{x1:500,y1:100,x2:500,y2:400});
    let q=X.snapPoint({x:506,y:94},{});ok(q.x===500&&q.y===100,'a point near a wall corner locks exactly onto the corner');
    q=X.snapPoint({x:300,y:107},{});ok(q.x===300&&q.y===100,'a point near a wall locks onto the wall line');
    q=X.snapPoint({x:300,y:160},{});ok(q.x===300&&q.y===160,'a point far from everything stays where it is');
    q=X.snapPoint({x:507,y:250},{altKey:true});ok(q.x===507&&q.y===250,'holding Alt turns snapping off');
    getEl('snapGrid').checked=true;q=X.snapPoint({x:333,y:247},{});ok(q.x===330&&q.y===250,'grid snapping rounds to 10 px');getEl('snapGrid').checked=false;
    const D=X.snapDelta({x:200,y:200,w:50,h:40},{x:246,y:0},{},null);ok(200+D.x+50===500,'a moved box lines its edge up with a nearby wall');
    const r={x:280,y:90,w:40,h:26};ok(X.lockExitToWall(r)==='h'&&r.y+r.h/2===100&&r.w===40,'an exit drawn across a wall is centred on it, door width kept');
    const r2={x:200,y:200,w:40,h:26};ok(X.lockExitToWall(r2)===null&&r2.y===200,'an exit away from walls is left alone');
    // drop 10 dots inside a closed room, clicking near one wall: all stay inside
    X.clearMap();st.walls.push({x1:100,y1:100,x2:300,y2:100},{x1:300,y1:100,x2:300,y2:300},{x1:300,y1:300,x2:100,y2:300},{x1:100,y1:300,x2:100,y2:100});
    const pts=X.dropDots({x:120,y:200},10,60);
    ok(pts.length===10,'10 dots dropped with one click ('+pts.length+')');
    ok(pts.every(q=>q.x>100&&q.x<300&&q.y>100&&q.y<300),'all dropped dots stay inside the room clicked, even near its wall');
    ok(pts.every((a,i)=>pts.every((b,j)=>i===j||Math.hypot(a.x-b.x,a.y-b.y)>=7*0.9-1e-9)),'dropped dots do not pile on top of each other');
    const many=X.dropDots({x:200,y:200},400,40);ok(many.length<400&&many.length>10,'asking for more dots than fit places only what fits ('+many.length+')');
    ok(X.dropDots({x:100,y:200},5,40).length>0,'clicking right on a wall still drops dots on one side');}

  // 16. Removed features stay removed
  ok(!/id="toolDelete"|id="addSec"|id="selType"|id="selTargetKind"|id="toolTarget"/.test(html),'removed: Delete tool button, Add random dots, Kind dropdown, Target tool');
  ok(!/function stPSO\(|function addParticles\(|function changeSelType\(|function applySelTarget\(/.test(html),'removed: old region PSO, addParticles, changeSelType, applySelTarget code');

  // 17. Simulate: exit plan (nearest / PSO), door usage, crowding, reaction delay, paired experiment
  {const st=X.state;X.stCollegeMap();getEl('stScale').value='9';X.STUDY.study=null;
    const pts=X.simStartPoints(120,mulberry(42));ok(pts.length===120&&pts.every(q=>st.starts.some(z=>q.x>=z.x&&q.x<=z.x+z.w&&q.y>=z.y&&q.y<=z.y+z.h)),'experiment start points are sampled inside the Start zones (rooms)');
    // nearest plan: each person is sent to the exit with the shortest walk
    X.SIMX.force='nearest';getEl('simDelay').checked=false;st.particles=pts.map(q=>new X.Particle(q.x,q.y));st.iter=0;st.mode='sim';X.simAssign();
    ok(st.particles.every(p=>p.simStage==='exit'&&st.exits.every((e,k)=>X.simGeo(p.pos,st.exits[p.planExit])<=X.simGeo(p.pos,e)+1e-9)),'nearest plan: every person heads for the exit with the shortest walk');
    // a huge penalty on S-court empties it under the PSO plan
    const fakePen=st.exits.map((e,k)=>e.label==='S-court'?1000:0);ok(st.particles.every(p=>X.simChooseExit(p.pos,'pso',fakePen)!==6),'PSO plan: an exit with a huge penalty is never chosen');
    X.SIMX.force=null;
    // a full run: everyone reaches a safe zone, door counts add up, no wall crossings
    const r1=X.simRunOnce(pts,'nearest',123);
    ok(r1.done&&r1.used.reduce((a,b)=>a+b,0)+r1.outside===120,'nearest run: all 120 reach a safe zone; people per exit add up to 120');
    ok(r1.peak.every((v,k)=>v<=r1.used[k]+120)&&r1.peakMax>0&&r1.expo>0,'crowding is measured at the doors (peak and exposure)');
    const r1b=X.simRunOnce(pts,'nearest',123);ok(JSON.stringify(r1)===JSON.stringify(r1b),'a run with the same seed is exactly repeatable (paired comparison is fair)');
    // reaction delay: nobody moves during the first steps
    X.SIMX.forceDelay=true;X.SIMX.force='nearest';st.particles=pts.slice(0,30).map(q=>new X.Particle(q.x,q.y));st.iter=0;X.psoStep(1);
    ok(st.particles.every((p,i)=>p.pos.x===pts[i].x&&p.pos.y===pts[i].y),'reaction delay on: people stay put at first (Duck, Cover, Hold)');
    const ss=X.state.pso.maxV/(9*1.3);ok(st.particles.every(p=>p.wait+1>=Math.round(10/ss)-1&&p.wait+1<=Math.round(30/ss)+1),'reaction delay = 10 to 30 s converted to steps ('+Math.round(10/ss)+' to '+Math.round(30/ss)+' steps)');
    X.SIMX.forceDelay=null;X.SIMX.force=null;
    // a dot pinned exactly on a wall corner gets out (stall rescue)
    st.particles=[new X.Particle(930,125)];st.particles[0].vel={x:0,y:0};st.iter=0;let k=0;while(k<800&&!st.particles[0].evacuated){X.psoStep(1);k++;}
    ok(st.particles[0].evacuated,'a dot pinned exactly on a wall corner is rescued and reaches a safe zone ('+k+' steps)');
    // the experiment needs the Study's PSO plan, then runs paired nearest/PSO runs
    let threw=false;try{await X.simExperiment(50,2);}catch(e){threw=/Run the study/.test(e.message);}ok(threw,'experiment asks for a Study run first (the PSO plan comes from it)');
    const S=await X.stRun({pxPerM:9,n:300,seeds:3,particles:10,iters:8,qw:0,alsoBlock:false,psoSeed:0});X.STUDY.study=S;X.STUDY.stale=false;
    st.particles=[];const E=await X.simExperiment(80,3);
    ok(E.nearest.length===3&&E.pso.length===3&&[...E.nearest,...E.pso].every(r=>r.done),'experiment: 3 paired runs per plan, everyone reaches safety');
    ok(st.particles.length===0&&X.SIMX.force==null,'experiment leaves the map and settings as they were');
    st.mode='edit';X.STUDY.study=null;}
  // 18. Redundant fields removed, scale moved to the Map section
  ok(!/targetKind|id="statusText"|targetPos\(|simExitAt|function demoLayout/.test(html),'removed: per-dot targets, hidden status text, targetPos, duplicate door detection, Dots demo code');
  ok(!/id="simExpN"|id="wallAvoid"|Apply PSO settings|Apply boids settings|Dots demo/.test(html),'removed: experiment People field, Avoid walls checkbox, Apply buttons, Dots demo');
  {const ms=html.slice(html.indexOf('id="mapSec"'),html.indexOf('id="roomSec"'));ok(ms.includes('id="stScale"'),'scale (px per metre) lives in the Map section');}
  getEl('wallRepel').value='0';getEl('boidCoh').value='0';getEl('boidSep').value='1.6';getEl('boidAli').value='0.6';getEl('boidRadius').value='70';getEl('boidsOn').checked=true;
  X.applyBoids();ok(X.state.boids.coh===0&&X.state.wallRepel===0&&X.state.wallAvoid===false&&X.state.boids.sep===1.6,'a Boids weight of 0 is kept (not replaced by the default); wall repel 0 turns wall avoidance off');
  getEl('wallRepel').value='2.2';getEl('boidCoh').value='0.8';X.applyBoids();
  // 19. A blocked exit is a closed door, and no walk to an exit passes through another exit (bug: N-court blocked -> walk crossed the quadrangle)
  {X.stCollegeMap();st.particles=[];st.exits[4].blocked=true;
   const S=await X.stRun({pxPerM:9,n:600,seeds:3,particles:20,iters:30,qw:0,alsoBlock:false,psoSeed:0});const c=S.conds[0];
   const inQ=q=>q[0]>402&&q[0]<898&&q[1]>257&&q[1]<563;
   for(const meth of ['nearest','reroute','pso']){const rp=X.stReplayBuild(S,c,meth,0);let cut=0;for(let i=0;i<rp.ag.n;i++)if(!rp.ag.out[i]&&rp.paths[i].pts.some(inQ))cut++;
     ok(cut===0,'N-court blocked, '+meth+': no indoor walk crosses the quadrangle (they use the hallway): '+cut);}
   const w=S.world,ex=w.g.exits;let thru=0;for(let k=0;k<ex.length;k++)for(const o of ex)if(o.k!==k)for(const i of o.cells)if(isFinite(w.fields[k][i]))thru++;
   ok(thru===0,'the walking field to each exit never passes through another exit (open or blocked)');
   st.exits[4].blocked=false;
   const S2=await X.stRun({pxPerM:9,n:600,seeds:15,particles:20,iters:30,qw:0,alsoBlock:false,psoSeed:0}),m=k=>X.stSummary(S2.conds[0].rows[k].map(r=>r.avg)).mean;
   ok(Math.abs(m('nearest')-52.6)<0.15&&Math.abs(m('pso')-49.1)<0.15,'all exits open: results unchanged (nearest '+m('nearest').toFixed(1)+' s, PSO '+m('pso').toFixed(1)+' s)');
   // Simulate: dots from the north rooms never step through a blocked door
   st.exits[4].blocked=true;st.mode='sim';
   const pts=[];for(let k=0;k<8;k++)for(let j=0;j<5;j++)pts.push({x:420+k*62.5+j*8,y:160+j*10});
   st.particles=pts.map(q=>new X.Particle(q.x,q.y));st.iter=0;const N1=st.exits[4];let bad=0,steps=0;
   const prev=st.particles.map(p=>({x:p.pos.x,y:p.pos.y}));
   const crosses=(a,b,e)=>{for(let u=0;u<=20;u++){const x=a.x+(b.x-a.x)*u/20,y=a.y+(b.y-a.y)*u/20;if(x>=e.x&&x<=e.x+e.w&&y>=e.y&&y<=e.y+e.h)return true;}return false;};
   while(steps<1500&&!st.particles.every(p=>p.evacuated)){X.psoStep(1);steps++;st.particles.forEach((p,i)=>{if(crosses(prev[i],p.pos,N1))bad++;prev[i]={x:p.pos.x,y:p.pos.y};});}
   ok(bad===0,'Simulate: no dot steps through a blocked N-court door');
   ok(st.particles.every(p=>p.evacuated),'Simulate: with N-court blocked, all 40 north-side dots still reach a safe zone ('+steps+' steps)');
   ok(!X.inExitRect(N1.x+N1.w/2,N1.y+N1.h/2)&&X.moveCrossesWall({x:N1.x+10,y:N1.y-10},{x:N1.x+10,y:N1.y+N1.h+10}),'a blocked exit is solid for moving dots');
   st.exits[4].blocked=false;st.particles=[];st.mode='edit';}
  // 5. dump one agent set + choices for cross-check against the Python engine
  const w3=W.g.exits.map(e=>e.widthM),ch=X.stNearest(a3,[0,1,2]),res=X.stSimulate(a3,ch,w3);
  fs.writeFileSync(process.env.DUMP||'/tmp/js_dump.json',JSON.stringify({n:a3.n,E:a3.E,dist:Array.from(a3.dist),speed:Array.from(a3.speed),delay:Array.from(a3.delay),choice:Array.from(ch),widths:w3,avg:res.avg,maxQueue:res.maxQueue,nEvac:res.nEvac,makespan:res.makespan}));
  console.log(fails?('\n'+fails+' FAILED'):'\nALL PASSED');process.exit(fails?1:0);
})();
