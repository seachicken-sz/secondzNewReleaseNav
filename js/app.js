import {buildPurchase,buildMethod,buildSupport,isBeforeDeadline} from "./result.js?v=20261111-all-budget-addon";
import {createPurchaseFlow} from "./planner.js?v=20261112-extra-support-v18";
import {supportCopy,selectedMusic,supportImageSections} from "./supportContent.js?v=20261112-v1";
import {IMAGE_FOOTER_LINE1,IMAGE_FOOTER_LINE2} from "./imageFooter.js?v=20261112-v1";
const DRAFT_KEY="secondzReleaseNav:draft:v1";
const RESULT_KEY="secondzReleaseNav:result:v1";
const $=s=>document.querySelector(s);
let config,messages,answers={},step=0,view="home",lastResult=null,progressPercent=0,planner=null;
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
frame('<section class="card"><div class="intro"><img class="home-brand-logo" src="./img/new-release-nav-logo.svg?v=20261110-logo-fix2" width="440" height="121" style="display:block;width:100%;max-width:440px;height:auto;max-height:145px;object-fit:contain;margin:0 auto 12px" alt="タムごと新曲応援ナビ"><p class="home-release-copy">2/3 発売<br><strong class="home-release-emphasis" style="color:#A148AC">「ザユウノメイ/本当のことを言うと」</strong><br>を応援しよう！<br>予算や好みに応じた応援プランを<br>チェックできます！</p><div class="home-cautions"><p>※特典情報・受け取り・支払いについては必ず購入先で確認してください。</p><p>※特典内容は変更される可能性があります。<br>必ず購入前に公式サイトで確認をしてください。</p></div></div><div class="pf-home-choices"><article class="pf-home-choice"><h2>特典から考える！</h2><p>収録曲や映像特典を比較して、欲しい盤を見つけよう！</p><button class="btn" data-action="plan-compare">特典を比較する</button></article><article class="pf-home-choice"><h2>枚数から考える！</h2><p>CDの種類と枚数を選んで、合計金額をチェック！</p><button class="btn" data-action="plan-create">購入プランを作る</button></article><article class="pf-home-choice"><h2>予算から考える！</h2><p>予算に合わせておすすめのCDや応援方法をチェック！</p><button class="btn" data-action="start">始める</button></article></div><div class="actions">'+
(draft&&draft.releaseId===config.releaseId?'<button class="btn secondary" data-action="resume">前回の続きから</button>':"")+
(result&&result.releaseId===config.releaseId?'<button class="btn secondary" data-action="saved">前回の結果を見る</button>':"")+

'</div><p class="small" style="text-align:center;margin-top:22px">回答内容はご利用の端末に保存し、送信は行いません。</p></section>');
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
const editionDetails={
regular:{intro:"カップリングが2曲入ってるよ！",sections:[{title:"収録内容（CDのみ）",items:[["ザユウノメイ"],["本当のことを言うと"],["45",true],["Still us",true]]}]},
a:{intro:"ダンスを楽しみたいならこれ！",sections:[
{title:"CD",items:[["ザユウノメイ"],["本当のことを言うと"],["大怪盗",true]]},
{title:"DVD or Blu-ray",items:[["ザユウノメイ MV"],["ザユウノメイ MV Dance edit ver.",true],["ザユウノメイ MV撮影メイキング"],["ジャケット撮影メイキング"]]}]},
b:{intro:"ビジュアルをじっくり楽しむならこれ！",sections:[
{title:"CD",items:[["ザユウノメイ"],["本当のことを言うと"],["Avocado",true]]},
{title:"DVD or Blu-ray",items:[["本当のことを言うと MV"],["本当のことを言うと MV メンバーソロver.7種",true],["本当のことを言うと MV撮影メイキング"]]}]},
fc:{intro:"わちゃわちゃを楽しみたいならFC限定盤！",sections:[
{title:"CD",items:[["ザユウノメイ"],["本当のことを言うと"]]},
{title:"DVD or Blu-ray",items:[["バラエティ映像「人生は一度きり！timeleszミッションすごろく！」",true]]},
{title:"その他",items:[["メッセージ入りメンバーフォトカード（7種） 直筆メッセージ＋付属の二次元コードからメンバーコメント動画も！",true]]}]}
};
const editionLabels={regular:"通常盤",a:"初回限定盤A",b:"初回限定盤B",fc:"FC限定盤"};
function editionContents(id){
const d=editionDetails[id];if(!d)return "";
return '<div class="edition-details"><p class="edition-intro">'+escapeHtml(d.intro)+'</p>'+(id==="regular"?"":'<p class="edition-contents-label">収録内容</p>')+
d.sections.map(section=>'<div class="edition-section"><h4>'+escapeHtml(section.title)+'</h4><ul>'+section.items.map(([name,emphasis])=>
'<li'+(emphasis?' class="edition-emphasis"':'')+'>'+escapeHtml(name)+'</li>').join("")+'</ul></div>').join("")+'</div>';
}
function productContents(item){
const ids=item.productIds||[];
const single=ids.length===1?ids[0]:null;
if(single&&editionDetails[single])return editionContents(single);
if(ids.includes("set")){
return '<div class="edition-set-contents">'+["a","b","regular"].map(id=>
'<details class="edition-set-item"><summary>'+editionLabels[id]+'の収録内容</summary>'+editionContents(id)+'</details>').join("")+'</div>';
}
return ids.includes("fc")?editionContents("fc"):"";
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
'</div>'+(productContents(item)||(item.description?p(item.description):""))+'<div class="price">'+money(item.price)+'</div>';
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
const feature=editionDetails[alt.id]?.intro||alt.description||"";
const detail=is1800?editionContents(alt.id)+'<div class="detail">'+money(price)+'</div>':editionContents(alt.id)+'<div class="detail">合計 '+money(alt.total)+'</div>';
return '<details class="result-secondary-option"><summary><span class="result-secondary-label"><strong class="edition-name">'+escapeHtml(alt.label)+'</strong>'+(feature?'<span class="result-secondary-feature">'+escapeHtml(feature)+'</span>':"")+'</span></summary><div class="result-secondary-body">'+detail+'</div></details>';
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
return '<div class="store-finder"><p>'+escapeHtml(messages.method.storeFinder||"近所のオリコン・ビルボ加盟店を探してみよう！")+'</p>'+linkFor(finder.name||"TSZ在庫チェッカー",config.links.storeList)+'<p class="detail">'+escapeHtml(finder.credit||"作成・運営：chino様")+'</p><p class="detail">'+escapeHtml(finder.notice||"※外部サイトに移動します")+'</p></div>';
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
'<p class="seven-info">'+escapeHtml(m.sevenInfo)+'</p>'+ '<p class="seven-caution" style="color:#777;font-weight:700">※フラゲするためには予約の締切があることも！確認して早めに予約しよう！</p>'+
'<div class="site-links">'+linkFor("タワレコオンライン",config.links.tower)+linkFor("セブンネット",config.links.seven)+'</div>');
}
function onlineMarkup(showSeven){
const m=messages.method;
let html=card(m.onlineTitle,listText([m.onlineCheck,m.onlinePickup,m.onlineSet])+'<p class="subhead">'+escapeHtml(m.onlineStores)+'</p><div class="site-links">'+[
["楽天ブックス",config.links.rakuten],["HMV",config.links.hmv],["タワレコオンライン",config.links.tower],["セブンネット",config.links.seven]].map(x=>linkFor(...x)).join("")+"</div>");
if(showSeven)html+=sevenMarkup();
return html;
}
function storeMarkup(showFinder=false){
const m=messages.method;
return card(m.storeTitle,listText([m.storeBenefit1,m.storeBenefit2,m.storePickup])+
(showFinder?'<div class="store-finder"><p>対象店舗の確認や在庫の確認・共有にはこのサイトが便利だよ！</p>'+linkFor(config.storeFinder?.name||"TSZ在庫チェッカー",config.links.storeList)+'<p class="detail">'+escapeHtml(config.storeFinder?.credit||"作成・運営：chino様")+'</p><p class="detail">'+escapeHtml(config.storeFinder?.notice||"※外部サイトに移動します")+'</p></div>':""));
}
function methodMarkup(data,print=false){
let html="";
if(isSmallBudget(answers.budget)){
  if(data.digitalMethod)return card(messages.method.digitalHeading,
    supportParagraph(supportText().digital)+supportParagraph(messages.method.digitalMethod)+'<div class="site-links">'+linkFor("予約・購入ページ",config.links.digital)+'</div>');
  return "";
}
if(answers.store==="yes")html=storeMarkup(true);
else if(answers.store==="no")html=onlineMarkup(answers.seven==="yes");
else{
html=card(messages.method.unknownTitle,storeFinderMarkup());
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
supportParagraph(supportText().digital)+supportParagraph(messages.method.digitalMethod)+'<div class="site-links">'+linkFor("予約・購入ページ",config.links.digital)+'</div>');
return html;
}


