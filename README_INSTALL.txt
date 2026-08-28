TROPIC MERGE v7 — Universal Offline PWA (iPhone / iPad / Android)

FIX v7
- Rotation tak lagi guna free-running spin: angle ikut jarak horizontal sebenar buah bergerak.
- Bila buah settle, ia tak boleh berpusing sendiri tanpa henti.
- Physics guna sub-steps + hard containment; buah yang dah masuk box tak boleh terpelanting keluar kiri/kanan/atas/bawah.
- Same fruit merge pada visual contact dengan sedikit tolerance; kes 'dah rapat tapi tak merge' dikurangkan.
- Header Score/Best responsive untuk skrin phone sempit dan safe-area/notch.
- Shake masih ada tetapi impulse di-cap supaya susunan bergerak tanpa melontar buah keluar.
- Score/Best disimpan local pada device.
- Offline cache dikemas kini ke v7.

CARA UPDATE GITHUB PAGES
1. Extract ZIP ini.
2. Dalam repo tropic-merge GitHub, replace/upload SEMUA isi folder ini ke root repo:
   index.html, sw.js, manifest.webmanifest, README_INSTALL.txt dan folder icons.
3. Commit changes.
4. Buka URL GitHub Pages dengan internet dan refresh sekali.
5. iPhone/iPad: Safari > Share > Add to Home Screen.
6. Android: Chrome > menu ⋮ > Install app / Add to Home screen.
7. Selepas first load, boleh test Airplane Mode; game akan guna offline cache.

Nota: Jika Home Screen app masih nampak versi lama selepas update, buka URL GitHub Pages dalam browser sekali dengan internet, refresh, tutup app Home Screen dan buka semula.
