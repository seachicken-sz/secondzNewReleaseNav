const STORAGE_KEY="secondzReleaseNav:purchasePlan:v2";
const OLD_STORAGE_KEY="secondzReleaseNav:purchasePlan:v1";
const SHARE_URL="https://seachicken-sz.github.io/secondzNewReleaseNav/";
const SHARE_TEXT="タムごと新曲応援ナビで購入プランを作ったよ！\n"+SHARE_URL;
const IOS="https://apps.apple.com/app/id1553865678";
const ANDROID="https://play.google.com/store/apps/details?id=com.timeleSZ.app";
const APPGUIDE="https://ovtp.jp/app/info.html";
const format=n=>Number(n).toLocaleString("ja-JP");
const safe=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const openLink=(label,url)=>'<a href="'+safe(url)+'" target="_blank" rel="noopener noreferrer">'+safe(label)+' ↗</a>';
const ITEM_IDS=["regular","a_dvd","a_bd","b_dvd","b_bd","fc_dvd","fc_bd"];
const names={regular:"通常盤",a_dvd:"初回限定盤A（DVD）",a_bd:"初回限定盤A（Blu-ray）",b_dvd:"初回限定盤B（DVD）",b_bd:"初回限定盤B（Blu-ray）",fc_dvd:"FC限定盤（DVD）",fc_bd:"FC限定盤（Blu-ray）"};
const baseKey=id=>id.split("_")[0];
const isFc=id=>id.startsWith("fc_");
const NON_FC=ITEM_IDS.filter(id=>!isFc(id));
const SHOP_NAMES={amazon:"Amazon",rakuten:"楽天ブックス",hmv:"HMV",tower:"タワレコ",sevennet:"セブンネット",other:"その他"};
const digits=n=>Math.max(0,Math.min(99,Math.floor(Number(n)||0)));
let sequence=0;
const makePlace=(type="online",shopKey="",label="")=>({id:"place_"+Date.now().toString(36)+"_"+(++sequence),type,shopKey,label,items:Object.fromEntries(NON_FC.map(id=>[id,0]))});
const initial=()=>({version:2,source:"count",name:"",originalBudget:null,budgetLabel:"",recommended:[],places:[],fcItems:{fc_dvd:0,fc_bd:0},imageOptions:{hideOnlineStoreNames:false,hidePhysicalStoreNames:false,theme:"purplePink"},updatedAt:""});
const normalizePlace=p=>({id:String(p.id||"place_"+(++sequence)),type:p.type==="store"?"store":"online",shopKey:String(p.shopKey||""),label:String(p.label||"").slice(0,10),items:Object.fromEntries(NON_FC.map(id=>[id,digits(p.items?.[id])]))});
const plansafe=value=>value&&typeof value==="object"?{
 ...initial(),...value,version:2,
 places:Array.isArray(value.places)?value.places.map(normalizePlace):[],
 fcItems:{fc_dvd:digits(value.fcItems?.fc_dvd),fc_bd:digits(value.fcItems?.fc_bd)},
 imageOptions:{...initial().imageOptions,...value.imageOptions}
}:initial();
const qty=(plan,id)=>isFc(id)?digits(plan.fcItems[id]):plan.places.reduce((sum,p)=>sum+digits(p.items[id]),0);
const qtyOf=plan=>ITEM_IDS.reduce((sum,id)=>sum+qty(plan,id),0);
const totalOf=(plan,config)=>ITEM_IDS.reduce((sum,id)=>sum+qty(plan,id)*priceFor(id,config),0);
const selectedIds=plan=>ITEM_IDS.filter(id=>qty(plan,id)>0);
const onlineLabel=p=>p.shopKey==="other"?p.label:(SHOP_NAMES[p.shopKey]||p.label||"購入先を選択");
const placeLabel=p=>p.type==="online"?onlineLabel(p):(p.label||"店舗名未入力");
const migrateOld=old=>{
 const result=initial();result.source=old.source||"count";result.name=old.name||"";
 result.originalBudget=old.originalBudget??null;result.budgetLabel=old.budgetLabel||"";
 result.recommended=old.recommended||[];
 const online=makePlace("online","other","オンライン");
 const store=makePlace("store","","実店舗");
 for(const id of NON_FC){online.items[id]=digits(old.items?.[id]?.online);store.items[id]=digits(old.items?.[id]?.store)}
 if(NON_FC.some(id=>online.items[id]>0))result.places.push(online);
 if(NON_FC.some(id=>store.items[id]>0))result.places.push(store);
 result.fcItems.fc_dvd=digits(old.items?.fc_dvd?.online);result.fcItems.fc_bd=digits(old.items?.fc_bd?.online);
 return result;
};
const deadlineOk=date=>{
  const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Tokyo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
  return parts<=date;
};
const detail={
  regular:{
    description:"カップリング曲をたくさん楽しみたい人におすすめ！",
    tracks:[["ザユウノメイ"],["本当のことを言うと"],["45",true],["Still us",true],["上記4曲のInst音源"]],
    videos:[],
    gifts:[["20P歌詞ブックレット"],["分けて使える！オリジナルステッカーシート ver.C"],["シリアルコード入りプレイリストカード"]],
    note:"天地空きスリーブ・両面ジャケット仕様。封入特典は初回仕様のため、購入時に確認してね。"
  },
  a:{
    description:"ダンスシーンが好きな人におすすめ！",
    tracks:[["ザユウノメイ"],["本当のことを言うと"],["大怪盗",true],["大怪盗 -Inst-"]],
    videos:[["「ザユウノメイ」Music Video"],["「ザユウノメイ」Music Video Dance edit ver.",true],["Making of「ザユウノメイ」"],["Behind of Jacket Shooting"]],
    gifts:[["分けて使える！オリジナルステッカーシート ver.A",true],["シリアルコード入りプレイリストカード"]],
    note:"DVD版とBlu-ray版は映像内容は同一ですが、盤面の色味が異なります。"
  },
  b:{
    description:"メンバーそれぞれの映像をじっくり楽しみたい人におすすめ！",
    tracks:[["本当のことを言うと"],["ザユウノメイ"],["Avocado",true],["Avocado -Inst-"]],
    videos:[["「本当のことを言うと」Music Video"],["「本当のことを言うと」Music Video メンバーソロver.×7種",true],["Making of「本当のことを言うと」"]],
    gifts:[["分けて使える！オリジナルステッカーシート ver.B",true],["シリアルコード入りプレイリストカード"]],
    note:"DVD版とBlu-ray版は映像内容は同一ですが、盤面の色味が異なります。"
  },
  fc:{
    description:"メンバーのわちゃわちゃを楽しみたい人におすすめ！",
    tracks:[["ザユウノメイ"],["本当のことを言うと"]],
    videos:[["「人生は一度きり！timeleszミッションすごろく！」",true]],
    gifts:[["32Pスペシャルフォトブック",true],["メッセージ入りメンバーフォトカード7種（L判サイズ）。直筆メッセージに加えて、カードの二次元コードからメンバーのショート動画コメントも楽しめるよ！",true],["シリアルコード入りプレイリストカード"]],
    note:"三方背BOX＋デジパック仕様。FC会員限定・完全受注生産（2026年12月21日23:59まで）。コメント動画視聴期間：2027年2月2日〜3月31日。"
  }
};
const rows=items=>'<ul class="pf-detail-list">'+items.map(([label,emphasis])=>'<li'+(emphasis?' class="pf-emphasis"':"")+'>'+safe(label)+'</li>').join("")+'</ul>';
const priceFor=(id,config)=>Number(config.products[baseKey(id)]?.price)||0;
function seededPlan(result,config){
  const plan=initial();plan.source="budget";
  const a=result.answers||{};const budget=config.budgetOptions.find(x=>x.id===a.budget);
  plan.originalBudget=budget?.value??null;plan.budgetLabel=budget?.label||"";
  const eligible=deadlineOk(config.deadline)&&a.fc===true;
  let picks=[];
  if(a.budget==="1400")picks=["regular"];
  else if(["1800","3600"].includes(a.budget)){
    let pick={songs:"regular",dance:"a_dvd",visual:"b_dvd",variety:"fc_dvd",complete:eligible?"fc_dvd":"a_dvd"}[a.priority]||"a_dvd";
    if(isFc(pick)&&!eligible)pick="a_dvd";
    picks=[pick];
  }else if(["5000","7000","more"].includes(a.budget)){
    picks=["a_dvd","b_dvd","regular"];
    if(["7000","more"].includes(a.budget)&&eligible)picks.push("fc_dvd");
  }
  const normal=picks.filter(id=>!isFc(id));
  if(normal.length){const place=makePlace("online","", "");normal.forEach(id=>place.items[id]=1);plan.places.push(place)}
  picks.filter(isFc).forEach(id=>plan.fcItems[id]=1);
  plan.recommended=picks;
  return plan;
}

