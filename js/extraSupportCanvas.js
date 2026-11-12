import {IMAGE_FOOTER_LINE1,IMAGE_FOOTER_LINE2} from "./imageFooter.js?v=20261112-v1";
import {supportImageSections} from "./supportContent.js?v=20261112-v1";
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
function textRuns(input){
 const result=[];let cursor=0;const source=String(input??"");
 for(const m of source.matchAll(/<([^<>]+)>/g)){
   if(m.index>cursor)result.push({text:source.slice(cursor,m.index),emphasis:false});
   result.push({text:m[1],emphasis:true});cursor=m.index+m[0].length;
 }
 if(cursor<source.length)result.push({text:source.slice(cursor),emphasis:false});
 return result;
}
const textFont=(size,emphasis)=>(emphasis?"800 ":"500 ")+size+"px system-ui, -apple-system, 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif";
function markedLines(g,input,maxWidth,size){
 const lines=[[]];let lineWidth=0;
 for(const run of textRuns(input)){
  for(const char of run.text){
   if(char==="\n"){lines.push([]);lineWidth=0;continue}
   g.font=textFont(size,run.emphasis);
   const width=g.measureText(char).width;
   if(lineWidth>0&&lineWidth+width>maxWidth){lines.push([]);lineWidth=0}
   const row=lines[lines.length-1],last=row[row.length-1];
   if(last&&last.emphasis===run.emphasis){last.text+=char;last.width+=width}
   else row.push({text:char,width,emphasis:run.emphasis});
   lineWidth+=width;
  }
 }
 return lines;
}
function drawMarked(g,input,x,y,maxWidth,size,lineHeight,colors){
 const lines=markedLines(g,input,maxWidth,size);
 for(const [i,line] of lines.entries()){
  let xPos=x;
  for(const run of line){
   g.font=textFont(size,run.emphasis);
   g.textAlign="left";g.textBaseline="top";
   g.fillStyle=run.emphasis?colors.accent:colors.ink;
   g.fillText(run.text,xPos,y+i*lineHeight);
   xPos+=run.width;
  }
 }
 return y+lines.length*lineHeight;
}
function measureCard(g,section){
 let h=91;
 section.rows.forEach(row=>{
  g.font="800 27px system-ui, sans-serif";
  const titleLines=wrap(g,row.title,720).length;
  const descLines=row.description?markedLines(g,row.description,720,23).length:0;
  h+=titleLines*36+descLines*35+30;
 });
 return h+18;
}
export async function renderExtraSupportPng(data){
  await document.fonts?.ready;
  const selected=Array.isArray(data.subs)?data.subs:[];
  const theme=data.theme==="movieMint"?"movieMint":"purplePink",c=palette[theme];
  const name=Array.from(String(data.name||"").trim()).slice(0,10).join("");
  const sections=supportImageSections({...data,subs:selected});
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
      rowY=(row.description?drawMarked(g,row.description,82,rowY+3,728,23,35,c):rowY)+26;
    });
    y+=h+28;
  });
  drawText(g,IMAGE_FOOTER_LINE1,450,y+2,20,c.muted,"700",810,1.25,true);
  drawText(g,IMAGE_FOOTER_LINE2,450,y+34,19,c.muted,"500",810,1.3,true);
  return new Promise((resolve,reject)=>{
    temp.toBlob(blob=>blob?resolve(blob):reject(new Error("PNGの生成に失敗しました")),"image/png");
  });
}
