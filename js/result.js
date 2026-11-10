export function isBeforeDeadline(deadline){
  // Deadline is inclusive in Japan local time.
  const today=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Tokyo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
  return today<=deadline;
}
export function buildPurchase(a,c,m){
  const level=a.budget;
  const eligible=isBeforeDeadline(c.deadline);
  const canFc=a.fc===true&&eligible;
  const choice=a.priority;
  const items=[],extra=[],notes=[],secondaries=[];
  const product=id=>c.products[id];
  const item=(title,price,description="",productIds=[])=>items.push({title,price,description,productIds});
  const baseId=({songs:"regular",dance:"a",visual:"b",variety:"fc"})[choice];
  const names=ids=>ids.map(id=>product(id).label).join("＋");
  const addFcNotes=()=>{
    if(eligible){
      if(!a.fc)notes.push(m.purchase.fcJoin);
      notes.push(m.purchase.deadline);
    }
  };
  if(level==="zero")return {items,extra,notes,secondaries};
  if(level==="300"){item(product("digital").label,255,m.purchase.digital,["digital"]);return {items,extra,notes,secondaries}}
  if(level==="1400"){item(product("regular").label,1320,m.purchase.regular,["regular"]);return {items,extra,notes,secondaries}}
  if(level==="1800"){
    if(choice==="complete"){
      if(canFc)item("FC限定盤",1800,m.purchase.completeBefore,["fc"]);
      else {item("初回限定盤A または B",1800,eligible?m.purchase.completeBefore:m.purchase.completeAfter,["a","b"]);if(eligible&&!a.fc)addFcNotes()}
    }else{
      const id=baseId==="fc"&&!canFc?"a":baseId||"a";
      item(product(id).label,product(id).price,m.purchase[id]||"",[id]);
    }
    extra.push("購入前にプランを変更するなら、あと"+money(4920-items[0].price)+"で3形態セットも選べるよ！");
  }
  if(level==="3600"){
    let first=baseId;
    if(choice==="complete"){
      first=canFc?"fc":"a";
      notes.push(eligible?m.purchase.completeBefore:m.purchase.completeAfter);
      if(eligible&&!a.fc)addFcNotes();
    }
    if(!first||first==="fc"&&!canFc)first="a";
    const price=product(first).price;
    item(product(first).label,price,m.purchase[first]||"",[first]);
    ["regular","a","b","fc"].filter(id=>id!==first&&(! (id==="fc")||canFc)).forEach(id=>{
      const total=price+product(id).price;
      if(total<=3600)secondaries.push({id,label:product(id).label,total});
    });
    extra.push("購入前にプランを変更するなら、初回A＋初回B（3,600円）から＋1,320円で3形態特典付きセット（4,920円）も選べるよ！");
    if(canFc)notes.push(m.purchase.deadline);
  }
  if(level==="5000"){
    item(product("set").label,4920,m.purchase.set,["set"]);
    notes.push(m.purchase.setCaution);
    if(eligible){
      extra.push("＋1,800円でFC限定盤も購入できるよ！ 4形態で合計6,720円。");
      addFcNotes();
    }
    if(choice==="complete")notes.push(eligible?m.purchase.completeBefore:m.purchase.completeAfter);
  }
  if(level==="7000"||level==="more"){
    if(canFc)item(names(["regular","a","b","fc","digital"]),6975,"3形態セットの専用特典もチェック！",["set","fc","digital"]);
    else item(names(["regular","a","b","digital"]),5175,"3形態セットの専用特典もチェック！",["set","digital"]);
    notes.push(m.purchase.setCaution);
    if(eligible&&!a.fc)addFcNotes();
    if(level==="7000"){
      const priorityMap={songs:"通常盤",dance:"初回限定盤A",visual:"初回限定盤B",variety:"FC限定盤",complete:"DVD版・Blu-ray版の仕様違い"};
      const suggestion=priorityMap[choice];
      if(suggestion)extra.push("さらに追加で買うなら、"+suggestion+"も候補に！ "+m.purchase.extraBudget);
    }else{
      extra.push(m.purchase.double);
      extra.push(m.purchase.extraBudget);
    }
  }
  return {items,extra,notes,secondaries};
}
function money(n){return Number(n).toLocaleString("ja-JP")+"円"}
export function buildMethod(a,c){
  const budget=a.budget;
  const digitalMethod=["300","7000","more"].includes(budget);
  const fcMethod=a.fc===true&&isBeforeDeadline(c.deadline)&&["1800","3600","5000","7000","more"].includes(budget);
  return {digitalMethod,fcMethod};
}
export function buildSupport(a,m){
  const selected=new Set(a.subs||[]);
  const s=m.support;
  const streaming=[];
  const hasMusic=["spotify","prime","unlimited","line","youtubeMusic","apple"].some(id=>selected.has(id));
  if(!hasMusic)streaming.push(s.freeSpotify);
  else{
    if(selected.has("spotify"))streaming.push(s.spotify);
    if(selected.has("unlimited"))streaming.push(s.unlimited);
    else if(selected.has("prime"))streaming.push(s.prime);
    if(selected.has("line"))streaming.push(s.line);
    if(selected.has("youtubeMusic"))streaming.push(s.youtubeMusic);
    if(selected.has("apple"))streaming.push(s.apple);
  }
  return {streaming,stationhead:selected.has("spotify")||selected.has("apple"),unext:selected.has("unext")};
}