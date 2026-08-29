TROPIC MERGE v10 — Battery Optimized Universal Offline PWA (iPhone / iPad / Android)

BASELINE
- Semua gameplay, fruit spacing, Bomb, Shake, NEXT, BEST/SCORE dan UI v9 dikekalkan.

BATTERY OPTIMIZATION v10
- Fruit artwork dirender sekali dan dicache sebagai sprite; texture kompleks tak dilukis semula setiap frame.
- Background + box dicache sebagai static scene.
- Physics aktif pada kadar adaptive (hingga 45 Hz semasa buah bergerak).
- Bila board settle, physics turun ke low-power idle rate dan render sekitar 15 FPS.
- Buah yang stabil masuk sleep state; gravity/collision tak dikira penuh sampai diganggu buah lain atau Shake.
- Collision solver guna adaptive passes dan skip sleeping pairs yang stabil.
- Device pixel ratio canvas dicap 1.6 untuk kurangkan GPU load sambil kekalkan visual tajam pada phone/tablet.
- Bila PWA masuk background / screen lain, loop tidak buat physics/render aktif dan audio disuspend.
- Merge, Bomb dan Shake akan wake semula buah yang perlu bergerak.

CARA UPDATE GITHUB PAGES
1. Extract ZIP.
2. Upload/replace SEMUA isi folder ke root repo tropic-merge.
3. Commit changes.
4. Tunggu GitHub Pages deploy.
5. Buka URL game dalam Safari/Chrome dengan internet dan refresh sekali.
6. Tutup PWA Home Screen sepenuhnya dan buka semula.
7. Jika masih nampak v9, refresh browser sekali lagi supaya service worker v10 ambil alih.
