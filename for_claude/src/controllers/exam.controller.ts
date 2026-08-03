import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

// Guru/admin membuat ujian
export async function createExam(req: AuthRequest, res: Response) {
  const { title, subjectId, durationMinutes, startTime, endTime } = req.body;

  if (!title || !subjectId || !durationMinutes) {
    return res.status(400).json({ message: 'title, subjectId, durationMinutes wajib diisi' });
  }

  const exam = await prisma.exam.create({
    data: {
      title,
      subjectId: Number(subjectId),
      createdById: req.user!.id,
      durationMinutes: Number(durationMinutes),
      startTime: startTime ? new Date(startTime) : null,
      endTime: endTime ? new Date(endTime) : null,
    },
  });

  return res.status(201).json(exam);
}

export async function getAllExams(req: AuthRequest, res: Response) {
  const exams = await prisma.exam.findMany({
    include: { subject: true, createdBy: { select: { id: true, name: true } } },
    orderBy: { id: 'asc' },
  });
  return res.json(exams);
}

// Aturan bisnis: siswa hanya dapat mengikuti ujian aktif (dan dalam rentang waktu jika diatur)
export async function getActiveExams(req: AuthRequest, res: Response) {
  const now = new Date();

  const exams = await prisma.exam.findMany({
    where: {
      isActive: true,
      OR: [
        { startTime: null, endTime: null },
        { startTime: { lte: now }, endTime: { gte: now } },
        { startTime: { lte: now }, endTime: null },
        { startTime: null, endTime: { gte: now } },
      ],
    },
    include: { subject: true },
    orderBy: { id: 'asc' },
  });

  return res.json(exams);
}

export async function getExamById(req: AuthRequest, res: Response) {
  const id = Number(req.params.id);
  const exam = await prisma.exam.findUnique({
    where: { id },
    include: { subject: true, questions: { include: { options: true } } },
  });

  if (!exam) return res.status(404).json({ message: 'Ujian tidak ditemukan' });
  return res.json(exam);
}

export async function updateExam(req: AuthRequest, res: Response) {
  const id = Number(req.params.id);
  const { title, subjectId, durationMinutes, isActive, startTime, endTime } = req.body;

  const data: any = {};
  if (title) data.title = title;
  if (subjectId) data.subjectId = Number(subjectId);
  if (durationMinutes) data.durationMinutes = Number(durationMinutes);
  if (typeof isActive === 'boolean') data.isActive = isActive;
  if (startTime) data.startTime = new Date(startTime);
  if (endTime) data.endTime = new Date(endTime);

  try {
    const exam = await prisma.exam.update({ where: { id }, data });
    return res.json(exam);
  } catch (err) {
    return res.status(404).json({ message: 'Ujian tidak ditemukan' });
  }
}

export async function deleteExam(req: AuthRequest, res: Response) {
  const id = Number(req.params.id);
  try {
    await prisma.exam.delete({ where: { id } });
    return res.json({ message: 'Ujian berhasil dihapus' });
  } catch (err) {
    return res.status(404).json({ message: 'Ujian tidak ditemukan' });
  }
}
