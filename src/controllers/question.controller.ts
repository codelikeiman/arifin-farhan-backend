import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

/* ───── BANK SOAL (independen dari ujian) ───── */

// GET /api/questions?subjectId=&difficulty=
export async function getQuestionBank(req: AuthRequest, res: Response) {
  const { subjectId, difficulty } = req.query;

  const questions = await prisma.question.findMany({
    where: {
      ...(subjectId ? { subjectId: Number(subjectId) } : {}),
      ...(difficulty ? { difficulty: difficulty as any } : {}),
    },
    include: { options: true, subject: true },
    orderBy: { createdAt: 'desc' },
  });

  return res.json(questions);
}

// POST /api/questions
export async function createQuestion(req: AuthRequest, res: Response) {
  const { subjectId, questionText, difficulty, options } = req.body;

  if (!subjectId || !questionText || !Array.isArray(options) || options.length < 2) {
    return res.status(400).json({
      message: 'subjectId, questionText wajib diisi, options minimal 2 pilihan',
    });
  }

  const hasCorrect = options.some((o: any) => o.isCorrect === true);
  if (!hasCorrect) {
    return res.status(400).json({ message: 'Minimal 1 option harus isCorrect = true' });
  }

  const subject = await prisma.subject.findUnique({ where: { id: Number(subjectId) } });
  if (!subject) return res.status(404).json({ message: 'Mata pelajaran tidak ditemukan' });

  const question = await prisma.question.create({
    data: {
      subjectId: Number(subjectId),
      questionText,
      difficulty: difficulty ?? 'SEDANG',
      createdById: req.user?.id ?? null,
      options: {
        create: options.map((o: any) => ({
          optionText: o.optionText,
          isCorrect: !!o.isCorrect,
        })),
      },
    },
    include: { options: true, subject: true },
  });

  return res.status(201).json(question);
}

// PUT /api/questions/:id
export async function updateQuestion(req: AuthRequest, res: Response) {
  const id = Number(req.params.id);
  const { subjectId, questionText, difficulty, options } = req.body;

  if (options && Array.isArray(options) && !options.some((o: any) => o.isCorrect)) {
    return res.status(400).json({ message: 'Minimal 1 option harus isCorrect = true' });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.question.update({
        where: { id },
        data: {
          ...(subjectId ? { subjectId: Number(subjectId) } : {}),
          ...(questionText ? { questionText } : {}),
          ...(difficulty ? { difficulty } : {}),
        },
      });

      if (options && Array.isArray(options)) {
        await tx.option.deleteMany({ where: { questionId: id } });
        await tx.option.createMany({
          data: options.map((o: any) => ({
            questionId: id,
            optionText: o.optionText,
            isCorrect: !!o.isCorrect,
          })),
        });
      }
    });

    const updated = await prisma.question.findUnique({
      where: { id },
      include: { options: true, subject: true },
    });
    return res.json(updated);
  } catch (err: any) {
    if (err.code === 'P2003') {
      return res.status(400).json({
        message: 'Opsi tidak bisa diubah karena sudah pernah dijawab siswa',
      });
    }
    return res.status(404).json({ message: 'Soal tidak ditemukan' });
  }
}

// DELETE /api/questions/:id
export async function deleteQuestion(req: AuthRequest, res: Response) {
  const id = Number(req.params.id);
  try {
    await prisma.$transaction([
      prisma.examQuestion.deleteMany({ where: { questionId: id } }),
      prisma.option.deleteMany({ where: { questionId: id } }),
      prisma.question.delete({ where: { id } }),
    ]);
    return res.json({ message: 'Soal berhasil dihapus' });
  } catch (err: any) {
    if (err.code === 'P2003') {
      return res.status(400).json({
        message: 'Soal tidak bisa dihapus karena sudah pernah dijawab siswa',
      });
    }
    return res.status(404).json({ message: 'Soal tidak ditemukan' });
  }
}

/* ───── RELASI SOAL <-> UJIAN ───── */

// GET /api/exams/:examId/questions
export async function getQuestionsByExam(req: AuthRequest, res: Response) {
  const examId = Number(req.params.examId);

  const examQuestions = await prisma.examQuestion.findMany({
    where: { examId },
    include: { question: { include: { options: true, subject: true } } },
    orderBy: { order: 'asc' },
  });

  return res.json(examQuestions.map((eq) => eq.question));
}

// POST /api/exams/:examId/questions   body: { questionIds: number[] }
export async function attachQuestionsToExam(req: AuthRequest, res: Response) {
  const examId = Number(req.params.examId);
  const { questionIds } = req.body;

  if (!Array.isArray(questionIds) || questionIds.length === 0) {
    return res.status(400).json({ message: 'Pilih minimal satu soal' });
  }

  const exam = await prisma.exam.findUnique({ where: { id: examId } });
  if (!exam) return res.status(404).json({ message: 'Ujian tidak ditemukan' });

  await prisma.examQuestion.createMany({
    data: questionIds.map((qId: number) => ({ examId, questionId: Number(qId) })),
    skipDuplicates: true,
  });

  return res.json({ message: 'Soal berhasil ditambahkan ke ujian' });
}

// DELETE /api/exams/:examId/questions/:questionId
export async function detachQuestionFromExam(req: AuthRequest, res: Response) {
  const examId = Number(req.params.examId);
  const questionId = Number(req.params.questionId);

  await prisma.examQuestion.deleteMany({ where: { examId, questionId } });
  return res.json({ message: 'Soal dihapus dari ujian' });
}

/* ───── SUBJECT (dropdown mata pelajaran) ───── */

// GET /api/subjects
export async function getAllSubjects(_req: AuthRequest, res: Response) {
  const subjects = await prisma.subject.findMany({ orderBy: { name: 'asc' } });
  return res.json(subjects);
}