TROPIC MERGE v6 — iPhone/iPad Offline PWA

APA DALAM PACKAGE
- index.html : game Tropic Merge v6
- manifest.webmanifest : metadata PWA
- sw.js : offline cache/service worker
- icons/ : Home Screen icons

PENTING UNTUK iPHONE/iPAD
PWA tidak boleh dipasang terus daripada ZIP/local file. Ia perlu dibuka daripada HTTPS website sekurang-kurangnya sekali.
Selepas first load dan Add to Home Screen, game akan menggunakan offline cache dan boleh dimainkan tanpa internet.

CARA INSTALL DI iPHONE/iPAD
1. Host seluruh folder ini di HTTPS (contoh GitHub Pages/Cloudflare Pages/Netlify atau server HTTPS sendiri).
2. Buka URL menggunakan Safari.
3. Tunggu game load sekali.
4. Tekan Share.
5. Pilih Add to Home Screen.
6. Pastikan Open as Web App diaktifkan jika pilihan itu dipaparkan.
7. Buka icon Tropic Merge dari Home Screen.
8. Selepas itu boleh test Airplane Mode — game sepatutnya masih boleh dibuka/main offline.

Gameplay berasaskan v5 dengan realistic roll physics: random fruit, drag kiri/kanan, release drop, Bomb, Shake Box, score/best score dan local save.


PERUBAHAN v6
- Rotation buah ikut pergerakan sebenar: bila slide/roll, buah berpusing mengikut kelajuan.
- Collision memberi angular kick pendek supaya hentaman nampak hidup.
- Rotation diredam bila buah settle, jadi tiada bug berpusing tanpa henti.
- Shake Box turut memberi sedikit temporary rotation.
