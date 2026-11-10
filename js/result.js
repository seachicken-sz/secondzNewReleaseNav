export function isBeforeDeadline(deadline){
  // Deadline is inclusive in Japan local time.
  const today=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Tokyo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
  return today<=deadline;
}
export function buildPurchase(a,c,m){
  const level=a.budget,eligible=isBeforeDeadline(c.deadline),canFc=a.fc===true&&eligible;
  const choice=level==="7000"||level==="more"?null:a.priority;
  const items=[],extra=[],notes=[],secondaries=[];
  const product=id=>c.products[id];
  const item=(title,price,description="",productIds=[])=>items.push({title,price,description,productIds});
  const baseId=({songs:"regular",dance:"a",visual:"b",variety:"fc"})[choice];
  const names=ids=>ids.map(id=>product(id).label).join("＋");
  const parts=m.purchase.extraParts;
  const finish=()=>({items,extra,notes,secondaries});
  const add=(key,link=null)=>extra.push({key,text:parts[key],link});
  if(level==="zero")return finish();
  if(level==="300"){
    item(product("digital").label,255,m.purchase.digital,["digital"]);
    add("digitalAdd1400");
    add("editionAdd300");
    return finish();
  }
  if(level==="1400"){
    item(product("regular").label,1320,m.purchase.regular,["regular"]);
    add("digitalAdd1400Budget","digital");
    if(canFc)add("fcAdd1400Budget","fcSpecial");
    return finish();
  }
  if(level==="1800"){
    if(choice==="complete"){
      if(canFc)item(product("fc").label,1800,m.purchase.completeBefore,["fc"]);
      else item(product("a").label,1800,eligible?m.purchase.completeBefore:m.purchase.completeAfter,["a"]);
      if(eligible&&!a.fc)notes.push(m.purchase.fcJoin);
    }else{
      const id=baseId==="fc"&&!canFc?"a":baseId||"a";
      item(product(id).label,product(id).price,m.purchase[id]||"",[id]);
    }
    const primaryIds=items[0].productIds;
    const candidates=["regular","a","b","fc"].filter(id=>!primaryIds.includes(id)&&(id!=="fc"||canFc));
    candidates.forEach(id=>secondaries.push({id,label:product(id).label,price:product(id).price,description:m.purchase[id]||""}));
    const regular=primaryIds.length===1&&primaryIds[0]==="regular";
    add(regular?"regularAddEdition":"editionAddRegular");
    add(regular?"regularSet":"editionSet");
    add("threeSetBonus");add("consider");
  }
  if(level==="3600"){
    let first=baseId;
    if(choice==="complete"){
      first=canFc?"fc":"a";
      notes.push(eligible?m.purchase.completeBefore:m.purchase.completeAfter);
      if(eligible&&!a.fc)notes.push(m.purchase.fcJoin);
    }
    if(!first||(first==="fc"&&!canFc))first="a";
    const price=product(first).price;
    item(product(first).label,price,m.purchase[first]||"",[first]);
    ["regular","a","b","fc"].filter(id=>id!==first&&(id!=="fc"||canFc)).forEach(id=>{
      const total=price+product(id).price;
      if(total<=3600)secondaries.push({id,label:product(id).label,total});
    });
    if(first!=="fc")add(first==="regular"?"threeSetSongs3600":"threeSet3600");
    if(first!=="fc"){add("threeSetBonus");add("consider");}
  }
  if(level==="5000"){
    item(product("set").label,4920,m.purchase.set,["set"]);
    notes.push(m.purchase.setCaution);
    add("digital5000","digital");
    if(canFc)add("fc5000","fcSpecial");
    if(choice==="complete")notes.push(eligible?m.purchase.completeBefore:m.purchase.completeAfter);
  }
  if(level==="7000"||level==="more"){
    if(canFc)item(names(["regular","a","b","fc","digital"]),6975,"3形態セットの専用特典もチェック！",["set","fc","digital"]);
    else item(names(["regular","a","b","digital"]),5175,"3形態セットの専用特典もチェック！",["set","digital"]);
    notes.push(m.purchase.setCaution);
    if(eligible&&!a.fc)notes.push(m.purchase.fcJoin);
    add("iphoneGift");
    if(!(a.subs||[]).includes("spotify")&&!(a.subs||[]).includes("apple"))add("spotifyPremium","spotifyPremium");
    add("discs");
    if(level==="more"&&eligible&&!a.fc)add("joinFc","joinFc");
  }
  return finish();
}
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