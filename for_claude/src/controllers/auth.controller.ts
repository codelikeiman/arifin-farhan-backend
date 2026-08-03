import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { signToken } from '../utils/jwt';

// Registrasi default sebagai siswa (kalau mau bikin guru/admin, dilakukan oleh admin via /api/users)
export async function register(req: Request, res: Response) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'name, email, dan password wajib diisi' });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(400).json({ message: 'Email sudah terdaftar' });
  }

  const roleData = await prisma.role.findUnique({ where: { name: 'siswa' } });
  if (!roleData) {
    return res.status(500).json({ message: "Role 'siswa' belum ada, jalankan seed terlebih dahulu" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, roleId: roleData.id },
    include: { role: true },
  });

  return res.status(201).json({
    message: 'Registrasi berhasil',
    user: { id: user.id, name: user.name, email: user.email, role: user.role.name },
  });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'email dan password wajib diisi' });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });

  if (!user) {
    return res.status(401).json({ message: 'Email atau password salah' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Email atau password salah' });
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role.name });

  return res.json({
    message: 'Login berhasil',
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role.name },
  });
}