const supportTitle=()=>config.release?.digitalTitle||"本当のことを言うと";
const supportText=()=>supportCopy(supportTitle());
function markedSupport(text){
 const input=String(text??"");
 let html="",cursor=0;
 for(const part of input.matchAll(/<([^<>]+)>/g)){
   html+=escapeHtml(input.slice(cursor,part.index));
   html+='<strong class="support-emphasis">'+escapeHtml(part[1])+'</strong>';
   cursor=part.index+part[0].length;
 }
 return (html+escapeHtml(input.slice(cursor))).replace(/\n/g,"<br>");
}
const supportParagraph=text=>'<p class="support-copy">'+markedSupport(text)+'</p>';
const supportLinks=()=>({
 youtube:'<div class="app-link-grid">'+linkFor("YouTube公式チャンネル","https://youtube.com/@timelesz_official?si=Mn0Jxa2dxpRjfqyB")+'</div>',
 sns:'<div class="app-link-grid">'+linkFor("X公式アカウント","https://x.com/ovtt_official?s=21&t=BbGDP467n_oSf2L69POfqA")+
     linkFor("Instagram公式アカウント","https://www.instagram.com/timelesz_official")+
     linkFor("TikTok公式アカウント","https://www.tiktok.com/@timelesz_overthetop")+'</div>',
 request:'<div class="app-link-grid">'+linkFor("タムごとDailyで応援する",config.links.daily)+'</div>'
});
function snsDetailsMarkup(copy){
 return '<details class="support-sns-details"><summary>詳しく見る</summary><div class="support-sns-details-body">'+
 copy.snsDetails.map(group=>'<section class="support-sns-group"><h4>'+escapeHtml(group.title)+'</h4>'+
 group.steps.map(line=>supportParagraph(line)).join("")+'</section>').join("")+
 '</div></details>';
}
function freeSupportMarkup(){
 const c=supportText(),links=supportLinks();
 return card("みんなでできる応援",
  supportParagraph(c.youtube)+links.youtube+
  supportParagraph(c.sns)+snsDetailsMarkup(c)+links.sns+
  supportParagraph(c.request)+links.request);
}
function stationheadLinks(){
 return '<div class="site-links">'+linkFor("設定方法を見る",config.links.stationheadGuide)+'</div>'+
 '<div class="stationhead-device-links"><a href="'+escapeHtml(config.links.stationheadIOS)+'" target="_blank" rel="noopener noreferrer">iPhone</a>'+
 '<a href="'+escapeHtml(config.links.stationheadAndroid)+'" target="_blank" rel="noopener noreferrer">Android</a></div>'+
 '<p class="subhead">登録ができたら以下のリンクをタップ！</p>'+
 '<div class="site-links">'+linkFor("secondzチャンネル",config.links.stationhead)+'</div>';
}
function musicSupportMarkup(subs){
 const selected=new Set(subs||[]);
 const music=selectedMusic(subs||[]),c=supportText();
 const eligible=selected.has("spotify")||selected.has("apple");
 let body=supportParagraph(c.listen);
 if(music.length){
   if(selected.has("prime")&&!selected.has("unlimited"))body+=supportParagraph(c.prime);
   body+='<div class="app-link-grid">'+music.map(([id,name])=>linkFor(name+"を開く",config.links.musicApps[id])).join("")+'</div>';
 }else{
   body+=supportParagraph(c.freeSpotify)+'<div class="app-link-grid">'+linkFor("Spotifyを開く",config.links.musicApps.spotify)+'</div>';
 }
 let html=card("新曲をサブスクで応援！",body,"support-music");
 let stationBody=supportParagraph(eligible?c.stationMember:c.stationUpsell);
 if(!eligible)stationBody+='<div class="site-links">'+linkFor("Spotify Premiumはこちら！",config.links.spotifyPremium)+'</div>';
 stationBody+=stationheadLinks();
 html+=card("ステヘにチャレンジしてみない？",stationBody);
 if(selected.has("unext"))html+=card("U-NEXT会員の方へ！",supportParagraph(c.unext)+
 '<div class="site-links">'+linkFor("詳しくはこちら",config.links.unextCampaign)+'</div>');
 return html;
}
function supportMarkup(data,a){
 return musicSupportMarkup(a.subs||[])+freeSupportMarkup();
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
const hasCdBudget=!isSmallBudget(a.budget);
const nav=hasCdBudget&&!print?'<nav class="result-section-nav" aria-label="結果ページ内の移動"><a href="#result-recommend">おすすめプラン</a><a href="#result-method">購入方法</a><a href="#result-support">応援方法</a></nav>':"";
const resultSection=(id,index,title,body)=>'<section class="section result-scroll-target" id="'+id+'"><h2 class="section-title"><span class="number">'+index+'</span>'+escapeHtml(title)+'</h2>'+body+'</section>';
const purchaseActions=hasCdBudget&&!print?'<div class="result-block-actions"><button type="button" class="btn" data-action="plan-recommended">おすすめを元にCD購入プランを作る</button><button type="button" class="btn secondary" data-action="compare-from-result">特典を比較する</button></div>':"";
const methodActions=hasCdBudget&&!print?'<div class="result-block-actions"><button type="button" class="btn secondary" data-action="plan-from-result">CD購入プランを作る</button></div>':"";
const html='<div class="result-meta"><p class="pill">MY NEW RELEASE SUPPORT PLAN</p><h1>あなたの新曲応援プラン</h1><p class="release-title">'+escapeHtml(config.release?.cdTitle||"ザユウノメイ／本当のことを言うと")+'</p></div>'+resultSummary(a)+nav+
(a.budget==="zero"?"":resultSection("result-recommend","01","これを買うのがおすすめ！",purchaseMarkup(data.purchase)+purchaseActions))+
(a.budget==="zero"?"":resultSection("result-method","02","こんな買い方がおすすめ！",methodMarkup(data.method,print)+methodActions))+
resultSection("result-support",a.budget==="zero"?"01":"03",messages.headings.support,supportMarkup(data.support,a)+addOnMarkup(data.purchase))+
'<hr class="divider"><p class="small" style="text-align:center">タムごと新曲応援ナビ<br>タムごと新曲応援ナビは非公式のファンツールです。<br>集計・購入・特典に関する情報は必ず公式・販売店の最新情報をご確認ください。</p>';
answers=oldAnswers;return html;
}
function compactResultContent(result){
const a=result.answers;
const purchase=buildPurchase(a,config,messages);
const budget=config.budgetOptions.find(x=>x.id===a.budget)?.label||"0円";
const cdTitle=config.release?.cdTitle||"ザユウノメイ／本当のことを言うと";
const names={regular:"通常盤",a:"初回限定盤A",b:"初回限定盤B",fc:"FC限定盤",set:"3形態セット",digital:"デジタル配信"};
const items=purchase.items.flatMap(item=>(item.productIds||[]).map(id=>names[id]||id));
const unique=[...new Set(items)];
const first=unique.length?unique.map(x=>'<span class="compact-plan-tag">'+escapeHtml(x)+'</span>').join(""):'<span class="compact-plan-tag">お金をかけずに応援！</span>';
const secondary=purchase.secondaries?.length?'<p class="compact-plan-label">もう1枚選ぶなら…</p><div class="compact-plan-tags">'+purchase.secondaries.map(x=>'<span class="compact-plan-tag compact-plan-tag-secondary">'+escapeHtml(x.label)+'</span>').join("")+'</div>':"";
const compactSupport=supportImageSections({subs:a.subs||[],digitalTitle:supportTitle()});
const compactItems=compactSupport.map(group=>
  '<div class="compact-support-group"><h3>'+escapeHtml(group.number+" "+group.title)+'</h3>'+
  group.rows.map(row=>'<div class="compact-support-item"><strong>'+escapeHtml(row.title)+'</strong>'+
    (row.description?'<p>'+markedSupport(row.description)+'</p>':"")+'</div>').join("")+'</div>').join("");
return '<div class="compact-share-summary"><div class="compact-share-stars">✧　♡　✧</div><p class="compact-share-eyebrow">MY NEW RELEASE SUPPORT PLAN</p><h1>'+(budgetImageOptions.name.trim()?escapeHtml(budgetImageOptions.name.trim())+'さんの新曲応援プラン':'あなたの新曲応援プラン')+'</h1><p class="compact-share-release">'+escapeHtml(cdTitle)+'</p>'+
'<div class="compact-share-budget"><small>MY BUDGET</small><strong>'+escapeHtml(budget)+'</strong></div>'+
'<section class="compact-share-recommend"><h2>♡ おすすめの購入プラン</h2><div class="compact-plan-tags">'+first+'</div>'+secondary+'</section>'+
'<section class="compact-share-support"><h2>✧ この応援がおすすめ！</h2>'+compactItems+'</section>'+
'<p class="compact-share-footer">'+escapeHtml(IMAGE_FOOTER_LINE1)+'<br><small>'+escapeHtml(IMAGE_FOOTER_LINE2)+'</small></p></div>';
}

