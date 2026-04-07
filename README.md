# 🕷️ Web Crawler

Aplikasi crawler website berbasis **Node.js** yang mendukung tipe **SPA**, **SSR**, dan **PWA**.  
Hasil crawl disimpan sebagai file `.html` lengkap dengan konten yang sudah di-render.

---

## Stack & Arsitektur

```
src/
├── config.js                  # Semua konfigurasi terpusat
├── index.js                   # Express REST API server
├── cli.js                     # CLI untuk crawl langsung
├── crawlers/
│   ├── browserCrawler.js      # Puppeteer — SPA/PWA/SSR (primary)
│   └── httpCrawler.js         # Axios + Cheerio — SSR/Static (fallback)
├── services/
│   └── crawlerService.js      # Orchestrator: pipeline + save output
└── utils/
    ├── logger.js              # Logger sederhana
    └── fileHelper.js          # Save file + URL → filename helper
output/                        # Hasil crawl disimpan di sini
```

**Strategi crawl:**
1. **BrowserCrawler (Puppeteer)** → digunakan pertama kali. Headless Chrome me-render halaman secara penuh — JavaScript dieksekusi, SPA di-hydrate, PWA service worker di-bootstrap. Cocok untuk semua tipe website.
2. **HttpCrawler (Axios)** → fallback otomatis jika Puppeteer gagal (browser tidak tersedia, timeout, dll). Bekerja baik untuk SSR/static, tapi tidak mengeksekusi JS.

---

## Requirement

- Node.js >= 18
- Google Chrome **atau** Chromium terinstall di sistem

---

## Instalasi

```bash
npm install
```

---

## Konfigurasi Chrome Path

Edit `src/config.js` atau set environment variable:

```bash
# Linux
export CHROME_PATH=/usr/bin/google-chrome

# Mac
export CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# Windows (PowerShell)
$env:CHROME_PATH = "C:\Program Files\Google\Chrome\Application\chrome.exe"
```

---

## Penggunaan

### A) CLI — Crawl 3 Website Sekaligus

```bash
# Gunakan Puppeteer (direkomendasikan — render SPA/PWA penuh)
npm run crawl

# Atau mode HTTP saja (tanpa browser)
node src/cli.js --http-only
```

Output tersimpan di folder `output/`:
```
output/
├── cmlabs_co.html
├── sequence_day.html
└── github_com.html
```

---

### B) REST API

```bash
npm start
# Server berjalan di http://localhost:3000
```

#### `GET /health`
```bash
curl http://localhost:3000/health
```
```json
{ "status": "ok", "timestamp": "2026-04-07T08:00:00.000Z" }
```

---

#### `POST /crawl` — Crawl 1 URL
```bash
curl -X POST http://localhost:3000/crawl \
  -H "Content-Type: application/json" \
  -d '{ "url": "https://cmlabs.co" }'
```

**Request body:**
| Field      | Type    | Required | Deskripsi                                      |
|------------|---------|----------|------------------------------------------------|
| url        | string  | ✅       | URL yang akan di-crawl                         |
| filename   | string  | ❌       | Override nama file output (tanpa `.html`)      |
| httpOnly   | boolean | ❌       | `true` = skip browser, pakai HTTP saja         |

**Response:**
```json
{
  "status": "ok",
  "url": "https://cmlabs.co",
  "outputPath": "/home/user/crawler/output/cmlabs_co.html",
  "bytes": 285432,
  "method": "browser",
  "duration": 4231
}
```

---

#### `POST /crawl/batch` — Crawl Banyak URL
```bash
curl -X POST http://localhost:3000/crawl/batch \
  -H "Content-Type: application/json" \
  -d '{
    "targets": [
      { "url": "https://cmlabs.co",    "filename": "cmlabs_co" },
      { "url": "https://sequence.day", "filename": "sequence_day" },
      { "url": "https://github.com",   "filename": "github_com" }
    ],
    "parallel": false
  }'
```

**Request body:**
| Field    | Type    | Required | Deskripsi                                    |
|----------|---------|----------|----------------------------------------------|
| targets  | array   | ✅       | List `{ url, filename? }`                    |
| parallel | boolean | ❌       | `true` = crawl paralel (default: sequential) |

**Response:**
```json
{
  "status": "ok",
  "total": 3,
  "results": [
    { "status": "ok", "url": "https://cmlabs.co", "method": "browser", "bytes": 285432, "duration": 4231 },
    { "status": "ok", "url": "https://sequence.day", "method": "browser", "bytes": 194021, "duration": 3812 },
    { "status": "ok", "url": "https://github.com", "method": "browser", "bytes": 312049, "duration": 5103 }
  ]
}
```

---

## Cara Kerja per Tipe Website

| Tipe    | Contoh                    | Crawler          | Keterangan                                     |
|---------|---------------------------|------------------|------------------------------------------------|
| **SPA** | cmlabs.co, sequence.day   | BrowserCrawler   | Puppeteer tunggu `networkidle2` setelah JS run |
| **SSR** | next.js, nuxt.js sites    | BrowserCrawler   | Browser render + hydration selesai             |
| **PWA** | github.com, twitter.com   | BrowserCrawler   | Service worker ter-register, konten lengkap    |
| Static  | docs, landing page sederhana | HttpCrawler   | Axios langsung ambil HTML dari server          |

---

## Output HTML

Setiap file HTML hasil crawl memiliki:
- Konten halaman **penuh** (termasuk yang di-render oleh JavaScript)
- **Komentar metadata** di baris pertama: URL, method, timestamp
- **Banner kecil** di bagian bawah halaman (fixed position) untuk identifikasi file

---

## Menambah Website Target (CLI)

Edit array `TARGETS` di `src/cli.js`:

```js
const TARGETS = [
  { url: 'https://cmlabs.co',       filename: 'cmlabs_co'    },
  { url: 'https://sequence.day',    filename: 'sequence_day' },
  { url: 'https://github.com',      filename: 'github_com'   },
  { url: 'https://website-baru.id', filename: 'website_baru' }, // tambah di sini
];
```
