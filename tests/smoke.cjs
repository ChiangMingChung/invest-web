const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const defaults = {principal:'1000000', monthly:'10000', years:'20', interest:'compound', frequency:'monthly', inspect:'20', delay:'5', 'timing-scheme':'0', 'catalogue-kind':'all'};
const elements = {};
const document = {
 body:{dataset:{}}, addEventListener(){}, querySelectorAll:()=>[],
 getElementById(id){return elements[id] ??= {
  value:defaults[id] ?? '', checked:true, dataset:{}, options:[{},{},{},{}],
  handlers:{}, checkValidity:()=>true,
  addEventListener(e,f){(this.handlers[e] ??=[]).push(f)},
  setAttribute(){}, removeAttribute(){}, getBoundingClientRect:()=>({width:360}),
  querySelectorAll:()=>[], contains:()=>false, focus(){}, innerHTML:'', textContent:''
 }}
};
const context = vm.createContext({document,window:{addEventListener(){}},location:{hash:''}});
const run = code => vm.runInContext(code,context);
run(script);
assert.equal(run('currentPage'),'life');
run("setPage('scenarios')");
assert.equal(elements.total.textContent,'NT$ 2,400,000');
assert.equal(elements.value0.textContent,'—');
elements.rate0.value='2'; elements.rate1.value='6'; elements.rate2.value='10';
run('render()');
assert.equal(elements.legend2.dataset.line,'solid');
assert.equal(elements.legend1.dataset.line,'dashed');
assert.equal(elements.legend0.dataset.line,'dotted');
elements.rate0.value='12'; run('render()');
assert.equal(elements.legend0.dataset.line,'solid');
elements.rate2.value='12'; run('render()');
assert.equal(elements.legend0.dataset.line,'solid');
assert.equal(elements.legend2.dataset.line,'solid');
elements.rate0.value=''; run('render()');
assert.equal(elements.value0.textContent,'—');
assert.equal(run('calculateFinal(0,10000,20,0)'),2400000);
assert.equal(run('calculateFinal(1000000,0,20,0)'),1000000);
function reference(p,m,y,a,l){
 let value=p,interest=0;
 for(let month=1;month<=y*12;month++){
  interest+=value*a/12; value+=m;
  if(month%l===0){value+=interest;interest=0}
 }return value;
}
for(const [frequency,months] of [['annual',12],['semiannual',6],['quarterly',3],['monthly',1]]){
 for(const [p,m] of [[0,10000],[1000000,0],[1000000,10000]]){
  for(const rate of [0,6,-5]){
   const actual=run('calculateFinal('+p+','+m+',20,'+rate+',"compound","'+frequency+'")');
   assert.ok(Math.abs(actual-reference(p,m,20,rate/100,months))<0.0001);
  }
 }
 elements.frequency.value=frequency; elements['quick-rate'].value='10'; run('render()');
 assert.equal(elements['quick-value'].textContent,run('fmt(calculateFinal(0,10000,20,10,"compound","'+frequency+'"))'));
}
elements.frequency.value='monthly'; elements['timing-scheme'].value='1'; elements.delay.value='25'; run('render()');
assert.equal(elements['late-value'].textContent,'NT$ 0');
assert.equal(run('searchCatalogue("0050")[0].code'),'0050');
assert.ok(Math.abs(run('annualized(100,2)')-41.4213562)<1e-6);
assert.ok(Math.abs(run('annualized(-50,1)')+50)<1e-9);
const yearsBetween=(a,b)=>(Date.parse(b.replace(/\//g,'-'))-Date.parse(a.replace(/\//g,'-')))/31557600000;
const expectLT=code=>{const it=run('searchCatalogue("'+code+'")[0]');const y=yearsBetween(it.perf.inception,it.perf.asOf);return{years:y,annual:(Math.pow(1+it.perf.returns.since/100,1/y)-1)*100}};
const fund=run('searchCatalogue("統一奔騰")[0]');
assert.equal(typeof fund.perf.returns[5],'number');
const fundRows=run('perfRows(searchCatalogue("統一奔騰")[0])');
assert.equal(fundRows.map(r=>r.years).join(),"1,2,3,5");
assert.ok(Math.abs(fundRows[3].annual-(Math.pow(1+fund.perf.returns[5]/100,1/5)-1)*100)<1e-9);
const longTerm=run('perfLongTerm(searchCatalogue("安聯台灣科技")[0])');
assert.ok(Math.abs(longTerm.years-expectLT('TW000T3604Y3').years)<1e-9&&longTerm.years>25);
assert.ok(Math.abs(longTerm.annual-expectLT('TW000T3604Y3').annual)<1e-9);
const detail=run('perfDetail(1,searchCatalogue("安聯台灣科技")[0])');
assert.equal((detail.match(/data-rate=/g)||[]).length,1);
assert.ok(detail.includes('data-rate="'+longTerm.annual.toFixed(2)+'"'));
assert.ok(detail.includes('僅供參考'));
assert.equal(run('perfLongTerm(searchCatalogue("00878")[0])'),null);
assert.ok(Math.abs(run('perfLongTerm(searchCatalogue("0050")[0])').annual-expectLT('0050').annual)<1e-9);
assert.equal(run('perfRows(searchCatalogue("00878")[0]).length'),0);
assert.ok(run('perfDetail(0,searchCatalogue("00878")[0])').includes('待補'));
assert.equal(run('growthSeries(10000,20,0)[20]'),2400000);
function growthReference(m,y,rate){const g=Math.pow(1+rate/100,1/12)-1;let v=0;for(let k=0;k<y*12;k++)v=v*(1+g)+m;return v}
for(const rate of [8,-5,30])assert.ok(Math.abs(run('growthSeries(10000,20,'+rate+')[20]')-growthReference(10000,20,rate))<1e-4);
assert.ok(Math.abs(run('growthSeries(1000,1,12)[1]')-growthReference(1000,1,12))<1e-9);
elements['g-monthly'].value='10000'; elements['g-rate'].value='8'; elements['g-years'].value='20'; run('renderGrowth()');
assert.ok(elements['g-stats'].innerHTML.includes('NT$ 2,400,000'));
assert.equal(elements['g-value'].textContent,run('fmt(growthSeries(10000,20,8)[20])'));
assert.equal((elements['g-rows'].innerHTML.match(/<tr>/g)||[]).length,20);
elements['g-years'].value=''; run('renderGrowth()');
assert.equal(elements['g-value'].textContent,'—');
assert.ok(elements['g-error'].textContent.length>0);
const ig=run('searchCatalogue("LU0820561818")[0]');
assert.equal(ig.perf.returns.since,179.3);
assert.ok(Math.abs(run('perfLongTerm(searchCatalogue("LU0820561818")[0])').annual-expectLT('LU0820561818').annual)<1e-9);
assert.ok(run('perfDetail(0,searchCatalogue("LU0820561818")[0])').includes('0.055 美元'));
assert.equal(run('perfDividend(searchCatalogue("TW000T3635H2")[0])'),'');
// dividend presets (Allianz Income & Growth AM as default)
assert.equal(elements['g-preset'].value,'LU0820561818');
assert.equal(+elements['g-yield'].value,7.8);
assert.ok(Math.abs(+elements['g-nav'].value+0.41)<0.011);
const presetSim=run('dividendSim(1000000,20,'+elements['g-nav'].value+','+elements['g-yield'].value+',false)');
assert.ok(Math.abs(presetSim.totalReturn-run('perfLongTerm(searchCatalogue("LU0820561818")[0]).annual'))<0.02);
assert.ok(elements['g-preset-note'].innerHTML.includes('0.055 美元'));
assert.equal(run('dividendPresets().length'),3);
// monthly dividend mode (lump sum)
const sim=(p,y,nav,yp,re)=>run('dividendSim('+[p,y,nav,yp,re].join(',')+')');
assert.ok(Math.abs(sim(1000000,20,8,0,false).values[20]-1000000*Math.pow(1.08,20))<1e-4);
assert.ok(Math.abs(sim(1000000,10,0,6,true).values[10]-1000000*Math.pow(1.005,120))<1e-4);
assert.equal(sim(1000000,3,0,6,false).cashes[3],1000000*0.005*36);
assert.equal(sim(1000000,3,0,6,false).values[3],1000000);
const cashCase=sim(1000000,10,-1,6,false);
assert.ok(Math.abs(cashCase.yearDivs.reduce((a,b)=>a+b,0)-cashCase.cashes[10])<1e-6);
assert.ok(Math.abs(cashCase.monthlyEnd-cashCase.values[10]*0.005)<1e-9);
assert.ok(Math.abs(cashCase.monthlyFirst-1000000*Math.pow(0.99,1/12)*0.005)<1e-9);
assert.ok(cashCase.values[10]<1000000);
elements['g-years'].value='20'; elements['g-principal'].value='1000000'; elements['g-yield'].value='6'; elements['g-nav'].value='-1'; elements['g-payout'].value='cash'; run('setGrowthMode("div")');
const cash20=sim(1000000,20,-1,6,false);
assert.equal(elements['g-value'].textContent,run('fmt('+(cash20.values[20]+cash20.cashes[20])+')'));
assert.ok(elements['g-income'].innerHTML.includes(run('fmt('+cash20.monthlyFirst+')')));
assert.ok(elements['g-income'].innerHTML.includes(run('fmt('+cash20.monthlyEnd+')')));
assert.ok(elements['g-stats'].innerHTML.includes('NT$ 1,000,000'));
assert.ok(elements['g-summary'].textContent.startsWith('單筆投入 NT$ 1,000,000'));
assert.equal(elements['g-warning'].hidden,false);
assert.equal((elements['g-head'].innerHTML.match(/<th>/g)||[]).length,6);
elements['g-principal'].value=''; run('renderGrowth()');
assert.equal(elements['g-value'].textContent,'—');
elements['g-principal'].value='1000000'; run('setGrowthMode("price")');
assert.equal(elements['g-warning'].hidden,true);
assert.equal(elements['g-value'].textContent,run('fmt(growthSeries(10000,20,8)[20])'));
// life curve
const base={age:35,retire:65,end:90,inflation:0,assets:0,monthly:10000,rate1:0,expense:0,income:0,rate2:0,dreams:[]};
const lifeRun=o=>run('lifeSim('+JSON.stringify(o)+')');
assert.equal(lifeRun(base).retireValue,3600000);
assert.equal(lifeRun(base).values.length,56);
assert.equal(lifeRun({...base,expense:20000}).deplete,360+181);
assert.equal(lifeRun({...base,expense:10000}).deplete,null);
assert.equal(lifeRun({...base,dreams:[{age:40,name:'x',amount:100000}]}).values[5],5*120000-100000);
assert.equal(lifeRun({...base,inflation:10,dreams:[{age:37,name:'x',amount:100000}]}).events[2][0].cost.toFixed(4),'121000.0000');
assert.ok(Math.abs(lifeRun({...base,rate1:6}).retireValue-growthReference(10000,30,6))<1e-4);
assert.equal(run('neededMonthly('+JSON.stringify({...base,monthly:0,expense:10000})+')'),8400);
assert.equal(run('ageText(78.25)'),'78 歲 3 個月');
assert.equal(run('ageText(80)'),'80 歲');
const life={'l-age':'35','l-retire':'65','l-end':'90','l-inflation':'2','l-assets':'1000000','l-monthly':'20000','l-rate1':'6','l-income':'20000','l-rate2':'3','l-food':'600','l-living':'15000','l-rent':'15000','l-house-price':'15000000','l-house-age':'40','l-car1':'1000000','l-car2':'600000','l-car-years':'10','l-edu':'2000000','l-edu-age':'45','l-eu':'1','l-eu-cost':'100000','l-asia':'1','l-asia-cost':'45000','l-travel-end':'80'};
elements['l-house'].value='rent';
for(const [k,v] of Object.entries(life))elements[k].value=v;
run('renderLife()');
assert.notEqual(elements['l-value'].textContent,'—');
assert.equal((elements['l-rows'].innerHTML.match(/<tr>/g)||[]).length,56);
assert.ok(elements['l-chart'].innerHTML.includes('小孩花費'));
assert.ok(elements['l-chart'].innerHTML.includes('換車'));
assert.ok(!elements['l-chart'].innerHTML.includes('出國旅遊'));
elements['l-retire'].value='95'; run('renderLife()');
assert.equal(elements['l-value'].textContent,'—');
assert.ok(elements['l-error'].textContent.length>0);
elements['l-retire'].value='65'; elements['l-monthly'].value='0'; elements['l-assets'].value='0'; run('renderLife()');
assert.equal(elements['l-warning'].hidden,false);
assert.ok(elements['l-value'].textContent.includes('歲'));
// 食衣住行育樂
const full={age:35,retire:65,end:90,inflation:0,assets:0,monthly:0,rate1:0,rate2:0,income:20000,food:600,living:15000,house:'rent',rent:15000,housePrice:15000000,houseAge:40,car1:1000000,car2:600000,carYears:10,edu:2000000,eduAge:45,eu:1,euCost:100000,asia:1,asiaCost:45000,travelEnd:80,dreams:[]};
const needs=run('lifeNeeds('+JSON.stringify(full)+')');
const nv=k=>needs.find(r=>r[0]===k)[2];
assert.equal(nv('食'),600*30*12*25);
assert.equal(nv('衣・生活'),15000*12*25);
assert.equal(nv('住'),15000*12*25);
assert.equal(nv('行'),(1000000+600000)/2*3);
assert.equal(nv('育'),2000000);
assert.equal(nv('樂'),145000*15);
assert.equal(nv('其他收入'),-20000*12*25);
const ev=run('lifeEvents('+JSON.stringify(full)+')');
assert.equal(JSON.stringify(ev.filter(e=>e.kind==='car').map(e=>[e.age,e.amount])),'[[65,1000000],[75,800000],[85,600000]]');
assert.equal(ev.filter(e=>e.kind==='travel').length,15);
assert.equal(run('lifeNeeds('+JSON.stringify({...full,house:'buy'})+')').find(r=>r[0]==='住')[2],15000000);
assert.equal(run('lifeMonthlyNeed('+JSON.stringify({...full,house:'own'})+')'),600*30+15000-20000);
const simFull=run('lifeSim('+JSON.stringify(full)+')');
const total=run('lifeNeeds('+JSON.stringify(full)+')').reduce((a,r)=>a+r[2],0);
assert.ok(Math.abs(-simFull.values[55]-total)<1e-3);
// inflation page
assert.ok(Math.abs(run('inflationAt(100,2,30).future')-100*Math.pow(1.02,30))<1e-9);
assert.ok(Math.abs(run('inflationAt(100,2,30).power')-100/Math.pow(1.02,30))<1e-9);
elements['i-amount'].value='1000000'; elements['i-years'].value='30'; elements['i-rate'].value='2'; run("setPage('inflation')");
assert.equal(elements['i-future'].textContent,run('fmt(1000000*Math.pow(1.02,30))'));
assert.ok(elements['i-examples'].innerHTML.includes('便當'));
console.log('PASS: principal, blank/zero rates, highest/ties, 4 frequencies, quick, delay, catalogue, long-term average returns, growth page, monthly dividends, life curve, 食衣住行育樂, inflation.');
