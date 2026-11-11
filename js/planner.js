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
const SHOP_NAMES={amazon:"Amazon.co.jp",rakuten:"楽天ブックス",hmv:"HMV&BOOKS online",tower:"タワーレコード オンライン",sevennet:"セブンネットショッピング",other:"その他"};
const digits=n=>Math.max(0,Math.min(99,Math.floor(Number(n)||0)));
let sequence=0;
const makePlace=(type="online",shopKey="",label="")=>({id:"place_"+Date.now().toString(36)+"_"+(++sequence),type,shopKey,label,items:Object.fromEntries(NON_FC.map(id=>[id,0])),sets:{dvd:0,bd:0}});
const initial=()=>({version:2,source:"count",name:"",originalBudget:null,budgetLabel:"",recommended:[],places:[],fcItems:{fc_dvd:0,fc_bd:0},imageOptions:{hideOnlineStoreNames:false,hidePhysicalStoreNames:false,theme:"purplePink"},updatedAt:""});
const normalizePlace=p=>({id:String(p.id||"place_"+(++sequence)),type:p.type==="store"?"store":p.type==="unassigned"?"unassigned":"online",shopKey:String(p.shopKey||""),label:String(p.label||"").slice(0,10),items:Object.fromEntries(NON_FC.map(id=>[id,digits(p.items?.[id])])),sets:{dvd:p.type==="online"?digits(p.sets?.dvd):0,bd:p.type==="online"?digits(p.sets?.bd):0}});
const plansafe=value=>value&&typeof value==="object"?{
 ...initial(),...value,version:2,
 places:Array.isArray(value.places)?value.places.map(normalizePlace).map(p=>p.type==="online"&&!p.shopKey&&!p.label?{...p,type:"unassigned",label:"未設定"}:p):[],
 fcItems:{fc_dvd:digits(value.fcItems?.fc_dvd),fc_bd:digits(value.fcItems?.fc_bd)},
 imageOptions:{...initial().imageOptions,...value.imageOptions}
}:initial();
const qty=(plan,id)=>isFc(id)?digits(plan.fcItems[id]):plan.places.reduce((sum,p)=>sum+digits(p.items[id]),0);
const qtyOf=plan=>ITEM_IDS.reduce((sum,id)=>sum+qty(plan,id),0);
const totalOf=(plan,config)=>ITEM_IDS.reduce((sum,id)=>sum+qty(plan,id)*priceFor(id,config),0);
const selectedIds=plan=>ITEM_IDS.filter(id=>qty(plan,id)>0);
const onlineLabel=p=>p.shopKey==="other"?p.label:(SHOP_NAMES[p.shopKey]||p.label||"購入先を選択");
const placeLabel=p=>p.type==="unassigned"?"未設定":p.type==="online"?onlineLabel(p):(p.label||"店舗名未入力");
const ensureUnassigned=plan=>{
  const registered=plan.places.find(p=>p.type==="online"||p.type==="store");
  const pending=plan.places.filter(p=>p.type==="unassigned");
  if(registered){
    // Move all outstanding unassigned copies to the first registered place.
    if(pending.length){
      const fits=NON_FC.every(id=>registered.items[id]+pending.reduce((sum,p)=>sum+p.items[id],0)<=99);
      if(fits){
        for(const id of NON_FC)registered.items[id]+=pending.reduce((sum,p)=>sum+p.items[id],0);
        plan.places=plan.places.filter(p=>p.type!=="unassigned");
      }
    }
    return registered;
  }
  let p=pending[0];
  if(!p){p=makePlace("unassigned","","未設定");plan.places.unshift(p)}
  // Collapse older duplicated unassigned entries safely.
  for(const duplicate of pending.slice(1)){
    for(const id of NON_FC)p.items[id]+=duplicate.items[id];
    plan.places=plan.places.filter(x=>x!==duplicate);
  }
  return p;
};
const setIngredients=format=>["regular","a_"+format,"b_"+format];
const setNum=(p,format)=>digits(p.sets?.[format]);
const reduceSets=(p,id,next)=>{
 const items={...p.items,[id]:next};
 const dvd=Math.max(0,Math.min(setNum(p,"dvd"),items.a_dvd,items.b_dvd,items.regular));
 const bd=Math.max(0,Math.min(setNum(p,"bd"),items.a_bd,items.b_bd,items.regular-dvd));
 return {dvd,bd};
};

