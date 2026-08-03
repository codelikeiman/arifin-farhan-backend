# CBT Backend (Express + TypeScript + Prisma + MySQL)

Backend sederhana untuk aplikasi CBT (Computer Based Test), dibangun berdasarkan
hasil analisis kebutuhan & rancangan database pada folder `docs/`.

Semua kebutuhan fungsional & aturan bisnis dari modul sudah diimplementasikan:

- ✅ User dapat login (JWT)
- ✅ Admin dapat mengelola user (CRUD)
- ✅ Guru dapat membuat ujian
- ✅ Guru dapat membuat soal & pilihan jawaban
- ✅ Siswa dapat mengikuti ujian
- ✅ Sistem menyimpan jawaban siswa
- ✅ Sistem menghitung nilai otomatis
- ✅ Password terenkripsi (bcrypt)
- ✅ Siswa hanya bisa ikut ujian yang aktif
- ✅ Ujian punya batas waktu (durationMinutes)
- ✅ Siswa hanya boleh mengerjakan satu kali (unique constraint)

## 1. Struktur Folder

```
cbt-backend/
├── docs/
│   ├── analisis-kebutuhan.md
│   └── database-design.md
├── database/
│   └── schema.sql            # skema SQL mentah (referensi/dokumentasi)
├── prisma/
│   ├── schema.prisma         # skema yang BENAR-BENAR dipakai backend
│   └── seed.ts                # seed role + akun admin default
├── src/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── lib/prisma.ts
│   ├── utils/
│   ├── app.ts
│   └── server.ts
├── .env.example
├── package.json
└── tsconfig.json
```

> Catatan: `database/schema.sql` dan `prisma/schema.prisma` berisi struktur yang
> sama persis (8 tabel sesuai ERD). Backend ini menjalankan migrasi lewat Prisma,
> jadi kamu **tidak perlu** menjalankan `schema.sql` secara manual — itu cuma
> dokumentasi tambahan sesuai struktur folder di modul.

## 2. Instalasi

```bash
cd cbt-backend
npm install
```

## 3. Konfigurasi Environment

```bash
cp .env.example .env
```

Sesuaikan `DATABASE_URL` di `.env` dengan kredensial MySQL kamu, contoh:

```
DATABASE_URL="mysql://root:password@127.0.0.1:3306/cbt_db"
```

Pastikan MySQL sudah jalan dan database `cbt_db` sudah dibuat (atau biarkan
Prisma yang membuatnya lewat migrate).

## 4. Migrasi Database (Prisma)

```bash
npx prisma generate
npx prisma migrate dev --name init
```

Ini otomatis membuat 8 tabel: `roles`, `users`, `subjects`, `exams`, `questions`,
`options`, `exam_attempts`, `student_answers`.

## 5. Seed Data Awal

```bash
npm run seed
```

Ini membuat 3 role (`admin`, `guru`, `siswa`) dan 1 akun admin default:

```
email: admin@cbt.test
password: admin123
```

## 6. Jalankan Server

```bash
npm run dev
```

Server jalan di `http://localhost:3000` (atau sesuai `APP_PORT`).

## 7. Daftar Endpoint

### Auth
| Method | Endpoint | Akses | Body |
|---|---|---|---|
| POST | `/api/auth/register` | publik (otomatis role siswa) | `{ name, email, password }` |
| POST | `/api/auth/login` | publik | `{ email, password }` |

### Users (kelola user — Admin)
| Method | Endpoint | Akses |
|---|---|---|
| GET | `/api/users` | admin |
| GET | `/api/users/:id` | admin |
| POST | `/api/users` | admin — `{ name, email, password, role }` (`role`: admin/guru/siswa) |
| PUT | `/api/users/:id` | admin |
| DELETE | `/api/users/:id` | admin |

### Subjects (mata pelajaran)
| Method | Endpoint | Akses |
|---|---|---|
| GET | `/api/subjects` | semua role login |
| POST | `/api/subjects` | admin, guru — `{ name }` |
| PUT | `/api/subjects/:id` | admin, guru |
| DELETE | `/api/subjects/:id` | admin |

### Exams (ujian — dibuat Guru)
| Method | Endpoint | Akses |
|---|---|---|
| GET | `/api/exams` | semua role login |
| GET | `/api/exams/active` | semua role login (siswa lihat ujian aktif) |
| GET | `/api/exams/:id` | semua role login (termasuk soal & opsi) |
| POST | `/api/exams` | admin, guru — `{ title, subjectId, durationMinutes, startTime?, endTime? }` |
| PUT | `/api/exams/:id` | admin, guru — bisa ubah `isActive` |
| DELETE | `/api/exams/:id` | admin, guru |

### Questions (soal — dibuat Guru)
| Method | Endpoint | Akses |
|---|---|---|
| GET | `/api/questions/exam/:examId` | semua role login |
| POST | `/api/questions/exam/:examId` | admin, guru — lihat body contoh di bawah |
| PUT | `/api/questions/:id` | admin, guru |
| DELETE | `/api/questions/:id` | admin, guru |

Contoh body `POST /api/questions/exam/1`:
```json
{
  "questionText": "Ibu kota Indonesia adalah?",
  "options": [
    { "optionText": "Jakarta", "isCorrect": true },
    { "optionText": "Bandung", "isCorrect": false },
    { "optionText": "Surabaya", "isCorrect": false }
  ]
}
```

### Attempts (siswa mengerjakan ujian)
| Method | Endpoint | Akses |
|---|---|---|
| POST | `/api/attempts/start/:examId` | siswa — mulai ujian (cek aktif & belum pernah ikut) |
| POST | `/api/attempts/:attemptId/answer` | siswa — `{ questionId, optionId }`, simpan/update jawaban |
| POST | `/api/attempts/:attemptId/finish` | siswa — selesaikan ujian, nilai dihitung otomatis |
| GET | `/api/attempts/my` | siswa — riwayat attempt milik sendiri |
| GET | `/api/attempts/:attemptId` | login — lihat detail hasil (siswa hanya punya sendiri) |

## 8. Alur Pakai Singkat

1. Login sebagai admin → buat user guru & siswa (`POST /api/users`).
2. Login sebagai guru → buat subject, lalu buat exam, lalu tambah question + options.
3. Login sebagai siswa → `GET /api/exams/active` untuk lihat ujian aktif.
4. Siswa `POST /api/attempts/start/:examId` untuk mulai.
5. Siswa kirim jawaban per soal lewat `POST /api/attempts/:attemptId/answer`.
6. Siswa `POST /api/attempts/:attemptId/finish` → nilai otomatis dihitung & dikembalikan.

## 9. Catatan Pengembangan Lanjutan

Versi ini sengaja dibuat sederhana dulu. Beberapa hal yang bisa ditambah nanti:
- Validasi input pakai library (zod/joi) biar lebih rapi.
- Refresh token (saat ini cuma access token JWT biasa).
- Pagination & filter di endpoint list.
- Role `ketua_prpm`-style approval flow kalau dibutuhkan nanti.
"# cbt-frontend" 
