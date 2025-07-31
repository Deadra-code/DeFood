# **DeFood - Asisten Resep \& Kalkulator Biaya Kuliner**

**DeFood** adalah aplikasi desktop modern yang dirancang untuk para penggemar kuliner, koki rumahan, hingga pemilik usaha kuliner. Aplikasi ini berfungsi sebagai buku resep digital yang cerdas, dilengkapi dengan kalkulator nutrisi otomatis dan alat analisis biaya yang mendalam untuk membantu Anda merencanakan, menganalisis, dan mengoptimalkan setiap masakan.

## **Fitur Utama**

Aplikasi ini dikemas dengan fitur-fitur canggih yang didukung oleh AI untuk menyederhanakan alur kerja Anda, dari dapur pribadi hingga perencanaan bisnis.

#### **Manajemen Resep \& Bahan Berbasis AI**

* **Database Bahan Cerdas:** Kelola pustaka bahan makanan Anda sendiri, lengkap dengan informasi nutrisi, harga, kategori, dan **konversi satuan otomatis** (misalnya, 'siung' ke gram).
* **Asisten AI untuk Entri Data:** Secara otomatis mengisi data nutrisi, estimasi harga, dan kategori untuk bahan baru hanya dengan mengetikkan namanya.
* **AI Drafting:** Biarkan AI membuat draf awal untuk **nama resep, deskripsi, dan instruksi memasak** berdasarkan daftar bahan Anda.
* **Antarmuka Canggih:** Tampilan database bahan yang fleksibel (mode kartu \& tabel), dilengkapi dengan fitur pencarian, filter, dan berbagai opsi pengurutan.
* **Manajemen Resep Interaktif:** Atur urutan bahan dengan mudah menggunakan *drag-and-drop*, edit jumlahnya secara *inline*, dan pilih satuan yang sesuai.

#### **Analisis Nutrisi \& Biaya Real-time**

* **Kalkulator Nutrisi Otomatis:** Setiap resep secara otomatis menghitung total kalori dan makronutrien (protein, karbohidrat, lemak, serat) per porsi, yang diperbarui secara *real-time*.
* **Analisis Biaya Mendalam:**

  * Hitung **Harga Pokok Produksi (HPP)** per porsi secara akurat.
  * Sertakan **biaya operasional dan tenaga kerja** yang dapat diatur secara spesifik untuk setiap resep.
  * Tentukan harga jual yang profitabel dengan menyesuaikan **persentase margin keuntungan per resep** menggunakan *slider* interaktif.

* **Visualisasi Data:** Pahami komposisi makronutrien resep Anda melalui grafik batang yang jelas dan informatif.

#### **Peningkatan Alur Kerja \& Efisiensi**

* **Duplikasi Resep:** Buat salinan resep yang sudah ada dengan satu klik untuk bereksperimen dengan variasi baru.
* **Peringatan Cerdas:** Aplikasi akan memberikan peringatan jika Anda mencoba beralih halaman atau resep tanpa menyimpan perubahan terakhir, mencegah kehilangan data.
* **Ekspor ke PDF:** Bagikan atau cetak resep Anda dengan mudah melalui fitur ekspor ke PDF yang profesional.
* **Pembaruan Otomatis:** Aplikasi dapat memeriksa pembaruan secara otomatis dan memberi tahu Anda jika ada versi baru yang tersedia.

#### **Pengalaman Pengguna Modern**

* **UI Kustom \& Modern:** Antarmuka tanpa bingkai (*frameless*) dengan *title bar* yang dapat di-*drag* dan kontrol jendela kustom.
* **Tema Terang \& Gelap:** Sesuaikan tampilan aplikasi dengan preferensi Anda.
* **Animasi Halus:** Nikmati pengalaman pengguna yang responsif dengan transisi dan animasi yang elegan di seluruh aplikasi.

## **Tumpukan Teknologi**

* **Framework:** Electron \& React
* **Database:** SQLite 3
* **AI:** Google AI (Gemini)
* **Styling:** Tailwind CSS \& shadcn/ui
* **Manajemen State:** React Context \& Custom Hooks
* **Drag \& Drop:** @hello-pangea/dnd
* **Pelaporan:** jsPDF \& jspdf-autotable

## **Instalasi dan Menjalankan (Untuk Pengembang)**

Untuk menjalankan proyek ini di lingkungan pengembangan, ikuti langkah-langkah berikut:

1. **Prasyarat:** Pastikan Anda telah menginstal [Node.js](https://nodejs.org/) (termasuk npm).
2. **Clone Repositori:**  
   git clone https://github.com/Deadra-code/DeFood.git  
   cd DeFood
3. **Instal Dependensi:**  
   npm install
4. Jalankan dalam Mode Pengembangan:  
   Perintah ini akan menjalankan server pengembangan React dan aplikasi Electron secara bersamaan.  
   npm run electron:dev

## **Membangun Aplikasi untuk Produksi**

Untuk membuat file *installer* yang dapat didistribusikan (misalnya .exe untuk Windows), jalankan perintah berikut:

npm run build

Hasil *build* akan tersedia di dalam direktori dist.



