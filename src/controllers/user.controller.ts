import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';

const CODE_EXPIRES_MINUTES = 15;

function generateVerificationCode(): string {
  // Kode verifikasi 6 digit, contoh: 123456
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Bentuk data verifikasi yang aman ditampilkan ke admin di User Management.
// Kode hanya ditampilkan selama belum expired; kalau sudah expired dianggap tidak ada
// (admin perlu generate ulang) supaya tidak menyampaikan kode yang sudah tidak berlaku.
function verificationInfo(u: { emailVerifiedAt: Date | null; verificationCode: string | null; verificationExpires: Date | null; role: { name: string } }) {
  if (u.role.name === 'admin') {
    return { verified: true, code: null, codeExpiresAt: null };
  }

  if (u.emailVerifiedAt) {
    return { verified: true, code: null, codeExpiresAt: null };
  }

  const codeIsValid = !!u.verificationCode && !!u.verificationExpires && u.verificationExpires > new Date();

  return {
    verified: false,
    code: codeIsValid ? u.verificationCode : null,
    codeExpiresAt: codeIsValid ? u.verificationExpires : null,
  };
}

export async function getAllUsers(req: Request, res: Response) {
  const users = await prisma.user.findMany({
    include: { role: true },
    orderBy: { id: 'asc' },
  });

  return res.json(
    users.map((u: (typeof users)[number]) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role.name,
      verification: verificationInfo(u),
    }))
  );
}

export async function getUserById(req: Request, res: Response) {
  const id = Number(req.params.id);
  const user = await prisma.user.findUnique({ where: { id }, include: { role: true } });

  if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

  return res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role.name,
    verification: verificationInfo(user),
  });
}

export async function createUser(req: Request, res: Response) {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'name, email, password, role wajib diisi' });
  }

  const roleData = await prisma.role.findUnique({ where: { name: role } });
  if (!roleData) return res.status(400).json({ message: `Role '${role}' tidak ditemukan` });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(400).json({ message: 'Email sudah digunakan' });

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, roleId: roleData.id },
    include: { role: true },
  });

  return res.status(201).json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role.name,
    verification: verificationInfo(user),
  });
}

export async function updateUser(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { name, email, role, password } = req.body;

  const data: any = {};
  if (name) data.name = name;
  if (email) data.email = email;
  if (password) data.password = await bcrypt.hash(password, 10);

  if (role) {
    const roleData = await prisma.role.findUnique({ where: { name: role } });
    if (!roleData) return res.status(400).json({ message: `Role '${role}' tidak ditemukan` });
    data.roleId = roleData.id;
  }

  try {
    const user = await prisma.user.update({ where: { id }, data, include: { role: true } });
    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.name,
      verification: verificationInfo(user),
    });
  } catch (err) {
    return res.status(404).json({ message: 'User tidak ditemukan' });
  }
}

export async function deleteUser(req: Request, res: Response) {
  const id = Number(req.params.id);

  try {
    await prisma.user.delete({ where: { id } });
    return res.json({ message: 'User berhasil dihapus' });
  } catch (err) {
    return res.status(404).json({ message: 'User tidak ditemukan' });
  }
}

// Admin membuat/memperbarui kode verifikasi untuk user tertentu secara manual.
// Kode ini TIDAK dikirim ke mana pun — admin melihatnya di dashboard lalu
// menyampaikannya sendiri (lisan/chat) ke user yang bersangkutan (demo verifikasi lokal).
export async function generateVerificationCodeForUser(req: Request, res: Response) {
  const id = Number(req.params.id);

  const user = await prisma.user.findUnique({ where: { id }, include: { role: true } });
  if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

  if (user.role.name === 'admin') {
    return res.status(400).json({ message: 'Akun admin tidak memerlukan kode verifikasi' });
  }

  if (user.emailVerifiedAt) {
    return res.status(400).json({ message: 'User ini sudah terverifikasi' });
  }

  const verificationCode = generateVerificationCode();
  const verificationExpires = new Date(Date.now() + CODE_EXPIRES_MINUTES * 60 * 1000);

  const updated = await prisma.user.update({
    where: { id },
    data: { verificationCode, verificationExpires },
    include: { role: true },
  });

  return res.json({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role.name,
    verification: verificationInfo(updated),
  });
}
