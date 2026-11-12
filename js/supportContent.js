// Shared support copy used by both browser result views and PNG exports.
// <...> marks a colored, bold and underlined phrase; \n marks an explicit line break.
export const SUPPORT_COPY_VERSION=1;
export const MUSIC_SERVICES=[
 ["spotify","Spotify Premium"],["prime","Amazon Music Prime"],["unlimited","Amazon Music Unlimited"],
 ["line","LINE MUSIC"],["youtubeMusic","YouTube Music Premium"],["apple","Apple Music"]
];
export function supportCopy(title="本当のことを言うと"){
 const song="「"+title+"」";
 const official="<Billboard Japan>";
 return {
  digital:"<11/25>から先行配信される<"+song+">を購入すると"+official+"のランキングに貢献できるよ！",
  listen:"加入している音楽サブスクで<11/25>から先行配信される <"+song+">をたくさん聴こう！\n"+official+"のランキングに貢献できるよ！",
  freeSpotify:"Spotifyのフリープランなら無料で聴けるよ！",
  prime:"Amazon Prime会員なら、Amazon Music Primeで利用できる範囲の楽曲を聴けるよ！",
  stationUpsell:"1ヶ月だけ<1,080円>で<Spotify Premium>に加入してみない？\n<Spotify Premium>に加入すると<Stationhead>に追加料金なしで参加できるよ！\n<Stationhead>を使うと超簡単に"+official+"のランキングに大きく貢献できるよ！",
  stationMember:"<Spotify Premium>または<Apple Musicの有料会員>で<18歳以上>なら<Stationhead>（ステヘ）に追加料金なしで参加できるよ！\n<Stationhead>を使うと超簡単に"+official+"のランキングに大きく貢献できるよ！",
  unext:"U-NEXT会員はUSEN推し活リクエストを追加でできるよ！",
  youtube:"YouTubeにMVが公開されたら<高評価>を押そう！\n毎日再生して楽しく応援しよう！",
  sns:"各SNSで<いいね・拡散・応援コメント>をしよう！",
  request:"<ラジオリクエスト>や<USEN推し活リクエスト>をやってみよう！\nもし何をやればいいか迷った時は<タムごとDaily>も活用してね！",
  snsDetails:[
   {title:"Xの場合",steps:[
     "①まず<いいね・リポスト・ブックマーク>を押そう！",
     "②共有ボタンから<リンクをコピー>してみよう！",
     "③殻を破って<リプライ>や<引用ポスト>をしてみよう！\n迷ったら他の人のリプライを参考にしてみよう！\n(もちろんそのまま真似はNG)",
     "④これを<timelesz公式>や<新曲に関するタイアップ先>(今回ならお姉ちゃんの翠くんの公式など)にできるだけやろう！"
   ]},
   {title:"Instagramの場合",steps:[
     "①まず<いいね・再投稿・保存>を押そう！",
     "②共有ボタンから<ストーリーズに追加>や<Threadsに投稿>してみよう！",
     "③コメントできる投稿には殻を破って<コメント>してみよう！",
     "④これを<timelesz公式>や<新曲に関するタイアップ先>(今回ならお姉ちゃんの翠くんの公式など)にできるだけやろう！"
   ]},
   {title:"TikTokの場合",steps:[
     "①まず<いいね・保存>を押そう！",
     "②殻を破って<コメント>してみよう！",
     "③これを<timelesz公式>や<新曲に関するタイアップ先>(今回ならお姉ちゃんの翠くんの公式など)にできるだけやろう！"
   ]}
  ]
 };
}
export function selectedMusic(subs=[]){
 const selected=new Set(subs);
 return MUSIC_SERVICES.filter(([id])=>selected.has(id)&&!(id==="prime"&&selected.has("unlimited")));
}
export function supportImageSections({subs=[],digitalTitle="本当のことを言うと"}={}){
 const c=supportCopy(digitalTitle),selected=new Set(subs),music=selectedMusic(subs);
 const rows=[{title:"新曲をサブスクで応援！",description:c.listen}];
 if(music.length){
   if(selected.has("prime")&&!selected.has("unlimited"))rows.push({title:"Amazon Music Prime",description:c.prime});
   for(const [id,label] of music)if(id!=="prime")rows.push({title:label,description:""});
 }else rows.push({title:"Spotify無料版",description:c.freeSpotify});
 rows.push({title:"ステヘにチャレンジしてみない？",description:selected.has("spotify")||selected.has("apple")?c.stationMember:c.stationUpsell});
 if(selected.has("unext"))rows.push({title:"U-NEXT会員の方へ！",description:c.unext});
 return [
  {number:"01",title:"デジタル配信で応援！",rows:[{title:"デジタル配信「"+digitalTitle+"」を買うには",description:c.digital}]},
  {number:"02",title:"サブスクで応援！",rows},
  {number:"03",title:"無料でできる応援！",rows:[
   {title:"みんなでできる応援",description:""},
   {title:"YouTube",description:c.youtube},
   {title:"SNS",description:c.sns},
   {title:"リクエスト",description:c.request}
  ]}
 ];
}
