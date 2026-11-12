// Native Canvas PNG export for additional support plan; no SVG-to-PNG or external fonts.
const W=900;
const round=(g,x,y,w,h,r,fill,stroke)=>{
  g.beginPath();g.roundRect(x,y,w,h,r);
  if(fill){g.fillStyle=fill;g.fill()}
  if(stroke){g.lineWidth=2.2;g.strokeStyle=stroke;g.stroke()}
};
const wrap=(g,value,maxWidth)=>{
  const out=[];
  for(const part of String(value).split("\n")){
    if(!part){out.push("");continue}
    let line="";
    for(const ch of part){
      if(line&&g.measureText(line+ch).width>maxWidth){out.push(line);line=ch}
      else line+=ch;
    }
    if(line)out.push(line);
  }
  return out;
};
const drawText=(g,str,x,y,size,color,weight="600",maxWidth=760,lineHeight=1.5,center=false)=>{
  g.font=weight+" "+size+"px system-ui, -apple-system, 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif";
  g.textAlign=center?"center":"left";g.textBaseline="top";g.fillStyle=color;
  const lines=wrap(g,str,maxWidth);
  lines.forEach((line,i)=>g.fillText(line,x,y+i*size*lineHeight));
  return y+lines.length*size*lineHeight;
};
const palette={
  purplePink:{background:"#F8F1FC",paper:"#FFFCFF",accent:"#8951BA",second:"#E965A0",border:"#D8B9EF",ink:"#4E2768",muted:"#725B82",band:"#EEDBF8",soft:"#FFF0F8"},
  movieMint:{background:"#E8F7F1",paper:"#FFFDF5",accent:"#197E73",second:"#CC79A8",border:"#A4D9CB",ink:"#265951",muted:"#57796F",band:"#CBECE2",soft:"#F6F1E7"}
};
function decorate(g,h,c,theme){
  g.fillStyle=c.background;g.fillRect(0,0,W,h);
  round(g,18,18,W-36,h-36,36,c.paper,c.border);
  g.save();g.globalAlpha=.6;
  if(theme==="purplePink"){
    g.fillStyle=c.band;g.beginPath();g.moveTo(20,124);g.lineTo(230,20);g.lineTo(338,20);g.lineTo(20,217);g.closePath();g.fill();
    for(let i=0;i<6;i++){
      g.fillStyle=i%2?c.second:c.accent;g.globalAlpha=.25;
      const x=60+i*150,y=42+(i%2)*38;
      g.beginPath();g.moveTo(x,y-10);g.lineTo(x+9,y);g.lineTo(x,y+10);g.lineTo(x-9,y);g.closePath();g.fill();
    }
    g.globalAlpha=.2;g.fillStyle=c.second;g.beginPath();g.arc(860,h-50,160,0,2*Math.PI);g.fill();
  }else{
    g.fillStyle=c.band;
    g.fillRect(40,38,820,13);
    for(let x=56;x<850;x+=52){g.fillStyle=c.paper;g.fillRect(x,40,20,8)}
    g.globalAlpha=.18;g.fillStyle=c.accent;
    for(let i=0;i<12;i++){
      const x=65+i*67,y=h-75;
      g.beginPath();g.ellipse(x,y,9,6,-.5,0,Math.PI*2);g.fill();
    }
  }
  g.restore();
}
function getSections(data){
  const chosen=new Set(data.subs);
  const labels={spotify:"Spotify Premium",prime:"Amazon Music Prime",unlimited:"Amazon Music Unlimited",line:"LINE MUSIC",youtubeMusic:"YouTube Music Premium",apple:"Apple Music"};
  const digitalTitle=data.digitalTitle||"本当のことを言うと";
  const music=Object.keys(labels).filter(id=>chosen.has(id)&&!(id==="prime"&&chosen.has("unlimited")));
  const musicIntro=data.listenIntro||"11/25〜先行配信される「"+digitalTitle+"」をたくさん聴こう！";
  const streaming=[{title:"新曲をサブスクで応援！",description:musicIntro}];
  if(music.length){
    if(chosen.has("prime")&&!chosen.has("unlimited"))streaming.push({title:"Amazon Music Prime",description:"Amazon Prime会員なら、Amazon Music Primeで利用できる範囲の楽曲を聴けるよ！"});
    music.filter(id=>id!=="prime").forEach(id=>streaming.push({title:labels[id],description:""}));
  }else streaming.push({title:"Spotify無料版",description:data.freeSpotify||"Spotifyのフリープランなら無料で聴けるよ！"});
  const eligible=chosen.has("spotify")||chosen.has("apple");
  streaming.push({
    title:"ステヘにチャレンジしてみない？",
    description:eligible?
      (data.stationheadMember||"Spotify PremiumまたはApple Musicの有料会員で18歳以上ならStationhead（ステヘ）に参加できるよ！プレイリストを自分で作る必要はなし！"):
      (data.stationheadUpsell||"＋1,080円でSpotify Premiumに加入してみない？\n1ヶ月だけでも加入してステへに参加すると、Billboardポイントに大きく貢献できるよ！\n面倒なプレイリスト作成の必要はなし！")
  });
  if(chosen.has("unext"))streaming.push({title:"U-NEXT会員の方へ！",description:data.unext||"U-NEXT会員はUSEN推し活リクエストを追加でできるよ！"});
  return [
    {number:"01",title:"デジタル配信で応援！",rows:[{
      title:"デジタル配信「"+digitalTitle+"」を買うには",
      description:data.digitalDescription||"11/25から先行配信される「"+digitalTitle+"」を購入するとBillboardポイントに貢献できるよ！"
    }]},
    {number:"02",title:"サブスクで応援！",rows:streaming},
    {number:"03",title:"無料でできる応援！",rows:[
      {title:"みんなでできる応援",description:""},
      {title:"YouTube",description:data.youtube||"YouTubeにMVが公開されたら高評価！ たくさん再生して楽しもう！"},
      {title:"SNS",description:data.sns||"各SNSでいいね・拡散・応援コメントをしよう！"},
      {title:"リクエスト",description:(data.request||"ラジオリクエストや推し活リクエストに参加しよう！ タムごとDailyも活用してね！")+"\nリクエストをまとめてやるにはタムごとDailyをご利用ください！"}
    ]}
  ];
}
function measureCard(g,section){
  let h=91;
  section.rows.forEach(row=>{
    g.font="800 27px system-ui, sans-serif";
    const titleLines=wrap(g,row.title,720).length;
    g.font="500 23px system-ui, sans-serif";
    const descLines=row.description?wrap(g,row.description,720).length:0;
    h+=titleLines*36+descLines*33+30;
  });
  return h+18;
}
export async function renderExtraSupportPng(data){
  await document.fonts?.ready;
  const selected=Array.isArray(data.subs)?data.subs:[];
  const theme=data.theme==="movieMint"?"movieMint":"purplePink",c=palette[theme];
  const name=Array.from(String(data.name||"").trim()).slice(0,10).join("");
  const sections=getSections({...data,subs:selected});
  const measuring=document.createElement("canvas").getContext("2d");
  const sizes=sections.map(s=>measureCard(measuring,s));
  const temp=document.createElement("canvas");
  temp.width=W;temp.height=340+sizes.reduce((a,b)=>a+b+28,0)+120;
  const g=temp.getContext("2d");
  if(!g)throw Error("Canvas is unavailable");
  const height=temp.height;
  decorate(g,height,c,theme);
  g.textAlign="center";
  drawText(g,"MY NEW RELEASE SUPPORT PLAN",450,65,23,c.muted,"700",820,1.2,true);
  const title=name?name+"さんの追加応援プラン":"あなたの追加応援プラン";
  let titleSize=42;
  g.font="800 "+titleSize+"px system-ui, sans-serif";
  while(g.measureText(title).width>790&&titleSize>28){titleSize-=2;g.font="800 "+titleSize+"px system-ui, sans-serif"}
  drawText(g,title,450,107,titleSize,c.ink,"800",800,1.22,true);
  drawText(g,data.releaseTitle||"ザユウノメイ／本当のことを言うと",450,168,26,c.ink,"600",820,1.3,true);
  const lookup={spotify:"Spotify Premium",prime:"Amazon Prime",unlimited:"Amazon Music Unlimited",line:"LINE MUSIC",youtubeMusic:"YouTube Music Premium",apple:"Apple Music",unext:"U-NEXT"};
  const subscriptions=selected.map(id=>lookup[id]).filter(Boolean).join("・")||"なし";
  g.font="600 23px system-ui, sans-serif";
  const subsLines=wrap(g,"加入中のサブスク： "+subscriptions,730);
  const subsH=24+subsLines.length*32;
  round(g,62,224,776,subsH,22,c.soft,c.border);
  drawText(g,"加入中のサブスク： "+subscriptions,90,238,23,c.ink,"600",720,1.4);
  let y=224+subsH+34;
  sections.forEach((s,i)=>{
    const h=sizes[i];
    round(g,46,y,808,h,25,c.paper,c.border);
    round(g,46,y,808,69,24,c.band);
    round(g,46,y,90,69,20,c.accent);
    drawText(g,s.number,91,y+14,33,"#FFFFFF","800",80,1.1,true);
    drawText(g,s.title,157,y+15,29,c.ink,"800",665,1.3);
    let rowY=y+87;
    s.rows.forEach((row,idx)=>{
      if(idx){g.strokeStyle=c.border;g.lineWidth=1.5;g.beginPath();g.moveTo(78,rowY-8);g.lineTo(820,rowY-8);g.stroke()}
      rowY=drawText(g,row.title,82,rowY,27,c.ink,"800",728,1.33);
      rowY=(row.description?drawText(g,row.description,82,rowY+3,23,c.ink,"500",728,1.43):rowY)+26;
    });
    y+=h+28;
  });
  drawText(g,"非公式ファンメイドツール",450,y+2,20,c.muted,"700",810,1.25,true);
  drawText(g,"各サービスの最新情報は公式で確認してください",450,y+34,19,c.muted,"500",810,1.3,true);
  return new Promise((resolve,reject)=>{
    temp.toBlob(blob=>blob?resolve(blob):reject(new Error("PNGの生成に失敗しました")),"image/png");
  });
}
