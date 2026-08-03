import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';

export async function getAllUsers(req: Request, res: Response) {
  const users = await prisma.user.findMany({
    include: { role: true },
    orderBy: { id: 'asc' },
  });

  return res.json(
    users.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role.name }))
  );
}

export async function getUserById(req: Request, res: Response) {
  const id = Number(req.params.id);
  const user = await prisma.user.findUnique({ where: { id }, include: { role: true } });

  if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

  return res.json({ id: user.id, name: user.name, email: user.email, role: user.role.name });
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
    return res.json({ id: user.id, name: user.name, email: user.email, role: user.role.name });
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
