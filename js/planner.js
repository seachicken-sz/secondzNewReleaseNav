const STORAGE_KEY="secondzReleaseNav:purchasePlan:v1";
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
const emptyItems=()=>Object.fromEntries(ITEM_IDS.map(id=>[id,{online:0,store:0}]));
const initial=()=>({version:1,source:"count",name:"",originalBudget:null,budgetLabel:"",recommended:[],defaultChannel:"online",items:emptyItems(),updatedAt:""});
const plansafe=value=>value&&typeof value==="object"?{...initial(),...value,items:Object.fromEntries(ITEM_IDS.map(id=>[id,{online:Math.max(0,Math.min(99,Number(value.items?.[id]?.online)||0)),store:isFc(id)?0:Math.max(0,Math.min(99,Number(value.items?.[id]?.store)||0))}]))}:initial();
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
    note:"DVD版とBlu-ray版は映像内容が同じで、盤面の色味が異なるよ。"
  },
  b:{
    description:"メンバーそれぞれの映像をじっくり楽しみたい人におすすめ！",
    tracks:[["本当のことを言うと"],["ザユウノメイ"],["Avocado",true],["Avocado -Inst-"]],
    videos:[["「本当のことを言うと」Music Video"],["「本当のことを言うと」Music Video メンバーソロver.×7種",true],["Making of「本当のことを言うと」"]],
    gifts:[["分けて使える！オリジナルステッカーシート ver.B",true],["シリアルコード入りプレイリストカード"]],
    note:"DVD版とBlu-ray版は映像内容が同じで、盤面の色味が異なるよ。"
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
const totalOf=(plan,config)=>ITEM_IDS.reduce((s,id)=>s+priceFor(id,config)*(plan.items[id].online+plan.items[id].store),0);
const qtyOf=plan=>ITEM_IDS.reduce((s,id)=>s+plan.items[id].online+plan.items[id].store,0);
const qty=(plan,id)=>plan.items[id].online+plan.items[id].store;
const selectedIds=plan=>ITEM_IDS.filter(id=>qty(plan,id)>0);
function seededPlan(result,config){
  const plan=initial();plan.source="budget";
  const a=result.answers;const budget=config.budgetOptions.find(x=>x.id===a.budget);
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
  picks.forEach(id=>plan.items[id].online=1);
  plan.recommended=picks;
  return plan;
}
function issueText(plan,config){
  const rows=selectedIds(plan).map(id=>names[id]+" ×"+qty(plan,id)+"枚");
  const userName=plan.name.trim();
  return (userName?userName+"の":"わたしの")+"CD購入プラン\n"+rows.join("\n")+"\nCD合計 "+qtyOf(plan)+"枚｜"+format(totalOf(plan,config))+"円\nタムごと新曲応援ナビ";
}
export function createPurchaseFlow({config,render,goHome,goResult}){
  let plan=initial(),screen="home",previous="home",saving=false;
  const read=()=>{try{const item=JSON.parse(localStorage.getItem(STORAGE_KEY));return item?.releaseId===config.releaseId?plansafe(item):null}catch{return null}};
  const persist=()=>{
    plan.updatedAt=new Date().toISOString();
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify({...plan,releaseId:config.releaseId}));return true}catch{return false}
  };
  const hasSaved=()=>Boolean(read());
  const planLink=id=>config.links.fcSpecial;
  function begin({result=null,reset=false,fromCompare=false}={}){
    const prev=read();
    plan=reset?(result?seededPlan(result,config):initial()):(prev||result?result?seededPlan(result,config):prev:initial());
    if(fromCompare&&prev)plan=prev;
    showPlan();
  }
  function resume(){plan=read()||initial();showPlan()}
  function comparison(){screen="comparison";render(compareMarkup())}
  function back(){if(previous==="result")goResult();else if(previous==="comparison")comparison();else if(previous==="plan")showPlan();else goHome()}
  function openFromResult(result){previous="result";begin({result,reset:true})}
  function openFromHome(){previous="home";begin({reset:true})}
  function openCompare(){previous="home";plan=read()||initial();comparison()}
  function compareMarkup(){
    const name={regular:"通常盤",a:"初回限定盤A",b:"初回限定盤B",fc:"FC限定盤"};
    const cards=["regular","a","b","fc"].map(id=>{
      const d=detail[id],formats=id==="regular"?'<button type="button" class="btn" data-pf="add" data-id="regular">この盤を追加する</button>':
        '<div class="pf-formats"><button type="button" class="btn" data-pf="add" data-id="'+id+'_dvd">DVDを追加</button><button type="button" class="btn secondary" data-pf="add" data-id="'+id+'_bd">Blu-rayを追加</button></div>';
      return '<article class="pf-edition"><div class="pf-edition-head"><h2>'+name[id]+'</h2><strong>'+format(priceFor(id==="regular"?id:id+"_dvd",config))+'円</strong></div>'+
       '<p class="pf-muted">'+(id==="regular"?"CDのみ":"CD＋DVD／Blu-ray")+'</p><p class="pf-description">'+safe(d.description)+'</p>'+
       '<h3>収録曲</h3>'+rows(d.tracks)+(d.videos.length?'<h3>映像特典</h3>'+rows(d.videos):"")+
       '<h3>'+(id==="regular"?"初回仕様封入特典":"封入特典")+'</h3>'+rows(d.gifts)+
       '<p class="pf-note">'+safe(d.note)+'</p>'+formats+'</article>';
    }).join("");
    return '<section class="card pf-root"><button type="button" class="pf-back" data-pf="back">← 戻る</button>'+
      '<h1>どの盤にする？特典を比較しよう！</h1><p class="muted">収録曲や映像をチェックして、欲しい盤を購入プランに追加しよう！</p>'+
      cards+'<section class="pf-guide"><h2>CDの曲をスマホでも聴けるよ！</h2>'+
      '<p>全形態に「シリアルコード入りプレイリストカード」が封入されているよ！カードに記載されたシリアルコードを無料の「timeleSZアプリ」に登録すると、購入したCDに収録されている楽曲をスマホで楽しめるよ！</p>'+
      '<p class="pf-note">※インストゥルメンタル（-Inst-）楽曲は再生対象外だよ。</p>'+
      '<div class="pf-formats">'+openLink("App Store",IOS)+openLink("Google Play",ANDROID)+'</div>'+
      '<p>'+openLink("アプリの使い方",APPGUIDE)+'</p></section>'+
      '<section class="pf-guide"><h2>3形態同時購入特典もチェック！</h2><p>初回限定盤A・初回限定盤B・通常盤の3形態を同時予約購入すると、専用特典が付く対象商品があるよ！</p>'+
      '<p>対象の組み合わせ：A（Blu-ray）＋B（Blu-ray）＋通常盤、またはA（DVD）＋B（DVD）＋通常盤。</p>'+
      '<p class="pf-note">※特典内容は後日発表。対象の商品・購入方法・特典の在庫状況は購入先で確認してね！</p></section>'+
      '<button type="button" class="btn secondary" data-pf="home">トップへ戻る</button></section>';
  }
  function selectedGiftNotice(){
    const hasRegular=qty(plan,"regular")>0;
    const sameFormat=(qty(plan,"a_dvd")>0&&qty(plan,"b_dvd")>0)||(qty(plan,"a_bd")>0&&qty(plan,"b_bd")>0);
    return hasRegular&&sameFormat?'<div class="pf-caution">3形態同時購入特典を希望する場合は、購入先の「3形態特典付きセット」を確認してね！単品で購入した場合は特典対象外になることがあるよ！</div>':"";
  }
  function showPlan(){
    screen="plan";
    const budget=plan.source==="budget"?'<div class="pf-meta"><div><small>当初の予算</small><strong>'+safe(plan.budgetLabel||"未設定")+'</strong></div><div><small>診断のおすすめ</small><strong>'+safe(plan.recommended.map(id=>names[id]).join("・")||"なし")+'</strong></div></div>':"";
    const total=totalOf(plan,config),count=qtyOf(plan);
    const diff=plan.originalBudget===null?"":'<p class="pf-budget-diff">'+(total>plan.originalBudget?"当初の予算より "+format(total-plan.originalBudget)+"円多いよ！":"予算の残り "+format(plan.originalBudget-total)+"円")+'</p>';
    const products=ITEM_IDS.map(id=>{
      const val=plan.items[id];
      const controls=(channel)=>'<div class="pf-counter"><button type="button" data-pf="minus" data-id="'+id+'" data-channel="'+channel+'" aria-label="'+safe(names[id])+' '+(channel==="online"?"オンライン":"実店舗")+'を1枚減らす" '+(!val[channel]?"disabled":"")+'>−</button><strong>'+val[channel]+'</strong><button type="button" data-pf="plus" data-id="'+id+'" data-channel="'+channel+'" aria-label="'+safe(names[id])+' '+(channel==="online"?"オンライン":"実店舗")+'を1枚増やす" '+(val[channel]>=99?"disabled":"")+'>＋</button></div>';
      const isSplit=val.online>0&&val.store>0;
      return '<div class="pf-product"><div class="pf-product-top"><div><h3>'+safe(names[id])+'</h3><span>'+format(priceFor(id,config))+'円'+(plan.recommended.includes(id)?' <em class="pf-recommended">診断おすすめ</em>':"")+'</span></div><strong>'+qty(plan,id)+'枚</strong></div>'+
        '<div class="pf-item-actions">'+(isFc(id)?'<small>ファミクラストアオンライン限定</small>': '<small>追加する場所：'+(plan.defaultChannel==="online"?"オンライン":"実店舗")+'</small>')+
        controls(isFc(id)?"online":plan.defaultChannel)+'</div>'+
        (!isFc(id)?'<details class="pf-split" '+(isSplit?"open":"")+'><summary>購入場所を分けて入力する</summary><div class="pf-split-row"><span>オンライン</span>'+controls("online")+'</div><div class="pf-split-row"><span>実店舗</span>'+controls("store")+'</div></details>':"")+
        '</div>';
    }).join("");
    render('<section class="card pf-root"><button type="button" class="pf-back" data-pf="back">← 戻る</button><h1>わたしのCD購入プラン</h1>'+budget+
      '<div class="pf-total"><div><small>現在の合計金額</small><strong>'+format(total)+'円</strong></div><div><small>CD合計</small><strong>'+count+'枚</strong></div>'+diff+'</div>'+
      '<div class="pf-channel"><h2>購入場所の基本設定</h2><div class="pf-switch"><button type="button" data-pf="channel" data-channel="online" class="'+(plan.defaultChannel==="online"?"active":"")+'">オンライン</button><button type="button" data-pf="channel" data-channel="store" class="'+(plan.defaultChannel==="store"?"active":"")+'">実店舗</button></div><p class="pf-note">新たに追加するCDの購入場所の初期値。各盤の購入場所は個別にも調整できるよ！</p></div>'+
      '<h2>CDの種類と枚数</h2>'+products+
      (selectedIds(plan).some(isFc)?'<div class="pf-caution">FC限定盤の購入にはFC加入が必要だよ！受注期限は2026年12月21日23:59まで。購入条件は公式サイトで確認してね。<p>'+openLink("FC限定盤の購入ページ",planLink())+'</p></div>':"")+
      selectedGiftNotice()+
      '<p class="pf-note">表示価格は税込の商品代金のみ。送料・手数料・割引は含まないよ。DVD版とBlu-ray版は別々にカウントするよ。</p>'+
      '<div class="pf-name"><label for="pf-name">シェアするときの名前（任意）</label><input id="pf-name" data-pf-name type="text" maxlength="30" placeholder="例：ツナ缶" value="'+safe(plan.name)+'"><p class="pf-note">未入力なら「わたしの購入プラン」。名前はこの端末にのみ保存するよ。</p></div>'+
      '<button type="button" class="btn" data-pf="share" '+(count?"":"disabled")+'>購入プランを画像で保存・シェア</button>'+
      '<button type="button" class="btn secondary" data-pf="compare">特典を比較する</button>'+
      '<button type="button" class="btn ghost" data-pf="home">トップへ戻る</button></section>');
  }
  function shareMarkup(){
    const current=selectedIds(plan).map(id=>'<div class="pf-share-item"><span>'+safe(names[id])+'</span><b>'+qty(plan,id)+'枚</b></div>').join("");
    const title=plan.name.trim()?plan.name.trim()+"の購入プラン":"わたしの購入プラン";
    return '<div class="pf-share-card"><div class="pf-share-decor">✧　♡　✧</div><p class="pf-share-eyebrow">MY CD PURCHASE PLAN</p><h1>'+safe(title)+'</h1>'+
      '<p class="pf-share-release">ザユウノメイ／本当のことを言うと</p><div class="pf-share-list">'+current+'</div>'+
      '<div class="pf-share-total"><span>CD合計 <b>'+qtyOf(plan)+'枚</b></span><strong>'+format(totalOf(plan,config))+'円</strong></div>'+
      '<p class="pf-share-footer">タムごと新曲応援ナビ</p></div>';
  }
  async function share(btn){
    if(qtyOf(plan)===0)return;
    btn.disabled=true;btn.textContent="画像を作成中…";
    const node=document.createElement("div");node.className="pf-share-export";node.innerHTML=shareMarkup();document.body.appendChild(node);
    try{
      await document.fonts?.ready;
      const {toBlob}=await import("https://cdn.jsdelivr.net/npm/html-to-image@1.11.13/+esm");
      const blob=await toBlob(node,{backgroundColor:"#f9effb",pixelRatio:1,cacheBust:true,style:{position:"static",left:"auto",top:"auto"}});
      if(!blob)throw Error("画像が生成できませんでした");
      const file=new File([blob],"タムごと_CD購入プラン.png",{type:"image/png"});
      if(navigator.canShare?.({files:[file]})&&navigator.share){
        try{await navigator.share({files:[file],title:"CD購入プラン"});return}catch(e){if(e.name==="AbortError")return}
      }
      const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=file.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
    }catch(e){console.error(e);alert("画像の保存に失敗しました。通信状況を確認してもう一度お試しください。")}
    finally{node.remove();btn.disabled=false;btn.textContent="購入プランを画像で保存・シェア"}
  }
  document.addEventListener("click",event=>{
    const button=event.target.closest("[data-pf]");if(!button)return;
    const action=button.dataset.pf,id=button.dataset.id,channel=button.dataset.channel;
    if(action==="home"){goHome();return}
    if(action==="back"){back();return}
    if(action==="compare"){previous="plan";comparison();return}
    if(action==="channel"){plan.defaultChannel=channel;persist();showPlan();return}
    if(action==="add"){
      // Comparison cards add one copy and then open the shared purchase planner.
      if(!ITEM_IDS.includes(id))return;
      const ch=isFc(id)?"online":plan.defaultChannel;
      plan.items[id][ch]=Math.min(99,plan.items[id][ch]+1);
      persist();previous="comparison";showPlan();return;
    }
    if(action==="plus"||action==="minus"){
      if(!ITEM_IDS.includes(id)||!["online","store"].includes(channel)||(isFc(id)&&channel==="store"))return;
      plan.items[id][channel]=Math.max(0,Math.min(99,plan.items[id][channel]+(action==="plus"?1:-1)));
      persist();showPlan();return;
    }
    if(action==="share")share(button);
  });
  document.addEventListener("input",event=>{
    if(event.target.matches("[data-pf-name]")){plan.name=event.target.value.slice(0,30);persist()}
  });
  return {openFromResult,openFromHome,openCompare,resume,hasSaved,showPlan};
}