const EXTRA_SUPPORT_KEY="secondzReleaseNav:extraSupport:v1";
let extraSubs=[];
function openExtraSupport(){
  const saved=load(EXTRA_SUPPORT_KEY);
  const prior=load(RESULT_KEY);
  const initial=saved?.releaseId===config.releaseId?saved.subs:prior?.releaseId===config.releaseId?prior.answers?.subs:[];
  const known=new Set(config.subscriptions.map(x=>x.id));
  extraSubs=Array.isArray(initial)?initial.filter(id=>known.has(id)):[];
  showExtraSupportQuestion();
}
function showExtraSupportQuestion(){
  view="extra-support-question";
  const choices=config.subscriptions.map(s=>choice("extra-subs",s.id,s.label,extraSubs.includes(s.id),true)).join("");
  frame('<section class="card pf-extra-screen"><h1>加入しているサブスクを選択してください。</h1>'+
    '<p class="muted">加入しているものをすべて選択して「結果を見る」を押してください。加入しているものがないときは、そのまま「結果を見る」を押してください。</p>'+
    '<div class="choices">'+choices+'</div><div class="actions"><button type="button" class="btn" data-action="extra-support-result">結果を見る</button>'+
    '<button type="button" class="btn ghost" data-action="extra-support-back">購入プランに戻る</button></div></section>');
}
function extraSupportMarkup(){
 const digital=section("01","デジタル配信で応援！",card(messages.method.digitalHeading,
  supportParagraph(supportText().digital)+supportParagraph(messages.method.digitalMethod)+
  '<div class="site-links">'+linkFor("予約・購入ページ",config.links.digital)+'</div>'));
 return digital+
  section("02","サブスクで応援！",musicSupportMarkup(extraSubs))+
  section("03","無料でできる応援！",freeSupportMarkup());
}

function showExtraSupportResult(){
  readExtraImageOptions();
  save(EXTRA_SUPPORT_KEY,{releaseId:config.releaseId,subs:[...extraSubs]});
  view="extra-support-result";
  const summary=extraSubs.map(id=>config.subscriptions.find(s=>s.id===id)?.label).filter(Boolean).join("・")||"なし";
  frame('<div class="card pf-extra-screen"><div class="result-meta"><p class="pill">MY NEW RELEASE SUPPORT PLAN</p>'+
    '<h1>あなたの追加応援プラン</h1><p class="release-title">'+escapeHtml(config.release?.cdTitle||"ザユウノメイ／本当のことを言うと")+'</p></div>'+
    '<p class="pf-extra-selected">加入中のサブスク：'+escapeHtml(summary)+'</p>'+extraSupportMarkup()+
    '<p class="small" style="text-align:center">※集計・配信・サービスに関する条件は必ず各公式サイトの最新情報をご確認ください。</p>'+
    '<div class="pf-name pf-extra-name"><label for="pf-extra-image-name">シェアするときの名前（任意）</label><input id="pf-extra-image-name" type="text" maxlength="10" value="'+escapeHtml(extraImageOptions.name)+'"><p class="pf-note">名前はこの端末に保存されます。</p></div></div>'+ 
    '<section class="card footer-actions"><div class="actions"><button type="button" class="btn secondary" data-action="extra-support-edit">サブスクを選び直す</button>'+
    '<button type="button" class="btn" data-action="extra-support-back">CD購入プランに戻る</button></div></section>'+ 
    '<nav class="pf-bottom-nav"><button type="button" class="btn" data-action="extra-image-open">画像を生成</button></nav>');
}