const migrateOld=old=>{
 const result=initial();result.source=old.source||"count";result.name=old.name||"";
 result.originalBudget=old.originalBudget??null;result.budgetLabel=old.budgetLabel||"";
 result.recommended=old.recommended||[];
 const online=makePlace("online","other","ネット通販");
 const store=makePlace("store","","店舗");
 for(const id of NON_FC){online.items[id]=digits(old.items?.[id]?.online);store.items[id]=digits(old.items?.[id]?.store)}
 if(NON_FC.some(id=>online.items[id]>0)){online.type="unassigned";online.shopKey="";online.label="未設定";result.places.push(online)}
 if(NON_FC.some(id=>store.items[id]>0)){store.type="unassigned";store.label="未設定";result.places.push(store)}
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
  if(normal.length){const place=ensureUnassigned(plan);normal.forEach(id=>place.items[id]=1)}
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
 const begin=result=>{plan=result?seededPlan(result,config):initial();ensureUnassigned(plan);addMode=null;persist();showPlan()};
 const resume=()=>{plan=read()||initial();ensureUnassigned(plan);addMode=null;persist();showPlan()};
 const openFromResult=result=>{previous="result";const saved=read();if(saved){plan=saved;ensureUnassigned(plan);showPlan()}else begin(result)};
 const openFromHome=()=>{previous="home";const saved=read();if(saved){plan=saved;ensureUnassigned(plan);addMode=null;persist();showPlan()}else begin(null)};
 const openCompare=()=>{previous="home";plan=read()||initial();ensureUnassigned(plan);comparison()};
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
    '<div class="pf-purchase-advice"><h3>ネット通販の場合</h3><p>「3形態同時購入特典付」と書かれているセットを選ぼう！</p><p>定価は4,920円なのでそれより高いところは気をつけてね！</p></div></section>'+
    '<button class="btn secondary" type="button" data-pf="home">トップへ戻る</button></section>'+
    '<nav class="pf-bottom-nav" aria-label="画面操作"><button type="button" class="btn" data-pf="to-plan">購入プランを作る <span data-pf-selected-count>（'+qtyOf(plan)+'枚）</span></button></nav>';
 }
 const addForm=()=>addMode?'<div class="pf-add-form"><h3>'+(addMode==="online"?"ネット通販の購入先を追加":"店舗を追加")+'</h3>'+
   (addMode==="online"?'<label for="pf-shop-select">購入先</label><select id="pf-shop-select" data-pf-shop-select><option value="">選択してください</option>'+Object.entries(SHOP_NAMES).map(([key,label])=>'<option value="'+key+'">'+label+'</option>').join("")+'</select><div data-pf-other-wrap hidden><label for="pf-shop-custom">購入先の名前（10文字まで）</label><input id="pf-shop-custom" maxlength="10" type="text"></div>':
   '<label for="pf-shop-custom">店舗名（10文字まで）</label><input id="pf-shop-custom" maxlength="10" type="text" placeholder="">')+
   '<div class="pf-add-actions"><button type="button" class="btn" data-pf="add-place">追加する</button><button type="button" class="btn secondary" data-pf="cancel-place">キャンセル</button></div></div>':"";
 function registeredPlaces(){
   return plan.places.filter(p=>p.type!=="unassigned");
 }
 function placeListMarkup(){
   const shops=registeredPlaces();
   const editor=p=>'<div class="pf-shop-editor" data-editor="'+safe(p.id)+'" hidden>'+
     (p.type==="online"?'<select aria-label="ネット通販の購入先" data-pf-place-select="'+safe(p.id)+'">'+
       '<option value="">選択してください</option>'+
       Object.entries(SHOP_NAMES).map(([key,label])=>'<option value="'+key+'"'+(p.shopKey===key?' selected':'')+'>'+label+'</option>').join("")+'</select>':"")+
     '<div data-pf-place-other="'+safe(p.id)+'"'+(p.type==="online"&&p.shopKey!=="other"?" hidden":"")+'>'+
       '<input type="text" maxlength="10" aria-label="購入先の名前" data-pf-place-custom="'+safe(p.id)+'" value="'+safe(p.type==="store"||p.shopKey==="other"?p.label:"")+'" placeholder="10文字まで"></div>'+
     '<div class="pf-editor-buttons"><button type="button" data-pf="save-edit-place" data-place="'+safe(p.id)+'">保存</button><button type="button" data-pf="cancel-edit-place" data-place="'+safe(p.id)+'">キャンセル</button></div></div>';
   return '<div class="pf-configured-list">'+shops.map(p=>
     '<div class="pf-configured-item" data-configured-place="'+safe(p.id)+'">'+
       '<strong class="pf-shop-name">'+safe(placeLabel(p))+'</strong>'+
       '<button type="button" class="pf-edit-place" data-pf="edit-place" data-place="'+safe(p.id)+'">編集</button>'+
       '<button type="button" class="pf-remove-place" data-pf="remove-place" data-place="'+safe(p.id)+'">削除</button>'+
       editor(p)+'</div>').join("")+'</div>';
 }
 function counter(place,id){
   const val=isFc(id)?plan.fcItems[id]:place.items[id];
   const attr=isFc(id)?'data-fc="true"':'data-place="'+safe(place.id)+'"';
   return '<div class="pf-counter" data-pf-count-for="'+(isFc(id)?"fc":safe(place.id))+'-'+id+'"><button type="button" data-pf="decrease" '+attr+' data-id="'+id+'" aria-label="'+safe(names[id])+'を1枚減らす"'+(val===0?' disabled':'')+'>－</button><strong>'+val+'</strong><button type="button" data-pf="increase" '+attr+' data-id="'+id+'" aria-label="'+safe(names[id])+'を1枚増やす"'+(val>=99?' disabled':'')+'>＋</button></div>';
 }
 function formatRow(id){
   const entries=isFc(id)?[{id:"fc",type:"fc",label:"ファミクラストアオンライン"}]:plan.places.map(p=>({id:p.id,type:p.type,label:placeLabel(p),place:p}));
   const visible=entries.filter(p=>!isFc(id)||p.type==="fc").filter(p=>p.type!=="unassigned"||!registeredPlaces().length);
   return '<div class="pf-edition-place-list">'+visible.map(entry=>'<div class="pf-edition-place-row"><span class="pf-edition-place-label">'+safe(entry.label)+'</span>'+counter(entry.place||null,id)+'</div>').join("")+'</div>';
 }
 function setRows(){
   const shops=registeredPlaces().filter(p=>p.type==="online");
   if(!shops.length)return "";
   const total=shops.reduce((sum,p)=>sum+setNum(p,"dvd")+setNum(p,"bd"),0);
   return '<article class="pf-product pf-product-group pf-set-product">'+
     '<div class="pf-product-top"><div><h3>3形態特典セット</h3><span>4,920円</span></div>'+
     '<strong data-pf-set-total>'+total+'セット</strong></div>'+
     '<p class="pf-note">ネット通販でのセット購入用</p>'+
     ["dvd","bd"].map(format=>{
       const count=shops.reduce((sum,p)=>sum+setNum(p,format),0);
       return '<div class="pf-format-row"><span class="pf-format-title">'+(format==="dvd"?"DVD":"Blu-ray")+'</span>'+
         '<div class="pf-primary-value" data-pf-set-format-total="'+format+'">'+count+'セット</div>'+
         '<div class="pf-split"><div class="pf-edition-place-list">'+shops.map(p=>
           '<div class="pf-edition-place-row"><span class="pf-edition-place-label">'+safe(placeLabel(p))+'</span>'+
           '<div class="pf-counter" data-pf-set-counter="'+safe(p.id)+'-'+format+'">'+
           '<button type="button" data-pf="set-minus" data-place="'+safe(p.id)+'" data-format="'+format+'"'+(!setNum(p,format)?' disabled':'')+'>－</button>'+
           '<strong>'+setNum(p,format)+'</strong>'+
           '<button type="button" data-pf="set-plus" data-place="'+safe(p.id)+'" data-format="'+format+'"'+(setNum(p,format)>=99||setIngredients(format).some(id=>p.items[id]>=99)?' disabled':'')+'>＋</button>'+
           '</div></div>').join("")+'</div></div></div>';
     }).join("")+'</article>';
 }
 function showPlan(){
   screen="plan";ensureUnassigned(plan);
   const budget=plan.source==="budget"?'<div class="pf-meta"><div><small>当初の予算</small><strong>'+safe(plan.budgetLabel||"未設定")+'</strong></div><div><small>診断のおすすめ</small><strong>'+safe(plan.recommended.map(id=>names[id]).join("・")||"なし")+'</strong></div></div>':"";
   const groups=[["regular","通常盤",["regular"]],["a","初回限定盤A",["a_dvd","a_bd"]],["b","初回限定盤B",["b_dvd","b_bd"]],["fc","FC限定盤",["fc_dvd","fc_bd"]]];
   render('<section class="card pf-root pf-with-footer"><button type="button" class="pf-back" data-pf="back">← 戻る</button><h1>わたしのCD購入プラン</h1>'+budget+
     '<div class="pf-total"><div><small>現在の合計金額</small><strong data-pf-total></strong></div><div><small>CD合計</small><strong data-pf-qty></strong></div><p class="pf-budget-diff" data-pf-budget></p></div>'+
     '<section class="pf-channel"><h2>購入場所を設定する</h2><p class="pf-note">購入場所を追加してください。枚数は下の「枚数を設定する」から指定できます。</p>'+
     '<div data-pf-place-list>'+placeListMarkup()+'</div><div class="pf-add-actions"><button type="button" class="btn secondary" data-pf="show-add-online">＋ ネット通販を追加</button><button type="button" class="btn secondary" data-pf="show-add-store">＋ 店舗を追加</button></div>'+
     '<div data-pf-add-form>'+addForm()+'</div></section>'+
     '<section class="pf-quantity"><h2>枚数を設定する</h2>'+
     '<div data-pf-sets>'+setRows()+'</div><div data-pf-set-notice></div><div data-pf-editions>'+groups.map(([key,title,ids])=>'<article class="pf-product pf-product-group"><div class="pf-product-top"><div><h3>'+title+'</h3><span>'+format(priceFor(ids[0],config))+'円'+(ids.some(id=>plan.recommended.includes(id))?' <em class="pf-recommended">診断おすすめ</em>':'')+'</span></div><strong data-pf-group-total="'+key+'">'+ids.reduce((sum,id)=>sum+qty(plan,id),0)+'枚</strong></div>'+
       ids.map(id=>'<div class="pf-format-row"><span class="pf-format-title">'+(id==="regular"?"CD":id.endsWith("_dvd")?"DVD":"Blu-ray")+'</span><div class="pf-primary-value" data-pf-row-total="'+id+'">'+qty(plan,id)+'枚</div>'+
       '<div class="pf-split">'+formatRow(id)+'</div></div>').join("")+(key==='fc'?'<div data-pf-fc-notice></div>':'')+'</article>').join("")+'</div></section>'+
     '<p class="pf-note pf-system-notes">※購入場所を削除するとそこに設定した枚数も削除されます。<br>※表示金額は定価の税込金額となります。送料や割引は各店舗、各通販サイトでご確認ください。</p>'+
     '<div class="pf-name"><label for="pf-name">シェアするときの名前（任意）</label><input id="pf-name" data-pf-name type="text" maxlength="30" value="'+safe(plan.name)+'"><p class="pf-note">名前や購入先はこの端末に保存されます。</p></div>'+
     '<button type="button" class="btn secondary" data-pf="compare">特典を見る</button><button type="button" class="btn secondary pf-clear-button" data-pf="clear-plan">購入プランをクリア</button><button type="button" class="btn ghost" data-pf="home">トップへ戻る</button></section>'+
     '<nav class="pf-bottom-nav"><button type="button" class="btn" data-pf="preview" data-pf-generate>画像を生成</button></nav>');
   updatePlanDom();
 }
 function giftNotice(){
   const matching=(qty(plan,"a_dvd")&&qty(plan,"b_dvd"))||(qty(plan,"a_bd")&&qty(plan,"b_bd"));
   return qty(plan,"regular")&&matching?'<div class="pf-caution">3形態同時購入特典を希望する場合は、購入先の「3形態特典付きセット」をご確認ください。単品購入の場合、特典の対象外になることがあります。</div>':"";
 }
 function updatePlanDom(){
   if(screen!=="plan")return;
   const root=document.querySelector(".pf-root");if(!root)return;
   const set=(selector,value)=>{const el=root.querySelector(selector);if(el)el.textContent=value};
   set("[data-pf-total]",format(totalOf(plan,config))+"円");
   set("[data-pf-qty]",qtyOf(plan)+"枚");
   const budget=root.querySelector("[data-pf-budget]");
   if(budget){const amount=plan.originalBudget,total=totalOf(plan,config);
     budget.textContent=amount===null?"":total>amount?"当初の予算より "+format(total-amount)+"円多いよ！":"予算の残り "+format(amount-total)+"円";
   }
   for(const id of ITEM_IDS)set('[data-pf-row-total="'+id+'"]',qty(plan,id)+"枚");
   for(const key of ["regular","a","b","fc"]){
     const ids=key==="regular"?["regular"]:[key+"_dvd",key+"_bd"];
     set('[data-pf-group-total="'+key+'"]',ids.reduce((n,id)=>n+qty(plan,id),0)+"枚");
   }
   root.querySelectorAll("[data-pf-count-for]").forEach(el=>{
     const plus=el.querySelector("[data-pf='increase']"),minus=el.querySelector("[data-pf='decrease']");
     const id=plus?.dataset.id,placeId=plus?.dataset.place;
     const val=placeId?plan.places.find(p=>p.id===placeId)?.items[id]:plan.fcItems[id];
     const strong=el.querySelector("strong");if(strong)strong.textContent=val??0;
     if(minus)minus.disabled=!val;if(plus)plus.disabled=val>=99;
   });
   set("[data-pf-set-total]",plan.places.reduce((sum,p)=>sum+setNum(p,"dvd")+setNum(p,"bd"),0)+"セット");
   for(const format of ["dvd","bd"])set('[data-pf-set-format-total="'+format+'"]',plan.places.reduce((sum,p)=>sum+setNum(p,format),0)+"セット");
   root.querySelectorAll("[data-pf-set-counter]").forEach(el=>{
     const plus=el.querySelector("[data-pf='set-plus']"),minus=el.querySelector("[data-pf='set-minus']");
     const p=plan.places.find(p=>p.id===plus?.dataset.place),format=plus?.dataset.format;
     if(!p||!format)return;
     el.querySelector("strong").textContent=setNum(p,format);
     if(minus)minus.disabled=setNum(p,format)===0;
     if(plus)plus.disabled=setNum(p,format)>=99||setIngredients(format).some(id=>p.items[id]>=99);
   });
   const fcNotice=root.querySelector("[data-pf-fc-notice]");
   if(fcNotice)fcNotice.innerHTML=qty(plan,"fc_dvd")+qty(plan,"fc_bd")?'<div class="pf-caution">FC限定盤の購入にはFC加入が必要です。受注期限は2026年12月21日23:59までです。</div>':"";
   const setNotice=root.querySelector("[data-pf-set-notice]");
   if(setNotice)setNotice.innerHTML=giftNotice();
   const button=document.querySelector("[data-pf-generate]");if(button)button.disabled=qtyOf(plan)===0;
 }
 function refreshLocationUI(){
   if(screen!=="plan")return;
   const list=document.querySelector("[data-pf-place-list]");
   const editions=document.querySelector("[data-pf-editions]");
   const sets=document.querySelector("[data-pf-sets]");
   if(list)list.innerHTML=placeListMarkup();
   if(editions){
     const ids=[...ITEM_IDS];
     for(const id of ids){
       const section=editions.querySelector('[data-pf-row-total="'+id+'"]')?.closest(".pf-format-row");
       const area=section?.querySelector(".pf-split");
       if(area)area.innerHTML=formatRow(id)
     }
   }
   if(sets)sets.innerHTML=setRows();
   updatePlanDom();
 }
 const themeVars=()=>plan.imageOptions.theme==="movieMint"?{bg:"#d6f4ec",border:"#9fd5c9",accent:"#14877e",paper:"#fffef1",soft:"#f1f9e5",pink:"#f3dbef"}:{bg:"#f3eefd",border:"#c6ace9",accent:"#7346b4",paper:"#fffafd",soft:"#faeaf4",pink:"#f2c7dd"};
 function imageMarkup(){
   const colors=themeVars(),opts=plan.imageOptions,title=plan.name.trim()?plan.name.trim()+"の購入プラン":"わたしの購入プラン";
   const active=plan.places.filter(p=>NON_FC.some(id=>p.items[id]>0));
   const listing=active.map(p=>{
     const hidden=p.type==="online"?opts.hideOnlineStoreNames:p.type==="store"?opts.hidePhysicalStoreNames:false;
     const order=active.filter(k=>k.type===p.type).findIndex(k=>k.id===p.id)+1;
     const shown=hidden?(p.type==="online"?"ネット通販購入先":"店舗")+order:placeLabel(p);
     const sets=p.type==="online"?["dvd","bd"].filter(format=>setNum(p,format)>0).map(format=>
       '<div class="pf-image-line"><span>3形態セット（'+(format==="dvd"?"DVD":"Blu-ray")+'）</span><strong>'+setNum(p,format)+'セット</strong></div>').join(""):"";
     const singles=NON_FC.map(id=>{
       const included=p.type==="online"?(id==="regular"?setNum(p,"dvd")+setNum(p,"bd"):id.endsWith("_dvd")?setNum(p,"dvd"):setNum(p,"bd")):0;
       return {id,count:Math.max(0,p.items[id]-included)};
     }).filter(x=>x.count>0).map(x=>'<div class="pf-image-line"><span>'+safe(names[x.id])+'</span><strong>'+x.count+'枚</strong></div>').join("");
     return '<div class="pf-image-place"><h3>'+safe(shown)+'</h3>'+sets+singles+'</div>';
   }).join("");
   const fc=qty(plan,"fc_dvd")+qty(plan,"fc_bd");
   const fcMarkup=fc?'<div class="pf-image-place"><h3>ファミクラストアオンライン</h3>'+['fc_dvd','fc_bd'].filter(id=>plan.fcItems[id]>0).map(id=>'<div class="pf-image-line"><span>'+safe(names[id])+'</span><strong>'+plan.fcItems[id]+'枚</strong></div>').join("")+'</div>':"";
   const vars='--image-bg:'+colors.bg+';--image-border:'+colors.border+';--image-accent:'+colors.accent+';--image-paper:'+colors.paper+';--image-soft:'+colors.soft+';--image-pink:'+colors.pink+';';
   return '<div class="pf-image-card" style="'+vars+'"><div class="pf-image-stars">✧ ♡ ✧</div><small>MY CD PURCHASE PLAN</small><h2>'+safe(title)+'</h2><p class="pf-image-release">ザユウノメイ／本当のことを言うと</p>'+
   '<div class="pf-image-places">'+listing+fcMarkup+'</div><div class="pf-image-footer"><span>CD合計 '+qtyOf(plan)+'枚</span><strong>'+format(totalOf(plan,config))+'円</strong></div><p class="pf-image-credit">タムごと新曲応援ナビ</p></div>';
 }
 function closePreview(){previewVersion++;closePreviewAssets();if(modal){modal.remove();modal=null;document.body.classList.remove("pf-modal-open")}}
 let previewVersion=0,previewUrl=null;
 function closePreviewAssets(){if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl=null}}
 async function refreshPreview(){
   const current=modal;if(!current)return;
   const version=++previewVersion;
   const target=current.querySelector("[data-pf-image-preview]");
   if(!target)return;
   target.textContent="画像プレビューを生成中…";
   try{
     const blob=await generatePng();
     if(version!==previewVersion||modal!==current)return;
     closePreviewAssets();
     previewUrl=URL.createObjectURL(blob);
     target.innerHTML='<img class="pf-generated-preview" alt="購入プランの画像プレビュー">';
     target.querySelector("img").src=previewUrl;
   }catch(error){
     console.error("購入プラン画像プレビューに失敗",error);
     if(version===previewVersion&&modal===current){
       target.innerHTML=imageMarkup();
       const note=document.createElement("p");note.className="pf-note";
       note.textContent="プレビュー画像の生成に失敗しました。表示中の内容は参考表示です。";
       target.appendChild(note);
     }
   }
 }
 function openPreview(){
   if(qtyOf(plan)===0)return;
   closePreview();
   modal=document.createElement("div");modal.className="pf-modal-overlay";
   const opts=plan.imageOptions;
   modal.innerHTML='<section class="pf-modal" role="dialog" aria-modal="true" aria-labelledby="pf-modal-heading"><div class="pf-modal-head"><h2 id="pf-modal-heading">購入プランの画像プレビュー</h2><button class="pf-modal-close" type="button" data-pf="close-modal" aria-label="閉じる">×</button></div>'+
   '<div class="pf-modal-body"><div class="pf-preview-frame" data-pf-image-preview></div>'+
   '<fieldset class="pf-modal-options"><legend>画像のオプション</legend>'+
   '<label><input type="checkbox" data-pf-option="hideOnlineStoreNames"'+(opts.hideOnlineStoreNames?" checked":"")+'>ネット通販の店名を隠す</label>'+
   '<label><input type="checkbox" data-pf-option="hidePhysicalStoreNames"'+(opts.hidePhysicalStoreNames?" checked":"")+'>店舗の店名を隠す</label>'+
   '<p>カラー</p><div class="pf-theme-options"><label><input type="radio" name="pf-image-theme" data-pf-theme="purplePink"'+(opts.theme==="purplePink"?" checked":"")+'>カラー①</label>'+
   '<label><input type="radio" name="pf-image-theme" data-pf-theme="movieMint"'+(opts.theme==="movieMint"?" checked":"")+'>カラー②</label></div></fieldset>'+
   '<div class="pf-modal-buttons"><button type="button" class="btn" data-pf="share-image">画像を保存・共有する</button></div></div></section>';
   document.body.appendChild(modal);document.body.classList.add("pf-modal-open");
   refreshPreview();
   modal.querySelector(".pf-modal-close")?.focus();
 }
 async function generatePng(){
   const sections=[];
   const active=plan.places.filter(p=>NON_FC.some(id=>p.items[id]>0));
   for(const p of active){
     const hidden=p.type==="online"?plan.imageOptions.hideOnlineStoreNames:p.type==="store"?plan.imageOptions.hidePhysicalStoreNames:false;
     const order=active.filter(k=>k.type===p.type).findIndex(k=>k.id===p.id)+1;
     const title=hidden?(p.type==="online"?"ネット通販購入先":"店舗")+order:placeLabel(p);
     const entries=[];
     if(p.type==="online")for(const format of ["dvd","bd"])if(setNum(p,format)>0)
       entries.push(["3形態セット（"+(format==="dvd"?"DVD":"Blu-ray")+"）",setNum(p,format)+"セット"]);
     for(const id of NON_FC){
       const allocated=p.type==="online"?(id==="regular"?setNum(p,"dvd")+setNum(p,"bd"):id.endsWith("_dvd")?setNum(p,"dvd"):setNum(p,"bd")):0;
       const count=Math.max(0,p.items[id]-allocated);
       if(count)entries.push([names[id],count+"枚"]);
     }
     sections.push({title,entries});
   }
   const fcEntries=["fc_dvd","fc_bd"].filter(id=>plan.fcItems[id]>0).map(id=>[names[id],plan.fcItems[id]+"枚"]);
   if(fcEntries.length)sections.push({title:"ファミクラストアオンライン",entries:fcEntries});
   const title=plan.name.trim()?plan.name.trim()+"の購入プラン":"わたしの購入プラン";
   const {renderPlanPng}=await import("./planCanvas.js?v=20261111-no-reel-v5");
   return renderPlanPng({sections,title,releaseTitle:"ザユウノメイ／本当のことを言うと",totalCount:qtyOf(plan),totalPrice:totalOf(plan,config),colors:themeVars(),theme:plan.imageOptions.theme});
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
   const place=ensureUnassigned(plan);
   place.items[id]=Math.max(1,place.items[id]);
 }
 function removeSelectedFromCompare(id){
   if(isFc(id)){plan.fcItems[id]=0;return}
   for(const p of plan.places){
     p.items[id]=0;
     if(p.type==="online")p.sets=reduceSets(p,id,0);
   }
 }
 document.addEventListener("click",event=>{
   if(modal&&event.target===modal){closePreview();return}
   const button=event.target.closest("[data-pf]");if(!button)return;
   const action=button.dataset.pf,id=button.dataset.id,placeId=button.dataset.place;
   if(action==="home"){closePreview();goHome();return}
   if(action==="back"){closePreview();back();return}
   if(action==="compare"){previous="plan";comparison();return}
   if(action==="to-plan"){previous="comparison";persist();showPlan();return}
   if(action==="clear-plan"){
     if(!confirm("購入プランをクリアしますか？登録した購入先・枚数・名前・画像設定も削除されます。"))return;
     plan=initial();ensureUnassigned(plan);addMode=null;
     persist();showPlan();return;
   }
   if(action==="show-add-online"||action==="show-add-store"){addMode=action==="show-add-online"?"online":"store";document.querySelector("[data-pf-add-form]").innerHTML=addForm();return}
   if(action==="cancel-place"){addMode=null;document.querySelector("[data-pf-add-form]").innerHTML="";return}
   if(action==="edit-place"||action==="cancel-edit-place"){
     const editor=document.querySelector('[data-editor="'+placeId+'"]');
     if(!editor)return;
     if(action==="cancel-edit-place"){refreshLocationUI();return}
     editor.hidden=false;
     editor.querySelector("select,input")?.focus();
     return;
   }
   if(action==="save-edit-place"){
     const place=plan.places.find(p=>p.id===placeId);
     const editor=document.querySelector('[data-editor="'+placeId+'"]');
     if(!place||!editor)return;
     if(place.type==="online"){
       const shop=editor.querySelector("[data-pf-place-select]")?.value||"";
       if(!shop){alert("購入先を選択してください。");return}
       const label=editor.querySelector("[data-pf-place-custom]")?.value.trim().slice(0,10)||"";
       if(shop==="other"&&!label){alert("購入先の名前を入力してください。");return}
       place.shopKey=shop;place.label=shop==="other"?label:SHOP_NAMES[shop];
     }else{
       const label=editor.querySelector("[data-pf-place-custom]")?.value.trim().slice(0,10)||"";
       if(!label){alert("店舗名を入力してください。");return}
       place.label=label;
     }
     persist();refreshLocationUI();return;
   }
   if(action==="add-place"){
     const field=document.querySelector("#pf-shop-custom"),shop=document.querySelector("#pf-shop-select")?.value||"";
     const name=(field?.value||"").trim().slice(0,10);
     if(addMode==="online"&&!shop){alert("購入先を選択してください。");return}
     if((addMode==="store"||shop==="other")&&!name){alert("購入先の名前を入力してください。");return}
     const place=makePlace(addMode,addMode==="online"?shop:"",name);
     plan.places.push(place);ensureUnassigned(plan);addMode=null;persist();
     document.querySelector("[data-pf-add-form]").innerHTML="";
     refreshLocationUI();return;
   }
   if(action==="remove-place"){
     const place=plan.places.find(p=>p.id===placeId);
     if(!place||place.type==="unassigned")return;
     const count=NON_FC.reduce((sum,id)=>sum+place.items[id],0);
     if(count&&!confirm("「"+placeLabel(place)+"」の購入予定 "+count+"枚と3形態セットも削除されます。削除しますか？"))return;
     plan.places=plan.places.filter(p=>p.id!==placeId);persist();refreshLocationUI();return;
   }
   if(action==="set-plus"||action==="set-minus"){
     const place=plan.places.find(p=>p.id===placeId),format=button.dataset.format;
     if(!place||place.type!=="online"||!["dvd","bd"].includes(format))return;
     const delta=action==="set-plus"?1:-1;
     const current=setNum(place,format),parts=setIngredients(format);
     if(current+delta<0||current+delta>99||delta>0&&parts.some(id=>place.items[id]>=99))return;
     place.sets[format]=current+delta;
     parts.forEach(id=>{place.items[id]=digits(place.items[id]+delta)});
     persist();updatePlanDom();return;
   }
   if(action==="increase"||action==="decrease"){
     const delta=action==="increase"?1:-1;
     if(!ITEM_IDS.includes(id))return;
     if(button.dataset.fc==="true")plan.fcItems[id]=digits(plan.fcItems[id]+delta);
     else{
       const place=plan.places.find(p=>p.id===placeId);
       if(!place||isFc(id))return;
       const next=digits(place.items[id]+delta);
       if(place.type==="online"){
         const remaining=reduceSets(place,id,next);
         const reduction=(setNum(place,"dvd")-remaining.dvd)+(setNum(place,"bd")-remaining.bd);
         if(reduction>0&&!confirm("この変更により3形態セットが"+reduction+"セット解除されます。変更しますか？"))return;
         if(reduction>0)place.sets=remaining;
       }
       place.items[id]=next;
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
   if(action==="share-image"){saveOrShare(button,true);return}
 });
 document.addEventListener("change",event=>{
   const target=event.target;
   if(target.matches("[data-pf-shop-select]")){const wrap=document.querySelector("[data-pf-other-wrap]");if(wrap)wrap.hidden=target.value!=="other"}
   if(target.matches("[data-pf-place-select]")){
     const editor=target.closest("[data-editor]");
     const wrap=editor?.querySelector("[data-pf-place-other]");
     if(wrap)wrap.hidden=target.value!=="other";
   }
   if(target.matches("[data-pf-option]")){plan.imageOptions[target.dataset.pfOption]=target.checked;persist();refreshPreview()}
   if(target.matches("[data-pf-theme]")){plan.imageOptions.theme=target.dataset.pfTheme;persist();refreshPreview()}
 });
 document.addEventListener("input",event=>{
   if(event.target.matches("[data-pf-name]")){plan.name=event.target.value.slice(0,30);persist()}

 });
 document.addEventListener("keydown",event=>{if(event.key==="Escape"&&modal)closePreview()});
 return {openFromResult,openFromHome,openCompare,resume,hasSaved,showPlan};
}
