# **DeFood - Asisten Resep \& Kalkulator Biaya Kuliner**

**DeFood** adalah aplikasi desktop modern yang dirancang untuk para penggemar kuliner, koki rumahan, hingga pemilik usaha kuliner. Aplikasi ini berfungsi sebagai buku resep digital yang cerdas, dilengkapi dengan kalkulator nutrisi otomatis dan alat analisis biaya yang mendalam untuk membantu Anda merencanakan, menganalisis, dan mengoptimalkan setiap masakan.

## **Fitur Utama**

Aplikasi ini dikemas dengan fitur-fitur canggih untuk menyederhanakan alur kerja Anda, dari dapur pribadi hingga perencanaan bisnis.

#### **Manajemen Resep \& Bahan**

* **Database Bahan Lengkap:** Kelola pustaka bahan makanan Anda sendiri, lengkap dengan informasi nutrisi (kalori, protein, karbohidrat, lemak), harga, dan kategori.
* **Antarmuka Canggih:** Tampilan database bahan yang fleksibel (mode kartu \& tabel), dilengkapi dengan fitur pencarian, filter, dan berbagai opsi pengurutan (nama, harga, paling sering digunakan).
* **Manajemen Resep Interaktif:** Buat dan kelola resep dengan antarmuka dua panel yang efisien. Atur urutan bahan dengan mudah menggunakan *drag-and-drop* dan edit jumlahnya secara *inline*.
* **Penambahan Bahan Massal:** Tambahkan beberapa bahan sekaligus ke dalam resep menggunakan antarmuka *checklist* dua panel yang intuitif.

#### **Analisis Nutrisi \& Biaya**

* **Kalkulator Nutrisi Otomatis:** Setiap resep secara otomatis menghitung total kalori dan makronutrien (protein, karbohidrat, lemak) per porsi, yang diperbarui secara *real-time* saat Anda menyesuaikan jumlah porsi.
* **Analisis Biaya \& Kalkulator Harga Jual:**

  * **Rincian Biaya Modal:** Hitung **Harga Pokok Produksi (HPP)** per porsi secara akurat, dengan kemampuan untuk menambahkan biaya operasional dan tenaga kerja.
  * **Kalkulator Harga Jual Interaktif:** Tentukan harga jual yang profitabel dengan menyesuaikan **persentase margin keuntungan** menggunakan *slider* interaktif.
  * **Simulasi Profit:** Proyeksikan potensi keuntungan dengan cepat berdasarkan target penjualan per porsi.

* **Visualisasi Data:** Pahami komposisi makronutrien dan struktur biaya resep Anda melalui grafik dan diagram yang mudah dibaca.

#### **Peningkatan Alur Kerja \& Efisiensi**

* **Duplikasi Resep:** Buat salinan resep yang sudah ada dengan satu klik untuk bereksperimen dengan variasi baru tanpa harus memulai dari nol.
* **Peringatan Cerdas:** Aplikasi akan memberikan peringatan jika Anda mencoba beralih halaman atau resep tanpa menyimpan perubahan terakhir Anda, mencegah kehilangan data yang tidak disengaja.
* **Ekspor ke PDF:** Bagikan atau cetak resep Anda dengan mudah melalui fitur ekspor ke PDF yang profesional.

#### **Pengalaman Pengguna Modern**

* **UI yang Sleek \& Modern:** Antarmuka yang bersih dan intuitif dibangun dengan komponen modern.
* **Tema Terang \& Gelap:** Sesuaikan tampilan aplikasi dengan preferensi Anda.
* **Animasi Halus:** Nikmati pengalaman pengguna yang responsif dengan transisi dan animasi yang elegan di seluruh aplikasi.

## **Peta Jalan Fitur (Rencana Pengembangan)**

DeFood terus berkembang. Berikut adalah beberapa fitur besar yang direncanakan untuk masa depan, sesuai dengan visi untuk menjadi asisten kuliner yang lengkap:

* **Fase 1: Buku Resep Cerdas**

  * **Konteks Nutrisi Personal:** Menetapkan target kalori harian dan melihat bagaimana setiap resep berkontribusi pada target tersebut.

* **Fase 2: Dapur Efisien**

  * **Komponen Resep (Sub-Recipes):** Membuat resep dasar (seperti saus atau bumbu) yang dapat digunakan kembali di dalam resep lain.
  * **Manajemen Inventaris:** Melacak stok bahan yang Anda miliki.

* **Fase 3: Perencana Strategis**

  * **Perencana Menu Mingguan:** Merencanakan menu untuk seminggu penuh menggunakan resep yang ada.
  * **Daftar Belanja Cerdas \& Otomatis:** Membuat daftar belanja secara otomatis berdasarkan rencana menu dan stok inventaris.

## **Tumpukan Teknologi**

* **Framework:** Electron \& React
* **Database:** SQLite 3
* **Styling:** Tailwind CSS \& shadcn/ui
* **Manajemen State:** React Context
* **Animasi:** tailwindcss-animate
* **Drag \& Drop:** @hello-pangea/dnd
* **Pelaporan:** jsPDF \& jspdf-autotable

## **Instalasi dan Menjalankan (Untuk Pengembang)**

Untuk menjalankan proyek ini di lingkungan pengembangan, ikuti langkah-langkah berikut:

1. **Prasyarat:** Pastikan Anda telah menginstal [Node.js](https://nodejs.org/) (termasuk npm).
2. **Clone Repositori:**  
   git clone https://www.andarepository.com/  
   cd defood-refactored
3. **Instal Dependensi:**  
   npm install
4. Jalankan dalam Mode Pengembangan:  
   Perintah ini akan menjalankan server pengembangan React dan aplikasi Electron secara bersamaan.  
   npm run electron:dev

## **Membangun Aplikasi untuk Produksi**

Untuk membuat file *installer* yang dapat didistribusikan (misalnya .exe untuk Windows), jalankan perintah berikut:

npm run build

Hasil *build* akan tersedia di dalam direktori dist atau release.



