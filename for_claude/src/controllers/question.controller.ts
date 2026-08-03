import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

// Guru membuat soal sekaligus pilihan jawabannya
export async function createQuestion(req: AuthRequest, res: Response) {
  const examId = Number(req.params.examId);
  const { questionText, options } = req.body;

  if (!questionText || !Array.isArray(options) || options.length < 2) {
    return res.status(400).json({
      message: 'questionText wajib diisi, options minimal 2 pilihan',
    });
  }

  const exam = await prisma.exam.findUnique({ where: { id: examId } });
  if (!exam) return res.status(404).json({ message: 'Ujian tidak ditemukan' });

  const hasCorrect = options.some((o: any) => o.isCorrect === true);
  if (!hasCorrect) {
    return res.status(400).json({ message: 'Minimal 1 option harus isCorrect = true' });
  }

  const question = await prisma.question.create({
    data: {
      examId,
      questionText,
      options: {
        create: options.map((o: any) => ({
          optionText: o.optionText,
          isCorrect: !!o.isCorrect,
        })),
      },
    },
    include: { options: true },
  });

  return res.status(201).json(question);
}

export async function getQuestionsByExam(req: AuthRequest, res: Response) {
  const examId = Number(req.params.examId);

  const questions = await prisma.question.findMany({
    where: { examId },
    include: { options: true },
    orderBy: { id: 'asc' },
  });

  return res.json(questions);
}

export async function updateQuestion(req: AuthRequest, res: Response) {
  const id = Number(req.params.id);
  const { questionText } = req.body;

  try {
    const question = await prisma.question.update({
      where: { id },
      data: { questionText },
    });
    return res.json(question);
  } catch (err) {
    return res.status(404).json({ message: 'Soal tidak ditemukan' });
  }
}

export async function deleteQuestion(req: AuthRequest, res: Response) {
  const id = Number(req.params.id);
  try {
    await prisma.question.delete({ where: { id } });
    return res.json({ message: 'Soal berhasil dihapus' });
  } catch (err) {
    return res.status(404).json({ message: 'Soal tidak ditemukan' });
  }
}
