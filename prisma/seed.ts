import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Memulai proses seeding...\n');

  // ─── 1. ROLES ────────────────────────────────────────────────────────────────
  const roleNames = ['admin', 'guru', 'siswa'];
  for (const name of roleNames) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('✅ Roles dibuat: admin, guru, siswa');

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: 'admin' } });
  const guruRole  = await prisma.role.findUniqueOrThrow({ where: { name: 'guru' } });
  const siswaRole = await prisma.role.findUniqueOrThrow({ where: { name: 'siswa' } });

  // ─── 2. USERS ────────────────────────────────────────────────────────────────
  const hash = (plain: string) => bcrypt.hash(plain, 10);

  // Admin
  await prisma.user.upsert({
    where: { email: 'admin@cbt.test' },
    update: {},
    create: {
      name: 'Administrator',
      email: 'admin@cbt.test',
      password: await hash('admin123'),
      roleId: adminRole.id,
      emailVerifiedAt: new Date(),
    },
  });

  // Guru
  const guru1 = await prisma.user.upsert({
    where: { email: 'budi.guru@cbt.test' },
    update: {},
    create: {
      name: 'Budi Santoso',
      email: 'budi.guru@cbt.test',
      password: await hash('guru123'),
      roleId: guruRole.id,
      emailVerifiedAt: new Date(),
    },
  });

  const guru2 = await prisma.user.upsert({
    where: { email: 'siti.guru@cbt.test' },
    update: {},
    create: {
      name: 'Siti Rahayu',
      email: 'siti.guru@cbt.test',
      password: await hash('guru123'),
      roleId: guruRole.id,
      emailVerifiedAt: new Date(),
    },
  });

  // Siswa
  const siswa1 = await prisma.user.upsert({
    where: { email: 'andi.siswa@cbt.test' },
    update: {},
    create: {
      name: 'Andi Pratama',
      email: 'andi.siswa@cbt.test',
      password: await hash('siswa123'),
      roleId: siswaRole.id,
      emailVerifiedAt: new Date(),
    },
  });

  const siswa2 = await prisma.user.upsert({
    where: { email: 'dewi.siswa@cbt.test' },
    update: {},
    create: {
      name: 'Dewi Lestari',
      email: 'dewi.siswa@cbt.test',
      password: await hash('siswa123'),
      roleId: siswaRole.id,
      emailVerifiedAt: new Date(),
    },
  });

  const siswa3 = await prisma.user.upsert({
    where: { email: 'rizky.siswa@cbt.test' },
    update: {},
    create: {
      name: 'Rizky Fajar',
      email: 'rizky.siswa@cbt.test',
      password: await hash('siswa123'),
      roleId: siswaRole.id,
      emailVerifiedAt: new Date(),
    },
  });

  console.log('✅ Users dibuat: 1 admin, 2 guru, 3 siswa');

  // ─── 3. SUBJECTS ─────────────────────────────────────────────────────────────
  const subjectData = [
    'Matematika',
    'Bahasa Indonesia',
    'Ilmu Pengetahuan Alam',
    'Bahasa Inggris',
  ];

  const subjects: Record<string, { id: number; name: string }> = {};
  for (const name of subjectData) {
    const existing = await prisma.subject.findFirst({ where: { name } });
    if (existing) {
      subjects[name] = existing;
    } else {
      subjects[name] = await prisma.subject.create({ data: { name } });
    }
  }
  console.log('✅ Subjects dibuat:', subjectData.join(', '));

  // ─── 4. EXAMS + QUESTIONS + OPTIONS ──────────────────────────────────────────

  // Helper: buat ujian beserta soal dan opsinya (idempotent berdasarkan title)
  async function createExamWithQuestions(payload: {
    title: string;
    subjectName: string;
    createdById: number;
    durationMinutes: number;
    isActive?: boolean;
    startTime?: Date;
    endTime?: Date;
    questions: {
      text: string;
      options: { text: string; isCorrect: boolean }[];
    }[];
  }) {
    const existing = await prisma.exam.findFirst({ where: { title: payload.title } });
    if (existing) {
      console.log(`   ↩  Ujian "${payload.title}" sudah ada, dilewati.`);
      return existing;
    }

    const exam = await prisma.exam.create({
      data: {
        title: payload.title,
        subjectId: subjects[payload.subjectName].id,
        createdById: payload.createdById,
        durationMinutes: payload.durationMinutes,
        isActive: payload.isActive ?? true,
        startTime: payload.startTime ?? null,
        endTime: payload.endTime ?? null,
      },
    });

    for (const q of payload.questions) {
      const question = await prisma.question.create({
        data: {
          examId: exam.id,
          questionText: q.text,
        },
      });

      await prisma.option.createMany({
        data: q.options.map((o) => ({
          questionId: question.id,
          optionText: o.text,
          isCorrect: o.isCorrect,
        })),
      });
    }

    return exam;
  }

  // ── Ujian 1: Matematika Dasar (guru Budi) ──
  const examMath = await createExamWithQuestions({
    title: 'Ujian Matematika Dasar',
    subjectName: 'Matematika',
    createdById: guru1.id,
    durationMinutes: 60,
    isActive: true,
    questions: [
      {
        text: 'Berapakah hasil dari 7 × 8?',
        options: [
          { text: '54', isCorrect: false },
          { text: '56', isCorrect: true },
          { text: '58', isCorrect: false },
          { text: '64', isCorrect: false },
        ],
      },
      {
        text: 'Nilai dari √144 adalah...',
        options: [
          { text: '10', isCorrect: false },
          { text: '11', isCorrect: false },
          { text: '12', isCorrect: true },
          { text: '14', isCorrect: false },
        ],
      },
      {
        text: 'Jika x + 5 = 12, maka nilai x adalah...',
        options: [
          { text: '5', isCorrect: false },
          { text: '6', isCorrect: false },
          { text: '7', isCorrect: true },
          { text: '8', isCorrect: false },
        ],
      },
      {
        text: 'Hasil dari 15% × 200 adalah...',
        options: [
          { text: '25', isCorrect: false },
          { text: '30', isCorrect: true },
          { text: '35', isCorrect: false },
          { text: '40', isCorrect: false },
        ],
      },
      {
        text: 'Keliling persegi dengan sisi 9 cm adalah...',
        options: [
          { text: '27 cm', isCorrect: false },
          { text: '36 cm', isCorrect: true },
          { text: '45 cm', isCorrect: false },
          { text: '81 cm', isCorrect: false },
        ],
      },
    ],
  });

  // ── Ujian 2: Bahasa Indonesia (guru Siti) ──
  const examBindo = await createExamWithQuestions({
    title: 'Ujian Bahasa Indonesia Semester 1',
    subjectName: 'Bahasa Indonesia',
    createdById: guru2.id,
    durationMinutes: 45,
    isActive: true,
    questions: [
      {
        text: 'Apa yang dimaksud dengan paragraf deduktif?',
        options: [
          { text: 'Paragraf yang kalimat utamanya berada di tengah', isCorrect: false },
          { text: 'Paragraf yang kalimat utamanya berada di awal', isCorrect: true },
          { text: 'Paragraf yang kalimat utamanya berada di akhir', isCorrect: false },
          { text: 'Paragraf tanpa kalimat utama', isCorrect: false },
        ],
      },
      {
        text: 'Manakah penulisan kata yang tepat?',
        options: [
          { text: 'Apotik', isCorrect: false },
          { text: 'Apotek', isCorrect: true },
          { text: 'Apothek', isCorrect: false },
          { text: 'Aptik', isCorrect: false },
        ],
      },
      {
        text: 'Sinonim kata "bijaksana" adalah...',
        options: [
          { text: 'Pintar', isCorrect: false },
          { text: 'Pandai', isCorrect: false },
          { text: 'Arif', isCorrect: true },
          { text: 'Cerdas', isCorrect: false },
        ],
      },
      {
        text: 'Kalimat efektif adalah kalimat yang...',
        options: [
          { text: 'Panjang dan berbunga-bunga', isCorrect: false },
          { text: 'Singkat, padat, dan jelas maknanya', isCorrect: true },
          { text: 'Menggunakan banyak kata sifat', isCorrect: false },
          { text: 'Terdiri atas lebih dari sepuluh kata', isCorrect: false },
        ],
      },
    ],
  });

  // ── Ujian 3: IPA (guru Budi, tidak aktif / akan datang) ──
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const twoWeeks = new Date();
  twoWeeks.setDate(twoWeeks.getDate() + 14);

  await createExamWithQuestions({
    title: 'Ujian IPA - Sistem Tata Surya',
    subjectName: 'Ilmu Pengetahuan Alam',
    createdById: guru1.id,
    durationMinutes: 90,
    isActive: false,
    startTime: nextWeek,
    endTime: twoWeeks,
    questions: [
      {
        text: 'Planet terbesar dalam tata surya adalah...',
        options: [
          { text: 'Saturnus', isCorrect: false },
          { text: 'Jupiter', isCorrect: true },
          { text: 'Uranus', isCorrect: false },
          { text: 'Neptunus', isCorrect: false },
        ],
      },
      {
        text: 'Berapa lama waktu yang dibutuhkan cahaya Matahari untuk sampai ke Bumi?',
        options: [
          { text: 'Sekitar 1 menit', isCorrect: false },
          { text: 'Sekitar 8 menit', isCorrect: true },
          { text: 'Sekitar 1 jam', isCorrect: false },
          { text: 'Sekitar 1 hari', isCorrect: false },
        ],
      },
      {
        text: 'Lapisan terluar Matahari yang bisa dilihat saat gerhana total disebut...',
        options: [
          { text: 'Kromosfer', isCorrect: false },
          { text: 'Fotosfer', isCorrect: false },
          { text: 'Korona', isCorrect: true },
          { text: 'Inti Matahari', isCorrect: false },
        ],
      },
    ],
  });

  console.log('✅ Exams, Questions, dan Options dibuat');

  // ─── 5. CONTOH ATTEMPT SISWA (opsional, untuk demo data) ─────────────────────
  // Andi mengerjakan ujian Matematika
  const attemptAndi = await prisma.examAttempt.upsert({
    where: { userId_examId: { userId: siswa1.id, examId: examMath.id } },
    update: {},
    create: {
      userId: siswa1.id,
      examId: examMath.id,
      startedAt: new Date(),
      finishedAt: new Date(),
      score: 80,
    },
  });

  // Ambil soal + opsi ujian matematika untuk diisi jawabannya
  const mathQuestions = await prisma.question.findMany({
    where: { examId: examMath.id },
    include: { options: true },
    orderBy: { id: 'asc' },
  });

  // Andi jawab benar semua kecuali soal terakhir (score 80 = 4/5 benar)
  for (let i = 0; i < mathQuestions.length; i++) {
    const q = mathQuestions[i];
    const correctOption = q.options.find((o) => o.isCorrect)!;
    const wrongOption   = q.options.find((o) => !o.isCorrect)!;
    const chosenOption  = i < 4 ? correctOption : wrongOption; // soal ke-5 salah

    await prisma.studentAnswer.upsert({
      where: {
        examAttemptId_questionId: {
          examAttemptId: attemptAndi.id,
          questionId: q.id,
        },
      },
      update: {},
      create: {
        examAttemptId: attemptAndi.id,
        questionId: q.id,
        optionId: chosenOption.id,
      },
    });
  }

  // Dewi mengerjakan ujian Bahasa Indonesia
  const attemptDewi = await prisma.examAttempt.upsert({
    where: { userId_examId: { userId: siswa2.id, examId: examBindo.id } },
    update: {},
    create: {
      userId: siswa2.id,
      examId: examBindo.id,
      startedAt: new Date(),
      finishedAt: new Date(),
      score: 100,
    },
  });

  const bindoQuestions = await prisma.question.findMany({
    where: { examId: examBindo.id },
    include: { options: true },
    orderBy: { id: 'asc' },
  });

  for (const q of bindoQuestions) {
    const correctOption = q.options.find((o) => o.isCorrect)!;
    await prisma.studentAnswer.upsert({
      where: {
        examAttemptId_questionId: {
          examAttemptId: attemptDewi.id,
          questionId: q.id,
        },
      },
      update: {},
      create: {
        examAttemptId: attemptDewi.id,
        questionId: q.id,
        optionId: correctOption.id,
      },
    });
  }

  console.log('✅ Contoh ExamAttempts dan StudentAnswers dibuat');

  // ─── RINGKASAN ────────────────────────────────────────────────────────────────
  console.log('\n─────────────────────────────────────────────');
  console.log('🎉 Seeding selesai!\n');
  console.log('📋 Akun yang tersedia:');
  console.log('   ADMIN  → admin@cbt.test          | admin123');
  console.log('   GURU   → budi.guru@cbt.test       | guru123');
  console.log('   GURU   → siti.guru@cbt.test       | guru123');
  console.log('   SISWA  → andi.siswa@cbt.test      | siswa123');
  console.log('   SISWA  → dewi.siswa@cbt.test      | siswa123');
  console.log('   SISWA  → rizky.siswa@cbt.test     | siswa123');
  console.log('─────────────────────────────────────────────\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });