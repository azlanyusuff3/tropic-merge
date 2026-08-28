TROPIC MERGE v8 — Universal Offline PWA (iPhone / iPad / Android)

FIX v8
- Betulkan buah bertindih pada board padat. Collision radius kini hampir sama dengan saiz visual sebenar.
- Tambah final depenetration pass supaya residual overlap dipisahkan tanpa menambah bounce/energy.
- Same fruit masih merge bila bersentuh / sangat hampir bersentuh.
- BEST score dipindah ke tengah, di bawah title TROPIC MERGE supaya tak ditutup toolbar/Bomb.
- SCORE kekal di kanan atas.
- Semua fungsi v7 kekal: stable roll, hard containment, Bomb, Shake, Random/Next, offline save.
- Offline cache dinaikkan ke v8.

CARA UPDATE GITHUB PAGES
1. Extract ZIP ini.
2. Upload/replace SEMUA isi folder ini ke root repo tropic-merge:
   index.html, sw.js, manifest.webmanifest, README_INSTALL.txt dan folder icons.
3. Commit changes.
4. Buka URL GitHub Pages dengan internet dan refresh sekali.
5. Tutup app Home Screen sepenuhnya, kemudian buka semula.
6. Jika masih nampak v7, refresh URL dalam Safari/Chrome sekali lagi kerana service worker lama mungkin masih aktif seketika.
