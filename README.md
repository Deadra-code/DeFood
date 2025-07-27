# **BetonLAB \- Aplikasi Manajemen Laboratorium Beton**

**BetonLAB** adalah aplikasi desktop komprehensif yang dirancang untuk para insinyur sipil, teknisi laboratorium, dan profesional di bidang konstruksi untuk mengelola seluruh alur kerja desain campuran beton (concrete mix design) dan kontrol kualitas sesuai dengan Standar Nasional Indonesia (SNI).

## **Fitur Utama**

Aplikasi ini dikemas dengan fitur-fitur canggih untuk menyederhanakan dan mendigitalkan proses kerja Anda:

* **Manajemen Proyek & Trial Mix:** Organisasikan pekerjaan Anda ke dalam proyek-proyek, dan kelola beberapa versi *trial mix* di dalam setiap proyek.  
* **Kalkulator Desain Campuran:** Perhitungan *job mix design* yang akurat berdasarkan **SNI 03-2834-2000**, dengan antarmuka langkah-demi-langkah yang intuitif.  
* **Pustaka Material & Pengujian:**  
  * Kelola pustaka material Anda (semen, agregat halus, agregat kasar).  
  * Catat hasil pengujian laboratorium untuk setiap material (analisis saringan, berat jenis, kadar air, abrasi, dll.).  
  * Gunakan data pengujian yang "Aktif" secara otomatis dalam perhitungan desain.  
* **Manajemen Benda Uji:** Lacak siklus hidup setiap benda uji, mulai dari pengecoran, perawatan (*curing*), hingga pengujian, lengkap dengan status yang jelas.  
* **Analisis Kekuatan Beton:**  
  * Visualisasikan perkembangan kuat tekan beton dari waktu ke waktu melalui grafik interaktif.  
  * Gunakan **Grafik Kontrol Kualitas Statistik (SQC)** untuk memantau konsistensi dan variabilitas hasil pengujian Anda.  
* **Pelaporan Profesional:**  
  * Buat laporan PDF yang komprehensif untuk setiap *trial mix* atau ringkasan proyek secara keseluruhan.  
  * Ekspor data mentah ke format CSV untuk analisis lebih lanjut.  
* **Alur Kerja yang Efisien:**  
  * **Pencarian Global:** Temukan proyek, trial, atau material secara instan dari mana saja di dalam aplikasi.  
  * **Template Pengujian:** Buat dan terapkan serangkaian pengujian standar untuk material baru dengan satu klik.  
  * **Notifikasi & Pengingat:** Dapatkan pengingat otomatis untuk jadwal pengujian benda uji yang akan jatuh tempo.  
* **Pustaka Dokumen Referensi:** Unggah dan kelola file-file SNI atau dokumen referensi lainnya langsung di dalam aplikasi.  
* **Keamanan Data:** Lakukan pencadangan (backup) dan pemulihan (restore) seluruh database Anda dengan mudah.

## **Tumpukan Teknologi**

* **Framework:** Electron & React  
* **Database:** SQLite 3  
* **Styling:** Tailwind CSS & shadcn/ui  
* **Grafik:** Recharts  
* **Pelaporan:** jsPDF & PapaParse

## **Struktur Direktori**

Struktur proyek diorganisir berdasarkan fitur untuk kemudahan pemeliharaan dan pengembangan.

BetonLAB/  
├── public/  
│   ├── electron.js  (Logika Proses Utama Electron)  
│   ├── preload.js   (Jembatan antara Backend dan Frontend)  
│   └── index.html  
│  
├── src/  
│   ├── api/  
│   ├── components/  
│   ├── data/  
│   ├── features/    (Modul-modul utama aplikasi)  
│   │   ├── Dashboard/  
│   │   ├── MaterialTesting/  
│   │   ├── Projects/  
│   │   ├── ReferenceLibrary/  
│   │   └── Settings/  
│   ├── hooks/       (Logika state dan data fetching)  
│   ├── lib/  
│   ├── utils/       (Fungsi utilitas seperti kalkulator dan generator PDF)  
│   ├── App.js       (Komponen utama aplikasi)  
│   └── ...  
│  
├── package.json  
└── ...

*(Untuk struktur direktori lengkap, silakan lihat file Struktur Direktori Aplikasi BetonLAB.md)*

## **Instalasi dan Menjalankan (Untuk Pengembang)**

Untuk menjalankan proyek ini di lingkungan pengembangan, ikuti langkah-langkah berikut:

1. **Prasyarat:** Pastikan Anda telah menginstal [Node.js](https://nodejs.org/) (termasuk npm).  
2. **Clone Repositori:**  
   git clone https://github.com/nama-anda/betonlab.git  
   cd betonlab

3. **Instal Dependensi:**  
   npm install

4. Jalankan dalam Mode Pengembangan:  
   Perintah ini akan menjalankan server pengembangan React dan aplikasi Electron secara bersamaan.  
   npm run electron:dev

## **Membangun Aplikasi untuk Produksi**

Untuk membuat file installer yang dapat didistribusikan (misalnya .exe untuk Windows), jalankan perintah berikut:

npm run build

Hasil build akan tersedia di dalam direktori dist.

## **Kontribusi**

Kontribusi untuk meningkatkan BetonLAB sangat kami hargai. Silakan lakukan *fork* pada repositori ini, buat *branch* baru untuk fitur atau perbaikan Anda, dan ajukan *Pull Request*.

## **Lisensi**

Proyek ini dilisensikan di bawah [Lisensi MIT](http://docs.google.com/LICENSE.md).