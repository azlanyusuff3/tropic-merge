// Original lightweight vector props. Monster artwork remains the original WebP sprites.
const wrap=body=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x2=".8" y2="1"><stop stop-color="#fff3a6"/><stop offset="1" stop-color="#f3b84b"/></linearGradient></defs><g stroke="#75492d" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;
const drawings={
 mango:'<path d="M46 24C87 10 97 72 56 85 14 99 7 50 46 24Z" fill="#ffc542"/><path d="M45 25Q43 9 58 8" fill="none"/><path d="M51 20Q79 0 80 24Q65 32 51 20" fill="#63c879"/><path d="M30 48Q22 63 32 73" fill="none" stroke="#fff4a0" stroke-width="7"/>',
 berry:'<path d="M12 54H88L77 84H25Z" fill="#63ced6"/><path d="M15 59H86" stroke="#fff7c4" stroke-width="5"/><g fill="#ed6e8b"><circle cx="29" cy="44" r="17"/><circle cx="54" cy="37" r="19"/><circle cx="75" cy="46" r="15"/></g><path d="M45 21 51 10 58 21 69 15 64 27" fill="#7bc977"/>',
 milk:'<path d="M19 38Q18 87 53 87 88 86 84 37Z" fill="#b9794b"/><ellipse cx="51" cy="38" rx="33" ry="16" fill="#fff7d4"/><path d="M57 38 69 10H85" fill="none" stroke="#51b4c6" stroke-width="6"/><path d="M32 60 37 73M47 66 51 77" stroke="#e1ae77"/>',
 cookie:'<path d="m50 10 12 23 26 4-19 20 5 28-24-13-25 13 5-28L11 37l27-4Z" fill="url(#g)"/><g fill="#ae7743" stroke="none"><circle cx="48" cy="38" r="4"/><circle cx="36" cy="56" r="4"/><circle cx="61" cy="58" r="4"/></g>',
 ball:'<circle cx="50" cy="50" r="37" fill="#ffdb6a"/><path d="M50 13Q75 40 50 87M13 50Q45 25 87 50M50 13Q25 40 50 87M13 50Q45 75 87 50" fill="#f28f8b"/><circle cx="50" cy="50" r="10" fill="#7ad6ce"/>',
 kite:'<path d="m50 8 30 36-30 29-30-29Z" fill="#73d4dc"/><path d="m50 8v65M20 44h60" stroke="#fff4b9"/><path d="M50 73Q74 82 55 95" fill="none"/><path d="m57 80 10-5-2 13Z" fill="#ff9da0"/>',
 bed:'<ellipse cx="50" cy="75" rx="45" ry="15" fill="#b08051"/><path d="M8 67Q6 40 50 37 95 39 93 67Q80 86 50 82 17 84 8 67Z" fill="#f4ad9f"/><ellipse cx="50" cy="54" rx="35" ry="15" fill="#ffdbc3"/><path d="M25 69Q50 77 74 68" fill="none"/>',
 hammock:'<path d="M10 13 20 91M90 13 80 91" stroke="#b8854c" stroke-width="9"/><path d="M10 26Q50 95 90 26L85 56Q50 98 15 56Z" fill="#80d3c1"/><path d="M17 40Q50 82 83 40" fill="none" stroke="#fff4be" stroke-width="7"/>',
 palm:'<path d="M45 68Q56 41 49 20" fill="none" stroke="#ba8c4c" stroke-width="9"/><path d="M50 29Q15-3 8 33 30 17 50 29M50 29Q89-2 96 31 72 18 50 29M50 29Q19 18 14 57 33 38 50 29M50 29Q79 18 87 58 69 38 50 29" fill="#62bd76"/><path d="M25 66H77L68 95H33Z" fill="#e3a274"/>',
 flower:'<path d="M50 76V25M50 67Q21 39 24 66ZM50 57Q82 31 78 60Z" fill="#69bc79"/><path d="M23 74H77L68 96H32Z" fill="#73bec8"/><g fill="#f39aab"><ellipse cx="50" cy="21" rx="14" ry="18"/><ellipse cx="33" cy="35" rx="17" ry="14"/><ellipse cx="67" cy="35" rx="17" ry="14"/><ellipse cx="40" cy="50" rx="14" ry="17"/><ellipse cx="60" cy="50" rx="14" ry="17"/></g><circle cx="50" cy="36" r="9" fill="#ffe38a"/>',
 lamp:'<path d="M40 18Q40 4 50 4 62 4 62 18M30 83H70M50 75v8" fill="none"/><path d="M29 20H72L80 70Q50 87 20 70Z" fill="#ffd982"/><path d="M36 29 32 66M65 29 69 66" stroke="#b78647"/><circle cx="50" cy="50" r="11" fill="#fffbd1" stroke="none"/>',
 shell:'<path d="M16 62Q-1 25 28 24 32 2 51 20 72 0 78 25 105 27 86 64L58 86H43Z" fill="#ffc0a7"/><path d="M26 38 47 76M50 30v45M75 39 56 76M17 58 44 79M85 60 59 79" fill="none" stroke="#e79282"/><path d="M41 85h19" stroke-width="7"/>',
 stool:'<path d="M27 52 21 92M72 52 79 92M27 75h47" stroke="#a37743" stroke-width="9"/><ellipse cx="50" cy="46" rx="40" ry="17" fill="#e4bd78"/><path d="M16 46Q50 60 84 46" fill="none"/>',
 rug:'<ellipse cx="50" cy="61" rx="47" ry="26" fill="#77cfc2"/><ellipse cx="50" cy="61" rx="36" ry="18" fill="none" stroke="#fff0b4" stroke-width="6"/><path d="m50 49 6 8 12 4-12 4-6 8-6-8-12-4 12-4Z" fill="#ffca72"/>',
 soap:'<rect x="14" y="40" width="70" height="42" rx="17" fill="#f2b6d3"/><path d="M30 59h38" stroke="#fff0f2" stroke-width="7"/><g fill="#c9f5ff"><circle cx="28" cy="23" r="12"/><circle cx="57" cy="16" r="9"/><circle cx="77" cy="31" r="7"/></g>',
 heart:'<path d="M50 84 16 53C-9 21 27 1 50 28 73 1 109 21 84 53Z" fill="#f39da4"/>',
 coin:'<circle cx="50" cy="50" r="39" fill="#ffd76d"/><circle cx="50" cy="50" r="29" fill="none" stroke="#e9a642"/><path d="m50 29 6 13 14 2-10 10 2 15-12-7-13 7 3-15-10-10 14-2Z" fill="#fff3ad"/>',
 trophy:'<path d="M29 20H72V50Q70 70 50 70 29 68 29 50Z" fill="#ffd36e"/><path d="M28 27H12Q8 59 31 54M73 27H89Q94 58 70 54M50 70v17M33 89h35" fill="none" stroke="#ce9844" stroke-width="6"/>',
 home:'<path d="m9 46 41-33 41 33M21 39v49h58V39" fill="#f6d6a0"/><path d="M42 88V62h18v26" fill="#79c6bd"/>',
 garden:'<path d="M50 89V39M50 67Q18 36 17 64Q22 83 50 77M50 56Q83 21 85 54Q75 72 50 67" fill="#73c88b"/><circle cx="50" cy="27" r="17" fill="#ffd77d"/>',
 games:'<path d="M25 25h50q15 0 19 47 0 18-16 9L65 67H35L20 83Q3 92 8 68q2-43 17-43" fill="#79cfd7"/><path d="M28 40v22M17 51h22" stroke="#fff6ce" stroke-width="7"/><circle cx="72" cy="44" r="5" fill="#f6a0ab"/><circle cx="81" cy="58" r="5" fill="#ffda72"/>',
 shop:'<path d="M19 42h63v45H19Z" fill="#f6d3a3"/><path d="m12 41 11-25h54l12 25q-9 17-19 0-10 17-20 0-10 17-20 0-9 17-18 0" fill="#7ad0c0"/><path d="M42 87V61h19v26" fill="#b88957"/>'
};
export function svg(id){return wrap(drawings[id]||drawings.heart)}
export function icon(id,cls=''){return `<svg class="art ${cls}" viewBox="0 0 100 100" aria-hidden="true">${svg(id).replace(/^.*?<svg[^>]*>/,'').replace(/<\/svg>$/,'')}</svg>`}
const images=new Map();
export function artImage(id){if(!images.has(id)){const im=new Image();im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg(id));images.set(id,im)}return images.get(id)}
export function paintArt(c,id,x,y,w,h=w){const im=artImage(id);if(im.complete&&im.naturalWidth)c.drawImage(im,x,y,w,h)}
