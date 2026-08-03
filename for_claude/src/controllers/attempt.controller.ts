import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

// Siswa mulai mengerjakan ujian
export async function startAttempt(req: AuthRequest, res: Response) {
  const examId = Number(req.params.examId);
  const userId = req.user!.id;

  const exam = await prisma.exam.findUnique({ where: { id: examId } });
  if (!exam) return res.status(404).json({ message: 'Ujian tidak ditemukan' });

  // Aturan bisnis: siswa hanya dapat mengikuti ujian aktif
  if (!exam.isActive) {
    return res.status(400).json({ message: 'Ujian ini tidak aktif' });
  }

  const now = new Date();
  if (exam.startTime && now < exam.startTime) {
    return res.status(400).json({ message: 'Ujian belum dimulai' });
  }
  if (exam.endTime && now > exam.endTime) {
    return res.status(400).json({ message: 'Ujian sudah berakhir' });
  }

  // Aturan bisnis: siswa hanya boleh mengerjakan satu kali
  const existing = await prisma.examAttempt.findUnique({
    where: { userId_examId: { userId, examId } },
  });
  if (existing) {
    return res.status(400).json({
      message: 'Anda sudah pernah mengerjakan ujian ini',
      attempt: existing,
    });
  }

  const attempt = await prisma.examAttempt.create({
    data: { userId, examId },
  });

  return res.status(201).json(attempt);
}

// Sistem menyimpan jawaban siswa (boleh dipanggil berulang untuk mengubah jawaban sebelum selesai)
export async function submitAnswer(req: AuthRequest, res: Response) {
  const attemptId = Number(req.params.attemptId);
  const { questionId, optionId } = req.body;
  const userId = req.user!.id;

  if (!questionId) return res.status(400).json({ message: 'questionId wajib diisi' });

  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: { exam: true },
  });

  if (!attempt) return res.status(404).json({ message: 'Attempt tidak ditemukan' });
  if (attempt.userId !== userId) {
    return res.status(403).json({ message: 'Bukan attempt milik Anda' });
  }
  if (attempt.finishedAt) {
    return res.status(400).json({ message: 'Ujian sudah diselesaikan' });
  }

  // Aturan bisnis: ujian memiliki batas waktu
  const deadline = new Date(attempt.startedAt.getTime() + attempt.exam.durationMinutes * 60000);
  if (new Date() > deadline) {
    return res.status(400).json({ message: 'Waktu pengerjaan sudah habis' });
  }

  const answer = await prisma.studentAnswer.upsert({
    where: {
      examAttemptId_questionId: { examAttemptId: attemptId, questionId: Number(questionId) },
    },
    update: { optionId: optionId ? Number(optionId) : null },
    create: {
      examAttemptId: attemptId,
      questionId: Number(questionId),
      optionId: optionId ? Number(optionId) : null,
    },
  });

  return res.json(answer);
}

// Sistem menghitung nilai otomatis ketika siswa menyelesaikan ujian
export async function finishAttempt(req: AuthRequest, res: Response) {
  const attemptId = Number(req.params.attemptId);
  const userId = req.user!.id;

  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      exam: { include: { questions: true } },
      studentAnswers: { include: { option: true } },
    },
  });

  if (!attempt) return res.status(404).json({ message: 'Attempt tidak ditemukan' });
  if (attempt.userId !== userId) {
    return res.status(403).json({ message: 'Bukan attempt milik Anda' });
  }
  if (attempt.finishedAt) {
    return res.status(400).json({ message: 'Ujian sudah diselesaikan sebelumnya' });
  }

  const totalQuestions = attempt.exam.questions.length;
  const correctCount = attempt.studentAnswers.filter((a) => a.option?.isCorrect).length;
  const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  const finished = await prisma.examAttempt.update({
    where: { id: attemptId },
    data: { finishedAt: new Date(), score },
  });

  return res.json({
    message: 'Ujian selesai, nilai dihitung otomatis',
    totalQuestions,
    correctCount,
    score: finished.score,
    finishedAt: finished.finishedAt,
  });
}

export async function getMyAttempts(req: AuthRequest, res: Response) {
  const userId = req.user!.id;

  const attempts = await prisma.examAttempt.findMany({
    where: { userId },
    include: { exam: { select: { id: true, title: true } } },
    orderBy: { id: 'desc' },
  });

  return res.json(attempts);
}

export async function getAttemptResult(req: AuthRequest, res: Response) {
  const attemptId = Number(req.params.attemptId);

  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      exam: { select: { id: true, title: true, durationMinutes: true } },
      user: { select: { id: true, name: true } },
      studentAnswers: { include: { option: true, question: true } },
    },
  });

  if (!attempt) return res.status(404).json({ message: 'Attempt tidak ditemukan' });

  // Siswa hanya boleh melihat hasil miliknya sendiri; admin/guru boleh melihat semua
  if (req.user!.role === 'siswa' && attempt.userId !== req.user!.id) {
    return res.status(403).json({ message: 'Tidak boleh melihat hasil milik orang lain' });
  }

  return res.json(attempt);
}