export function createPurchaseFlow({config,render,goHome,goResult}){
 let plan=initial(),screen="home",previous="home",addMode=null,modal=null;
 const read=()=>{
   try{
     const current=JSON.parse(localStorage.getItem(STORAGE_KEY));
     if(current?.releaseId===config.releaseId)return plansafe(current);
     const old=JSON.parse(localStorage.getItem(OLD_STORAGE_KEY));
     if(old?.releaseId===config.releaseId){
       const migrated=migrateOld(old);
       localStorage.setItem(STORAGE_KEY,JSON.stringify({...migrated,releaseId:config.releaseId}));
       return migrated;
     }
   }catch(e){console.warn("購入プランの読み込みに失敗",e)}
   return null;
 };
 const persist=()=>{plan.updatedAt=new Date().toISOString();try{localStorage.setItem(STORAGE_KEY,JSON.stringify({...plan,releaseId:config.releaseId}));return true}catch{return false}};
 const hasSaved=()=>Boolean(read());
 const begin=result=>{plan=result?seededPlan(result,config):initial();addMode=null;persist();showPlan()};
 const resume=()=>{plan=read()||initial();addMode=null;showPlan()};
 const openFromResult=result=>{previous="result";begin(result)};
 const openFromHome=()=>{previous="home";begin(null)};
 const openCompare=()=>{previous="home";plan=read()||initial();comparison()};
 const comparison=()=>{screen="comparison";render(compareMarkup())};
 const back=()=>{if(previous==="result")goResult();else if(previous==="comparison")comparison();else if(previous==="plan")showPlan();else goHome()};
 const mark=(id,label)=>{
   const picked=qty(plan,id)>0;
   return '<button type="button" class="pf-choice-btn'+(picked?' is-added':'')+'" aria-pressed="'+picked+'" aria-label="'+safe(label)+(picked?' を選択解除':' を追加')+'" data-pf="toggle" data-id="'+id+'"><span class="pf-choice-label">'+safe(label)+'</span><span class="pf-choice-icon" aria-hidden="true">'+(picked?'✓':'＋')+'</span></button>';
 };
 function compareMarkup(){
   const edNames={regular:"通常盤",a:"初回限定盤A",b:"初回限定盤B",fc:"FC限定盤"};
   const cards=["regular","a","b","fc"].map(id=>{
     const d=detail[id],buttons=id==="regular"?mark("regular","通常盤"):'<div class="pf-formats">'+mark(id+"_dvd","DVD")+mark(id+"_bd","Blu-ray")+'</div>';
     return '<article class="pf-edition"><div class="pf-edition-head"><h2>'+edNames[id]+'</h2><strong>'+format(priceFor(id==="regular"?id:id+"_dvd",config))+'円</strong></div>'+
     '<p class="pf-muted">'+(id==="regular"?"CDのみ":"CD＋DVD／Blu-ray")+'</p><p class="pf-description">'+safe(d.description)+'</p>'+
     '<h3>収録曲</h3>'+rows(d.tracks)+(d.videos.length?'<h3>映像特典</h3>'+rows(d.videos):"")+
     '<h3>'+(id==="regular"?"初回仕様封入特典":"封入特典")+'</h3>'+rows(d.gifts)+
     '<p class="pf-note">'+safe(d.note)+'</p>'+buttons+'</article>';
   }).join("");
   return '<section class="card pf-root pf-with-footer"><button class="pf-back" type="button" data-pf="back">← 戻る</button><h1>どの盤にする？特典を比較しよう！</h1><p class="muted">収録曲や映像をチェックして、欲しい盤を購入プランに追加しよう！複数選べるよ。</p>'+
    cards+'<section class="pf-guide"><h2>CDの曲をスマホでも聴けるよ！</h2><p>全形態に「シリアルコード入りプレイリストカード」が封入されているよ！カードに記載されたシリアルコードを無料の「timeleSZアプリ」に登録すると、購入したCDに収録されている楽曲をスマホで楽しめるよ！</p>'+
    '<div class="pf-formats">'+openLink("App Store",IOS)+openLink("Google Play",ANDROID)+'</div><p>'+openLink("アプリの使い方",APPGUIDE)+'</p></section>'+
    '<section class="pf-guide pf-three-editions"><h2>3形態同時購入特典もチェック！</h2>'+
    '<p>初回限定盤A・初回限定盤B・通常盤の3形態を同時購入で専用特典がつくよ！</p><p>専用特典は早期終了したこともあるから早めの予約がマスト！</p>'+
    '<details class="pf-past-benefits"><summary>参考までに過去の特典はこんな感じ</summary><div class="pf-past-benefits-content"><h3>MOMENTUM</h3><ul><li>トレーディングカード(全員分)</li><li>ストリーミング映像<ul><li>バラエティ映像(ワンカードポーカー)</li><li>ユニット曲制作メイキング</li><li>あくびMV メンバーソロver</li></ul></li></ul>'+
    '<h3>消えない花火</h3><ul><li>フレークシール(全員分)</li><li>ストリーミング映像<ul><li>JALフェス出演時のライブ映像</li><li>消えない花火MV メンバーソロver</li></ul></li></ul></div></details>'+
    '<div class="pf-purchase-advice"><h3>店頭購入・予約の場合</h3><p>初回A+初回B+通常をまとめて予約しよう！</p><p>初回Aと初回Bの映像の盤種(DVD/Blu-ray)は揃えてね！</p></div>'+
    '<div class="pf-purchase-advice"><h3>オンラインの場合</h3><p>「3形態同時購入特典付」と書かれているセットを選ぼう！</p><p>定価は4,920円なのでそれより高いところは気をつけてね！</p></div></section>'+
    '<button class="btn secondary" type="button" data-pf="home">トップへ戻る</button></section>'+
    '<nav class="pf-bottom-nav" aria-label="画面操作"><button type="button" class="btn" data-pf="to-plan">購入プランを作る <span data-pf-selected-count>（'+qtyOf(plan)+'枚）</span></button></nav>';
 }
 const addForm=()=>addMode?'<div class="pf-add-form"><h3>'+(addMode==="online"?"オンラインの購入先を追加":"実店舗を追加")+'</h3>'+
   (addMode==="online"?'<label for="pf-shop-select">購入先</label><select id="pf-shop-select" data-pf-shop-select><option value="">選択してください</option>'+Object.entries(SHOP_NAMES).map(([key,label])=>'<option value="'+key+'">'+label+'</option>').join("")+'</select><div data-pf-other-wrap hidden><label for="pf-shop-custom">購入先の名前（10文字まで）</label><input id="pf-shop-custom" maxlength="10" type="text"></div>':
   '<label for="pf-shop-custom">店舗名（10文字まで）</label><input id="pf-shop-custom" maxlength="10" type="text" placeholder="">')+
   '<div class="pf-add-actions"><button type="button" class="btn" data-pf="add-place">追加する</button><button type="button" class="btn secondary" data-pf="cancel-place">キャンセル</button></div></div>':"";
 const counter=(place,id)=>{
   const val=isFc(id)?plan.fcItems[id]:place.items[id];
   return '<div class="pf-counter" data-pf-count-for="'+(isFc(id)?"fc":safe(place.id))+'-'+id+'"><button type="button" data-pf="decrease" '+(isFc(id)?'data-fc="true"':'data-place="'+safe(place.id)+'"')+' data-id="'+id+'" aria-label="'+safe(names[id])+'を1枚減らす"'+(val===0?' disabled':'')+'>－</button><strong>'+val+'</strong><button type="button" data-pf="increase" '+(isFc(id)?'data-fc="true"':'data-place="'+safe(place.id)+'"')+' data-id="'+id+'" aria-label="'+safe(names[id])+'を1枚増やす"'+(val>=99?' disabled':'')+'>＋</button></div>';
 };
 function placeCard(p){
   const label=placeLabel(p),isOnline=p.type==="online";
   return '<article class="pf-place-card" data-place-card="'+safe(p.id)+'"><div class="pf-place-heading"><div><small>'+(isOnline?"オンライン":"実店舗")+'</small><h3>'+safe(label)+'</h3></div><button type="button" class="pf-remove-place" data-pf="remove-place" data-place="'+safe(p.id)+'">削除</button></div>'+
    NON_FC.map(id=>'<div class="pf-format-row"><span class="pf-format-title">'+safe(names[id])+'</span>'+counter(p,id)+'</div>').join("")+
    '<div class="pf-place-subtotal">この購入先の小計 <strong data-pf-subtotal="'+safe(p.id)+'">'+format(NON_FC.reduce((sum,id)=>sum+p.items[id]*priceFor(id,config),0))+'円</strong></div></article>';
 }
 function showPlan(){
   screen="plan";
   const budget=plan.source==="budget"?'<div class="pf-meta"><div><small>当初の予算</small><strong>'+safe(plan.budgetLabel||"未設定")+'</strong></div><div><small>診断のおすすめ</small><strong>'+safe(plan.recommended.map(id=>names[id]).join("・")||"なし")+'</strong></div></div>':"";
   render('<section class="card pf-root pf-with-footer"><button class="pf-back" type="button" data-pf="back">← 戻る</button><h1>わたしのCD購入プラン</h1>'+budget+
   '<div class="pf-total"><div><small>現在の合計金額</small><strong data-pf-total></strong></div><div><small>CD合計</small><strong data-pf-qty></strong></div><p class="pf-budget-diff" data-pf-budget></p></div>'+
   '<section class="pf-channel"><h2>購入場所を設定する</h2><p class="pf-note">購入先を追加して、その購入先で購入するCDの枚数を入力してね！</p>'+
   '<div class="pf-add-actions"><button class="btn secondary" type="button" data-pf="show-add-online">＋ オンラインを追加</button><button class="btn secondary" type="button" data-pf="show-add-store">＋ 実店舗を追加</button></div>'+
   '<div data-pf-add-form>'+addForm()+'</div></section>'+
   '<section class="pf-places"><h2>購入先ごとの枚数</h2><div data-pf-places>'+plan.places.map(placeCard).join("")+'</div></section>'+
   '<article class="pf-place-card pf-fc-place"><div class="pf-place-heading"><div><small>ファンクラブ限定</small><h3>ファミクラストアオンライン</h3></div></div>'+
   ['fc_dvd','fc_bd'].map(id=>'<div class="pf-format-row"><span class="pf-format-title">'+safe(names[id])+'</span>'+counter(null,id)+'</div>').join("")+'</article>'+
   '<div data-pf-notices></div>'+
   '<p class="pf-note">購入先を削除すると、その購入先に入力した枚数も削除されるよ。表示金額は税込の商品代金のみ。送料・手数料・割引は含まないよ。</p>'+
   '<div class="pf-name"><label for="pf-name">シェアするときの名前（任意）</label><input id="pf-name" data-pf-name type="text" maxlength="30" value="'+safe(plan.name)+'"><p class="pf-note">未入力なら「わたしの購入プラン」。名前や購入先はこの端末に保存されるよ。</p></div>'+
   '<button class="btn secondary" type="button" data-pf="compare">特典を見る</button><button class="btn ghost" type="button" data-pf="home">トップへ戻る</button></section>'+
   '<nav class="pf-bottom-nav" aria-label="画面操作"><button class="btn" type="button" data-pf="preview" data-pf-generate>画像を生成</button></nav>');
   updatePlanDom();
 }
 function giftNotice(){
   const matching=(qty(plan,"a_dvd")&&qty(plan,"b_dvd"))||(qty(plan,"a_bd")&&qty(plan,"b_bd"));
   return qty(plan,"regular")&&matching?'<div class="pf-caution">3形態同時購入特典を希望する場合は、購入先の「3形態特典付きセット」を確認してね！単品で購入した場合は特典対象外になることがあるよ！</div>':"";
 }
 function updatePlanDom(){
   if(screen!=="plan")return;
   const root=document.querySelector(".pf-root");if(!root)return;
   const set=(selector,value)=>{const el=root.querySelector(selector);if(el)el.textContent=value};
   set("[data-pf-total]",format(totalOf(plan,config))+"円");
   set("[data-pf-qty]",qtyOf(plan)+"枚");
   const budget=root.querySelector("[data-pf-budget]");if(budget){
     const amount=plan.originalBudget,total=totalOf(plan,config);
     budget.textContent=amount===null?"":total>amount?"当初の予算より "+format(total-amount)+"円多いよ！":"予算の残り "+format(amount-total)+"円";
   }
   root.querySelectorAll("[data-pf-count-for]").forEach(el=>{
     const id=el.querySelector("[data-pf='increase']")?.dataset.id;
     const placeId=el.querySelector("[data-pf='increase']")?.dataset.place;
     const val=placeId?plan.places.find(p=>p.id===placeId)?.items[id]:plan.fcItems[id];
     el.querySelector("strong").textContent=val??0;
     const minus=el.querySelector("[data-pf='decrease']"),plus=el.querySelector("[data-pf='increase']");
     if(minus)minus.disabled=!val;
     if(plus)plus.disabled=val>=99;
   });
   for(const p of plan.places)set('[data-pf-subtotal="'+p.id+'"]',format(NON_FC.reduce((sum,id)=>sum+p.items[id]*priceFor(id,config),0))+"円");
   const notices=root.querySelector("[data-pf-notices]");
   if(notices)notices.innerHTML=(qty(plan,"fc_dvd")+qty(plan,"fc_bd")?'<div class="pf-caution">FC限定盤の購入にはFC加入が必要だよ！受注期限は2026年12月21日23:59まで。</div>':"")+giftNotice();
   const button=document.querySelector("[data-pf-generate]");if(button)button.disabled=qtyOf(plan)===0;
 }
 const themeVars=()=>plan.imageOptions.theme==="movieMint"?{bg:"#d6f4ec",border:"#9fd5c9",accent:"#14877e",paper:"#fffef1",soft:"#f1f9e5"}:{bg:"#f9effb",border:"#e9d5ee",accent:"#8e4fa5",paper:"#ffffff",soft:"#f5e5fa"};
 function imageMarkup(){
   const colors=themeVars(),opts=plan.imageOptions,title=plan.name.trim()?plan.name.trim()+"の購入プラン":"わたしの購入プラン";
   const listing=plan.places.filter(p=>NON_FC.some(id=>p.items[id]>0)).map((p,i)=>{
     const hidden=p.type==="online"?opts.hideOnlineStoreNames:opts.hidePhysicalStoreNames;
     const order=plan.places.filter(k=>k.type===p.type&&NON_FC.some(id=>k.items[id]>0)).findIndex(k=>k.id===p.id)+1;
     const shown=hidden?(p.type==="online"?"オンライン購入先":"実店舗")+order:placeLabel(p);
     return '<div class="pf-image-place"><h3>'+safe(shown)+'</h3>'+NON_FC.filter(id=>p.items[id]>0).map(id=>'<div class="pf-image-line"><span>'+safe(names[id])+'</span><strong>'+p.items[id]+'枚</strong></div>').join("")+'</div>';
   }).join("");
   const fc=qty(plan,"fc_dvd")+qty(plan,"fc_bd");
   const fcMarkup=fc?'<div class="pf-image-place"><h3>ファミクラストアオンライン</h3>'+['fc_dvd','fc_bd'].filter(id=>plan.fcItems[id]>0).map(id=>'<div class="pf-image-line"><span>'+safe(names[id])+'</span><strong>'+plan.fcItems[id]+'枚</strong></div>').join("")+'</div>':"";
   const vars='--image-bg:'+colors.bg+';--image-border:'+colors.border+';--image-accent:'+colors.accent+';--image-paper:'+colors.paper+';--image-soft:'+colors.soft+';';
   return '<div class="pf-image-card" style="'+vars+'"><div class="pf-image-stars">✧ ♡ ✧</div><small>MY CD PURCHASE PLAN</small><h2>'+safe(title)+'</h2><p class="pf-image-release">ザユウノメイ／本当のことを言うと</p>'+
   '<div class="pf-image-places">'+listing+fcMarkup+'</div><div class="pf-image-footer"><span>CD合計 '+qtyOf(plan)+'枚</span><strong>'+format(totalOf(plan,config))+'円</strong></div><p class="pf-image-credit">タムごと新曲応援ナビ</p></div>';
 }
 function closePreview(){if(modal){modal.remove();modal=null;document.body.classList.remove("pf-modal-open")}}
 function refreshPreview(){if(!modal)return;const target=modal.querySelector("[data-pf-image-preview]");if(target)target.innerHTML=imageMarkup()}
 function openPreview(){
   if(qtyOf(plan)===0)return;
   closePreview();
   modal=document.createElement("div");modal.className="pf-modal-overlay";
   const opts=plan.imageOptions;
   modal.innerHTML='<section class="pf-modal" role="dialog" aria-modal="true" aria-labelledby="pf-modal-heading"><div class="pf-modal-head"><h2 id="pf-modal-heading">購入プランの画像プレビュー</h2><button class="pf-modal-close" type="button" data-pf="close-modal" aria-label="閉じる">×</button></div>'+
   '<div class="pf-modal-body"><div class="pf-preview-frame" data-pf-image-preview></div>'+
   '<fieldset class="pf-modal-options"><legend>画像のオプション</legend>'+
   '<label><input type="checkbox" data-pf-option="hideOnlineStoreNames"'+(opts.hideOnlineStoreNames?" checked":"")+'>オンラインの店名を隠す</label>'+
   '<label><input type="checkbox" data-pf-option="hidePhysicalStoreNames"'+(opts.hidePhysicalStoreNames?" checked":"")+'>実店舗の店名を隠す</label>'+
   '<p>カラー</p><div class="pf-theme-options"><label><input type="radio" name="pf-image-theme" data-pf-theme="purplePink"'+(opts.theme==="purplePink"?" checked":"")+'>紫×ピンク</label>'+
   '<label><input type="radio" name="pf-image-theme" data-pf-theme="movieMint"'+(opts.theme==="movieMint"?" checked":"")+'>ミント×淡いイエロー</label></div></fieldset>'+
   '<div class="pf-modal-buttons"><button type="button" class="btn secondary" data-pf="save-image">画像を保存</button><button type="button" class="btn" data-pf="share-image">共有する</button></div></div></section>';
   document.body.appendChild(modal);document.body.classList.add("pf-modal-open");
   refreshPreview();
   modal.querySelector(".pf-modal-close")?.focus();
 }
 async function generatePng(){
   const wrapper=document.createElement("div");wrapper.className="pf-export-node";wrapper.innerHTML=imageMarkup();document.body.appendChild(wrapper);
   try{
     await document.fonts?.ready;
     const {toBlob}=await import("https://cdn.jsdelivr.net/npm/html-to-image@1.11.13/+esm");
     const blob=await toBlob(wrapper,{backgroundColor:themeVars().bg,pixelRatio:1,cacheBust:true});
     if(!blob)throw Error("画像を生成できませんでした");
     return blob;
   }finally{wrapper.remove()}
 }
 async function saveOrShare(button,share){
   if(qtyOf(plan)===0)return;
   button.disabled=true;const label=button.textContent;button.textContent="画像を作成中…";
   try{
     const blob=await generatePng();
     const file=new File([blob],"タムごと_購入プラン.png",{type:"image/png"});
     if(share&&navigator.share&&navigator.canShare?.({files:[file]})){
       try{await navigator.share({files:[file],text:SHARE_TEXT,title:"購入プラン"});return}catch(e){if(e.name==="AbortError")return}
     }
     const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=file.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
     if(share){try{await navigator.clipboard.writeText(SHARE_TEXT);alert("画像を保存しました。共有用テキストをコピーしたよ！")}catch{alert("画像を保存しました。共有テキスト：\n"+SHARE_TEXT)}}
   }catch(err){console.error(err);alert("画像の生成に失敗しました。通信状況を確認して再度お試しください。")}
   finally{button.disabled=false;button.textContent=label}
 }
 function addSelectedFromCompare(id){
   if(isFc(id)){plan.fcItems[id]=1;return}
   let place=plan.places.find(p=>p.type==="online");
   if(!place){place=makePlace("online");plan.places.push(place)}
   place.items[id]=1;
 }
 function removeSelectedFromCompare(id){
   if(isFc(id)){plan.fcItems[id]=0;return}
   for(const p of plan.places)p.items[id]=0;
 }
 document.addEventListener("click",event=>{
   if(modal&&event.target===modal){closePreview();return}
   const button=event.target.closest("[data-pf]");if(!button)return;
   const action=button.dataset.pf,id=button.dataset.id,placeId=button.dataset.place;
   if(action==="home"){closePreview();goHome();return}
   if(action==="back"){closePreview();back();return}
   if(action==="compare"){previous="plan";comparison();return}
   if(action==="to-plan"){previous="comparison";persist();showPlan();return}
   if(action==="show-add-online"||action==="show-add-store"){addMode=action==="show-add-online"?"online":"store";document.querySelector("[data-pf-add-form]").innerHTML=addForm();return}
   if(action==="cancel-place"){addMode=null;document.querySelector("[data-pf-add-form]").innerHTML="";return}
   if(action==="add-place"){
     const field=document.querySelector("#pf-shop-custom"),shop=document.querySelector("#pf-shop-select")?.value||"";
     const name=(field?.value||"").trim().slice(0,10);
     if(addMode==="online"&&!shop){alert("購入先を選択してね！");return}
     if((addMode==="store"||shop==="other")&&!name){alert("購入先の名前を入力してね！");return}
     // Multiple entries, including the same named online shop, are permitted.
     const place=makePlace(addMode,addMode==="online"?shop:"",name);
     plan.places.push(place);addMode=null;persist();
     document.querySelector("[data-pf-add-form]").innerHTML="";
     document.querySelector("[data-pf-places]").insertAdjacentHTML("beforeend",placeCard(place));return;
   }
   if(action==="remove-place"){
     const place=plan.places.find(p=>p.id===placeId);
     if(!place)return;
     const count=NON_FC.reduce((sum,id)=>sum+place.items[id],0);
     if(count&&!confirm("「"+placeLabel(place)+"」の購入予定 "+count+"枚も削除するよ。削除する？"))return;
     plan.places=plan.places.filter(p=>p.id!==placeId);persist();
     document.querySelector('[data-place-card="'+placeId+'"]')?.remove();updatePlanDom();return;
   }
   if(action==="increase"||action==="decrease"){
     const delta=action==="increase"?1:-1;
     if(!ITEM_IDS.includes(id))return;
     if(button.dataset.fc==="true")plan.fcItems[id]=digits(plan.fcItems[id]+delta);
     else{
       const place=plan.places.find(p=>p.id===placeId);
       if(!place||isFc(id))return;
       place.items[id]=digits(place.items[id]+delta);
     }
     persist();updatePlanDom();return;
   }
   if(action==="toggle"){
     if(!ITEM_IDS.includes(id))return;
     const selected=qty(plan,id)>0;
     if(selected)removeSelectedFromCompare(id);else addSelectedFromCompare(id);
     persist();
     button.classList.toggle("is-added",!selected);button.setAttribute("aria-pressed",String(!selected));
     const icon=button.querySelector(".pf-choice-icon");if(icon)icon.textContent=selected?"＋":"✓";
     const label=button.querySelector(".pf-choice-label")?.textContent||"";
     button.setAttribute("aria-label",label+(selected?" を追加":" を選択解除"));
     const current=document.querySelector("[data-pf-selected-count]");if(current)current.textContent="（"+qtyOf(plan)+"枚）";
     return;
   }
   if(action==="preview"){openPreview();return}
   if(action==="close-modal"){closePreview();return}
   if(action==="save-image"||action==="share-image"){saveOrShare(button,action==="share-image");return}
 });
 document.addEventListener("change",event=>{
   const target=event.target;
   if(target.matches("[data-pf-shop-select]")){const wrap=document.querySelector("[data-pf-other-wrap]");if(wrap)wrap.hidden=target.value!=="other"}
   if(target.matches("[data-pf-option]")){plan.imageOptions[target.dataset.pfOption]=target.checked;persist();refreshPreview()}
   if(target.matches("[data-pf-theme]")){plan.imageOptions.theme=target.dataset.pfTheme;persist();refreshPreview()}
 });
 document.addEventListener("input",event=>{
   if(event.target.matches("[data-pf-name]")){plan.name=event.target.value.slice(0,30);persist()}
 });
 document.addEventListener("keydown",event=>{if(event.key==="Escape"&&modal)closePreview()});
 return {openFromResult,openFromHome,openCompare,resume,hasSaved,showPlan};
}
