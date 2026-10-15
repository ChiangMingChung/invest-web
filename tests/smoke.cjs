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
const fund=run('searchCatalogue("統一奔騰")[0]');
assert.equal(fund.perf.returns[5],503.34);
const fundRows=run('perfRows(searchCatalogue("統一奔騰")[0])');
assert.equal(fundRows.map(r=>r.years).join(),"1,2,3,5");
assert.ok(Math.abs(fundRows[3].annual-43.3)<0.1);
const longTerm=run('perfLongTerm(searchCatalogue("安聯台灣科技")[0])');
assert.ok(Math.abs(longTerm.years-25.41)<0.01);
assert.ok(Math.abs(longTerm.annual-18.67)<0.05);
const detail=run('perfDetail(1,searchCatalogue("安聯台灣科技")[0])');
assert.equal((detail.match(/data-rate=/g)||[]).length,1);
assert.ok(detail.includes('data-rate="'+longTerm.annual.toFixed(2)+'"'));
assert.ok(detail.includes('僅供參考'));
assert.equal(run('perfLongTerm(searchCatalogue("00878")[0])'),null);
assert.ok(Math.abs(run('perfLongTerm(searchCatalogue("0050")[0])').annual-14.67)<0.05);
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
console.log('PASS: principal, blank/zero rates, highest/ties, 4 frequencies, quick, delay, catalogue, long-term average returns, growth page, monthly dividends.');
