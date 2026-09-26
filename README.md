# Odak — Gelişmiş PWA To Do

Offline-first, kurulabilir Progressive Web App. Projeler, etiketler, öncelikler, alt görevler, sürükle-bırak sıralama, komut paleti ve IndexedDB kalıcılığı.

## Özellikler

- **PWA**: Ana ekrana yükle, çevrimdışı çalış
- **Projeler & etiketler**: Renkli projeler, `#etiket` filtreleri
- **Öncelik & tarih**: Düşük → Acil, bugün / yaklaşan / geciken
- **Alt görevler & notlar**: Detay paneli
- **Sürükle-bırak**: Görev sırasını değiştir
- **Arama**: `Ctrl+K` komut paleti
- **Tema**: Sistem / koyu / açık
- **Yedek**: JSON dışa / içe aktarma
- **Kısayollar**: `N` veya `/` yeni görev, `1–4` görünümler, `Esc` kapat

## Geliştirme

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

PWA install prompt’u genellikle `https` veya `localhost` üzerinde production build ile görünür.

## GitHub’a yükleme

```bash
git init
git add .
git commit -m "feat: Odak PWA to-do uygulaması"
gh repo create odak-todo --public --source=. --remote=origin --push
```

GitHub Pages için `vite.config.ts` içine `base: '/REPO_ADI/'` ekleyip Actions ile deploy edebilirsin.

## Stack

Vite · React 19 · TypeScript · IndexedDB (idb) · vite-plugin-pwa · dnd-kit · date-fns · Lucide
