import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export async function getAllSubjects(req: Request, res: Response) {
  const subjects = await prisma.subject.findMany({ orderBy: { id: 'asc' } });
  return res.json(subjects);
}

export async function createSubject(req: Request, res: Response) {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'name wajib diisi' });

  const subject = await prisma.subject.create({ data: { name } });
  return res.status(201).json(subject);
}

export async function updateSubject(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { name } = req.body;

  try {
    const subject = await prisma.subject.update({ where: { id }, data: { name } });
    return res.json(subject);
  } catch (err) {
    return res.status(404).json({ message: 'Subject tidak ditemukan' });
  }
}

export async function deleteSubject(req: Request, res: Response) {
  const id = Number(req.params.id);
  try {
    await prisma.subject.delete({ where: { id } });
    return res.json({ message: 'Subject berhasil dihapus' });
  } catch (err) {
    return res.status(404).json({ message: 'Subject tidak ditemukan' });
  }
}
