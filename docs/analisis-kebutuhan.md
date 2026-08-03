# Analisis Kebutuhan Aplikasi CBT

## 1. Deskripsi Sistem
Aplikasi CBT adalah aplikasi ujian online yang digunakan untuk mengelola user,
soal, ujian, jawaban, dan nilai.

## 2. Aktor
- Admin
- Guru/Dosen
- Siswa/Mahasiswa
- Sistem

## 3. Kebutuhan Fungsional
- User dapat login.
- Admin dapat mengelola user.
- Guru dapat membuat ujian.
- Guru dapat membuat soal.
- Siswa dapat mengikuti ujian.
- Sistem dapat menyimpan jawaban.
- Sistem dapat menghitung nilai otomatis.

## 4. Kebutuhan Nonfungsional
- Sistem mudah digunakan.
- Sistem aman.
- Password harus terenkripsi.
- Sistem menggunakan file `.env`.
- Sistem dapat berjalan di komputer lokal.

## 5. Aturan Bisnis
- Siswa hanya dapat mengikuti ujian aktif.
- Ujian memiliki batas waktu.
- Siswa hanya boleh mengerjakan satu kali.
- Nilai dihitung otomatis.

## 6. Pemetaan ke Endpoint (Implementasi)
| Kebutuhan Fungsional | Endpoint |
|---|---|
| User dapat login | `POST /api/auth/login` |
| Admin mengelola user | `GET/POST/PUT/DELETE /api/users` |
| Guru membuat ujian | `POST /api/exams` |
| Guru membuat soal | `POST /api/questions/exam/:examId` |
| Siswa mengikuti ujian | `POST /api/attempts/start/:examId` |
| Sistem menyimpan jawaban | `POST /api/attempts/:attemptId/answer` |
| Sistem menghitung nilai otomatis | `POST /api/attempts/:attemptId/finish` |
