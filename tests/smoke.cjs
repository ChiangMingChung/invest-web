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
assert.equal(elements.total.textContent,'2,400,000 元');
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
assert.equal(elements['late-value'].textContent,'0 元');
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
assert.equal(run('perfLongTerm(searchCatalogue("0050")[0])'),null);
assert.equal(run('perfRows(searchCatalogue("0050")[0]).length'),0);
assert.ok(run('perfDetail(0,searchCatalogue("0050")[0])').includes('待補'));
console.log('PASS: principal, blank/zero rates, highest/ties, 4 frequencies, quick, delay, catalogue, long-term average returns.');
