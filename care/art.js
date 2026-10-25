// Painted vector props for Monster Care, matched to the glossy hand-painted monster sprites:
// volume gradients, coloured outlines (never one flat brown), specular highlights, soft contact
// shadows and small surface details. Monster artwork remains the original WebP sprites.
// Each drawing is a function of an id prefix so inline icons never share gradient ids in the DOM.
const S=(o,c,a=1)=>`<stop offset="${o}" stop-color="${c}"${a<1?` stop-opacity="${a}"`:''}/>`;
const RG=(id,stops,cx=.36,cy=.3,r=.78,fx,fy)=>`<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}"${fx!=null?` fx="${fx}" fy="${fy}"`:''}>${stops.join('')}</radialGradient>`;
const LG=(id,stops,x1=0,y1=0,x2=0,y2=1)=>`<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.join('')}</linearGradient>`;
const SHADOW=(p,cx=50,cy=91,rx=32,ry=5.5)=>`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${p}sh)"/>`;
const SH_DEF=p=>RG(p+'sh',[S(0,'#3a2412',.32),S(.6,'#3a2412',.12),S(1,'#3a2412',0)],.5,.5,.5);
const GLOSS=(x,y,rx,ry,rot=-30,a=.85)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${x} ${y})" fill="#fff" opacity="${a}"/>`;
function starPts(cx,cy,R,r,n=5,rot=-90){let d='';for(let i=0;i<n*2;i++){const a=(rot+i*180/n)*Math.PI/180,q=i%2?r:R;d+=(i?'L':'M')+(cx+Math.cos(a)*q).toFixed(1)+' '+(cy+Math.sin(a)*q).toFixed(1)}return d+'Z'}
function scallop(){ // seashell fan with bumpy edge
 const cx=50,cy=84,n=8;let d=`M${cx} ${cy}`;const pts=[];
 for(let i=0;i<=n;i++){const a=(200+i*140/n)*Math.PI/180;pts.push([cx+Math.cos(a)*44,cy+Math.sin(a)*62])}
 d+=`L${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
 for(let i=1;i<pts.length;i++){const[a,b]=pts[i-1],[c,e]=pts[i],mx=(a+c)/2,my=(b+e)/2,ox=(mx-cx)*.09,oy=(my-cy)*.09;d+=`Q${(mx+ox).toFixed(1)} ${(my+oy).toFixed(1)} ${c.toFixed(1)} ${e.toFixed(1)}`}
 return{d:d+'Z',ribs:pts.slice(1,-1)}}
const SHELL=scallop();
const drawings={
 mango:p=>`<defs>${SH_DEF(p)}${RG(p+'b',[S(0,'#fff6a8'),S(.32,'#ffd24a'),S(.7,'#ff9a2e'),S(1,'#e4572a')],.32,.28,.85)}${RG(p+'bl',[S(0,'#ff3d3d',.7),S(1,'#ff3d3d',0)],.5,.5,.5)}${RG(p+'rim',[S(.62,'#7a2408',0),S(1,'#7a2408',.38)],.42,.4,.62)}${LG(p+'lf',[S(0,'#b9f59a'),S(.45,'#4cc45c'),S(1,'#1c7a3b')],0,0,1,1)}<clipPath id="${p}c"><path d="M48 24C74 15 92 39 88 61C84 83 63 94 43 90C21 86 9 66 14 48C17 33 30 27 48 24Z"/></clipPath></defs>
 ${SHADOW(p,52,92,30,5)}
 <path d="M48 24C74 15 92 39 88 61C84 83 63 94 43 90C21 86 9 66 14 48C17 33 30 27 48 24Z" fill="url(#${p}b)"/>
 <g clip-path="url(#${p}c)"><ellipse cx="70" cy="72" rx="26" ry="22" fill="url(#${p}bl)"/><rect width="100" height="100" fill="url(#${p}rim)"/>
  <path d="M20 62C30 80 52 86 70 80" fill="none" stroke="#ffe27a" stroke-width="3" opacity=".45"/>
  <g fill="#fff4b8" opacity=".55"><circle cx="58" cy="44" r="1"/><circle cx="66" cy="54" r=".9"/><circle cx="44" cy="58" r="1"/><circle cx="54" cy="66" r=".8"/><circle cx="74" cy="46" r=".8"/><circle cx="36" cy="48" r=".9"/></g></g>
 <path d="M48 24C74 15 92 39 88 61C84 83 63 94 43 90C21 86 9 66 14 48C17 33 30 27 48 24Z" fill="none" stroke="#b5431c" stroke-width="2.2"/>
 ${GLOSS(31,40,10,5.5,-38,.8)}<circle cx="42" cy="32" r="2.2" fill="#fff" opacity=".85"/>
 <path d="M48 25C46 18 48 12 53 8" fill="none" stroke="#5e3416" stroke-width="3.4" stroke-linecap="round"/>
 <path d="M52 16C58 4 77 2 86 9C78 21 61 24 52 16Z" fill="url(#${p}lf)" stroke="#17653a" stroke-width="1.6" stroke-linejoin="round"/>
 <path d="M54 15C64 12 73 10 84 10M62 13l3-4M70 11l3-3M66 13l4 1M74 11l4 1" fill="none" stroke="#e3ffd0" stroke-width="1.1" stroke-linecap="round" opacity=".75"/>`,
 berry:p=>`<defs>${SH_DEF(p)}${LG(p+'g',[S(0,'#8ff0f2'),S(.5,'#2fb6c6'),S(1,'#126a80')])}${RG(p+'rb',[S(0,'#ffc3d0'),S(.45,'#f2496c'),S(1,'#9c0f39')],.35,.3,.75)}${RG(p+'bb',[S(0,'#c3d0ff'),S(.45,'#4f68d8'),S(1,'#1b2670')],.35,.3,.75)}${LG(p+'lf',[S(0,'#c6f7a6'),S(1,'#2a8f45')],0,0,1,1)}${RG(p+'in',[S(0,'#0e5d6e'),S(1,'#083f4c')],.5,.5,.6)}</defs>
 ${SHADOW(p,50,92,36,5.5)}
 <ellipse cx="50" cy="55" rx="37" ry="8" fill="url(#${p}in)"/>
 <g transform="translate(0 -9)"><g stroke="#7c0b2d" stroke-width="1.3"><circle cx="31" cy="48" r="12" fill="url(#${p}rb)"/><circle cx="70" cy="48" r="11.5" fill="url(#${p}rb)"/><circle cx="51" cy="41" r="14" fill="url(#${p}rb)"/><circle cx="60" cy="53" r="8.5" fill="url(#${p}bb)" stroke="#141c55"/><circle cx="40" cy="54" r="7.5" fill="url(#${p}bb)" stroke="#141c55"/></g>
 <g fill="#ffd9e2" opacity=".9"><circle cx="28" cy="46" r=".9"/><circle cx="34" cy="51" r=".9"/><circle cx="47" cy="38" r=".9"/><circle cx="55" cy="44" r=".9"/><circle cx="52" cy="34" r=".9"/><circle cx="68" cy="45" r=".9"/><circle cx="73" cy="51" r=".9"/></g>
 <g fill="#fff">${GLOSS(27,43,4,2.4,-35,.9)}${GLOSS(46,35,5,2.8,-35,.9)}${GLOSS(66,43,3.6,2.2,-35,.9)}<circle cx="57" cy="50" r="1.8" opacity=".85"/><circle cx="37" cy="51" r="1.6" opacity=".85"/></g>
 <path d="M58 54.5l2-2.5 2 2.5M38 55.5l2-2.3 2 2.3" fill="none" stroke="#141c55" stroke-width="1.1"/>
 <path d="M50 28C42 18 34 20 32 24C38 28 44 29 50 28ZM51 28C58 17 68 18 70 23C64 28 57 29 51 28Z" fill="url(#${p}lf)" stroke="#1f6b35" stroke-width="1.3" stroke-linejoin="round"/></g>
 <path d="M10 55H90C88 75 72 89 50 89C28 89 12 75 10 55Z" fill="url(#${p}g)" stroke="#0e5566" stroke-width="2"/>
 <path d="M15 66Q22 62 29 66T43 66T57 66T71 66T85 66" fill="none" stroke="#fff5c6" stroke-width="2.4" stroke-linecap="round" opacity=".85"/>
 <path d="M10 55C10 49 90 49 90 55C90 61 10 61 10 55Z" fill="none" stroke="#e8fdff" stroke-width="3.2"/><path d="M10 55C10 61 90 61 90 55" fill="none" stroke="#0e5566" stroke-width="1.6"/>
 <path d="M17 64C21 76 31 83 42 85" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".5"/>`,
 milk:p=>`<defs>${SH_DEF(p)}${RG(p+'s',[S(0,'#d79a62'),S(.55,'#8e532a'),S(1,'#4a250e')],.35,.25,.85)}${LG(p+'m',[S(0,'#ffffff'),S(1,'#efe6d2')])}</defs>
 ${SHADOW(p,50,92,34,5)}
 <path d="M13 52C13 76 30 91 50 91C70 91 87 76 87 52Z" fill="url(#${p}s)" stroke="#341a08" stroke-width="2"/>
 <g fill="none" stroke="#e2b27c" stroke-width="1.2" stroke-linecap="round" opacity=".5"><path d="M22 62q4 5 3 11M30 68q3 6 1 12M42 72q2 6 0 12M58 72q-1 6-3 11M70 66q-2 6-5 11M78 59q-2 5-5 9"/></g>
 <g fill="none" stroke="#3d1e09" stroke-width="1" stroke-linecap="round" opacity=".45"><path d="M26 60q3 4 2 9M36 66q2 5 1 10M50 70v10M64 66q-1 5-3 10M74 60q-2 4-4 8"/></g>
 <path d="M19 70C24 82 34 87 44 88" fill="none" stroke="#f6d4a8" stroke-width="2.4" stroke-linecap="round" opacity=".45"/>
 <ellipse cx="50" cy="52" rx="37" ry="11.5" fill="#fffaf0" stroke="#341a08" stroke-width="2"/>
 <ellipse cx="50" cy="53" rx="31" ry="8" fill="url(#${p}m)"/><ellipse cx="40" cy="51" rx="11" ry="2.6" fill="#fff"/><ellipse cx="62" cy="55" rx="6" ry="1.5" fill="#d9ecf5" opacity=".8"/>
 <path d="M60 52L71 15L83 10" fill="none" stroke="#a3304f" stroke-width="8.6" stroke-linecap="round" stroke-linejoin="round"/>
 <path d="M60 52L71 15L83 10" fill="none" stroke="#fff" stroke-width="6.2" stroke-linecap="round" stroke-linejoin="round"/>
 <path d="M60 52L71 15L83 10" fill="none" stroke="#ff6f9a" stroke-width="6.2" stroke-dasharray="4.5 4.5" stroke-linejoin="round"/>
 <g transform="translate(27 44)"><g fill="#ff7aa8" stroke="#c23b6c" stroke-width="1"><ellipse cx="0" cy="-6" rx="4" ry="5.5"/><ellipse cx="5.8" cy="-1.6" rx="4" ry="5.5" transform="rotate(72 5.8 -1.6)"/><ellipse cx="3.6" cy="5" rx="4" ry="5.5" transform="rotate(144 3.6 5)"/><ellipse cx="-3.6" cy="5" rx="4" ry="5.5" transform="rotate(216 -3.6 5)"/><ellipse cx="-5.8" cy="-1.6" rx="4" ry="5.5" transform="rotate(288 -5.8 -1.6)"/></g><circle r="2.4" fill="#ffe15a" stroke="#c98a12" stroke-width=".8"/></g>`,
 cookie:p=>`<defs>${SH_DEF(p)}${RG(p+'b',[S(0,'#ffeebd'),S(.55,'#f2b55a'),S(1,'#c27225')],.4,.35,.75)}${LG(p+'i',[S(0,'#ffffff'),S(1,'#ffe9f1')])}</defs>
 ${SHADOW(p,50,92,34,5)}
 <path d="${starPts(50,54,40,19)}" fill="#8c4a14" stroke="#8c4a14" stroke-width="10" stroke-linejoin="round"/>
 <path d="${starPts(50,54,40,19)}" fill="url(#${p}b)" stroke="url(#${p}b)" stroke-width="6" stroke-linejoin="round"/>
 <path d="${starPts(50,57,36,17)}" fill="none" stroke="#b8681f" stroke-width="2" stroke-linejoin="round" opacity=".45"/>
 <path d="${starPts(50,52,27,13)}" fill="url(#${p}i)" stroke="#ffd2e2" stroke-width="5" stroke-linejoin="round"/>
 <path d="${starPts(50,52,27,13)}" fill="none" stroke="#f2a9c3" stroke-width="1" stroke-linejoin="round" opacity=".9"/>
 <g stroke-width="2.6" stroke-linecap="round"><path d="M42 44l4 2" stroke="#ff5f8f"/><path d="M56 41l2 4" stroke="#43c4ff"/><path d="M60 54l4-1" stroke="#ffcf33"/><path d="M44 59l3 3" stroke="#6fd86a"/><path d="M52 50l1 4" stroke="#b07bff"/><path d="M38 52l3-2" stroke="#ffcf33"/></g>
 ${GLOSS(40,38,7,3,-30,.85)}<circle cx="47" cy="34" r="1.4" fill="#fff"/>`,
 ball:p=>`<defs>${SH_DEF(p)}${RG(p+'sh2',[S(0,'#ffffff',.0),S(.55,'#0a1a3a',0),S(1,'#0a1a3a',.5)],.38,.3,.72)}<clipPath id="${p}c"><circle cx="50" cy="48" r="37"/></clipPath></defs>
 ${SHADOW(p,52,92,30,5)}
 <g clip-path="url(#${p}c)"><rect width="100" height="100" fill="#fff"/>
  <path d="M46 30L-10 -20L40 -30Z" fill="#ff4e5a"/><path d="M46 30L110 -10L110 40Z" fill="#ffcf2e"/><path d="M46 30L110 90L60 120Z" fill="#2fa8ff"/><path d="M46 30L0 120L-20 60Z" fill="#3fcf72"/>
 </g><circle cx="50" cy="48" r="37" fill="url(#${p}sh2)"/>
 <ellipse cx="46" cy="30" rx="6" ry="4" fill="#fff" stroke="#9aa6bb" stroke-width="1"/>
 <circle cx="50" cy="48" r="37" fill="none" stroke="#24324d" stroke-width="2.2"/>
 ${GLOSS(33,30,10,5.5,-40,.85)}<circle cx="27" cy="44" r="2" fill="#fff" opacity=".7"/>`,
 kite:p=>`<defs>${SH_DEF(p)}${LG(p+'a',[S(0,'#ff9fb5'),S(1,'#e2385e')],0,0,1,1)}${LG(p+'b',[S(0,'#fff09a'),S(1,'#f0a917')],1,0,0,1)}${LG(p+'c',[S(0,'#9fdcff'),S(1,'#1d84d6')],1,1,0,0)}${LG(p+'d',[S(0,'#b6f5a6'),S(1,'#2f9d4c')],0,1,1,0)}</defs>
 ${SHADOW(p,52,95,20,3)}
 <path d="M50 42Q66 70 56 82T60 96" fill="none" stroke="#5a3418" stroke-width="1.5"/>
 <g stroke="#7a2236" stroke-width="1" stroke-linejoin="round"><path d="M54 66l-6-3 1 7Z" fill="#ff7aa0"/><path d="M54 66l6-1-3 6Z" fill="#ff7aa0"/><path d="M57 82l-6-2 2 6Z" fill="#ffd34a" stroke="#8a5a0c"/><path d="M57 82l6 0-3 5Z" fill="#ffd34a" stroke="#8a5a0c"/></g>
 <path d="M50 6L50 42L18 40Z" fill="url(#${p}a)"/><path d="M50 6L82 40L50 42Z" fill="url(#${p}b)"/><path d="M82 40L50 76L50 42Z" fill="url(#${p}c)"/><path d="M18 40L50 42L50 76Z" fill="url(#${p}d)"/>
 <path d="M50 6V76M18 40H82" stroke="#8a5a2b" stroke-width="2.4" stroke-linecap="round"/>
 <path d="M50 6L82 40L50 76L18 40Z" fill="none" stroke="#4a2a12" stroke-width="2.2" stroke-linejoin="round"/>
 <path d="M24 39L48 11" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>`,
 bed:p=>`<defs>${SH_DEF(p)}${LG(p+'w',[S(0,'#f0c387'),S(.5,'#c98a48'),S(1,'#8a5426')])}${RG(p+'c',[S(0,'#fff8f4'),S(.55,'#ffcdc4'),S(1,'#e7928c')],.42,.25,.8)}</defs>
 ${SHADOW(p,50,92,44,6)}
 <path d="M12 56C10 34 30 24 50 26C70 24 90 34 88 56C76 64 24 64 12 56Z" fill="url(#${p}c)" stroke="#bd5f5a" stroke-width="1.8"/>
 <path d="M20 42C28 32 40 30 50 30" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".75"/>
 <g fill="#e2847f" stroke="#b75954" stroke-width=".8"><circle cx="34" cy="43" r="2.4"/><circle cx="50" cy="39" r="2.4"/><circle cx="66" cy="43" r="2.4"/></g>
 <path d="M34 43Q42 37 50 39T66 43" fill="none" stroke="#d27a75" stroke-width="1" stroke-dasharray="2 2"/><path d="M24 50Q50 44 76 50" fill="none" stroke="#e8a29c" stroke-width="1.2" opacity=".7"/>
 <path d="M7 57C9 81 28 89 50 89C72 89 91 81 93 57Z" fill="url(#${p}w)" stroke="#5f3714" stroke-width="2"/>
 <g fill="none" stroke-linecap="round"><path d="M10 66C30 72 70 72 90 66M12 75C32 81 68 81 88 75" stroke="#5f3714" stroke-width="1.2" opacity=".55"/><path d="M10 63C30 69 70 69 90 63M13 72C32 78 68 78 87 72M18 81C34 85 66 85 82 81" stroke="#ffe0a8" stroke-width="1.2" opacity=".6"/>
 <path d="M20 60v24M30 62v25M40 63v26M50 63v26M60 63v26M70 62v25M80 60v24" stroke="#6e4019" stroke-width="1" opacity=".35"/></g>
 <path d="M7 57C7 51 93 51 93 57" fill="none" stroke="#e8b06e" stroke-width="6" stroke-linecap="round"/><path d="M7 57C7 51 93 51 93 57" fill="none" stroke="#5f3714" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>
 <path d="M14 64C18 78 30 84 42 86" fill="none" stroke="#fff3d6" stroke-width="2.4" stroke-linecap="round" opacity=".45"/>`,
 hammock:p=>`<defs>${SH_DEF(p)}${LG(p+'p',[S(0,'#7a4a22'),S(.4,'#d89c5a'),S(1,'#6b3f1c')],0,0,1,0)}${LG(p+'f',[S(0,'#1fb1a0'),S(.2,'#1fb1a0'),S(.2,'#fff2d0'),S(.4,'#fff2d0'),S(.4,'#ff8a6e'),S(.6,'#ff8a6e'),S(.6,'#fff2d0'),S(.8,'#fff2d0'),S(.8,'#1fb1a0'),S(1,'#1fb1a0')],0,0,1,0)}${LG(p+'s',[S(0,'#000',0),S(1,'#1b2f3a',.35)])}</defs>
 ${SHADOW(p,50,93,44,5)}
 <rect x="7" y="8" width="8" height="86" rx="3" fill="url(#${p}p)" stroke="#4a2a10" stroke-width="1.6"/><rect x="85" y="8" width="8" height="86" rx="3" fill="url(#${p}p)" stroke="#4a2a10" stroke-width="1.6"/>
 <path d="M14 22L24 34M86 22L76 34M14 28L22 38M86 28L78 38" stroke="#c99b62" stroke-width="1.4"/>
 <path d="M22 32Q50 84 78 32L78 46Q50 104 22 46Z" fill="url(#${p}f)" stroke="#1b5f57" stroke-width="1.8" stroke-linejoin="round"/>
 <path d="M22 32Q50 84 78 32L78 46Q50 104 22 46Z" fill="url(#${p}s)"/>
 <path d="M27 40Q50 78 73 40" fill="none" stroke="#fff" stroke-width="2" opacity=".55"/>
 <g fill="#fff2d0" stroke="#1b5f57" stroke-width=".8"><path d="M30 60l-3 7 5-3Z"/><path d="M42 70l-2 7 4-4Z"/><path d="M58 70l2 7-4-4Z"/><path d="M70 60l3 7-5-3Z"/></g>`,
 palm:p=>`<defs>${SH_DEF(p)}${LG(p+'pot',[S(0,'#f7b383'),S(.55,'#d0703e'),S(1,'#8f3b18')],0,0,1,0)}${LG(p+'lf',[S(0,'#a6ef8c'),S(.5,'#3fb45c'),S(1,'#17703a')],0,0,1,1)}${LG(p+'tr',[S(0,'#7a4a22'),S(.5,'#c48a50'),S(1,'#6b3f1c')],0,0,1,0)}</defs>
 ${SHADOW(p,50,95,26,4)}
 <path d="M48 64C51 50 47 38 51 26" fill="none" stroke="url(#${p}tr)" stroke-width="7.5" stroke-linecap="round"/>
 <path d="M46 58h8M45 50h8M47 42h7M48 34h6" stroke="#5e3615" stroke-width="1.3" stroke-linecap="round" opacity=".7"/>
 <g fill="url(#${p}lf)" stroke="#155f33" stroke-width="1.4" stroke-linejoin="round">
  <path d="M51 26C38 13 20 11 7 21C22 19 37 22 51 26Z"/><path d="M51 26C62 11 80 9 94 19C79 18 64 22 51 26Z"/><path d="M51 26C36 28 22 38 15 55C27 43 40 34 51 26Z"/><path d="M51 26C66 28 80 38 87 55C75 43 62 34 51 26Z"/><path d="M51 26C47 14 52 5 59 1C59 11 56 19 51 26Z"/></g>
 <g fill="none" stroke="#d8ffc2" stroke-width="1" stroke-linecap="round" opacity=".7"><path d="M49 25C38 18 24 17 12 20M53 25C64 17 78 15 90 19M49 27C38 32 27 40 19 51M53 27C64 32 74 40 83 51"/></g>
 <circle cx="48" cy="29" r="3.4" fill="#7b4a22" stroke="#4a2a10" stroke-width="1"/><circle cx="54" cy="30" r="3.4" fill="#8b5a2b" stroke="#4a2a10" stroke-width="1"/>
 <path d="M28 66H72L66 94H34Z" fill="url(#${p}pot)" stroke="#6e2a10" stroke-width="2" stroke-linejoin="round"/>
 <rect x="24" y="60" width="52" height="10" rx="3" fill="#e5874f" stroke="#6e2a10" stroke-width="2"/>
 <path d="M28 62.5H62" stroke="#ffd2ad" stroke-width="2" stroke-linecap="round" opacity=".8"/><path d="M34 74L38 90" stroke="#ffc49a" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>`,
 flower:p=>`<defs>${SH_DEF(p)}${RG(p+'pe',[S(0,'#ffe0ea'),S(.5,'#ff6fa3'),S(1,'#cc2c69')],.5,.85,.95)}${RG(p+'ce',[S(0,'#ffef8a'),S(1,'#c2185b')],.5,.5,.5)}${LG(p+'lf',[S(0,'#b5f29a'),S(1,'#24853f')],0,0,1,1)}${LG(p+'pot',[S(0,'#9be7f4'),S(.55,'#3fb2d1'),S(1,'#1a6d93')],0,0,1,0)}</defs>
 ${SHADOW(p,50,95,24,4)}
 <path d="M50 74V36" stroke="#2f8a44" stroke-width="3.6" stroke-linecap="round"/>
 <g fill="url(#${p}lf)" stroke="#1a6232" stroke-width="1.3" stroke-linejoin="round"><path d="M49 62C38 52 24 54 20 60C30 66 42 66 49 62Z"/><path d="M51 54C60 42 75 42 80 48C72 56 60 58 51 54Z"/></g>
 <path d="M48 62C38 58 30 58 23 60M52 54C61 49 70 47 77 48" fill="none" stroke="#e1ffd0" stroke-width="1" opacity=".7"/>
 <g transform="translate(50 30)" fill="url(#${p}pe)" stroke="#a3184f" stroke-width="1.2">${[0,72,144,216,288].map(a=>`<path d="M0 0C-9 -6 -10 -20 0 -24C10 -20 9 -6 0 0Z" transform="rotate(${a})"/>`).join('')}</g>
 <g transform="translate(50 30)" fill="none" stroke="#ffd0e0" stroke-width=".9" opacity=".8">${[0,72,144,216,288].map(a=>`<path d="M0 -3V-19" transform="rotate(${a})"/>`).join('')}</g>
 <circle cx="50" cy="30" r="5.5" fill="url(#${p}ce)"/><path d="M50 30L60 18" stroke="#fff1a8" stroke-width="1.6" stroke-linecap="round"/><g fill="#ffd23a" stroke="#a86f00" stroke-width=".6"><circle cx="60" cy="18" r="1.8"/><circle cx="58" cy="16" r="1.4"/><circle cx="62" cy="20" r="1.4"/></g>
 ${GLOSS(43,18,4,2,-40,.6)}
 <path d="M26 72H74L68 94H32Z" fill="url(#${p}pot)" stroke="#124d6a" stroke-width="2" stroke-linejoin="round"/>
 <path d="M30 80Q36 76 42 80T54 80T66 80T72 80" fill="none" stroke="#fff6d0" stroke-width="2" opacity=".9"/>
 <rect x="23" y="67" width="54" height="8" rx="3" fill="#5cc7e0" stroke="#124d6a" stroke-width="1.8"/><path d="M33 82L36 91" stroke="#e8fbff" stroke-width="2.2" stroke-linecap="round" opacity=".6"/>`,
 lamp:p=>`<defs>${SH_DEF(p)}${RG(p+'gl',[S(0,'#fff4a8',.85),S(.45,'#ffd35a',.35),S(1,'#ffb02e',0)],.5,.5,.5)}${RG(p+'pa',[S(0,'#fffbe2'),S(.45,'#ffd86e'),S(1,'#ee8f25')],.45,.4,.7)}${LG(p+'cap',[S(0,'#b87a3f'),S(1,'#5e3414')])}</defs>
 <circle cx="50" cy="52" r="46" fill="url(#${p}gl)"/>${SHADOW(p,50,95,18,3)}
 <path d="M38 22C38 8 62 8 62 22" fill="none" stroke="#5e3414" stroke-width="2.6" stroke-linecap="round"/>
 <path d="M30 26H70C81 40 81 64 70 78H30C19 64 19 40 30 26Z" fill="url(#${p}pa)" stroke="#a5531a" stroke-width="1.8" stroke-linejoin="round"/>
 <g fill="none" stroke="#c9741f" stroke-width="1.1" opacity=".6"><path d="M40 27C34 42 34 62 40 77M50 27V77M60 27C66 42 66 62 60 77M25 40H75M23 52H77M25 64H75"/></g>
 <ellipse cx="50" cy="52" rx="13" ry="15" fill="#fffbe6" opacity=".7"/>
 <rect x="28" y="21" width="44" height="7" rx="3" fill="url(#${p}cap)" stroke="#3e200a" stroke-width="1.4"/><rect x="28" y="76" width="44" height="7" rx="3" fill="url(#${p}cap)" stroke="#3e200a" stroke-width="1.4"/>
 <path d="M50 83v6" stroke="#d33a3a" stroke-width="2"/><path d="M47 89h6l-1 6h-4Z" fill="#e2474a" stroke="#8f1d1f" stroke-width=".8"/>
 <path d="M30 34C28 44 28 58 31 68" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>`,
 shell:p=>`<defs>${SH_DEF(p)}${RG(p+'s',[S(0,'#fff4ea'),S(.5,'#ffbfa2'),S(1,'#e2725f')],.5,.25,.85)}</defs>
 ${SHADOW(p,50,93,34,4.5)}
 <path d="M38 80L50 92L62 80Z" fill="#f4a08b" stroke="#a2493c" stroke-width="1.6" stroke-linejoin="round"/>
 <path d="${SHELL.d}" fill="url(#${p}s)" stroke="#a2493c" stroke-width="2" stroke-linejoin="round"/>
 <g fill="none" stroke-linecap="round">${SHELL.ribs.map(([x,y])=>`<path d="M50 84L${x.toFixed(1)} ${y.toFixed(1)}" stroke="#c9604f" stroke-width="1.6" opacity=".55"/><path d="M51.5 84L${(x+2.2).toFixed(1)} ${(y+1).toFixed(1)}" stroke="#fff" stroke-width="1.1" opacity=".55"/>`).join('')}</g>
 <path d="M22 50C28 34 40 26 50 25" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"/>
 <circle cx="50" cy="80" r="4.2" fill="#fff8ff" stroke="#c7a8c9" stroke-width=".8"/><circle cx="48.8" cy="78.8" r="1.3" fill="#fff"/>`,
 stool:p=>`<defs>${SH_DEF(p)}${LG(p+'l',[S(0,'#7a4a22'),S(.45,'#d39a58'),S(1,'#6b3f1c')],0,0,1,0)}${RG(p+'t',[S(0,'#ffe3a8'),S(.6,'#e2a95e'),S(1,'#a96a2c')],.45,.35,.7)}${LG(p+'cu',[S(0,'#ffb9a6'),S(1,'#e2675a')])}</defs>
 ${SHADOW(p,50,94,40,5)}
 <path d="M26 52L18 92h8l7-38ZM74 52l8 40h-8l-7-38Z" fill="url(#${p}l)" stroke="#4a2a10" stroke-width="1.6" stroke-linejoin="round"/>
 <path d="M46 56h8v38h-8Z" fill="url(#${p}l)" stroke="#4a2a10" stroke-width="1.6"/>
 <path d="M22 76H78" stroke="#8f5a2a" stroke-width="4.5" stroke-linecap="round"/><path d="M22 75H78" stroke="#e0aa6a" stroke-width="1.2" stroke-linecap="round" opacity=".7"/>
 <path d="M10 46v6c0 8 18 12 40 12s40-4 40-12v-6Z" fill="#b97a3c" stroke="#4a2a10" stroke-width="1.8"/>
 <ellipse cx="50" cy="46" rx="40" ry="13" fill="url(#${p}t)" stroke="#4a2a10" stroke-width="1.8"/>
 <ellipse cx="50" cy="44" rx="28" ry="8.5" fill="url(#${p}cu)" stroke="#a83d33" stroke-width="1.3"/>
 <path d="M30 41C38 37 52 36 62 37" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>
 <g fill="none" stroke="#8f5a2a" stroke-width=".9" opacity=".5"><path d="M15 50c10 4 25 6 35 6M85 50c-10 4-25 6-35 6"/></g>`,
 rug:p=>`<defs>${RG(p+'o',[S(0,'#ff9d7e'),S(1,'#c84836')],.45,.35,.7)}${RG(p+'m',[S(0,'#fff6dc'),S(1,'#f3dca4')],.45,.35,.7)}${RG(p+'t',[S(0,'#7fe6d6'),S(1,'#1d9e8c')],.45,.35,.7)}${RG(p+'sh2',[S(.6,'#000',0),S(1,'#2a1608',.25)],.5,.5,.55)}</defs>
 <ellipse cx="50" cy="64" rx="48" ry="25" fill="#3a2412" opacity=".18"/>
 <g stroke="#8a3424" stroke-width="1.2" stroke-linecap="round">${Array.from({length:11},(_,i)=>{const a=(-50+i*10)*Math.PI/180;const x1=50+Math.cos(a)*46,y1=62+Math.sin(a)*24;return`<path d="M${(x1).toFixed(1)} ${(y1).toFixed(1)}l${(Math.cos(a)*4).toFixed(1)} ${(Math.sin(a)*2).toFixed(1)}"/><path d="M${(100-x1).toFixed(1)} ${(y1).toFixed(1)}l${(-Math.cos(a)*4).toFixed(1)} ${(Math.sin(a)*2).toFixed(1)}"/>`}).join('')}</g>
 <ellipse cx="50" cy="62" rx="46" ry="24" fill="url(#${p}o)" stroke="#8a3424" stroke-width="1.8"/>
 <ellipse cx="50" cy="62" rx="38" ry="19" fill="url(#${p}m)" stroke="#d58a5a" stroke-width="1.2"/>
 <ellipse cx="50" cy="62" rx="28" ry="13.5" fill="url(#${p}t)" stroke="#16786b" stroke-width="1.2"/>
 <g fill="#ffcf5a" stroke="#b07a12" stroke-width=".8">${Array.from({length:10},(_,i)=>{const a=i*36*Math.PI/180,x=50+Math.cos(a)*33,y=62+Math.sin(a)*16.3;return`<path d="M${x.toFixed(1)} ${(y-2.6).toFixed(1)}l2.4 2.6-2.4 2.6-2.4-2.6Z"/>`}).join('')}</g>
 <path d="M50 53l5 6 10 3-10 3-5 6-5-6-10-3 10-3Z" fill="#ffd56a" stroke="#b07a12" stroke-width="1"/>
 <ellipse cx="50" cy="62" rx="46" ry="24" fill="url(#${p}sh2)"/>
 <path d="M14 56C22 46 36 41 50 40" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".35"/>`,
 soap:p=>`<defs>${SH_DEF(p)}${LG(p+'f',[S(0,'#ff9fc8'),S(1,'#d7518f')])}${RG(p+'t',[S(0,'#fff2f8'),S(.55,'#ffb6d5'),S(1,'#f07fb0')],.35,.3,.85)}${RG(p+'bu',[S(0,'#ffffff',.05),S(.72,'#c8f4ff',.22),S(.88,'#ffc8ee',.55),S(.96,'#fff6b0',.7),S(1,'#ffffff',.95)],.5,.5,.5)}${RG(p+'fo',[S(0,'#ffffff'),S(.7,'#f2f6ff'),S(1,'#c9d5ee')],.4,.35,.7)}</defs>
 ${SHADOW(p,50,92,40,5)}
 <rect x="12" y="48" width="76" height="38" rx="17" fill="url(#${p}f)" stroke="#a83269" stroke-width="2"/>
 <rect x="12" y="40" width="76" height="34" rx="16" fill="url(#${p}t)" stroke="#a83269" stroke-width="2"/>
 <path d="M50 66C50 66 36 58 36 50C36 45 40 43 43 43C46 43 49 45 50 47C51 45 54 43 57 43C60 43 64 45 64 50C64 58 50 66 50 66Z" fill="#ffa3cb" transform="translate(1.2 1.4)"/>
 <path d="M50 66C50 66 36 58 36 50C36 45 40 43 43 43C46 43 49 45 50 47C51 45 54 43 57 43C60 43 64 45 64 50C64 58 50 66 50 66Z" fill="#ffe3f0" stroke="#e98ab5" stroke-width="1"/>
 <path d="M20 50C22 45 28 43 36 43" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".85"/>
 <path d="M18 76C24 80 34 82 46 82" fill="none" stroke="#ffd0e6" stroke-width="2" stroke-linecap="round" opacity=".6"/>
 <g fill="url(#${p}fo)" stroke="#b7c5e2" stroke-width="1"><circle cx="70" cy="42" r="7"/><circle cx="79" cy="45" r="5.5"/><circle cx="63" cy="45" r="5"/><circle cx="74" cy="36" r="5"/></g>
 <g><circle cx="27" cy="22" r="12" fill="url(#${p}bu)" stroke="#9fd8ef" stroke-width=".9"/><path d="M19 17A10 10 0 0 1 27 12" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/><circle cx="33" cy="27" r="1.6" fill="#fff" opacity=".8"/>
 <circle cx="56" cy="14" r="8.5" fill="url(#${p}bu)" stroke="#9fd8ef" stroke-width=".8"/><path d="M50.5 11A7 7 0 0 1 56 7.5" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>
 <circle cx="80" cy="24" r="6" fill="url(#${p}bu)" stroke="#9fd8ef" stroke-width=".7"/><path d="M76.5 21.5A4.6 4.6 0 0 1 80 19" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/></g>`,
 bubble:p=>`<defs>${RG(p+'bu',[S(0,'#ffffff',.04),S(.62,'#d4f6ff',.18),S(.8,'#ffc6ee',.42),S(.9,'#fff2a6',.55),S(.96,'#b8f0ff',.75),S(1,'#ffffff',.95)],.5,.5,.5)}${RG(p+'sh',[S(0,'#7fd7ff',.0),S(1,'#7fd7ff',.25)],.65,.75,.6)}</defs>
 <circle cx="50" cy="50" r="46" fill="url(#${p}bu)"/><circle cx="50" cy="50" r="46" fill="url(#${p}sh)"/>
 <circle cx="50" cy="50" r="45.5" fill="none" stroke="#bfeaff" stroke-width="1.4" opacity=".8"/>
 <path d="M18 34A36 36 0 0 1 44 12" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".95"/>
 <circle cx="26" cy="46" r="3.2" fill="#fff" opacity=".9"/>
 <path d="M70 84A38 38 0 0 0 88 62" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".55"/>`,
 rock:p=>`<defs>${SH_DEF(p)}${RG(p+'r',[S(0,'#eef1f2'),S(.45,'#a9b1b6'),S(1,'#555e65')],.34,.28,.8)}${LG(p+'mo',[S(0,'#b6ee8a'),S(1,'#4f9c3a')])}</defs>
 ${SHADOW(p,50,90,38,6)}
 <path d="M16 70C10 55 19 37 35 31C47 25 64 26 75 37C87 47 89 64 81 74C70 86 29 86 16 70Z" fill="url(#${p}r)" stroke="#373f45" stroke-width="2.2" stroke-linejoin="round"/>
 <path d="M30 40C38 34 50 32 58 34L48 46L33 50Z" fill="#fff" opacity=".28"/>
 <path d="M58 34L72 46L62 58L48 46Z" fill="#fff" opacity=".1"/><path d="M33 50L48 46L62 58L50 74L24 68Z" fill="#000" opacity=".06"/>
 <path d="M48 46L50 74M62 58L80 66M48 46L33 50" fill="none" stroke="#5f686e" stroke-width="1.1" opacity=".5"/>
 <path d="M60 60l6 4-3 4M40 60l-4 6" fill="none" stroke="#2f363b" stroke-width="1.4" stroke-linecap="round"/>
 <path d="M34 32C42 26 56 25 66 29C60 33 52 33 46 36C42 34 38 34 34 32Z" fill="url(#${p}mo)" stroke="#3b7a2b" stroke-width="1"/>
 ${GLOSS(30,44,6,3,-35,.7)}`,
 log:p=>`<defs>${LG(p+'b',[S(0,'#5e3414'),S(.25,'#a8703c'),S(.55,'#d6a267'),S(.8,'#9a6332'),S(1,'#4e2a10')],0,0,1,0)}${RG(p+'t',[S(0,'#ffe7bd'),S(.5,'#e7b878'),S(1,'#b57a3f')],.5,.5,.55)}</defs>
 <path d="M12 22V84C12 96 88 96 88 84V22Z" fill="url(#${p}b)" stroke="#3a1e08" stroke-width="2.2"/>
 <g fill="none" stroke="#3a1e08" stroke-width="1.3" stroke-linecap="round" opacity=".55"><path d="M24 34v16M24 58v22M38 30v26M38 64v24M54 32v18M54 58v30M70 30v24M70 62v24M80 40v30"/></g>
 <g fill="none" stroke="#f3c88f" stroke-width="1" stroke-linecap="round" opacity=".45"><path d="M28 36v14M44 34v20M60 38v18M74 34v16"/></g>
 <ellipse cx="50" cy="22" rx="38" ry="12" fill="url(#${p}t)" stroke="#3a1e08" stroke-width="2.2"/>
 <g fill="none" stroke="#a46a33" stroke-width="1.2" opacity=".75"><ellipse cx="50" cy="22" rx="28" ry="8.5"/><ellipse cx="50" cy="22" rx="18" ry="5.5"/><ellipse cx="50" cy="22" rx="8" ry="2.5"/></g>
 <path d="M18 20C24 14 36 11 46 11" fill="none" stroke="#fff3d8" stroke-width="2" stroke-linecap="round" opacity=".7"/>
 <path d="M64 82c4-6 12-6 16-2" fill="#5fa84a" stroke="#2f6b25" stroke-width="1"/>`,
 heart:p=>`<defs>${RG(p+'h',[S(0,'#ffd0dc'),S(.45,'#ff5d88'),S(1,'#c81f55')],.35,.3,.8)}</defs>
 <path d="M50 88C50 88 9 62 9 35C9 21 21 12 33 12C42 12 48 18 50 24C52 18 58 12 67 12C79 12 91 21 91 35C91 62 50 88 50 88Z" fill="url(#${p}h)" stroke="#9c1641" stroke-width="2.4" stroke-linejoin="round"/>
 ${GLOSS(30,30,10,6,-35,.85)}<circle cx="44" cy="24" r="2.4" fill="#fff" opacity=".85"/>
 <path d="M70 66C76 58 82 50 84 42" fill="none" stroke="#ffb3c7" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>`,
 coin:p=>`<defs>${LG(p+'c',[S(0,'#fff8c8'),S(.3,'#ffd84f'),S(.65,'#f0a91c'),S(1,'#b46f0c')],0,0,1,1)}${RG(p+'in',[S(0,'#ffeea0'),S(1,'#e9a11d')],.4,.35,.75)}<clipPath id="${p}k"><circle cx="50" cy="50" r="40"/></clipPath></defs>
 <circle cx="50" cy="52" r="40" fill="#8a5208"/>
 <circle cx="50" cy="50" r="40" fill="url(#${p}c)" stroke="#875006" stroke-width="2.2"/>
 <circle cx="50" cy="50" r="30" fill="url(#${p}in)" stroke="#c7840f" stroke-width="2"/>
 <path d="${starPts(50,51.5,19,8.5)}" fill="#c7840f" stroke="#c7840f" stroke-width="3" stroke-linejoin="round"/>
 <path d="${starPts(50,50,19,8.5)}" fill="#fff0a0" stroke="#e7a51c" stroke-width="3" stroke-linejoin="round"/>
 <g clip-path="url(#${p}k)"><path d="M14 40L44 10L54 14L18 52Z" fill="#fff" opacity=".45"/><path d="M60 88L90 58L92 66L66 92Z" fill="#fff" opacity=".25"/></g>`,
 trophy:p=>`<defs>${LG(p+'g',[S(0,'#fff6c0'),S(.3,'#ffd54a'),S(.7,'#e9a01a'),S(1,'#a8650b')],0,0,1,0)}${LG(p+'w',[S(0,'#8a5a2c'),S(1,'#4e2c10')])}</defs>
 <path d="M28 26H14Q10 52 33 56M72 26H86Q90 52 67 56" fill="none" stroke="#c9871a" stroke-width="6" stroke-linecap="round"/><path d="M28 26H14Q10 52 33 56M72 26H86Q90 52 67 56" fill="none" stroke="#ffe48a" stroke-width="2" stroke-linecap="round"/>
 <path d="M26 16H74V44Q72 68 50 70Q28 68 26 44Z" fill="url(#${p}g)" stroke="#8a5608" stroke-width="2.2" stroke-linejoin="round"/>
 <path d="M44 70h12l3 12H41Z" fill="url(#${p}g)" stroke="#8a5608" stroke-width="2"/>
 <rect x="30" y="82" width="40" height="12" rx="3" fill="url(#${p}w)" stroke="#2e1806" stroke-width="2"/><rect x="40" y="85" width="20" height="5" rx="1.5" fill="#ffd54a" stroke="#8a5608" stroke-width=".8"/>
 <path d="${starPts(50,40,10,4.5)}" fill="#fff4b0" stroke="#c9871a" stroke-width="1.6" stroke-linejoin="round"/>
 <path d="M33 22V44Q34 58 44 64" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>`,
 home:p=>`<defs>${LG(p+'r',[S(0,'#ff9a7c'),S(1,'#d2452f')])}${LG(p+'w',[S(0,'#fff6e2'),S(1,'#f2d3a0')])}${RG(p+'gl',[S(0,'#fff8c8'),S(1,'#ffc24a')],.5,.5,.6)}</defs>
 <rect x="64" y="14" width="10" height="22" rx="2" fill="#c76b47" stroke="#6e2a14" stroke-width="1.8"/>
 <path d="M20 44H80V88H20Z" fill="url(#${p}w)" stroke="#8a5a2c" stroke-width="2" stroke-linejoin="round"/>
 <path d="M8 48L50 14L92 48" fill="none" stroke="#6e2a14" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 48L50 14L92 48" fill="none" stroke="url(#${p}r)" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
 <path d="M18 42L50 17" stroke="#ffd2c2" stroke-width="2" stroke-linecap="round" opacity=".8"/>
 <path d="M40 88V64Q40 56 50 56Q60 56 60 64V88Z" fill="#a8693a" stroke="#5e3414" stroke-width="1.8"/><circle cx="56" cy="74" r="1.6" fill="#ffd54a"/>
 <rect x="26" y="54" width="10" height="10" rx="2" fill="url(#${p}gl)" stroke="#8a5a2c" stroke-width="1.4"/><rect x="64" y="54" width="10" height="10" rx="2" fill="url(#${p}gl)" stroke="#8a5a2c" stroke-width="1.4"/>`,
 garden:p=>`<defs>${LG(p+'l',[S(0,'#b9f59a'),S(1,'#27894a')],0,0,1,1)}${RG(p+'s',[S(0,'#fff6b0'),S(1,'#ffb23a')],.4,.35,.7)}${LG(p+'g',[S(0,'#8fd36a'),S(1,'#4c9a3a')])}</defs>
 <path d="M6 86C20 72 80 72 94 86Z" fill="url(#${p}g)" stroke="#2f6b25" stroke-width="1.8"/>
 <path d="M50 84V44" stroke="#2f8a44" stroke-width="4" stroke-linecap="round"/>
 <path d="M50 70C34 50 14 58 14 66C24 76 40 76 50 70Z" fill="url(#${p}l)" stroke="#1a6232" stroke-width="1.6"/><path d="M50 60C64 36 86 42 88 52C80 64 62 66 50 60Z" fill="url(#${p}l)" stroke="#1a6232" stroke-width="1.6"/>
 <path d="M48 70C38 64 28 63 19 66M52 60C62 52 74 49 84 51" fill="none" stroke="#e0ffd0" stroke-width="1.2" opacity=".75"/>
 <g transform="translate(50 30)" fill="url(#${p}s)" stroke="#c97a12" stroke-width="1.4">${[0,60,120,180,240,300].map(a=>`<ellipse cx="0" cy="-10" rx="6" ry="9" transform="rotate(${a})"/>`).join('')}</g><circle cx="50" cy="30" r="6.5" fill="#d9661f" stroke="#8a3a0c" stroke-width="1.2"/><circle cx="48" cy="28" r="1.8" fill="#ffd9a0"/>`,
 games:p=>`<defs>${LG(p+'b',[S(0,'#8fe8ee'),S(.55,'#2fb3c2'),S(1,'#167a8c')])}${RG(p+'r',[S(0,'#ffd0d8'),S(1,'#e2385e')],.35,.3,.7)}${RG(p+'y',[S(0,'#fff4b0'),S(1,'#f0a917')],.35,.3,.7)}</defs>
 <path d="M26 26H74C88 26 95 50 95 70C95 86 82 88 72 76L64 66H36L28 76C18 88 5 86 5 70C5 50 12 26 26 26Z" fill="url(#${p}b)" stroke="#0e5463" stroke-width="2.2" stroke-linejoin="round"/>
 <path d="M14 46C18 34 24 31 34 31" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"/>
 <path d="M24 42h8v8h8v8h-8v8h-8v-8h-8v-8h8Z" fill="#fff6dc" stroke="#0e5463" stroke-width="1.4" stroke-linejoin="round"/>
 <circle cx="70" cy="44" r="6" fill="url(#${p}r)" stroke="#8c1534" stroke-width="1.2"/><circle cx="80" cy="56" r="6" fill="url(#${p}y)" stroke="#8a5a0c" stroke-width="1.2"/>
 <circle cx="68" cy="42" r="1.6" fill="#fff"/><circle cx="78" cy="54" r="1.6" fill="#fff"/>`,
 shop:p=>`<defs>${LG(p+'a',[S(0,'#ff6b6b'),S(.2,'#ff6b6b'),S(.2,'#fff6e0'),S(.4,'#fff6e0'),S(.4,'#ff6b6b'),S(.6,'#ff6b6b'),S(.6,'#fff6e0'),S(.8,'#fff6e0'),S(.8,'#ff6b6b'),S(1,'#ff6b6b')],0,0,1,0)}${LG(p+'w',[S(0,'#e8b273'),S(1,'#9c6230')])}</defs>
 <rect x="18" y="40" width="64" height="48" rx="3" fill="#fff3dc" stroke="#8a5a2c" stroke-width="2"/>
 <path d="M14 66H86V88H14Z" fill="url(#${p}w)" stroke="#5e3414" stroke-width="2"/><path d="M18 70H82" stroke="#ffe0b0" stroke-width="1.6" opacity=".7"/>
 <circle cx="34" cy="60" r="6" fill="#ffc63a" stroke="#b5741a" stroke-width="1.2"/><circle cx="50" cy="59" r="6" fill="#ff6f8a" stroke="#a81f45" stroke-width="1.2"/><circle cx="66" cy="60" r="6" fill="#8be06a" stroke="#2f7a25" stroke-width="1.2"/>
 <path d="M10 40L18 16H82L90 40Q85 50 77 40Q72 50 63 40Q58 50 50 40Q42 50 37 40Q28 50 23 40Q15 50 10 40Z" fill="url(#${p}a)" stroke="#9c2b2b" stroke-width="2" stroke-linejoin="round"/>
 <path d="M22 20L16 36" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".6"/>`
};
let uid=0;
const wrap=(id,body)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${body}</svg>`;
export function svg(id){const f=drawings[id]||drawings.heart;return wrap(id,f('a'+id+(uid++).toString(36)+'_'))}
export function icon(id,cls=''){return `<svg class="art ${cls}" viewBox="0 0 100 100" aria-hidden="true">${svg(id).replace(/^.*?<svg[^>]*>/,'').replace(/<\/svg>$/,'')}</svg>`}
const images=new Map();
export function artImage(id){if(!images.has(id)){const im=new Image();im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg(id));images.set(id,im)}return images.get(id)}
export function paintArt(c,id,x,y,w,h=w){const im=artImage(id);if(im.complete&&im.naturalWidth)c.drawImage(im,x,y,w,h)}
export const ART_IDS=Object.keys(drawings);
