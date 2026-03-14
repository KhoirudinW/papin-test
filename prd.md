Berikut **PRD (Product Requirement Document)** yang bisa langsung kamu copy untuk pengembangan fitur **Relationship Tests pada PAPin**.
Struktur dibuat **ringkas tapi profesional**, supaya mudah dipakai diskusi dengan partner atau developer.

---

# PRD — Relationship Tests Feature

**Product:** PAPin
**Feature:** Relationship Psychology Tests
**Version:** v1.0
**Status:** Draft

---

# 1. Objective

Menambahkan fitur **Relationship Tests** pada PAPin untuk:

1. Memberikan insight psikologi hubungan kepada user
2. Meningkatkan value dari subscription plan
3. Mendorong upgrade dari Free → Simple → Pro
4. Membantu user memahami dinamika hubungan dengan pasangan

Tes yang tersedia berfokus pada **relationship psychology**, seperti:

* Love Language
* Attachment Style
* Communication Style
* Conflict Style

---

# 2. Goals

### Product Goals

* Meningkatkan **conversion ke subscription**
* Menambah **engagement user**
* Memberikan **value edukatif dalam hubungan**

### Success Metrics

| Metric                 | Target                |
| ---------------------- | --------------------- |
| User yang mencoba test | >40% dari active user |
| Upgrade setelah test   | >10%                  |
| Completion rate test   | >70%                  |
| Retention 7 hari       | meningkat             |

---

# 3. User Segments

### Free Users

* Baru menggunakan PAPin
* Penasaran dengan insight hubungan

### Simple Plan Users

* Ingin memahami diri dalam hubungan
* Mengakses test advanced terbatas

### Pro Plan Users

* Ingin memahami hubungan secara mendalam
* Mengakses semua test

---

# 4. Feature Overview

Relationship Tests adalah fitur kuisioner psikologi yang memberikan **insight hubungan personal**.

Setiap test terdiri dari:

* Pertanyaan pilihan
* Analisis hasil
* Insight hubungan
* Tips relationship

---

# 5. Test Structure

### Basic Test

Digunakan untuk **Free plan**.

Karakteristik:

* 8–12 pertanyaan
* hasil sederhana
* tidak ada analisis mendalam

Contoh output:

> Love language kamu adalah
> **Words of Affirmation**

---

### Advanced Test

Digunakan untuk **Simple dan Pro plan**.

Karakteristik:

* 30–40 pertanyaan
* analisis lebih mendalam
* insight hubungan
* tips personal

Contoh output:

Primary Love Language
Words of Affirmation

Secondary Love Language
Quality Time

Insight:

Kamu merasa dicintai ketika pasangan:

* memberikan apresiasi
* mengungkapkan rasa bangga
* mengakui usaha kamu

---

# 6. Test Types (Phase 1)

Minimal test yang akan dikembangkan.

### 1. Love Language Test

Mengidentifikasi cara seseorang menerima dan mengekspresikan cinta.

Output:

* Primary love language
* Secondary love language
* Relationship tips

---

### 2. Attachment Style Test

Mengidentifikasi pola keterikatan emosional.

Output:

* Secure
* Anxious
* Avoidant
* Disorganized

---

### 3. Communication Style Test

Menilai cara seseorang menyampaikan emosi dan kebutuhan.

Output contoh:

* Passive
* Assertive
* Avoidant
* Aggressive

---

### 4. Conflict Style Test

Mengidentifikasi cara seseorang menghadapi konflik.

Output:

* Avoiding
* Competing
* Compromising
* Collaborating
* Accommodating

---

# 7. Subscription Integration

Relationship tests akan diintegrasikan dengan **subscription plans**.

---

## Free Plan

User mendapatkan:

* Love Language Basic Test
* Attachment Style Basic Test

Karakteristik:

* jumlah pertanyaan terbatas
* hasil sederhana
* tidak ada analisis mendalam

Tujuan:

Memberikan preview value dari fitur test.

---

## Simple Plan

User mendapatkan:

* Love Language Advanced Test

Fitur:

* insight mendalam
* relationship tips
* analisis tambahan

---

## Pro Plan

User mendapatkan:

* Semua Advanced Tests
* Tes baru otomatis terbuka

Contoh:

* Love Language Advanced
* Attachment Advanced
* Communication Advanced
* Conflict Advanced

---

# 8. User Flow

### Step 1

User membuka menu **Relationship Tests**

---

### Step 2

User melihat daftar test

Contoh:

Love Language Test
Attachment Style Test
Communication Style Test

---

### Step 3

User memilih test

Jika Free plan:

* hanya basic version

Jika Simple / Pro:

* advanced version terbuka

---

### Step 4

User mengisi pertanyaan

Format:

multiple choice

---

### Step 5

User melihat hasil test

Halaman hasil menampilkan:

* tipe hasil
* penjelasan
* insight relationship
* tips hubungan

---

# 9. UI Sections

### Test List Page

Menampilkan:

* daftar test
* badge Basic / Advanced
* lock icon jika belum tersedia

---

### Test Question Page

Menampilkan:

* pertanyaan
* pilihan jawaban
* progress indicator

Contoh:

Question 5 / 30

---

### Result Page

Menampilkan:

* hasil utama
* insight relationship
* tips pasangan

---

# 10. Future Development (Phase 2)

### Couple Compatibility Test

User dan pasangan mengisi test.

Sistem menghitung compatibility.

Output contoh:

Compatibility Score
78%

Love Language Match
Moderate

Insight:

Kamu membutuhkan Words of Affirmation
Pasangan menunjukkan cinta melalui Acts of Service

---

### Relationship Insights

Menggabungkan data dari:

* test
* mood
* PAP activity

Contoh insight:

> Saat pasangan tidak mengirim PAP, mood kamu cenderung menurun.

---

# 11. Risks

### Risk 1

User merasa test terlalu sederhana

Mitigation:

* pastikan advanced test berkualitas

---

### Risk 2

User merasa test hanya copy dari internet

Mitigation:

* tambahkan insight khusus PAPin

---

### Risk 3

User tidak menyelesaikan test

Mitigation:

* progress indicator
* jumlah pertanyaan jelas

---

# 12. Development Priority

Phase 1 (MVP)

* Love Language Basic
* Love Language Advanced
* Attachment Basic

Phase 2

* Attachment Advanced
* Communication Test
* Conflict Test

Phase 3

* Couple Compatibility Test
* Relationship Insights