const EXTRA_IMAGE_SETTINGS_KEY="secondzReleaseNav:extraSupportImage:v1";
const EXTRA_PNG_VERSION=6;
const EXTRA_SHARE_TEXT="タムごと新曲応援ナビで応援プランを作ったよ！\nhttps://seachicken-sz.github.io/secondzNewReleaseNav/";
let extraImageOptions={name:"",theme:"purplePink"};
let extraPreviewBlob=null,extraPreviewUrl=null,extraPreviewSignature="",extraPreviewOpen=false;
const previewSignature=()=>JSON.stringify({version:EXTRA_PNG_VERSION,releaseId:config.releaseId,name:extraImageOptions.name,theme:extraImageOptions.theme,subs:[...extraSubs].sort()});
function readExtraImageOptions(){
 const saved=load(EXTRA_IMAGE_SETTINGS_KEY);
 const plan=load("secondzReleaseNav:purchasePlan:v2");
 const planName=plan?.releaseId===config.releaseId?String(plan.name||""):"";
 const name=saved?.releaseId===config.releaseId&&typeof saved?.name==="string"?saved.name:planName;
 extraImageOptions={name:Array.from(name.trim()).slice(0,10).join(""),theme:["purplePink","movieMint"].includes(saved?.theme)?saved.theme:"purplePink"};
}
function persistExtraImageOptions(){
 save(EXTRA_IMAGE_SETTINGS_KEY,{...extraImageOptions,releaseId:config.releaseId});
}
function closeExtraPreview(){
 document.body.classList.remove("pf-modal-open");
 extraPreviewOpen=false;
 const modal=document.getElementById("pf-extra-preview-modal");
 if(modal)modal.remove();
 if(extraPreviewUrl){URL.revokeObjectURL(extraPreviewUrl);extraPreviewUrl=null}
}
function invalidateExtraPreview(){
 extraPreviewSignature="";
 extraPreviewBlob=null;
 if(extraPreviewUrl){URL.revokeObjectURL(extraPreviewUrl);extraPreviewUrl=null}
}
function openExtraPreview(){
 if(view!=="extra-support-result")return;
 closeExtraPreview();
 extraPreviewOpen=true;
 const node=document.createElement("div");
 node.id="pf-extra-preview-modal";
 node.className="pf-modal-overlay";
 node.innerHTML='<section class="pf-modal" role="dialog" aria-modal="true" aria-labelledby="pf-extra-preview-heading">'+
   '<div class="pf-modal-head"><h2 id="pf-extra-preview-heading">追加応援プランの画像プレビュー</h2><button type="button" class="pf-modal-close" data-action="extra-image-close" aria-label="閉じる">×</button></div>'+
   '<div class="pf-modal-body"><div class="pf-preview-frame"><p class="pf-extra-preview-status" aria-live="polite">画像プレビューを生成中…</p><img class="pf-generated-preview pf-extra-preview-image" alt="追加応援プランの画像プレビュー" hidden></div>'+
   '<fieldset class="pf-modal-options"><legend>画像のオプション</legend><p>カラー</p>'+
   '<div class="pf-theme-options"><label><input type="radio" name="pf-extra-theme" value="purplePink"'+(extraImageOptions.theme==="purplePink"?" checked":"")+'>カラー①</label>'+
   '<label><input type="radio" name="pf-extra-theme" value="movieMint"'+(extraImageOptions.theme==="movieMint"?" checked":"")+'>カラー②</label></div></fieldset>'+
   '<div class="pf-modal-buttons"><button type="button" class="btn pf-extra-share" data-action="extra-image-share" disabled>画像を保存・共有する</button></div></div></section>';
 document.body.appendChild(node);
 document.body.classList.add("pf-modal-open");
 node.addEventListener("click",event=>{if(event.target===node)closeExtraPreview()});
 node.querySelector(".pf-modal-close")?.focus();
 refreshExtraPreview();
}
async function extraImageCachedGet(signature){
 if(!("indexedDB" in window))return null;
 return new Promise(resolve=>{
   try{
     const request=indexedDB.open("secondzReleaseNav:extraImage",1);
     request.onupgradeneeded=()=>request.result.createObjectStore("previews");
     request.onerror=()=>resolve(null);
     request.onsuccess=()=>{
       const db=request.result;
       const tx=db.transaction("previews","readonly");
       const read=tx.objectStore("previews").get("current");
       read.onsuccess=()=>{const v=read.result;resolve(v?.signature===signature&&v.blob instanceof Blob?v.blob:null)};
       read.onerror=()=>resolve(null);
       tx.oncomplete=()=>db.close();
       tx.onerror=()=>{db.close();resolve(null)};
     };
   }catch{resolve(null)}
 });
}
async function extraImageCachedPut(signature,blob){
 if(!("indexedDB" in window))return;
 return new Promise(resolve=>{
   try{
     const request=indexedDB.open("secondzReleaseNav:extraImage",1);
     request.onupgradeneeded=()=>request.result.createObjectStore("previews");
     request.onerror=()=>resolve();
     request.onsuccess=()=>{
       const db=request.result;
       const tx=db.transaction("previews","readwrite");
       tx.objectStore("previews").put({signature,blob},"current");
       tx.oncomplete=()=>{db.close();resolve()};
       tx.onerror=()=>{db.close();resolve()};
     };
   }catch{resolve()}
 });
}
async function refreshExtraPreview(){
 if(!extraPreviewOpen)return;
 const signature=previewSignature();
 const root=document.getElementById("pf-extra-preview-modal");
 const status=root?.querySelector(".pf-extra-preview-status"),img=root?.querySelector(".pf-extra-preview-image"),share=root?.querySelector(".pf-extra-share");
 if(!root||!img||!status||!share)return;
 share.disabled=true;img.hidden=true;status.hidden=false;status.textContent="画像を生成中…";
 try{
   let blob=extraPreviewSignature===signature?extraPreviewBlob:null;
   if(!blob)blob=await extraImageCachedGet(signature);
   if(!blob){
     const {renderExtraSupportPng}=await import("./extraSupportCanvas.js?v=20261112-v6");
     blob=await renderExtraSupportPng({name:extraImageOptions.name,subs:extraSubs,theme:extraImageOptions.theme,digitalTitle:supportTitle(),releaseTitle:config.release?.cdTitle});
     // Persist the rendered PNG itself; never fail sharing if storage is unavailable.
     extraImageCachedPut(signature,blob).catch(()=>{});
   }
   if(!extraPreviewOpen||signature!==previewSignature()||root!==document.getElementById("pf-extra-preview-modal"))return;
   if(extraPreviewUrl)URL.revokeObjectURL(extraPreviewUrl);
   extraPreviewBlob=blob;extraPreviewSignature=signature;extraPreviewUrl=URL.createObjectURL(blob);
   img.src=extraPreviewUrl;img.hidden=false;status.hidden=true;share.disabled=false;
 }catch(error){
   console.error(error);
   if(extraPreviewOpen&&signature===previewSignature()){status.textContent="画像を生成できませんでした。設定を変更して再度お試しください。";}
 }
}
async function shareExtraImage(button){
 if(!extraPreviewBlob||extraPreviewSignature!==previewSignature())return;
 const blob=extraPreviewBlob;
 const filename="タムごと_追加応援プラン.png";
 const file=new File([blob],filename,{type:"image/png"});
 button.disabled=true;const original=button.textContent;button.textContent="準備中…";
 try{
   if(navigator.canShare?.({files:[file]})&&navigator.share){
     try{await navigator.share({files:[file],text:EXTRA_SHARE_TEXT,title:"追加応援プラン"});return}
     catch(error){if(error.name==="AbortError")return;console.warn(error)}
   }
   const url=URL.createObjectURL(blob);
   const a=document.createElement("a");a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),30000);
   try{await navigator.clipboard.writeText(EXTRA_SHARE_TEXT);alert("画像を保存しました。共有用テキストをコピーしたよ！")}
   catch{alert("画像を保存しました。共有用テキスト：\n"+EXTRA_SHARE_TEXT)}
 }catch(error){console.error(error);alert("保存・共有に失敗しました。再度お試しください。")}
 finally{button.disabled=false;button.textContent=original}
}


const BUDGET_IMAGE_KEY="secondzReleaseNav:budgetImage:v1";
let budgetImageOptions={name:"",theme:"purplePink"},budgetPreviewModal=null,budgetPreviewBlob=null,budgetPreviewUrl=null,budgetPreviewVersion=0;
function loadBudgetImageOptions(){
 const saved=load(BUDGET_IMAGE_KEY);
 const plannerPlan=load("secondzReleaseNav:purchasePlan:v2");
 const name=saved?.releaseId===config.releaseId&&typeof saved.name==="string"?saved.name:
   plannerPlan?.releaseId===config.releaseId?String(plannerPlan.name||""):"";
 budgetImageOptions={name:Array.from(name).slice(0,30).join(""),theme:["purplePink","movieMint"].includes(saved?.theme)?saved.theme:"purplePink"};
}
function saveBudgetImageOptions(){save(BUDGET_IMAGE_KEY,{...budgetImageOptions,releaseId:config.releaseId})}
function showResult(){
 view="result";
 const result=lastResult||load(RESULT_KEY);if(!result||result.releaseId!==config.releaseId){home();return}
 lastResult=result;
 loadBudgetImageOptions();
 frame('<div id="result-view" class="card">'+resultContent(result)+'</div><section class="card footer-actions">'+
 '<div class="pf-name result-image-name"><label for="result-image-name">シェアするときの名前（任意）</label><input id="result-image-name" type="text" maxlength="30" value="'+escapeHtml(budgetImageOptions.name)+'"><p class="pf-note">名前はこの端末に保存されます。</p></div>'+
 '<div class="actions"><button class="btn" data-action="export">画像を生成</button><button class="btn secondary" data-action="plan-from-result">CD購入プランを作る</button><button class="btn secondary" data-action="home">トップへ戻る</button><button class="btn ghost" data-action="restart">もう一度診断する</button></div><p class="small">診断結果はこの端末に保存済み。再診断が完了すると上書きされます。</p></section>');
}
function closeBudgetPreview(){
 budgetPreviewVersion++;
 if(budgetPreviewUrl){URL.revokeObjectURL(budgetPreviewUrl);budgetPreviewUrl=null}
 budgetPreviewBlob=null;
 if(budgetPreviewModal){budgetPreviewModal.remove();budgetPreviewModal=null}
 document.body.classList.remove("pf-modal-open");
}
async function makeBudgetImage(){
 const result=lastResult||load(RESULT_KEY);
 if(!result)throw Error("診断結果を読み込めません");
 const node=document.createElement("div");
 node.className="image-canvas";
 node.id="result-image-export";
 node.dataset.theme=budgetImageOptions.theme;
 node.innerHTML=compactResultContent(result);
 document.body.appendChild(node);
 try{
  await document.fonts?.ready;
  const {toBlob}=await import("https://cdn.jsdelivr.net/npm/html-to-image@1.11.13/+esm");
  const blob=await toBlob(node,{backgroundColor:"#ffffff",pixelRatio:1,cacheBust:true,style:{position:"static",left:"auto",top:"auto"}});
  if(!blob)throw Error("PNGを生成できませんでした");
  return blob;
 }finally{node.remove()}
}
async function refreshBudgetPreview(){
 const modal=budgetPreviewModal;if(!modal)return;
 const version=++budgetPreviewVersion;
 const frame=modal.querySelector("[data-budget-preview]"),btn=modal.querySelector("[data-action='budget-image-share']");
 if(!frame||!btn)return;
 btn.disabled=true;frame.textContent="画像プレビューを生成中…";
 try{
  const blob=await makeBudgetImage();
  if(modal!==budgetPreviewModal||version!==budgetPreviewVersion)return;
  if(budgetPreviewUrl)URL.revokeObjectURL(budgetPreviewUrl);
  budgetPreviewBlob=blob;budgetPreviewUrl=URL.createObjectURL(blob);
  frame.innerHTML='<img class="pf-generated-preview" alt="新曲応援プランの画像プレビュー">';
  frame.querySelector("img").src=budgetPreviewUrl;
  btn.disabled=false;
 }catch(err){console.error(err);if(modal===budgetPreviewModal&&version===budgetPreviewVersion)frame.textContent="画像を生成できませんでした。もう一度お試しください。"}
}
function openBudgetPreview(){
 if(view!=="result")return;
 closeBudgetPreview();
 const modal=document.createElement("div");
 modal.id="result-image-modal";modal.className="pf-modal-overlay";
 modal.innerHTML='<section class="pf-modal" role="dialog" aria-modal="true" aria-labelledby="result-image-title">'+
 '<div class="pf-modal-head"><h2 id="result-image-title">応援プランの画像プレビュー</h2><button type="button" class="pf-modal-close" data-action="budget-image-close" aria-label="閉じる">×</button></div>'+
 '<div class="pf-modal-body"><div class="pf-preview-frame" data-budget-preview>画像プレビューを生成中…</div>'+
 '<fieldset class="pf-modal-options"><legend>画像のオプション</legend><p>カラー</p><div class="pf-theme-options">'+
 '<label><input type="radio" name="budget-image-theme" value="purplePink"'+(budgetImageOptions.theme==="purplePink"?" checked":"")+'>カラー①</label>'+
 '<label><input type="radio" name="budget-image-theme" value="movieMint"'+(budgetImageOptions.theme==="movieMint"?" checked":"")+'>カラー②</label></div></fieldset>'+
 '<div class="pf-modal-buttons"><button type="button" class="btn" data-action="budget-image-share" disabled>画像を保存・共有する</button></div></div></section>';
 document.body.appendChild(modal);budgetPreviewModal=modal;
 document.body.classList.add("pf-modal-open");
 modal.addEventListener("click",e=>{if(e.target===modal)closeBudgetPreview()});
 modal.querySelector(".pf-modal-close")?.focus();
 refreshBudgetPreview();
}
async function shareBudgetImage(button){
 if(!budgetPreviewBlob)return;
 const blob=budgetPreviewBlob,filename="タムごと_新曲応援プラン.png";
 const file=new File([blob],filename,{type:"image/png"});
 button.disabled=true;const label=button.textContent;button.textContent="準備中…";
 try{
  if(navigator.canShare?.({files:[file]})&&navigator.share){
   try{await navigator.share({files:[file],title:"新曲応援プラン",text:EXTRA_SHARE_TEXT});return}
   catch(e){if(e.name==="AbortError")return;console.warn(e)}
  }
  const url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),30000);
  try{await navigator.clipboard.writeText(EXTRA_SHARE_TEXT);alert("画像を保存しました。共有用テキストをコピーしたよ！")}
  catch{alert("画像を保存しました。")}
 }catch(err){console.error(err);alert("画像の保存・共有に失敗しました。もう一度お試しください。")}
 finally{button.disabled=false;button.textContent=label}
}

