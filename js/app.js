(function(){
'use strict';
var R=window.RP, F=R.facts, DEMO=R.demo, SIM=R.sim;
var $=function(id){return document.getElementById(id)};
var fmt=function(n,d){return Number(n).toLocaleString('ko-KR',{maximumFractionDigits:d==null?0:d,minimumFractionDigits:d||0})};
var SCN={normal:'정상',stop:'사용 중단 (7월~)',half:'수요 반감 (7월~)',leak1:'누수 1.0㎥/일'};
var SCC={normal:'#2e75b6',stop:'#c0392b',half:'#d96c2b',leak1:'#7a4fb5'};
var THR=DEMO.meta['경보기준_월사용량_대비_기대치'];
var state={sc:'normal',recMonth:7,gu:'전체',dong:null,role:'admin',fleetF:'전체'};

/* ---------- 역할별 화면(모듈) ----------
   MODULES에 탭 이름을 넣거나 빼면 대상별 메뉴가 바뀝니다. */
var TABNAME={home:'홈',fleet:'관할 시설 현황',map:'시설 지도',detail:'시설 상세·이상 진단',record:'법정 기록',inspect:'점검표',operate:'운영 추천',biz:'서비스·사업 구조',esg:'ESG 리포트'};
var MODULES={
  admin:{label:'시설 관리자',tabs:['home','detail','record','operate','esg','biz']},
  gov:{label:'지자체',tabs:['home','fleet','map','inspect','biz']}
};
var tabs=Object.keys(TABNAME);
function roleFor(t){
  if(MODULES[state.role].tabs.indexOf(t)>=0)return state.role;
  return MODULES.admin.tabs.indexOf(t)>=0?'admin':'gov';
}
function buildNav(){
  var n=$('nav');n.innerHTML='';
  MODULES[state.role].tabs.forEach(function(t){var b=document.createElement('button');b.dataset.go=t;b.textContent=TABNAME[t];n.appendChild(b)});
  seg('roleSeg',Object.keys(MODULES).map(function(k){return [k,MODULES[k].label+'용']}),state.role,function(r){setRole(r)});
}
function setRole(r,target){
  state.role=r;buildNav();
  go(target&&MODULES[r].tabs.indexOf(target)>=0?target:(MODULES[r].tabs.indexOf(cur)>=0?cur:(r==='gov'?'fleet':'detail')));
}
var cur='home';
function go(t){
  if(tabs.indexOf(t)<0)t='home';
  var r=roleFor(t);if(r!==state.role){state.role=r;buildNav()}
  cur=t;
  tabs.forEach(function(x){$('tab-'+x).classList.toggle('on',x===t)});
  document.querySelectorAll('#nav button').forEach(function(b){b.classList.toggle('on',b.dataset.go===t)});
  if(location.hash!=='#'+t)history.replaceState(null,'','#'+t);
  window.scrollTo(0,0);
}
document.addEventListener('click',function(e){
  var rc=e.target.closest('[data-role]');if(rc){setRole(rc.dataset.role,rc.dataset.role==='gov'?'fleet':'detail');return}
  var g=e.target.closest('[data-go]');if(g){go(g.dataset.go)}
});

/* ---------- 공통 ---------- */
function seg(id,items,cur,cb){
  var box=$(id);if(!box)return;box.innerHTML='';
  items.forEach(function(it){
    var b=document.createElement('button');b.textContent=it[1];if(it[0]===cur)b.className='on';
    b.onclick=function(){cb(it[0])};box.appendChild(b);
  });
}
function monthStatus(sc){
  var ms=DEMO.monthly[sc];
  return ms.map(function(m,i){
    if(m.ratio==null)return '—';
    if(!m.alert)return '정상';
    var prev=i>0&&ms[i-1].alert,next=i<ms.length-1&&ms[i+1].alert;
    return (prev||next)?'이상':'의심';
  });
}
function badge(s){var c={'정상':'b-ok','의심':'b-warn','이상':'b-bad','—':'b-gray'}[s]||'b-gray';return '<span class="badge '+c+'">'+s+'</span>'}
function setSc(k){state.sc=k;renderSc()}
function scItems(){return Object.keys(SCN).map(function(k){return [k,SCN[k]]})}

/* ---------- 홈 ---------- */
function renderHome(){
  var ids=['unknown2021','unmeasured2016','unused_apt','seongnam146'],ps={};
  F.problem_stats.forEach(function(p){ps[p.id]=p});
  var labels={unknown2021:'2021년 전국 3,175곳 중 사용량을 파악하지 못한 시설',unmeasured2016:'2016년 전국 2,043곳 중 연간 사용량 미집계',unused_apt:'공동주택 시설 중 빗물을 쓰지 않는 비율(약, 2016)',seongnam146:'성남시 한 곳만의 2026년 점검 대상 빗물이용시설'};
  var h='';
  ids.forEach(function(id,i){var p=ps[id];h+='<div class="card stat'+(i===3?' navy':'')+'"><b>'+fmt(p.value)+p.unit+'</b><span>'+labels[id]+'</span>'+(p.status!=='확인'?'<em>원 출처 확인 중</em>':'')+'</div>'});
  $('homeStats').innerHTML=h;
  $('homeStatNote').textContent='출처: 환경부 하수도 통계(2016)·한국건설기술연구원 외(2022), 성남시 2026 과업지시서. 2021·2022 시설 수는 팀 정리 자료이며 원 출처를 확인 중입니다. 쓰지 않는 이유 1위는 "필요할 때 저류조 물이 부족", 2위는 "운영비 부담"입니다.';
  var t='<tr><th>법이 요구하는 것</th><th>우리 서비스가 하는 일</th><th>확인 수준</th></tr>';
  t+='<tr><td>빗물 사용량 기록 (물 재이용법 시행규칙)</td><td>센서로 자동 기록해 3년 보존. 전자적 방법으로 기록·보존할 수 있음</td><td>원문 확인(국회법률정보시스템)</td></tr>';
  t+='<tr><td>누수·점검·청소 기록</td><td>이상 진단으로 의심 구간을 표시, 점검·청소 날짜는 담당자가 입력</td><td>센서만으로 대체되지 않음</td></tr>';
  t+='<tr><td>과태료 (시행령 별표 2)</td><td>시설기준 위반 등 150만 원(반복 시 200만·300만), 자료 제출 거부·거짓 500만~1,000만 원</td><td>원문 확인. "기록 미이행" 전용 항목과 부과 사례는 확인하지 못함</td></tr>';
  t+='<tr><td>지자체 점검표 (성남 2026)</td><td>월별 빗물이용량 12개월, 유량계 설치 여부, 기록 3년 보존 여부를 자동으로 채움</td><td>과업지시서 확인</td></tr>';
  $('lawTable').innerHTML=t;
}

/* ---------- 지도 ---------- */
var dstat={};R.dongStats.forEach(function(d){dstat[d['구']+'|'+d['동']]=d});
var BINS=[[0,'0곳','#eef3f9'],[1,'1~4곳','#cfe0f2'],[5,'5~9곳','#93bde4'],[10,'10~19곳','#4a90cf'],[20,'20곳 이상','#1b3a5c']];
function binColor(n){var c=BINS[0][2];BINS.forEach(function(b){if(n>=b[0])c=b[2]});return c}
var GUS=['강남구','서초구','송파구','강동구','관악구','광진구','동작구','성동구'];
function renderMap(){
  seg('guSeg',[['전체','전체']].concat(GUS.map(function(g){return [g,g]})),state.gu,function(g){state.gu=g;state.dong=null;renderMap()});
  var svg='<g class="dongs">';
  R.geo.dongs.forEach(function(d,i){
    var k=d.gu+'|'+d.name,s=dstat[k]||{},n=s['빗물이용시설수']||0;
    var dim=state.gu!=='전체'&&state.gu!==d.gu;
    svg+='<path d="'+d.d+'" fill="'+binColor(n)+'" opacity="'+(dim?.25:1)+'" data-k="'+k+'"'+(state.dong===k?' class="sel"':'')+'/>';
  });
  svg+='</g>';
  R.geo.gus.forEach(function(g){svg+='<path d="'+g.d+'" fill="none" stroke="#1b3a5c" stroke-width="1.6" pointer-events="none" opacity="'+((state.gu==='전체'||state.gu===g.gu)?.9:.2)+'"/>'});
  if($('ptToggle').checked){R.pts.forEach(function(p){svg+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="4" fill="#d96c2b" stroke="#fff" stroke-width="1" pointer-events="none"/>'})}
  $('mapSvg').innerHTML=svg;
  $('mapLegend').innerHTML=BINS.map(function(b){return '<span><i style="background:'+b[2]+'"></i>'+b[1]+'</span>'}).join('')+($('ptToggle').checked?'<span><i style="background:#d96c2b;border-radius:50%"></i>시설 위치</span>':'');
  var tip=$('tip');
  $('mapSvg').querySelectorAll('path[data-k]').forEach(function(p){
    p.onmousemove=function(e){var s=dstat[p.dataset.k];tip.style.display='block';tip.style.left=(e.clientX+12)+'px';tip.style.top=(e.clientY+12)+'px';tip.textContent=p.dataset.k.replace('|',' ')+' · '+(s?s['빗물이용시설수']:0)+'곳'};
    p.onmouseleave=function(){tip.style.display='none'};
    p.onclick=function(){state.dong=p.dataset.k;showDong();renderMapSel()};
  });
  var gsum={};R.dongStats.forEach(function(d){gsum[d['구']]=(gsum[d['구']]||0)+d['빗물이용시설수']});
  var mx=Math.max.apply(null,Object.keys(gsum).map(function(k){return gsum[k]}));
  $('guBars').innerHTML=Object.keys(gsum).sort(function(a,b){return gsum[b]-gsum[a]}).map(function(g){return '<div style="display:flex;align-items:center;gap:8px;font-size:13.5px;margin:3px 0"><span style="width:56px">'+g+'</span><div style="background:#4a90cf;height:12px;border-radius:3px;width:'+(gsum[g]/mx*100)+'%;min-width:2px"></div><b>'+gsum[g]+'</b></div>'}).join('');
  var top=R.dongStats.slice().sort(function(a,b){return b['빗물이용시설수']-a['빗물이용시설수']}).slice(0,10);
  $('topDongs').innerHTML=top.map(function(d){return '<li data-k="'+d['구']+'|'+d['동']+'"><span>'+d['구']+' '+d['동']+'</span><b>'+d['빗물이용시설수']+'곳</b></li>'}).join('');
  $('topDongs').querySelectorAll('li').forEach(function(li){li.onclick=function(){state.dong=li.dataset.k;state.gu='전체';renderMap();showDong()}});
  showDong();
}
function renderMapSel(){$('mapSvg').querySelectorAll('path[data-k]').forEach(function(p){p.setAttribute('class',p.dataset.k===state.dong?'sel':'')})}
function showDong(){
  var box=$('dongDetail');
  if(!state.dong){box.innerHTML='<h3>동을 선택하세요</h3><p class="note">지도의 동을 누르면 건축면적, 세대수, 시설 수가 표시됩니다.</p>';return}
  var s=dstat[state.dong];
  box.innerHTML='<h3>'+s['구']+' '+s['동']+'</h3><table><tr><td>빗물이용시설</td><td class="n"><b>'+s['빗물이용시설수']+'곳</b></td></tr><tr><td>건축면적 합계</td><td class="n">'+fmt(s['면적_m2'])+' ㎡</td></tr><tr><td>세대수</td><td class="n">'+fmt(s['세대수'])+' 세대</td></tr></table><p class="note">건축면적은 건축물대장 기준이며 실제 집수면적이 아닙니다.</p>';
}

/* ---------- 차트 ---------- */
function levelChart(){
  var D=DEMO.days,W=900,H=280,l=42,r=8,t=8,b=26,n=D.length,sc=state.sc;
  var x=function(i){return l+(W-l-r)*i/(n-1)},y=function(v){return t+(H-t-b)*(1-v)};
  var maxR=Math.max.apply(null,D.map(function(d){return d.rain_mm}));
  var s='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto">';
  [0,.25,.5,.75,1].forEach(function(v){s+='<line x1="'+l+'" x2="'+(W-r)+'" y1="'+y(v)+'" y2="'+y(v)+'" stroke="#e5ebf2"/><text x="'+(l-6)+'" y="'+(y(v)+4)+'" font-size="11" text-anchor="end" fill="#5f6b78">'+Math.round(v*100)+'%</text>'});
  D.forEach(function(d,i){var h=d.rain_mm/maxR*70;if(h>0)s+='<rect x="'+(x(i)-1)+'" y="'+t+'" width="2.2" height="'+h+'" fill="#b7d3ee"/>'});
  [5,6,7,8,9,10].forEach(function(m){var i=D.findIndex(function(d){return +d.date.slice(5,7)===m&&d.date.slice(8)==='01'});if(i>=0){s+='<line x1="'+x(i)+'" x2="'+x(i)+'" y1="'+t+'" y2="'+(H-b)+'" stroke="#eef2f7"/><text x="'+(x(i)+3)+'" y="'+(H-8)+'" font-size="11" fill="#5f6b78">'+m+'월</text>'}});
  function path(key,col,dash){var p='';D.forEach(function(d,i){p+=(i?'L':'M')+x(i).toFixed(1)+','+y(d[key]).toFixed(1)});return '<path d="'+p+'" fill="none" stroke="'+col+'" stroke-width="'+(dash?1.5:2.2)+'"'+(dash?' stroke-dasharray="4 3"':'')+'/>'}
  s+=path('normal_level','#9aa7b5',true);
  if(sc!=='normal')s+=path(sc+'_level',SCC[sc],false);else s+=path('normal_level',SCC.normal,false);
  if(sc==='stop'||sc==='half'){var fi=D.findIndex(function(d){return d.date==='2025-07-01'});s+='<line x1="'+x(fi)+'" x2="'+x(fi)+'" y1="'+t+'" y2="'+(H-b)+'" stroke="#c0392b" stroke-dasharray="5 3"/><text x="'+(x(fi)+4)+'" y="'+(t+86)+'" font-size="11.5" fill="#c0392b" font-weight="700">7/1 이상 시작</text>'}
  s+='</svg>';
  $('levelChart').innerHTML=s;
  $('selColor').style.background=SCC[sc];$('selName').textContent=SCN[sc]+' 시설 수위';
}
function monthChart(){
  var ms=DEMO.monthly[state.sc],st=monthStatus(state.sc),W=900,H=250,l=46,t=22,b=30;
  var mx=Math.max.apply(null,ms.map(function(m){return m.expected_m3}))*1.1;
  var bw=(W-l-10)/ms.length,y=function(v){return t+(H-t-b)*(1-v/mx)};
  var s='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto">';
  [0,.25,.5,.75,1].forEach(function(f){var v=mx*f;s+='<line x1="'+l+'" x2="'+(W-10)+'" y1="'+y(v)+'" y2="'+y(v)+'" stroke="#e5ebf2"/><text x="'+(l-6)+'" y="'+(y(v)+4)+'" font-size="11" text-anchor="end" fill="#5f6b78">'+Math.round(v)+'</text>'});
  ms.forEach(function(m,i){
    var x0=l+bw*i+bw*.14,w=bw*.34,col=m.alert?'#c0392b':'#2e75b6';
    s+='<rect x="'+x0+'" y="'+y(m.expected_m3)+'" width="'+w+'" height="'+(y(0)-y(m.expected_m3))+'" fill="#c9d3de"/>';
    s+='<rect x="'+(x0+w+3)+'" y="'+y(m.actual_m3)+'" width="'+w+'" height="'+Math.max(0,y(0)-y(m.actual_m3))+'" fill="'+col+'"/>';
    s+='<text x="'+(x0+w+3+w/2)+'" y="'+(y(m.actual_m3)-5)+'" font-size="11.5" text-anchor="middle" font-weight="700" fill="'+col+'">'+(m.ratio==null?'':Math.round(m.ratio*100)+'%')+'</text>';
    s+='<text x="'+(l+bw*i+bw/2)+'" y="'+(H-10)+'" font-size="12" text-anchor="middle" fill="#222b36">'+m.month+'월 · '+st[i]+'</text>';
  });
  s+='</svg>';$('monthChart').innerHTML=s;
}
function baseChart(){
  var d=SIM.baseline_error_false_alarm_pct,keys=Object.keys(d).filter(function(k){return k!=='설명'}),W=520,H=240,l=34,t=18,b=28,bw=(W-l)/keys.length;
  var y=function(v){return t+(H-t-b)*(1-v/100)};
  var s='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto">';
  [0,25,50,75,100].forEach(function(v){s+='<line x1="'+l+'" x2="'+W+'" y1="'+y(v)+'" y2="'+y(v)+'" stroke="#e5ebf2"/><text x="'+(l-5)+'" y="'+(y(v)+4)+'" font-size="10.5" text-anchor="end" fill="#5f6b78">'+v+'</text>'});
  keys.forEach(function(k,i){var v=d[k],x0=l+bw*i+bw*.15,w=bw*.7,col=(k==='0%')?'#2e8b57':'#d96c2b';
    s+='<rect x="'+x0+'" y="'+y(v)+'" width="'+w+'" height="'+(y(0)-y(v))+'" fill="'+col+'"/><text x="'+(x0+w/2)+'" y="'+(y(v)-4)+'" font-size="11" text-anchor="middle" font-weight="700">'+Math.round(v)+'%</text><text x="'+(x0+w/2)+'" y="'+(H-10)+'" font-size="11" text-anchor="middle" fill="#5f6b78">'+k+'</text>'});
  s+='</svg>';$('baseChart').innerHTML=s;
}
function rainChart(){
  var d=R.rain,W=900,H=220,l=40,t=16,b=26,bw=(W-l)/12,mx=Math.max.apply(null,d)*1.12,y=function(v){return t+(H-t-b)*(1-v/mx)};
  var s='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto">';
  [0,100,200,300,400].forEach(function(v){s+='<line x1="'+l+'" x2="'+W+'" y1="'+y(v)+'" y2="'+y(v)+'" stroke="#e5ebf2"/><text x="'+(l-5)+'" y="'+(y(v)+4)+'" font-size="10.5" text-anchor="end" fill="#5f6b78">'+v+'</text>'});
  d.forEach(function(v,i){var x0=l+bw*i+bw*.18,w=bw*.64;s+='<rect x="'+x0+'" y="'+y(v)+'" width="'+w+'" height="'+(y(0)-y(v))+'" fill="'+((i>=5&&i<=8)?'#2e75b6':'#9fc3e6')+'"/><text x="'+(x0+w/2)+'" y="'+(y(v)-4)+'" font-size="11" text-anchor="middle">'+v+'</text><text x="'+(x0+w/2)+'" y="'+(H-8)+'" font-size="11.5" text-anchor="middle" fill="#5f6b78">'+(i+1)+'월</text>'});
  s+='</svg>';$('rainChart').innerHTML=s;
}

/* ---------- 시설 상세 ---------- */
function renderDetail(){
  var m=DEMO.meta['시설'];
  $('facInfo').textContent='가상 시설: 지붕 '+fmt(m['지붕면적_m2'])+'㎡, 저류조 '+m['저류조_m3']+'㎥, 하루 평균 수요 '+m['하루평균수요_m3']+'㎥ (변동 계수 '+m['수요변동계수']+'). 기상청 ASOS 서울 2025년 강우로 계산한 값입니다.';
  levelChart();monthChart();
  var ms=DEMO.monthly[state.sc],st=monthStatus(state.sc);
  $('monthBadges').innerHTML=ms.map(function(x,i){return '<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid #eef2f7"><span>'+x.month+'월 <span class="note">'+(x.ratio==null?'':'기대치의 '+Math.round(x.ratio*100)+'%')+'</span></span>'+badge(st[i])+'</div>'}).join('');
  var al='';
  ms.forEach(function(x,i){
    if(st[i]==='정상'||st[i]==='—')return;
    var pct=Math.round(x.ratio*100),txt;
    if(x.ratio===0)txt=x.month+'월 사용 중단 의심: 사용량이 기대치의 0%입니다';
    else if(x.ratio<0.6)txt=x.month+'월 사용량 감소 의심: 사용량이 기대치의 '+pct+'%입니다';
    else txt=x.month+'월 사용량이 기대치의 '+pct+'%로 기준('+Math.round(THR*1000)/10+'%) 미만입니다';
    al+='<p>'+badge(st[i])+' '+txt+'</p>';
  });
  if(!al)al='<p>'+badge('정상')+' 이상 알림이 없습니다.</p>';
  if(state.sc==='leak1')al+='<p class="note">누수는 사용량만으로 탐지가 어렵습니다. 수위 추이를 함께 확인하세요.</p>';
  $('alerts').innerHTML=al;
}
function renderSimTable(){
  var t='<tr><th>경보 기준<br><span class="note" style="color:#cfdcec">(정상 월 하위 %)</span></th><th class="n">기준 비율</th><th class="n">정상 월 오경보</th><th class="n">2개월 연속 규칙 오경보</th><th class="n">사용 중단 탐지</th><th class="n">수요 반감 탐지</th><th class="n">누수 0.5㎥/일</th><th class="n">누수 1.0㎥/일</th></tr>';
  SIM.detection_by_threshold.forEach(function(d){t+='<tr'+(d.threshold_pct===5?' class="hl"':'')+'><td>'+d.threshold_pct+'%'+(d.threshold_pct===5?' (시연에 사용)':'')+'</td><td class="n">'+d.cutoff_ratio+'</td><td class="n">'+d.false_alarm_pct+'%</td><td class="n">'+d.false_alarm_2month_rule_pct+'%</td><td class="n">'+d.stop+'%</td><td class="n">'+d.half+'%</td><td class="n">'+d['leak_0.5']+'%</td><td class="n">'+d['leak_1.0']+'%</td></tr>'});
  $('detTable').innerHTML=t;
  $('simLimits').innerHTML=SIM.limits.map(function(x){return '<li>'+x+'</li>'}).join('')+'<li>탐지율은 난수에 따라 달라집니다(수요 반감 91~95%, 누수 약 23~41%).</li>';
  baseChart();
}

/* ---------- 법정 기록 ---------- */
function isoPlus3(s){var p=s.split('-');return (+p[0]+3)+'-'+p[1]+'-'+p[2]}
function renderRecord(){
  seg('recScSeg',scItems(),state.sc,setSc);
  seg('recMonthSeg',[5,6,7,8,9,10].map(function(m){return [m,m+'월']}),state.recMonth,function(m){state.recMonth=m;renderRecord()});
  var st=monthStatus(state.sc),mi=state.recMonth-5,sc=state.sc;
  var rows=DEMO.days.filter(function(d){return +d.date.slice(5,7)===state.recMonth});
  var t='<tr><th>일자</th><th class="n">빗물 사용량(㎥)</th><th class="n">저류조 수위(%)</th><th>이상 의심(월 판정)</th><th>점검 결과(입력)</th><th>청소 일자(입력)</th><th>보존 만료일</th></tr>';
  var sum=0;
  rows.forEach(function(d){var u=d[sc+'_use_m3'];sum+=u;t+='<tr><td>'+d.date+'</td><td class="n">'+u.toFixed(2)+'</td><td class="n">'+(d[sc+'_level']*100).toFixed(0)+'</td><td>'+badge(st[mi])+'</td><td><input type="text" style="width:120px"></td><td><input type="date"></td><td>'+isoPlus3(d.date)+'</td></tr>'});
  t+='<tr><td><b>합계</b></td><td class="n"><b>'+sum.toFixed(1)+'</b></td><td colspan="5" class="note">'+state.recMonth+'월 사용량 합계(㎥)</td></tr>';
  $('recTable').innerHTML=t;
}
function csv(){
  var st=monthStatus(state.sc),mi=state.recMonth-5,sc=state.sc;
  var rows=DEMO.days.filter(function(d){return +d.date.slice(5,7)===state.recMonth});
  var trs=$('recTable').querySelectorAll('tr');
  var out=[['일자','빗물 사용량(㎥)','저류조 수위(%)','이상 의심(월 판정)','점검 결과','청소 일자','보존 만료일']];
  rows.forEach(function(d,i){var tr=trs[i+1],ins=tr.querySelectorAll('input');out.push([d.date,d[sc+'_use_m3'],Math.round(d[sc+'_level']*100),st[mi],ins[0].value,ins[1].value,isoPlus3(d.date)])});
  var txt='﻿'+out.map(function(r){return r.map(function(c){return '"'+String(c).replace(/"/g,'""')+'"'}).join(',')}).join('\n');
  var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'text/csv;charset=utf-8'}));a.download='rainpoint_record_'+state.recMonth+'월_'+sc+'.csv';a.click();
}
function printTab(id){var el=$(id);el.classList.add('printing');window.print();setTimeout(function(){el.classList.remove('printing')},500)}

/* ---------- 점검표 ---------- */
function renderInspect(){
  seg('insScSeg',scItems(),state.sc,setSc);
  var ms=DEMO.monthly[state.sc],t='<tr><th>월</th><th class="n">빗물이용량(㎥)</th><th class="n">기대 사용량(㎥)</th><th>비고</th></tr>',tot=0;
  var st=monthStatus(state.sc);
  for(var m=1;m<=12;m++){
    var x=ms.filter(function(a){return a.month===m})[0];
    if(x){tot+=x.actual_m3;t+='<tr><td>'+m+'월</td><td class="n">'+fmt(x.actual_m3,1)+'</td><td class="n">'+fmt(x.expected_m3,1)+'</td><td>'+badge(st[m-5])+'</td></tr>'}
    else t+='<tr><td>'+m+'월</td><td class="n">—</td><td class="n">—</td><td class="note">시연 데이터 없음 (실제 운영에서는 센서가 자동 기록)</td></tr>';
  }
  t+='<tr><td><b>합계</b></td><td class="n"><b>'+fmt(tot,1)+'</b></td><td></td><td></td></tr>';
  $('insTable').innerHTML=t;
}

/* ---------- 운영 추천 ---------- */
function renderOp(){
  var area=+$('opArea').value||0,tank=+$('opTank').value||0,lv=Math.min(100,Math.max(0,+$('opLevel').value||0)),use=+$('opUse').value||0,rain=+$('opRain').value||0;
  $('opRainV').textContent=rain;
  var inflow=rain/1000*area*0.85,free=tank*(1-lv/100),stored=tank*lv/100,over=inflow-free;
  var h='<h3>판단</h3><div class="grid g3" style="margin:8px 0"><div class="card soft stat navy"><b>'+fmt(inflow,1)+'㎥</b><span>예상 유입량</span></div><div class="card soft stat navy"><b>'+fmt(free,1)+'㎥</b><span>여유 용량</span></div><div class="card soft stat navy"><b>'+fmt(stored,1)+'㎥</b><span>현재 저장량'+(use>0?' ('+fmt(stored/use,1)+'일치)':'')+'</span></div></div>';
  if(over<=0)h+='<div class="box ok"><b>예보 강수를 저류조가 모두 받을 수 있습니다.</b> 예상 유입량이 여유 용량 이하입니다.</div>';
  else h+='<div class="box warn"><b>예상 유입량이 여유 용량을 '+fmt(over,1)+'㎥ 초과합니다.</b> 넘치는 물은 하수로 흘러갑니다. 사전 방류로 여유를 만들 수 있지만, 시뮬레이션에서는 총 이용량을 늘리지 못했고 하수·침수 부담을 줄이는 효과로 설명해야 합니다.</div>';
  if(use===0)h+='<p class="note" style="margin-top:8px">하루 사용량이 0이면 빗물이 쓰이지 않는 상태입니다. 사용 중단 여부를 확인하세요.</p>';
  $('opOut').innerHTML=h;
}

/* ---------- 사업 구조 ---------- */
function renderBiz(){
  var s=F.seongnam_2026,o=F.owner_spend;
  $('caseCards').innerHTML=[
   ['성남시 2026 점검 용역','대상 '+s['대상']+', 계약 '+s['계약']+'. 시설당 '+s['시설당']+'.'],
   ['시설 소유자의 유지관리 지출','수원시 도서관사업소: '+o['수원시도서관사업소']],
   ['중수도 위탁관리 (DDP)',o['DDP']]
  ].map(function(c){return '<div class="card"><h3>'+c[0]+'</h3><p style="font-size:13.5px">'+c[1]+'</p></div>'}).join('');
  $('unknownList').innerHTML=['실측 자료와 고객 지불 의사·단가','2022년 전국 시설 수(3,429곳)의 원 출처','업무지침(2024.11) 원문','법정·비법정 시설 모두에 기록 의무가 적용되는지','서울시 설치비 지원의 센서 포함 여부','과태료 실제 부과 사례','국내 센서 실제 견적(원격검침 계량기 포함)','센서 오차·통신 두절을 반영한 오경보율'].map(function(x){return '<li>'+x+'</li>'}).join('');
}

/* ---------- ESG ---------- */
function renderEsg(){
  var E=R.esg,cols={E:'#2e8b57',S:'#2e75b6',G:'#1b3a5c'},names={E:'E 환경',S:'S 사회',G:'G 지배구조'};
  $('esgCards').innerHTML=['E','S','G'].map(function(k){return '<div class="card"><h3 style="color:'+cols[k]+'">'+names[k]+'</h3><p>'+E[k]['서비스']+'</p><p class="note"><b>KPI</b> '+E[k]['KPI'].join(' · ')+'</p></div>'}).join('');
  seg('esgScSeg',scItems(),state.sc,setSc);
  var ms=DEMO.monthly[state.sc],st=monthStatus(state.sc),act=0,exp=0;
  ms.forEach(function(m){act+=m.actual_m3;exp+=m.expected_m3});
  var stopDays=DEMO.days.filter(function(d){return d[state.sc+'_use_m3']<0.01}).length;
  var alerts=st.filter(function(s){return s!=='정상'&&s!=='—'}).length;
  var tiles=[[fmt(act,0)+'㎥','5~10월 사용량'],[Math.round(act/exp*100)+'%','기대 사용량 대비'],[stopDays+'일','가동 중단 일수(사용량 0)'],[alerts+'개월','이상 알림 월수']];
  $('esgStats').innerHTML=tiles.map(function(t,i){return '<div class="card stat'+(i>1?'':' navy')+'"><b>'+t[0]+'</b><span>'+t[1]+'</span></div>'}).join('');
  var t='<tr><th>단계</th><th>내용</th><th>지금 가능한가</th></tr>';
  E.credit_stages.forEach(function(c){t+='<tr><td>'+c.stage+'</td><td>'+c['내용']+'</td><td>'+c['상태']+'</td></tr>'});
  $('creditTable').innerHTML=t;
}

/* ---------- 지자체: 관할 시설 현황 (가상 시설) ---------- */
var FLEET=[
 ['가상 시설 01','강남구','법정','설치',1.00,'normal'],['가상 시설 02','서초구','법정','설치',0.97,'stop'],
 ['가상 시설 03','송파구','비법정','미설치',1.03,'normal'],['가상 시설 04','강동구','법정','설치',0.95,'half'],
 ['가상 시설 05','관악구','법정','설치',1.02,'normal'],['가상 시설 06','광진구','비법정','미설치',0.99,'normal'],
 ['가상 시설 07','동작구','법정','설치',1.05,'leak1'],['가상 시설 08','성동구','비법정','설치',0.98,'normal'],
 ['가상 시설 09','강남구','법정','미설치',1.01,'half'],['가상 시설 10','서초구','법정','설치',1.04,'normal'],
 ['가상 시설 11','송파구','비법정','설치',0.96,'normal'],['가상 시설 12','관악구','법정','설치',1.00,'stop']
];
function fleetRows(){
  return FLEET.map(function(f,i){
    var ms=DEMO.monthly[f[5]].map(function(m,j){
      var r=m.ratio==null?null:m.ratio*f[4]*(1+((i*7+j*3)%5-2)*0.01);
      return {ratio:r,alert:r!=null&&r<THR};
    });
    var st=ms.map(function(m,j){
      if(!m.alert)return '정상';
      var p=j>0&&ms[j-1].alert,n=j<ms.length-1&&ms[j+1].alert;return (p||n)?'이상':'의심';
    });
    return {name:f[0],gu:f[1],kind:f[2],meter:f[3],sc:f[5],ms:ms,st:st,last:st[st.length-1],ratio:ms[ms.length-1].ratio};
  });
}
var RANK={'이상':0,'의심':1,'정상':2};
function renderFleet(){
  var rows=fleetRows().sort(function(a,b){return RANK[a.last]-RANK[b.last]||a.ratio-b.ratio});
  var cnt=function(s){return rows.filter(function(r){return r.last===s}).length};
  var noMeter=rows.filter(function(r){return r.meter==='미설치'}).length;
  var tiles=[[rows.length+'곳','관할 시설(가상)'],[cnt('이상')+'곳','이상(두 달 연속)'],[cnt('의심')+'곳','의심(1개월)'],[noMeter+'곳','유량계 미설치(가정)']];
  $('fleetStats').innerHTML=tiles.map(function(t,i){return '<div class="card stat'+(i===1?' navy':'')+'"><b>'+t[0]+'</b><span>'+t[1]+'</span></div>'}).join('');
  seg('fleetSeg',[['전체','전체'],['이상·의심','이상·의심만']],state.fleetF,function(f){state.fleetF=f;renderFleet()});
  var t='<tr><th>우선순위</th><th>시설</th><th>구</th><th>구분(가정)</th><th>유량계</th><th>5~10월 상태</th><th class="n">10월 기대 대비</th><th>판정</th><th></th></tr>';
  var k=0;
  rows.forEach(function(r){
    if(state.fleetF!=='전체'&&r.last==='정상')return;k++;
    var sq=r.st.map(function(s,j){return '<i class="sq '+({'정상':'ok','의심':'warn','이상':'bad'}[s])+'" title="'+(j+5)+'월 '+s+'"></i>'}).join('');
    t+='<tr><td>'+k+'</td><td>'+r.name+'</td><td>'+r.gu+'</td><td>'+r.kind+'</td><td>'+r.meter+'</td><td>'+sq+'</td><td class="n">'+Math.round(r.ratio*100)+'%</td><td>'+badge(r.last)+'</td><td><button class="btn alt" style="padding:4px 10px;font-size:12.5px" data-fleet="'+r.sc+'">상세 보기</button></td></tr>';
  });
  $('fleetTable').innerHTML=t;
  $('fleetTable').querySelectorAll('[data-fleet]').forEach(function(b){b.onclick=function(){state.sc=b.dataset.fleet;renderSc();setRole('admin','detail')}});
}

/* ---------- 공통 갱신 ---------- */
function renderSc(){
  seg('scSeg',scItems(),state.sc,setSc);
  renderDetail();renderRecord();renderInspect();renderEsg();
}

/* ---------- 초기화 ---------- */
$('ptToggle').onchange=renderMap;
['opArea','opTank','opLevel','opUse','opRain'].forEach(function(id){$(id).oninput=renderOp});
$('csvBtn').onclick=csv;
$('printRec').onclick=function(){printTab('tab-record')};
$('printIns').onclick=function(){printTab('tab-inspect')};
buildNav();renderFleet();renderHome();renderMap();renderSc();renderSimTable();renderOp();rainChart();renderBiz();
window.addEventListener('hashchange',function(){go(location.hash.slice(1))});
go(location.hash.slice(1)||'home');
})();
