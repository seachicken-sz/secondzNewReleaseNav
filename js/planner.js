import {IMAGE_FOOTER_LINE1,IMAGE_FOOTER_LINE2} from "./imageFooter.js?v=20261112-v1";
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
    tracks:[["ザユウノメイ"],["本当のことを言うと"],["45",true],["Still us",true]],
    videos:[],
    gifts:[["20P歌詞ブックレット"],["分けて使える！オリジナルステッカーシート ver.C",true],["シリアルコード入りプレイリストカード"]],
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

export function createPurchaseFlow({config,render,goHome,goResult,onExtraSupport}){
 let plan=initial(),screen="home",previous="home",addMode=null,modal=null;
 let compareSelection=["regular"],quizFc="",quizPriority="";
 const eligibleEditions=()=>deadlineOk(config.deadline)?["regular","a","b","fc"]:["regular","a","b"];
 const scrollToPart=id=>requestAnimationFrame(()=>document.getElementById(id)?.scrollIntoView({behavior:"smooth",block:"start"}));
 const editionId=id=>id==="regular"?"regular":id+"_dvd";
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
 const openRecommendedFromResult=result=>{if(!result)return;const saved=read();if(saved&&(selectedIds(saved).length||saved.name||saved.places.some(p=>p.type!=="unassigned"))&&!confirm("保存済みのCD購入プランを、おすすめ内容で上書きします。よろしいですか？"))return;previous="result";plan=seededPlan(result,config);if(saved?.name)plan.name=saved.name;if(saved?.imageOptions)plan.imageOptions={...plan.imageOptions,...saved.imageOptions};ensureUnassigned(plan);addMode=null;persist();showPlan()};
 const openCompareFromResult=()=>{previous="result";plan=read()||initial();ensureUnassigned(plan);comparison()};
 const openFromHome=()=>{previous="home";const saved=read();if(saved){plan=saved;ensureUnassigned(plan);addMode=null;persist();showPlan()}else begin(null)};
 const openCompare=()=>{previous="home";plan=read()||initial();ensureUnassigned(plan);comparison()};
 const comparison=()=>{screen="comparison";compareSelection=["regular"];quizFc="";quizPriority="";render(compareMarkup())};
 const back=()=>{if(previous==="result")goResult();else if(previous==="comparison")comparison();else if(previous==="plan")showPlan();else goHome()};
 const editionDetails=id=>{
   const d=detail[id];
   return '<p class="pf-description">'+safe(d.description)+'</p>'+
     '<h3>収録曲</h3>'+rows(d.tracks)+(d.videos.length?'<h3>映像特典</h3>'+rows(d.videos):"")+
     '<h3>'+(id==="regular"?"初回仕様封入特典":"封入特典")+'</h3>'+rows(d.gifts)+
     '<p class="pf-note">'+safe(d.note)+'</p>';
 };
 const editionActions=id=>'<div class="pf-edition-actions"><button type="button" class="btn" data-pf="choose-edition" data-edition="'+id+'">CD購入プランを作る</button><button type="button" class="btn secondary" data-pf="compare-edition" data-edition="'+id+'">特典を比較する</button></div>';
 const editionLabels={regular:"通常盤",a:"初回限定盤A",b:"初回限定盤B",fc:"FC限定盤"};
 const shortEditionLabels={regular:"通常",a:"初回A",b:"初回B",fc:"FC盤"};
 const priorityChoices=[["songs","とにかく曲をたくさん聴きたい！","regular"],["dance","timeleszの踊っているところを見たい！","a"],["visual","ビジュアルをじっくり楽しみたい！","b"],["variety","timeleszのわちゃわちゃが大好き！","fc"]];
 const recommendedEdition=()=>priorityChoices.find(([key,,id])=>key===quizPriority&&eligibleEditions().includes(id)&&(id!=="fc"||quizFc==="yes"))?.[2]||null;
 const quizMarkup=()=>{
   const active=eligibleEditions().includes("fc");
   const step1=active?'<fieldset class="pf-quiz-field"><legend>Q1. ファンクラブに加入している？</legend><label><input type="radio" name="pf-quiz-fc" value="yes" '+(quizFc==="yes"?"checked":"")+'> 加入している</label><label><input type="radio" name="pf-quiz-fc" value="no" '+(quizFc==="no"?"checked":"")+'> 加入していない</label></fieldset>':"";
   const showNext=!active||Boolean(quizFc);
   const choices=priorityChoices.filter(([, ,id])=>id!=="fc"||active&&quizFc==="yes");
   const step2=showNext?'<fieldset class="pf-quiz-field pf-quiz-reveal"><legend>'+(active?"Q2.":"Q1.")+' 何を一番楽しみたい？</legend>'+choices.map(([key,label])=>'<label><input type="radio" name="pf-quiz-priority" value="'+key+'" '+(quizPriority===key?"checked":"")+'> '+safe(label)+'</label>').join("")+'</fieldset>':"";
   const choice=recommendedEdition();
   const answer=choice?'<div class="pf-quiz-answer pf-quiz-reveal"><p class="pf-quiz-kicker">あなたにおすすめの一枚</p><h3>'+editionLabels[choice]+'</h3><p class="pf-description">'+safe(detail[choice].description)+'</p><details class="pf-quiz-details"><summary>収録曲・映像・封入特典を見る</summary><div>'+editionDetails(choice)+'</div></details>'+editionActions(choice)+'</div>':"";
   return '<section id="pf-quiz" class="pf-compare-section"><h2>好みからおすすめの特典を探す</h2><div class="pf-quiz-body"><div data-pf-quiz-step1>'+step1+'</div><div data-pf-quiz-step2>'+step2+'</div><div data-pf-quiz-answer>'+answer+'</div></div></section>';
 };
 const compareTableMarkup=()=>{
   const ids=eligibleEditions().filter(id=>compareSelection.includes(id));
   const chips=eligibleEditions().map(id=>'<button type="button" class="pf-compare-chip'+(ids.includes(id)?" is-active":"")+'" data-pf="compare-chip" data-edition="'+id+'" aria-pressed="'+ids.includes(id)+'">'+shortEditionLabels[id]+'</button>').join("");
   const columns=(get)=>ids.map(id=>'<td>'+get(id)+'</td>').join("");
   const subtracks={regular:[["45"],["Still us"]],a:[["大怪盗"],["大怪盗 -Inst-"]],b:[["Avocado"],["Avocado -Inst-"]],fc:[]};
   const comparison='<div class="pf-table-scroll" tabindex="0" aria-label="盤種別特典比較表・横スクロール可能"><table class="pf-comparison-table"><thead><tr>'+ids.map(id=>'<th scope="col">'+editionLabels[id]+'</th>').join("")+'</tr></thead><tbody>'+
     '<tr>'+columns(id=>subtracks[id].length?rows(subtracks[id]):'<p>追加カップリング曲なし</p>')+'</tr>'+
     '<tr>'+columns(id=>detail[id].videos.length?rows(detail[id].videos):'<p>映像特典なし</p>')+'</tr>'+
     '<tr>'+columns(id=>rows(detail[id].gifts.filter(([label])=>!label.includes("プレイリストカード"))))+'</tr>'+
     (["regular","a","b"].every(id=>ids.includes(id))?'<tr class="pf-compare-three-row"><td colspan="3"><strong>3形態同時購入特典</strong><p>初回限定盤A・初回限定盤B・通常盤を対象条件で購入すると専用特典がつくよ！</p><p>対象のセット商品・購入条件は販売店で確認してね。</p></td>'+(ids.includes("fc")?'<td>FC限定盤は対象外</td>':'')+'</tr>':"")+
     '</tbody></table></div>';
   const threeNotice="";
   return '<section id="pf-compare-table" class="pf-compare-section"><h2>特典を比較する</h2><div class="pf-common-tracks"><h3>全形態共通</h3><p>CD収録曲：「ザユウノメイ」「本当のことを言うと」</p><p>シリアルコード入りプレイリストカード（購入したCDの収録曲をスマホで聴けるよ！）</p><p>無料のtimeleSZアプリにカードのシリアルコードを登録して利用できます。</p><div class="pf-formats">'+openLink("App Store",IOS)+openLink("Google Play",ANDROID)+openLink("アプリの使い方",APPGUIDE)+'</div></div><div class="pf-compare-chips" aria-label="比較する盤種">'+chips+'</div>'+comparison+threeNotice+'</section>';
 };
 function compareMarkup(){
   compareSelection=eligibleEditions().filter(id=>compareSelection.includes(id));
   if(!compareSelection.length)compareSelection=[eligibleEditions()[0]];
   const visible=eligibleEditions();
   const toc='<nav class="pf-compare-toc" aria-label="このページの目次"><button type="button" class="pf-toc-section" data-pf="scroll-edition" data-edition="regular">特典を確認する</button><div class="pf-toc-editions">'+visible.map(id=>'<button type="button" data-pf="scroll-edition" data-edition="'+id+'">'+shortEditionLabels[id]+'</button>').join("")+'</div><button type="button" class="pf-toc-section" data-pf="scroll-section" data-target="pf-quiz">好みからおすすめの特典を探す</button><button type="button" class="pf-toc-section" data-pf="scroll-section" data-target="pf-compare-table">特典を比較する</button><button type="button" class="pf-toc-section" data-pf="scroll-section" data-target="pf-three-benefits">三形態同時購入特典について</button></nav>';
   const sections=visible.map(id=>'<section id="pf-edition-'+id+'" class="pf-edition pf-edition-flat"><div class="pf-edition-head"><h2>'+editionLabels[id]+'</h2><strong>'+format(priceFor(editionId(id),config))+'円</strong></div><p class="pf-muted">'+(id==="regular"?"CDのみ":"CD＋DVD／Blu-ray")+'</p>'+editionDetails(id)+editionActions(id)+'</section>').join("");
   const guide='<section id="pf-three-benefits" class="pf-compare-section pf-three-benefits-flat"><h2>3形態同時購入特典もチェック！</h2><p>初回限定盤A・初回限定盤B・通常盤の3形態を同時購入で専用特典がつくよ！</p><p>専用特典は早期終了したこともあるから早めの予約がマスト！</p><details class="pf-past-benefits"><summary>参考までに過去の特典はこんな感じ</summary><div class="pf-past-benefits-content"><h3>MOMENTUM</h3><ul><li>トレーディングカード(全員分)</li><li>ストリーミング映像<ul><li>バラエティ映像(ワンカードポーカー)</li><li>ユニット曲制作メイキング</li><li>あくびMV メンバーソロver</li></ul></li></ul><h3>消えない花火</h3><ul><li>フレークシール(全員分)</li><li>ストリーミング映像<ul><li>JALフェス出演時のライブ映像</li><li>消えない花火MV メンバーソロver</li></ul></li></ul></div></details><div class="pf-purchase-advice"><h3>店頭購入・予約の場合</h3><p>初回A+初回B+通常をまとめて予約しよう！</p><p>初回Aと初回Bの映像の盤種(DVD/Blu-ray)は揃えてね！</p></div><div class="pf-purchase-advice"><h3>ネット通販の場合</h3><p>「3形態同時購入特典付」と書かれているセットを選ぼう！</p><p>定価は4,920円なのでそれより高いところは気をつけてね！</p></div></section>';
   return '<section class="card pf-root pf-with-footer pf-compare-page"><button class="pf-back" type="button" data-pf="back">← 戻る</button><h1>どの盤にする？特典を比較しよう！</h1><p class="muted">収録曲や映像を確認してみよう！</p>'+toc+'<section id="pf-edition-list" class="pf-compare-section"><h2>特典を確認する</h2>'+sections+'</section>'+quizMarkup()+compareTableMarkup()+guide+'<button class="btn secondary" type="button" data-pf="home">トップへ戻る</button></section>';
 }
 const chooseEdition=id=>{
   if(!eligibleEditions().includes(id))return;
   const saved=read();
   const meaningful=saved&&(selectedIds(saved).length||saved.name||saved.places.some(place=>place.type!=="unassigned"));
   if(meaningful&&!confirm("保存済みのCD購入プランを、選択した盤1枚の内容で上書きします。よろしいですか？"))return;
   plan=initial();
   if(saved?.name)plan.name=saved.name;
   if(saved?.imageOptions)plan.imageOptions={...plan.imageOptions,...saved.imageOptions};
   addSelectedFromCompare(editionId(id));
   plan.recommended=[editionId(id)];
   ensureUnassigned(plan);
   previous="comparison";addMode=null;persist();showPlan();
 };
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
     '<div class="pf-total"><div><small>現在の合計金額</small><strong data-pf-total></strong></div><div><small>CD合計</small><strong data-pf-qty></strong></div><p class="pf-budget-diff" data-pf-budget></p><div class="pf-total-actions"><button type="button" class="pf-total-action" data-pf="compare">特典を見る</button><button type="button" class="pf-total-action pf-total-clear" data-pf="clear-plan">購入プランをクリア</button></div></div>'+
     '<section class="pf-channel"><h2>購入場所を設定する</h2><p class="pf-note">購入場所を追加してください。枚数は下の「枚数を設定する」から指定できます。</p><p class="pf-tsz-jump"><a href="#pf-tsz-card">どこで買えばいいかわからない方へ</a></p>'+
     '<div data-pf-place-list>'+placeListMarkup()+'</div><div class="pf-add-actions"><button type="button" class="btn secondary" data-pf="show-add-online">＋ ネット通販を追加</button><button type="button" class="btn secondary" data-pf="show-add-store">＋ 店舗を追加</button></div>'+
     '<div data-pf-add-form>'+addForm()+'</div></section>'+
     '<section class="pf-quantity"><h2>枚数を設定する</h2>'+
     '<div data-pf-sets>'+setRows()+'</div><div data-pf-set-notice></div><div data-pf-editions>'+groups.map(([key,title,ids])=>'<article class="pf-product pf-product-group"><div class="pf-product-top"><div><h3>'+title+'</h3><span>'+format(priceFor(ids[0],config))+'円'+(ids.some(id=>plan.recommended.includes(id))?' <em class="pf-recommended">診断おすすめ</em>':'')+'</span></div><strong data-pf-group-total="'+key+'">'+ids.reduce((sum,id)=>sum+qty(plan,id),0)+'枚</strong></div>'+
       ids.map(id=>'<div class="pf-format-row"><span class="pf-format-title">'+(id==="regular"?"CD":id.endsWith("_dvd")?"DVD":"Blu-ray")+'</span><div class="pf-primary-value" data-pf-row-total="'+id+'">'+qty(plan,id)+'枚</div>'+
       '<div class="pf-split">'+formatRow(id)+'</div></div>').join("")+(key==='fc'?'<div data-pf-fc-notice></div>':'')+'</article>').join("")+'</div></section>'+
     '<p class="pf-note pf-system-notes">※購入場所を削除するとそこに設定した枚数も削除されます。<br>※表示金額は定価の税込金額となります。送料や割引は各店舗、各通販サイトでご確認ください。</p>'+
     '<div class="pf-name"><label for="pf-name">シェアするときの名前（任意）</label><input id="pf-name" data-pf-name type="text" maxlength="30" value="'+safe(plan.name)+'"><p class="pf-note">名前や購入先はこの端末に保存されます。</p></div>'+
     '<section class="pf-extra-support-card" aria-labelledby="pf-extra-support-title"><h2 id="pf-extra-support-title">CD以外でも応援してみよう！</h2><p>CD購入プランが決まったら、次は普段使っているサブスクでできる応援をチェック！</p><p>加入中のサービスを選ぶだけで、あなたに合った応援方法をご案内します。</p><button type="button" class="btn pf-extra-support-cta" data-pf="extra-support">追加の応援方法を探す</button></section>'+
     '<section id="pf-tsz-card" class="pf-tsz-card" aria-labelledby="pf-tsz-title"><h2 id="pf-tsz-title">TSZ在庫チェッカーを活用しよう！</h2>'+
     '<p class="pf-tsz-intro">・オリコン・ビルボ加盟店の検索<br>・発売後の在庫状況の共有<br>ができる便利なサイトです！</p>'+
     '<p class="pf-tsz-questions">「どこで買えばオリコンチャートに貢献できるの？」<br>「家の近くのあの店って加盟店？」<br>「ネット通販ならどこ？」</p>'+
     '<p>そんなときはここからぜひ検索を！</p>'+
     '<a class="btn pf-tsz-button" href="https://timelesz-zaiko-static.pages.dev/" target="_blank" rel="noopener noreferrer">TSZ在庫チェッカーで探す ↗</a>'+
     '<p class="pf-tsz-credit">作成・運営：chino様<br>ファンの有志により運営されているサイトです。</p>'+
     '<p class="pf-tsz-disclaimer">※TSZ在庫チェッカーは、ファンの有志による非公式サイトです。掲載情報は変更される場合があります。加盟状況や在庫状況など、購入に関する最新情報は各販売店・公式サイトでもご確認ください。</p></section>'+
     '<button type="button" class="btn ghost" data-pf="home">トップへ戻る</button></section>'+
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
   '<div class="pf-image-places">'+listing+fcMarkup+'</div><div class="pf-image-footer"><span>CD合計 '+qtyOf(plan)+'枚</span><strong>'+format(totalOf(plan,config))+'円</strong></div><p class="pf-image-credit">'+safe(IMAGE_FOOTER_LINE1)+'<br>'+safe(IMAGE_FOOTER_LINE2)+'</p></div>';
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
   const {renderPlanPng}=await import("./planCanvas.js?v=20261112-unified-footer-v6");
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
   if(action==="extra-support"){closePreview();onExtraSupport?.();return}
   if(action==="home"){closePreview();goHome();return}
   if(action==="back"){closePreview();back();return}
   if(action==="scroll-edition"){scrollToPart("pf-edition-"+button.dataset.edition);return}
   if(action==="scroll-section"){scrollToPart(button.dataset.target);return}
   if(action==="compare-edition"){
     if(!eligibleEditions().includes(button.dataset.edition))return;
     compareSelection=[button.dataset.edition];const table=document.getElementById("pf-compare-table");if(table){const temp=document.createElement("div");temp.innerHTML=compareTableMarkup();table.replaceWith(temp.firstElementChild)}scrollToPart("pf-compare-table");return;
   }
   if(action==="choose-edition"){chooseEdition(button.dataset.edition);return}
   if(action==="compare-chip"){
     const edition=button.dataset.edition;
     if(!eligibleEditions().includes(edition))return;
     if(compareSelection.includes(edition)){if(compareSelection.length===1)return;compareSelection=compareSelection.filter(id=>id!==edition)}
     else compareSelection=eligibleEditions().filter(id=>compareSelection.includes(id)||id===edition);
     const table=document.getElementById("pf-compare-table");
     if(table){const temp=document.createElement("div");temp.innerHTML=compareTableMarkup();table.replaceWith(temp.firstElementChild)}
     return;
   }
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
   if(target.matches('input[name="pf-quiz-fc"]')){quizFc=target.value;quizPriority="";const temp=document.createElement("div");temp.innerHTML=quizMarkup();for(const key of ["step2","answer"]){const next=temp.querySelector("[data-pf-quiz-"+key+"]");const root=document.querySelector("[data-pf-quiz-"+key+"]");if(root&&next)root.innerHTML=next.innerHTML}return}
   if(target.matches('input[name="pf-quiz-priority"]')){quizPriority=target.value;const temp=document.createElement("div");temp.innerHTML=quizMarkup();const next=temp.querySelector("[data-pf-quiz-answer]");const root=document.querySelector("[data-pf-quiz-answer]");if(root&&next)root.innerHTML=next.innerHTML;return}
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
 return {openFromResult,openRecommendedFromResult,openCompareFromResult,openFromHome,openCompare,resume,hasSaved,showPlan};
}