document.addEventListener("click",event=>{
const jump=event.target.closest(".result-section-nav a");
if(jump&&view==="result"){event.preventDefault();document.getElementById(jump.getAttribute("href").slice(1))?.scrollIntoView({behavior:"smooth",block:"start"});return}
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
if(choiceEl){
  if(choiceEl.dataset.choice==="extra-subs"&&view==="extra-support-question"){
    const id=choiceEl.dataset.value;
    extraSubs=extraSubs.includes(id)?extraSubs.filter(x=>x!==id):[...extraSubs,id];
    choiceEl.classList.toggle("active",extraSubs.includes(id));
    choiceEl.setAttribute("aria-pressed",String(extraSubs.includes(id)));
    return;
  }
  setAnswer(choiceEl.dataset.choice,choiceEl.dataset.value);return;
}
const button=event.target.closest("[data-action]");if(!button)return;
switch(button.dataset.action){
case "extra-image-open":openExtraPreview();break;
case "extra-image-close":closeExtraPreview();break;
case "extra-image-share":shareExtraImage(button);break;
case "extra-support-result":showExtraSupportResult();break;
case "extra-support-edit":showExtraSupportQuestion();break;
case "extra-support-back":planner.showPlan();break;
case "start":case "restart":start();break;
case "plan-create":planner.openFromHome();break;
case "plan-compare":planner.openCompare();break;
case "plan-resume":planner.resume();break;
case "plan-from-result":planner.openFromResult(lastResult||load(RESULT_KEY));break;
case "plan-recommended":planner.openRecommendedFromResult(lastResult||load(RESULT_KEY));break;
case "compare-from-result":planner.openCompareFromResult();break;
case "budget-image-close":closeBudgetPreview();break;
case "budget-image-share":shareBudgetImage(button);break;
case "resume":start(true);break;
case "next":next();break;
case "back":back();break;
case "saved":lastResult=load(RESULT_KEY);showResult();break;
case "home":home();break;
case "export":openBudgetPreview();break;
}
});
document.addEventListener("input",event=>{
if(event.target.id==="result-image-name"){
 budgetImageOptions.name=Array.from(event.target.value).slice(0,30).join("");saveBudgetImageOptions();return;
}
if(event.target.id==="pf-extra-image-name"){
  extraImageOptions.name=Array.from(event.target.value).slice(0,10).join("");
  if(event.target.value!==extraImageOptions.name)event.target.value=extraImageOptions.name;
  persistExtraImageOptions();refreshExtraPreview();return;
}
if(event.target.id==="budget-range"){
const id=config.budgetOptions[Number(event.target.value)].id;
answers.budget=id;if(!["1800","3600"].includes(id))answers.priority=null;
if(isSmallBudget(id)){answers.store=null;answers.seven=null;answers.fc=null;}
saveDraft();$("#budget-label").textContent=config.budgetOptions[Number(event.target.value)].label;
$("#next").disabled=false;
// Keep the progress bar still until the user presses Next.
}
});
document.addEventListener("change",event=>{
 if(event.target.name==="budget-image-theme"){
 budgetImageOptions.theme=event.target.value==="movieMint"?"movieMint":"purplePink";saveBudgetImageOptions();refreshBudgetPreview();return;
 }
 if(event.target.name==="pf-extra-theme"){
   extraImageOptions.theme=event.target.value==="movieMint"?"movieMint":"purplePink";
   persistExtraImageOptions();refreshExtraPreview();
 }
});
document.addEventListener("keydown",event=>{if(event.key==="Escape"&&extraPreviewOpen)closeExtraPreview()});
async function init(){
try{
const responses=await Promise.all([fetch("./data/config.json",{cache:"no-store"}),fetch("./data/messages.json",{cache:"no-store"})]);
if(responses.some(r=>!r.ok))throw Error("データの取得に失敗しました");
[config,messages]=await Promise.all(responses.map(r=>r.json()));
planner=createPurchaseFlow({config,render:html=>frame(html),goHome:home,goResult:showResult,onExtraSupport:openExtraSupport});
home();
}catch(err){console.error(err);frame('<section class="card"><h1>読み込みに失敗しました</h1><p class="loading-error">通信状況を確認してページを再読み込みしてください。</p><button class="btn" onclick="location.reload()">再読み込み</button></section>')}
}
init();