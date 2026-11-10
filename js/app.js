import {buildPurchase,buildMethod,buildSupport,isBeforeDeadline} from "./result.js";
const DRAFT_KEY="secondzReleaseNav:draft:v1";
const RESULT_KEY="secondzReleaseNav:result:v1";
const $=s=>document.querySelector(s);
let config,messages,answers={},step=0,view="home",lastResult=null,progressPercent=0;
const QUESTIONS=["budget","store","seven","fc","subs","priority"];
const isSmallBudget=budget=>budget==="zero"||budget==="300";
const defaultAnswers=()=>({store:null,seven:null,fc:null,subs:[],budget:"zero",priority:null});
const load=key=>{try{return JSON.parse(localStorage.getItem(key))}catch{return null}};
const save=(key,obj)=>{try{localStorage.setItem(key,JSON.stringify(obj));return true}catch{return false}};
const clear=key=>{try{localStorage.removeItem(key)}catch{}};
const escapeHtml=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const p=txt=>"<p>"+escapeHtml(txt)+"</p>";
const money=value=>Number(value).toLocaleString("ja-JP")+"円";
const deadline=()=>isBeforeDeadline(config.deadline);
const fcAvailable=()=>answers.fc===true&&deadline();
const steps=()=>QUESTIONS.filter(q=>{
  if(isSmallBudget(answers.budget))return q==="budget"||q==="subs";
  return (q!=="seven"||answers.store!=="yes")&&(q!=="priority"||["1800","3600"].includes(answers.budget));
});
const question=()=>steps()[step];
function frame(content){$("#app").innerHTML=content;window.scrollTo({top:0,behavior:"instant"})}
function home(){
view="home";
const draft=load(DRAFT_KEY);
const result=load(RESULT_KEY);
frame('<section class="card"><div class="intro"><img class="home-brand-logo" src="./img/new-release-nav-logo.svg?v=20261110-logo-fix2" width="440" height="121" style="display:block;width:100%;max-width:440px;height:auto;max-height:145px;object-fit:contain;margin:0 auto 12px" alt="タムごと新曲応援ナビ"><p class="home-release-copy">2/3 発売<br>「ザユウノメイ/本当のことを言うと」<br>を応援しよう！<br>予算や好みに応じた応援プランを<br>チェックできます！</p><div class="home-cautions"><p>※特典情報・受け取り・支払いについては必ず購入先で確認してください。</p><p>※特典内容は変更される可能性があります。<br>必ず購入前に公式サイトで確認をしてください。</p></div></div><div class="actions"><button class="btn" data-action="start">ナビをはじめる</button>'+
(draft&&draft.releaseId===config.releaseId?'<button class="btn secondary" data-action="resume">前回の続きから</button>':"")+
(result&&result.releaseId===config.releaseId?'<button class="btn secondary" data-action="saved">前回の結果を見る</button>':"")+
'</div><p class="small" style="text-align:center;margin-top:22px">回答はこの端末のブラウザにのみ保存します。</p></section>');
}
function start(resume=false){
const d=resume?load(DRAFT_KEY):null;
answers=d&&d.releaseId===config.releaseId?{...defaultAnswers(),...d.answers}:defaultAnswers();
// Older drafts stored their step in the former order; migrate by question name.
const oldOrder=["store","seven","fc","subs","budget","priority"];
const oldIndex=Number(d?.step)||0;
const oldQuestion=d?.version===1?oldOrder[Math.max(0,Math.min(oldIndex,oldOrder.length-1))]:null;
step=resume?(oldQuestion&&steps().includes(oldQuestion)?steps().indexOf(oldQuestion):Math.max(0,Math.min(oldIndex,steps().length-1))):0;
if(answers.budget===null)answers.budget="zero";
if(!["1800","3600"].includes(answers.budget))answers.priority=null;
if(isSmallBudget(answers.budget)){answers.store=null;answers.seven=null;answers.fc=null;}
answers.subs=answers.subs.filter(x=>x!=="none");
progressPercent=step/steps().length*100;
saveDraft();showQuestion();
}
function saveDraft(){save(DRAFT_KEY,{releaseId:config.releaseId,version:2,step,answers});}
function choice(name,value,label,checked,multiple=false){
return '<button type="button" class="choice '+(multiple?"checkbox ":"")+(checked?"active":"")+'" data-choice="'+escapeHtml(name)+'" data-value="'+escapeHtml(value)+'" aria-pressed="'+checked+'"><span>'+escapeHtml(label)+'</span></button>';
}
function showQuestion(fromPercent=null){
view="question";
const q=question(),total=steps().length,number=step+1;
let title="",description="",content="";
if(q==="store"){
title="家の近くにオリコン・Billboard JAPAN両方の集計対象になっているCD販売店はありますか？";
content=choice(q,"yes","ある",answers.store==="yes")+choice(q,"no","ない",answers.store==="no")+choice(q,"unknown","わからない",answers.store==="unknown");
}
if(q==="seven"){
title="家の近くにセブンイレブンはありますか？";
content=choice(q,"yes","ある",answers.seven==="yes")+choice(q,"no","ない",answers.seven==="no");
}
if(q==="fc"){
title="timeleszのファンクラブに加入していますか？";
content=choice(q,"yes","加入している",answers.fc===true)+choice(q,"no","加入していない",answers.fc===false);
}
if(q==="subs"){
title="加入しているサブスクを選択してください。";description="加入しているものをすべて選択して「次へ」を押してください。加入しているものがないときは、そのまま「次へ」を押してください。";
content=config.subscriptions.map(s=>choice(q,s.id,s.label,answers.subs.includes(s.id),true)).join("");
}
if(q==="budget"){
title="新曲の応援に使える予算は？";description="無理のない範囲で選んでね！";
const idx=Math.max(0,config.budgetOptions.findIndex(b=>b.id===answers.budget));
content='<div class="budget-value" id="budget-label">'+escapeHtml(config.budgetOptions[idx].label)+'</div><input class="range" id="budget-range" type="range" min="0" max="'+(config.budgetOptions.length-1)+'" step="1" value="'+idx+'" aria-label="予算を選択"><div class="range-label"><span>0円</span><span>もっと！</span></div>';
}
if(q==="priority"){
title="どれを優先したい？";description="あなたが特に楽しみたいことを1つ選んでね！";
content=config.priorities.filter(item=>item.id!=="variety"||fcAvailable()).map(item=>choice(q,item.id,item.label,answers.priority===item.id)).join("");
}
const enabled=isAnswered(q);
frame('<section class="card"><div class="progress" role="progressbar" aria-label="回答の進み具合" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+Math.round(progressPercent)+'"><span style="width:'+(fromPercent??progressPercent)+'%"></span></div><h1>'+escapeHtml(title)+'</h1>'+(description?'<p class="muted">'+escapeHtml(description)+'</p>':'')+'<div class="choices">'+content+'</div><div class="actions"><button class="btn" id="next" data-action="next" '+(!enabled?"disabled":"")+'>'+(step===total-1?"結果を見る":"次へ")+'</button><button class="btn ghost" data-action="back">'+(step===0?"トップに戻る":"ひとつ前に戻る")+'</button></div></section>');
if(fromPercent!==null){
  const bar=document.querySelector(".progress > span");
  if(bar){
    // Replaced screens otherwise reset CSS transitions: paint the old width first.
    bar.getBoundingClientRect();
    requestAnimationFrame(()=>{if(bar.isConnected)bar.style.width=progressPercent+"%";});
  }
}
}
function isAnswered(q){
if(q==="subs")return true;
if(q==="fc")return answers.fc!==null;
return answers[q]!==null&&answers[q]!==undefined;
}
function setAnswer(q,val){
if(q==="fc"){answers.fc=val==="yes";if(!fcAvailable()&&answers.priority==="variety")answers.priority=null}
else if(q==="subs"){
answers.subs=answers.subs.includes(val)?answers.subs.filter(s=>s!==val):[...answers.subs,val];
saveDraft();
document.querySelectorAll('[data-choice="subs"]').forEach(el=>{
const active=answers.subs.includes(el.dataset.value);
el.classList.toggle("active",active);
el.setAttribute("aria-pressed",String(active));
});
return;
}
else if(q==="store"){answers.store=val;if(val==="yes")answers.seven=null}
else {answers[q]=val}
saveDraft();showQuestion();
}
function next(){
if(!isAnswered(question()))return;
if(step+1>=steps().length){finish();return}
const from=progressPercent;
step++;progressPercent=step/steps().length*100;
saveDraft();showQuestion(from);
}
function back(){if(step===0){home();return}const from=progressPercent;step--;progressPercent=step/steps().length*100;saveDraft();showQuestion(from)}
function finish(){
const result={releaseId:config.releaseId,version:1,completedAt:new Date().toISOString(),answers:{...answers,subs:[...answers.subs]}};
save(RESULT_KEY,result);clear(DRAFT_KEY);lastResult=result;showResult();
}
function card(title,body,css=""){return '<div class="panel '+css+'">'+(title?'<h3>'+escapeHtml(title)+'</h3>':"")+body+'</div>'}
function listText(items){return "<ul>"+items.map(x=>"<li>"+escapeHtml(x)+"</li>").join("")+"</ul>"}
function productList(item){
const names={set:"3形態セット",a:"初回限定盤A",b:"初回限定盤B",regular:"通常盤",fc:"FC限定盤",digital:"デジタル配信「"+(config.release?.digitalTitle||"本当のことを言うと")+"」"};
const ids=item.productIds||[];
if(!ids.length)return '<p class="edition-name">'+escapeHtml(item.title)+'</p>';
return '<ul class="product-list">'+ids.map(id=>id==="set"
?'<li><strong>3形態セット</strong><ul><li>初回限定盤A</li><li>初回限定盤B</li><li>通常盤</li></ul></li>'
:'<li>'+escapeHtml(names[id]||id)+'</li>').join("")+'</ul>';
}
function purchaseMarkup(data){
const cdTitle=config.release?.cdTitle||"ザユウノメイ／本当のことを言うと";
if(!data.items.length)return card("購入以外の応援を楽しもう！",p(messages.purchase.zero),"highlight");
const is1800=answers.budget==="1800";
const mainDetails=item=>{
const digital=item.productIds?.length===1&&item.productIds[0]==="digital";
return '<div class="product-heading">'+
(digital?'<span class="product-name">Digital shingle</span><strong class="edition-name">「'+escapeHtml(config.release?.digitalTitle||"本当のことを言うと")+'」</strong>':
'<span class="product-name">'+escapeHtml(cdTitle)+'</span>'+productList(item))+
'</div>'+(item.description?p(item.description):"")+'<div class="price">'+money(item.price)+'</div>';
};
let html="";
data.items.forEach((item,i)=>{
const heading=is1800?(i===0?"第一候補":"第二候補"):(i===0?"":"もうひとつの候補");
html+=card(heading,mainDetails(item),i===0?"highlight purchase-feature":"");
});
if(data.secondaries?.length){
const secondTitle=is1800?"第二候補":"もう1枚はここから選ぼう！";
html+=card(secondTitle,data.secondaries.map(alt=>{
const price=alt.price??(alt.total-data.items[0].price);
const detail=is1800?'<p class="option-description">'+escapeHtml(alt.description||"")+'</p><div class="detail">'+money(price)+'</div>':'<div class="detail">合計 '+money(alt.total)+'</div>';
return '<div class="option-card">'+
(is1800?'':'<span class="product-name">'+escapeHtml(cdTitle)+'</span>')+
'<strong class="edition-name">'+escapeHtml(alt.label)+'</strong>'+detail+'</div>';
}).join(""));
}
if(data.notes?.length)html+='<div class="note">'+data.notes.map(x=>'<p>'+escapeHtml(x)+'</p>').join("")+'</div>';
return html;
}
function addOnMarkup(data){
if(!data.extra?.length)return "";
const groupName=part=>{
const k=part.key||"";
if(["regularAddEdition","regularSet","editionAddRegular","editionSet","threeSet3600","threeSetSongs3600","threeSetBonus","consider","fc5000","discs","digitalAdd1400","editionAdd300"].includes(k))return "CDでもっと応援";
if(["digital5000","iphoneGift","digitalAdd1400Budget"].includes(k))return "デジタル配信で応援";
if(["spotifyPremium"].includes(k))return "サブスク・Stationheadで応援";
if(["joinFc","fcAdd1400Budget"].includes(k))return "ファンクラブで応援";
if(["storeChecker"].includes(k))return "店舗で応援";
return "その他の応援";
};
const links={digital:config.links.digital,fcSpecial:config.links.fcSpecial,joinFc:config.links.joinFc,spotifyPremium:config.links.spotifyPremium,storeList:config.links.storeList};
const names={digital:"購入はこちら！",fcSpecial:"購入はこちら！",joinFc:"FC加入ページはこちら！",spotifyPremium:"Spotify Premiumはこちら！",storeList:"TSZ在庫チェッカー"};
const groups=new Map();
data.extra.forEach(part=>{
const label=groupName(part);
if(!groups.has(label))groups.set(label,[]);
groups.get(label).push(part);
});
const content=Array.from(groups.entries()).map(([label,items])=>
'<section class="add-on-group"><h4 class="add-on-group-title">'+escapeHtml(label)+'</h4>'+
items.map(part=>{
const text=typeof part==="string"?part:part.text;
const link=typeof part==="string"?null:part.link;
const attribution=part.credit?'<p class="detail">作成・運営：chino様<br>※外部サイトに移動します</p>':"";
return '<div class="add-on-item"><p>'+escapeHtml(text).replace(/\n/g,"<br>")+'</p>'+(link&&links[link]?'<div class="addon-link">'+linkFor(names[link],links[link])+'</div>':"")+attribution+'</div>';
}).join("")+'</section>').join("");
return '<div class="add-on"><details class="add-on-details"><summary>'+escapeHtml(messages.purchase.extraTitle)+'</summary><div class="add-on-body">'+content+'</div></details></div>';
}
function linkFor(name,url){return '<a href="'+escapeHtml(url)+'" target="_blank" rel="noopener noreferrer">'+escapeHtml(name)+' ↗</a>'}
function storeFinderMarkup(){
const finder=config.storeFinder||{};
return '<div class="store-finder"><p>'+escapeHtml(messages.method.storeFinder||"対象店舗をチェックしよう！")+'</p>'+linkFor(finder.name||"TSZ在庫チェッカー",config.links.storeList)+'<p class="detail">'+escapeHtml(finder.credit||"作成・運営：chino様")+'</p><p class="detail">'+escapeHtml(finder.notice||"※外部サイトに移動します")+'</p></div>';
}
function deliveryDetails(kind){
const info=config.delivery?.[kind];if(!info)return "";
const title=kind==="tower"?"タワレコオンライン":"セブンネット";
const url=kind==="tower"?config.links.tower:config.links.seven;
return '<div class="delivery-item"><h4>'+escapeHtml(title)+'</h4><p>'+linkFor(title+"を開く",url)+'</p>'+
(kind==="tower"?'<p class="tag">フラゲ対象</p><p class="tag">セブンイレブン受取送料無料</p>':'<p class="tag">セブンイレブン受取送料無料</p>')+
'<p class="detail">'+escapeHtml(info.home)+'</p><p class="detail">'+escapeHtml(info.seven)+'</p>'+
(info.other?'<p class="detail">'+escapeHtml(info.other)+'</p>':'')+
(info.caution?'<p class="detail">'+escapeHtml(info.caution)+'</p>':'')+'</div>';
}
function sevenMarkup(){
const m=messages.method;
return card(m.sevenTitle,
'<p class="seven-info">'+escapeHtml(m.sevenInfo)+'</p>'+
'<div class="site-links">'+linkFor("タワレコオンライン",config.links.tower)+linkFor("セブンネット",config.links.seven)+'</div>');
}
function onlineMarkup(showSeven){
const m=messages.method;
let html=card(m.onlineTitle,listText([m.onlineCheck,m.onlinePickup,m.onlineSet])+'<p class="subhead">'+escapeHtml(m.onlineStores)+'</p><div class="site-links">'+[
["楽天ブックス",config.links.rakuten],["HMV",config.links.hmv],["タワレコオンライン",config.links.tower],["セブンネット",config.links.seven]].map(x=>linkFor(...x)).join("")+"</div>");
if(showSeven)html+=sevenMarkup();
return html;
}
function storeMarkup(){
const m=messages.method;
return card(m.storeTitle,listText([m.storeBenefit1,m.storeBenefit2,m.storePickup])+p(m.storeLink)+storeFinderMarkup());
}
function methodMarkup(data,print=false){
let html="";
if(isSmallBudget(answers.budget)){
  if(data.digitalMethod)return card(messages.method.digitalHeading,
    p(messages.method.digitalMethod)+'<div class="site-links">'+linkFor("予約・購入ページ",config.links.digital)+'</div>');
  return "";
}
if(answers.store==="yes")html=storeMarkup();
else if(answers.store==="no")html=onlineMarkup(answers.seven==="yes");
else{
html=card(messages.method.unknownTitle,p(messages.method.unknownNote)+storeFinderMarkup());
if(print){
html+=card("対象店舗があった場合",storeMarkup())+card("対象店舗がなかった場合",onlineMarkup(answers.seven==="yes"));
}else{
html+='<h3 class="store-toggle-heading screen-only">オリコン・ビルボ加盟店はあった？</h3><div class="store-toggle screen-only" role="group" aria-label="対象店舗の検索結果"><button type="button" class="btn secondary" data-store-toggle="yes" aria-expanded="false">あった</button><button type="button" class="btn secondary" data-store-toggle="no" aria-expanded="false">なかった</button></div>';
html+='<div id="store-expand" class="store-expand screen-only" aria-live="polite"></div>';
html+='<div class="print-only">'+card("対象店舗があった場合",storeMarkup())+card("対象店舗がなかった場合",onlineMarkup(answers.seven==="yes"))+"</div>";
}
}
if(data.fcMethod)html+=card(messages.method.fcHeading,
p(messages.method.fcMethod)+
'<div class="site-links">'+linkFor("ファミクラストアオンライン",config.links.fc)+'</div>'+
'<p class="subhead">FC盤特設ページはこちら！</p>'+
'<div class="site-links">'+linkFor("FC限定盤 特設ページ",config.links.fcSpecial)+'</div>'+
p(messages.method.fcInstructions)+'<p class="fc-card-warning">※'+escapeHtml(messages.method.fcCardWarning)+'</p>'+
'<div class="fc-deadline">'+escapeHtml(messages.method.fcDeadlineStrong)+'</div>');
if(data.digitalMethod)html+=card(messages.method.digitalHeading,
p(messages.method.digitalMethod)+'<div class="site-links">'+linkFor("予約・購入ページ",config.links.digital)+'</div>');
return html;
}

function supportMarkup(data,a){
const selected=new Set(a.subs||[]);
const appMap=[
  ["spotify","Spotify Premium"],["prime","Amazon Music Prime"],["unlimited","Amazon Music Unlimited"],
  ["line","LINE MUSIC"],["youtubeMusic","YouTube Music Premium"],["apple","Apple Music"]
];
const music=appMap.filter(([id])=>selected.has(id)&&!(id==="prime"&&selected.has("unlimited")));
const heading='<p class="stream-intro">11/25〜先行配信される <strong>「'+escapeHtml(config.release?.digitalTitle||"本当のことを言うと")+'」</strong> をたくさん聴こう！</p>';
const buttons=music.map(([id,name])=>linkFor(name+"を開く",config.links.musicApps[id])).join("");
const musicBlock=heading+(music.length?'<div class="app-link-grid">'+buttons+'</div>':p(messages.support.freeSpotify)+'<div class="app-link-grid">'+linkFor("Spotifyを開く",config.links.musicApps.spotify)+'</div>');
let html=card("新曲をサブスクで応援！",musicBlock,"support-music");
if(data.stationhead){
html+=card("ステヘにチャレンジしてみない？",
p(messages.support.stationhead)+
'<p class="detail">対象：Apple Music有料会員またはSpotify Premium会員・18歳以上</p>'+
'<div class="site-links">'+linkFor("設定方法を見る",config.links.stationheadGuide)+'</div>'+
'<div class="stationhead-device-links"><a href="'+escapeHtml(config.links.stationheadIOS)+'" target="_blank" rel="noopener noreferrer">iPhone</a><a href="'+escapeHtml(config.links.stationheadAndroid)+'" target="_blank" rel="noopener noreferrer">Android</a></div>'+
'<p class="subhead">登録ができたら以下のリンクをタップ！</p>'+
'<div class="site-links">'+linkFor("secondzチャンネル",config.links.stationhead)+'</div>');
}
if(data.unext){
html+=card("U-NEXT会員の方へ！",p(messages.support.unext)+
'<div class="site-links">'+linkFor("詳しくはこちら",config.links.unextCampaign)+'</div>');
}
html+=card("みんなでできる応援",
listText([messages.support.youtube,messages.support.sns,messages.support.request])+
'<div class="app-link-grid">'+linkFor("タムごとDailyで応援する",config.links.daily)+'</div>');
return html;
}
function section(index,title,body){return '<section class="section"><h2 class="section-title"><span class="number">'+index+'</span>'+escapeHtml(title)+'</h2>'+body+'</section>'}
function resultSummary(a){
const store={yes:"近くに対象店舗あり",no:"近くに対象店舗なし",unknown:"対象店舗は未確認"}[a.store]||"未回答";
const subs=(a.subs||[]).map(id=>config.subscriptions.find(s=>s.id===id)?.label).filter(Boolean);
const priority=config.priorities.find(x=>x.id===a.priority)?.label;
const entries=[["予算",config.budgetOptions.find(x=>x.id===a.budget)?.label||"0円"]];
if(!isSmallBudget(a.budget))entries.push(["対象店舗",store]);
if(!isSmallBudget(a.budget)&&a.store!=="yes"&&a.seven!==null)entries.push(["近くのセブンイレブン",a.seven==="yes"?"あり":"なし"]);
if(!isSmallBudget(a.budget))entries.push(["ファンクラブ",a.fc?"加入済み":"未加入"]);
entries.push(["加入中のサブスク",subs.length?subs.join("・"):"なし"]);
if(priority)entries.push(["特に優先したいこと",priority]);
return '<div class="answer-summary"><details class="answer-summary-details"><summary>あなたの回答</summary><dl>'+entries.map(([k,v])=>'<div class="answer-item"><dt>'+escapeHtml(k)+'</dt><dd>'+escapeHtml(v)+'</dd></div>').join("")+'</dl><button class="btn answer-restart screen-only" type="button" data-action="restart">もう一度回答する</button></details></div>';
}
function resultContent(result,print=false){
const a=result.answers;
const data={purchase:buildPurchase(a,config,messages),method:buildMethod(a,config),support:buildSupport(a,messages)};
const oldAnswers=answers;answers=a;
const html='<div class="result-meta"><p class="pill">MY NEW RELEASE SUPPORT PLAN</p><h1>あなたの新曲応援プラン</h1><p class="release-title">'+escapeHtml(config.release?.cdTitle||"ザユウノメイ／本当のことを言うと")+'</p></div>'+resultSummary(a)+
section("01","これを買うのがおすすめ！",purchaseMarkup(data.purchase))+
(a.budget==="zero"?"":section("02","こんな買い方がおすすめ！",methodMarkup(data.method,print)))+
section(a.budget==="zero"?"02":"03",messages.headings.support,supportMarkup(data.support,a)+addOnMarkup(data.purchase))+
'<hr class="divider"><p class="small" style="text-align:center">非公式ファンツール｜タムごとDaily<br>集計・購入条件は必ず公式・販売店の最新情報をご確認ください。</p>';
answers=oldAnswers;return html;
}
function compactResultContent(result){
const a=result.answers;
const purchase=buildPurchase(a,config,messages);
const support=buildSupport(a,messages);
const budget=config.budgetOptions.find(x=>x.id===a.budget)?.label||"0円";
const cdTitle=config.release?.cdTitle||"ザユウノメイ／本当のことを言うと";
const shopSummary=a.store==="yes"?"近くの対象店舗で早めに予約・購入しよう！":
a.store==="no"?"集計対象の通販サイトで早めに予約・購入しよう！":
"対象店舗を調べて、店舗か通販で予約・購入しよう！";
const is1800=a.budget==="1800";
const purchaseCards=purchase.items.length?purchase.items.map((item,i)=>{
const digital=item.productIds?.length===1&&item.productIds[0]==="digital";
return '<div class="compact-product">'+
(is1800?'<p class="compact-choice-title">'+(i===0?"第一候補":"第二候補")+'</p>':"")+
'<p class="compact-cd-title">'+escapeHtml(digital?"Digital shingle":cdTitle)+'</p>'+
(digital?'<p class="compact-digital-title">「'+escapeHtml(config.release?.digitalTitle||"本当のことを言うと")+'」</p>':productList(item))+
(item.description?'<p class="compact-description">'+escapeHtml(item.description)+'</p>':"")+
'<p class="compact-price">'+money(item.price)+'</p>'+
(is1800&&purchase.secondaries?.length?'<div class="compact-secondaries"><p class="compact-choice-title">第二候補</p>'+purchase.secondaries.map(x=>'<p>'+escapeHtml(x.label)+'（'+money(x.price)+'）</p>').join("")+'</div>':"")+
'</div>';
}).join("") :'<p>購入なしでもできる応援を楽しもう！</p>';
const optional=!is1800&&purchase.secondaries?.length?
'<div class="compact-alternatives-card"><p class="compact-subheading">もう1枚の候補</p><ul class="compact-alternatives">'+
purchase.secondaries.map(x=>'<li>'+escapeHtml(x.label)+'（合計 '+money(x.total)+'）</li>').join("")+'</ul></div>':"";
const methods=isSmallBudget(a.budget)?(a.budget==="300"?["デジタル配信「本当のことを言うと」を予約・購入しよう！"]:[]):[shopSummary];
if(!isSmallBudget(a.budget)&&a.store!=="yes"&&a.seven==="yes")methods.push("対象商品はセブンイレブン受取もチェック（送料無料）。");
if(purchase.items.some(item=>item.productIds?.includes("set")))methods.push("3形態の特典付きセットは専用の商品ページで購入しよう！");
if(purchase.items.some(item=>item.productIds?.includes("fc")))methods.push("FC限定盤は12/21 23:59までに予約しよう！");
if(purchase.items.some(item=>item.productIds?.includes("digital")))methods.push("デジタル配信「本当のことを言うと」もチェック！");
const selected=(a.subs||[]).filter(id=>id!=="unext").map(id=>config.subscriptions.find(x=>x.id===id)?.label).filter(Boolean);
const music=selected.length?selected.join("・")+"で新曲を聴こう！":"Spotifyの無料プランでも新曲を聴こう！";
const supports=[music];
if(support.stationhead)supports.push("Stationheadのsecondzチャンネルにも参加しよう！");
if(support.unext)supports.push("U-NEXT会員はUSEN推し活リクエストを追加でできるよ！");
supports.push("YouTubeでMVを視聴・高評価しよう！","SNSでの拡散やラジオ・推し活リクエストも応援に！");
return '<div class="compact-header"><p class="pill">タムごと新曲応援ナビ</p><h1>あなたの新曲応援プラン</h1><p>予算：'+escapeHtml(budget)+'</p></div>'+
'<section class="compact-section"><h2>01｜これを買うのがおすすめ！</h2>'+purchaseCards+optional+'</section>'+
(methods.length?'<section class="compact-section"><h2>02｜こんな買い方がおすすめ！</h2>'+listText(methods)+'</section>':"")+
'<section class="compact-section"><h2>'+(methods.length?"03":"02")+'｜他にこんなこともできるよ！</h2>'+listText(supports)+'</section>'+
'<p class="compact-footer">詳細・購入リンクはタムごと新曲応援ナビで確認してね！<br>非公式ファンツール｜購入条件・期限は公式情報をご確認ください。</p>';
}
function showResult(){
view="result";
const result=lastResult||load(RESULT_KEY);if(!result||result.releaseId!==config.releaseId){home();return}
lastResult=result;
frame('<div id="result-view" class="card">'+resultContent(result)+'</div><section class="card footer-actions"><div class="actions"><button class="btn" data-action="export">画像で保存</button><button class="btn secondary" data-action="home">トップへ戻る</button><button class="btn ghost" data-action="restart">もう一度診断する</button></div><p class="small">診断結果はこの端末に保存済み。再診断が完了すると上書きされます。</p></section>');
}
async function exportImage(button){
const result=lastResult||load(RESULT_KEY);if(!result)return;
button.disabled=true;button.textContent="画像を作成中…";
const node=document.createElement("div");
node.className="image-canvas";
node.id="result-image-export";
node.innerHTML=compactResultContent(result);
document.body.appendChild(node);
try{
await document.fonts?.ready;
const {toBlob}=await import("https://cdn.jsdelivr.net/npm/html-to-image@1.11.13/+esm");
const blob=await toBlob(node,{backgroundColor:"#ffffff",pixelRatio:1,cacheBust:true,style:{position:"static",left:"auto",top:"auto"}});
if(!blob)throw Error("PNGの作成に失敗しました");
const filename="新曲応援プラン_簡易版_"+new Date().toLocaleDateString("sv-SE",{timeZone:"Asia/Tokyo"}).replaceAll("-","")+".png";
const file=new File([blob],filename,{type:"image/png"});
if(navigator.canShare?.({files:[file]})&&navigator.share){
try{await navigator.share({files:[file],title:"新曲応援プラン"});return}catch(e){if(e.name==="AbortError")return}
}
const url=URL.createObjectURL(blob);
const a=document.createElement("a");a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
}catch(err){console.error(err);alert("画像の保存ができませんでした。通信環境を確認して再度お試しください。");}finally{node.remove();button.disabled=false;button.textContent="画像で保存"}
}
document.addEventListener("click",event=>{
const toggle=event.target.closest("[data-store-toggle]");
if(toggle){
const active=toggle.getAttribute("aria-expanded")==="true";
document.querySelectorAll("[data-store-toggle]").forEach(btn=>{
const selected=!active&&btn===toggle;
btn.setAttribute("aria-expanded",String(selected));
btn.classList.toggle("active",selected);
});
const panel=document.getElementById("store-expand");
if(panel)panel.innerHTML=active?"":toggle.dataset.storeToggle==="yes"?storeMarkup():onlineMarkup((lastResult?.answers?.seven??answers.seven)==="yes");
return;
}
const choiceEl=event.target.closest("[data-choice]");
if(choiceEl){setAnswer(choiceEl.dataset.choice,choiceEl.dataset.value);return}
const button=event.target.closest("[data-action]");if(!button)return;
switch(button.dataset.action){
case "start":case "restart":start();break;
case "resume":start(true);break;
case "next":next();break;
case "back":back();break;
case "saved":lastResult=load(RESULT_KEY);showResult();break;
case "home":home();break;
case "export":exportImage(button);break;
}
});
document.addEventListener("input",event=>{
if(event.target.id==="budget-range"){
const id=config.budgetOptions[Number(event.target.value)].id;
answers.budget=id;if(!["1800","3600"].includes(id))answers.priority=null;
if(isSmallBudget(id)){answers.store=null;answers.seven=null;answers.fc=null;}
saveDraft();$("#budget-label").textContent=config.budgetOptions[Number(event.target.value)].label;
$("#next").disabled=false;
// Keep the progress bar still until the user presses Next.
}
});
async function init(){
try{
const responses=await Promise.all([fetch("./data/config.json",{cache:"no-store"}),fetch("./data/messages.json",{cache:"no-store"})]);
if(responses.some(r=>!r.ok))throw Error("データの取得に失敗しました");
[config,messages]=await Promise.all(responses.map(r=>r.json()));
home();
}catch(err){console.error(err);frame('<section class="card"><h1>読み込みに失敗しました</h1><p class="loading-error">通信状況を確認してページを再読み込みしてください。</p><button class="btn" onclick="location.reload()">再読み込み</button></section>')}
}
init();