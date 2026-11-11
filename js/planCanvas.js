// Canvas-based PNG export for Safari: never rasterize a far-offscreen HTML element.
export async function renderPlanPng({sections,title,releaseTitle,totalCount,totalPrice,colors}){
  await document.fonts?.ready;
  const width=900,margin=38,innerX=78,innerW=744;
  const canvas=document.createElement("canvas");
  canvas.width=width;
  const ctx=canvas.getContext("2d",{alpha:false});
  if(!ctx)throw new Error("Canvasを初期化できませんでした");
  const fontFamily='"Hiragino Kaku Gothic ProN","Hiragino Sans",-apple-system,BlinkMacSystemFont,sans-serif';
  const font=(size,weight=500)=>weight+" "+size+"px "+fontFamily;
  const wrap=(str,max,fontString)=>{
    ctx.font=fontString;
    const result=[];let line="";
    for(const char of String(str)){
      if(line&&ctx.measureText(line+char).width>max){result.push(line);line=char}
      else line+=char;
    }
    if(line)result.push(line);
    return result.length?result:[""];
  };
  const heading=wrap(title,innerW-70,font(40,750));
  const releaseLines=wrap(releaseTitle,innerW-50,font(21,500));
  const groups=sections.map(section=>{
    const titleLines=wrap(section.title,innerW-60,font(26,750));
    const rows=section.entries.map(([label,value])=>{
      const lines=wrap(label,innerW-190,font(22,500));
      return {lines,value,height:Math.max(52,lines.length*32+18)};
    });
    const height=24+titleLines.length*39+13+rows.reduce((sum,row)=>sum+row.height,0)+18;
    return {titleLines,rows,height};
  });
  const topHeight=65+55+40+heading.length*56+12+releaseLines.length*33+38;
  const groupsHeight=groups.reduce((sum,g)=>sum+g.height+18,0);
  const imageHeight=Math.max(880,margin*2+topHeight+groupsHeight+112+84);
  canvas.height=imageHeight;
  const g=canvas.getContext("2d",{alpha:false});
  const rounded=(x,y,w,h,r,fill,stroke)=>{
    const radius=Math.min(r,w/2,h/2);
    g.beginPath();g.moveTo(x+radius,y);g.lineTo(x+w-radius,y);g.quadraticCurveTo(x+w,y,x+w,y+radius);
    g.lineTo(x+w,y+h-radius);g.quadraticCurveTo(x+w,y+h,x+w-radius,y+h);
    g.lineTo(x+radius,y+h);g.quadraticCurveTo(x,y+h,x,y+h-radius);
    g.lineTo(x,y+radius);g.quadraticCurveTo(x,y,x+radius,y);g.closePath();
    if(fill){g.fillStyle=fill;g.fill()}
    if(stroke){g.lineWidth=2;g.strokeStyle=stroke;g.stroke()}
  };
  const text=(str,x,y,size,weight=500,color="#40334a",align="left")=>{
    g.font=font(size,weight);g.fillStyle=color;g.textAlign=align;g.textBaseline="top";g.fillText(String(str),x,y);
  };
  g.fillStyle=colors.bg;g.fillRect(0,0,width,imageHeight);
  if(colors.pink){
    // Violet and pink share the visual emphasis rather than just tinting the purple.
    rounded(width-235,58,155,13,7,colors.pink);
    rounded(82,58,155,13,7,colors.accent);
  }
  rounded(margin,margin,width-margin*2,imageHeight-margin*2,36,colors.paper,colors.border);
  let y=margin+34;
  text("✧  ♡  ✧",width/2,y,34,650,colors.accent,"center");y+=55;
  text("MY CD PURCHASE PLAN",width/2,y,19,750,colors.accent,"center");y+=40;
  heading.forEach(line=>{text(line,width/2,y,40,750,colors.accent,"center");y+=56});
  y+=12;
  releaseLines.forEach(line=>{text(line,width/2,y,21,500,colors.accent,"center");y+=33});
  y+=38;
  for(const [groupIndex,group] of groups.entries()){
    rounded(innerX,y,innerW,group.height,22,colors.paper,groupIndex%2===0?colors.border:(colors.pink||colors.border));
    let offset=y+24;
    for(const line of group.titleLines){text(line,innerX+26,offset,26,750,groupIndex%2===0?colors.accent:(colors.pink||colors.accent));offset+=39}
    offset+=13;
    for(const row of group.rows){
      g.strokeStyle=colors.border;g.lineWidth=1;
      g.beginPath();g.moveTo(innerX+22,offset-7);g.lineTo(innerX+innerW-22,offset-7);g.stroke();
      const lineStart=offset+2;
      row.lines.forEach((line,i)=>text(line,innerX+26,lineStart+i*32,22,500));
      text(row.value,innerX+innerW-26,lineStart+Math.max(0,(row.lines.length-1)*16),22,750,colors.accent,"right");
      offset+=row.height;
    }
    y+=group.height+18;
  }
  rounded(innerX,y,innerW,112,19,colors.soft);
  text("CD合計 "+totalCount+"枚",innerX+26,y+42,27,750,colors.accent);
  text(totalPrice.toLocaleString("ja-JP")+"円",innerX+innerW-26,y+37,37,750,colors.accent,"right");
  y+=137;
  text("タムごと新曲応援ナビ",width/2,y+8,21,750,colors.accent,"center");
  const blob=await new Promise((resolve,reject)=>canvas.toBlob(result=>result?resolve(result):reject(new Error("PNGを生成できませんでした")),"image/png"));
  if(blob.size<2000)throw new Error("画像データが正常に作成されませんでした");
  return blob;
}
