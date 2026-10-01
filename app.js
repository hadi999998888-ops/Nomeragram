const $=s=>document.querySelector(s);
const letters=['А','В','Е','К','М','Н','О','Р','С','Т','У','Х'];
const regions=['01','05','07','10','15','16','20','23','26','34','50','52','61','66','77','78','95'];
const tiers=[
 {key:'common',name:'ОБЫЧНЫЙ',display:'Обычный',mult:1,weight:74,desc:'Случайная комбинация',color:'#aaa'},
 {key:'rare',name:'РЕДКИЙ',display:'Редкий',mult:8,weight:18,desc:'Красивая комбинация',color:'#5dbfff'},
 {key:'epic',name:'ЭПИЧЕСКИЙ',display:'Эпический',mult:30,weight:6.5,desc:'Редкая комбинация',color:'#b55bff'},
 {key:'legendary',name:'ЛЕГЕНДАРНЫЙ',display:'Легендарный',mult:90,weight:1.5,desc:'Исключительная комбинация',color:'#ffd052'}
];
let state=JSON.parse(localStorage.getItem('nomerProV2')||'null')||{
 balance:25249751, kept:null, collection:[], favorites:[], lastBonus:0
};
let current=null, upgradeResult=null, audioCtx=null;

function save(){localStorage.setItem('nomerProV2',JSON.stringify(state));updateBalance();renderCollection();renderBonus();renderOwned()}
function fmt(n){return Math.round(n).toLocaleString('ru-RU')}
function pick(a){return a[Math.floor(Math.random()*a.length)]}
function weightedTier(){let r=Math.random()*100,s=0;for(const t of tiers){s+=t.weight;if(r<s)return t}return tiers[0]}
function tripleChance(){return Math.random()<.035}
function makeNumber(forceTier=null){
 let t=forceTier||weightedTier(), x,y,z, l1,l2;
 if(tripleChance() && t.key!=='common'){x=y=z=Math.floor(Math.random()*10);l1=l2=pick(letters);t=tiers[Math.max(1,tiers.indexOf(t))]}
 else {x=Math.floor(Math.random()*10);y=Math.floor(Math.random()*10);z=Math.floor(Math.random()*10);l1=pick(letters);l2=pick(letters)}
 if(t.key==='legendary'){x=y=z=Math.floor(Math.random()*10);l1=l2=pick(letters)}
 let region=pick(regions);
 let base=100*t.mult + (x===y&&y===z?250:0) + (l1===l2?120:0);
 return {text:`${l1}${x}${y}${z}${l2}${pick(letters)}`,region,tier:t.key,value:base,desc:t.desc,id:Date.now()+Math.random()}
}
function getTier(key){return tiers.find(x=>x.key===key)||tiers[0]}
function updateBalance(){$('#balance').textContent=fmt(state.balance)}
function audio(freq=220,dur=.12){
 try{audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();let o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(.0001,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.045,audioCtx.currentTime+.01);g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+dur);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+dur)}catch(e){}
}
function toast(s){let t=$('#toast');t.textContent=s;t.classList.add('show');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>t.classList.remove('show'),1900)}
function renderRarity(t){
 let card=$('#rarityCard');card.className='rarity-card '+t.key;
 $('#rarityName').textContent=t.name;$('#currentPrice').textContent=fmt(current.value)+' ₽';
 $('#descriptionTitle').textContent=t.display;$('#descriptionText').textContent=current.desc;
 $('#sellValue').textContent=fmt(current.value)+' ₽';
 $('#rarityDots').innerHTML=[0,1,2,3,4].map((_,i)=>`<i class="${i<=tiers.indexOf(t)?'on':''}"></i>`).join('');
}
function showCurrent(n){
 current=n;let t=getTier(n.tier);
 $('#numLeft').textContent=n.text;$('#region').textContent=n.region;
 renderRarity(t);$('#plateLarge').classList.remove('flash');void $('#plateLarge').offsetWidth;$('#plateLarge').classList.add('flash');
}
function renderOwned(){
 const has=!!state.kept;
 $('#ownedValue').textContent=has?fmt(state.kept.value)+' ₽':'—';
 $('#upgradeBtn').disabled=!has;
 if(!has)$('#upgradeNote').textContent='Сначала оставь номер в генераторе.';
}
function renderCollection(){
 const c=$('#collection');
 if(!state.collection.length){c.className='collection-empty';c.textContent='Здесь появятся номера, которые ты оставишь.';return}
 c.className='';c.innerHTML='<div class="items">'+state.collection.slice().reverse().map(n=>{let t=getTier(n.tier);return `<div class="item"><div class="item-plate">${n.text} <small>${n.region}</small></div><div class="item-info"><b style="color:${t.color}">${t.display}</b><span>${fmt(n.value)} ₽</span></div></div>`}).join('')+'</div>';
}
function renderBonus(){
 let ready=Date.now()-state.lastBonus>=86400000;
 let s=$('#bonusStatus');s.textContent=ready?'Готово к получению':'Следующий бонус: '+timeLeft();
 $('#claimBonus').disabled=!ready;$('#claimBonus').style.opacity=ready?'1':'.4';
}
function timeLeft(){let ms=Math.max(0,86400000-(Date.now()-state.lastBonus));let h=Math.floor(ms/3600000),m=Math.floor(ms%3600000/60000);return `${h}ч ${m}м`}
function generate(){
 if(state.kept){toast('Сначала продай сохранённый номер');return}
 if(state.balance<100){toast('Недостаточно денег');return}
 state.balance-=100;
 let n=makeNumber();showCurrent(n);
 $('#previous').style.opacity='.45';
 $('#prevText').textContent=current.text;$('#prevRegion').textContent=current.region;
 $('#prevRarity').textContent=getTier(current.tier).display;$('#prevPrice').textContent=fmt(current.value)+' ₽';
 $('.stage').classList.remove('kept');
 updateBalance();audio(260,.1);
 toast('Новый номер выпал');
}
function sell(){
 if(!current)return;
 state.balance+=current.value;
 toast('Номер продан за '+fmt(current.value)+' ₽');
 current=null;$('.stage').classList.remove('kept');updateBalance();audio(330,.13);
 $('#rarityName').textContent='ОБЫЧНЫЙ';$('#currentPrice').textContent='—';$('#numLeft').textContent='А123АА';$('#region').textContent='05';
}
function keep(){
 if(!current)return;
 state.kept={...current};
 state.collection.push({...current});
 $('.stage').classList.add('kept');
 renderOwned();renderCollection();save();audio(620,.18);toast('Номер оставлен в коллекции');
}
function claimBonus(){
 if(Date.now()-state.lastBonus<86400000){toast('Бонус ещё не готов');return}
 state.lastBonus=Date.now();state.balance+=1000;save();audio(740,.2);toast('+1 000 ₽ получено');
}
function showView(view){
 document.querySelectorAll('.tool,.bottom-item').forEach(x=>x.classList.remove('active'));
 document.querySelectorAll(`[data-view="${view}"]`).forEach(x=>x.classList.add('active'));
 $('#roulettePanel').classList.toggle('show',view==='roulette');
 $('#collectionPanel').classList.toggle('show',view==='collection');
 if(view!=='generator')setTimeout(()=>document.querySelector(view==='roulette'?'#roulettePanel':'#collectionPanel').scrollIntoView({behavior:'smooth',block:'start'}),50)
}
function buildTrack(result){
 const track=$('#upgradeTrack');track.innerHTML='';
 let vals=[];
 for(let i=0;i<27;i++) vals.push(makeNumber());
 vals[23]=result;
 vals.forEach(n=>{let el=document.createElement('div');el.className='tile '+n.tier;el.textContent=n.text;track.appendChild(el)});
 track.style.transition='none';track.style.transform='translateX(8px)';
}
function upgrade(){
 if(!state.kept){toast('Оставь номер, чтобы использовать апгрейд');return}
 if(state.balance<50){toast('Недостаточно денег');return}
 state.balance-=50;upgradeResult=null;$('#exchangeBtn').disabled=true;$('#upgradeNote').textContent='Рулетка крутится…';updateBalance();
 let currentTierIndex=tiers.findIndex(t=>t.key===state.kept.tier);
 let minIndex=Math.max(0,currentTierIndex);
 let desired=Math.random()<.52 ? tiers[Math.min(3,currentTierIndex+1)] : tiers[Math.floor(Math.random()*(4-minIndex))+minIndex];
 let result=makeNumber(desired);buildTrack(result);
 let tileW=112, target=-(23*tileW-155);
 requestAnimationFrame(()=>{$('#upgradeTrack').style.transition='transform 3.2s cubic-bezier(.1,.72,.18,1)';$('#upgradeTrack').style.transform=`translateX(${target}px)`});
 setTimeout(()=>{
   upgradeResult=result;$('#upgradeResult').textContent=result.text;
   let better=result.value>state.kept.value;
   $('#upgradeNote').textContent=better?`Выпал ${getTier(result.tier).display.toLowerCase()} вариант — можно обменять.`:'Выпал номер дешевле твоего — обмен недоступен.';
   $('#exchangeBtn').disabled=!better;audio(better?780:180,.22);toast(better?'Есть шанс на апгрейд!':'Апгрейд не удался');
 },3300);
}
function exchange(){
 if(!upgradeResult||upgradeResult.value<=state.kept.value)return;
 state.kept={...upgradeResult};current={...upgradeResult};state.collection.push({...upgradeResult});
 showCurrent(upgradeResult);renderOwned();renderCollection();save();$('#exchangeBtn').disabled=true;$('#upgradeNote').textContent='Обмен выполнен.';audio(920,.28);toast('Номер улучшен!');
}
$('#rollBtn').onclick=generate;$('#sellBtn').onclick=sell;$('#keepBtn').onclick=keep;$('#claimBonus').onclick=claimBonus;$('#upgradeBtn').onclick=upgrade;$('#exchangeBtn').onclick=exchange;
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>showView(b.dataset.view));
$('#clearBtn').onclick=()=>{if(confirm('Удалить все сохранённые номера?')){state.collection=[];if(state.kept)state.kept=null;save();$('.stage').classList.remove('kept');renderOwned();toast('Коллекция очищена')}};
$('#menuBtn').onclick=()=>toast('Номер PRO • виртуальный симулятор');
$('#searchBtn').onclick=()=>$('#searchModal').classList.add('show');$('#closeSearch').onclick=()=>$('#searchModal').classList.remove('show');
$('#searchDo').onclick=()=>{let q=$('#searchInput').value.trim().toUpperCase();let found=state.collection.filter(x=>(x.text+x.region).includes(q));$('#searchResult').textContent=found.length?`Найдено: ${found.length} номер(а).`:'Ничего не найдено.'};
setInterval(renderBonus,30000);
updateBalance();renderBonus();renderOwned();renderCollection();showCurrent(makeNumber());
