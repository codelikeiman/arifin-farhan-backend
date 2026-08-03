import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { signToken } from '../utils/jwt';

const CODE_EXPIRES_MINUTES = 15;

function generateVerificationCode(): string {
  // Kode verifikasi 6 digit, contoh: 123456
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const REGISTERABLE_ROLES = ['siswa', 'guru'];

// Registrasi mandiri untuk role siswa atau guru saja.
// Admin tidak bisa dibuat lewat sini — akun admin dibuat langsung oleh sistem/seed,
// atau oleh admin lain lewat halaman User Management.
// Catatan: kode verifikasi TIDAK dibuat di sini dan TIDAK dikirim via email.
// Kode akan otomatis digenerate oleh sistem saat user mencoba login,
// lalu admin melihat kode tersebut di halaman User Management dan
// menyampaikannya secara manual ke user (demo verifikasi lokal).
export async function register(req: Request, res: Response) {
  const { name, email, password } = req.body;
  const role = req.body.role || 'siswa';

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'name, email, dan password wajib diisi' });
  }

  if (!REGISTERABLE_ROLES.includes(role)) {
    return res.status(400).json({ message: "Role hanya boleh 'siswa' atau 'guru'" });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(400).json({ message: 'Email sudah terdaftar' });
  }

  const roleData = await prisma.role.findUnique({ where: { name: role } });
  if (!roleData) {
    return res.status(500).json({ message: `Role '${role}' belum ada, jalankan seed terlebih dahulu` });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      roleId: roleData.id,
    },
    include: { role: true },
  });

  return res.status(201).json({
    message: 'Registrasi berhasil. Silakan hubungi admin untuk mendapatkan kode verifikasi sebelum login.',
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

  // Admin dikecualikan dari verifikasi — admin dibuat langsung oleh sistem/seed
  // dan dianggap tepercaya, jadi tidak perlu proses verifikasi kode.
  if (user.role.name !== 'admin' && !user.emailVerifiedAt) {
    // Demo verifikasi lokal: kode dibuat/diperbarui di sini (bukan dikirim email).
    // Kalau kode belum ada atau sudah expired, generate kode baru supaya admin
    // punya kode terbaru untuk dilihat & disampaikan ke user di User Management.
    const needsNewCode =
      !user.verificationCode || !user.verificationExpires || user.verificationExpires < new Date();

    if (needsNewCode) {
      const verificationCode = generateVerificationCode();
      const verificationExpires = new Date(Date.now() + CODE_EXPIRES_MINUTES * 60 * 1000);
      await prisma.user.update({
        where: { id: user.id },
        data: { verificationCode, verificationExpires },
      });
    }

    return res.status(403).json({
      message: 'Akun Anda belum diverifikasi. Silakan minta kode verifikasi ke admin.',
      needsVerification: true,
      email: user.email,
    });
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role.name });

  return res.json({
    message: 'Login berhasil',
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role.name },
  });
}

// Verifikasi akun menggunakan kode 6 digit yang diberikan oleh admin secara manual
// (kode dibuat otomatis oleh sistem saat user mencoba login, dan admin melihatnya
// di halaman User Management untuk disampaikan ke user).
export async function verifyEmail(req: Request, res: Response) {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: 'email dan kode verifikasi wajib diisi' });
  }

  const user = await prisma.user.findUnique({ where: { email }, include: { role: true } });
  if (!user) {
    return res.status(404).json({ message: 'User tidak ditemukan' });
  }

  if (user.role.name === 'admin') {
    return res.status(400).json({ message: 'Akun admin tidak memerlukan verifikasi' });
  }

  if (user.emailVerifiedAt) {
    return res.status(400).json({ message: 'Akun sudah diverifikasi sebelumnya' });
  }

  if (!user.verificationCode || !user.verificationExpires) {
    return res.status(400).json({ message: 'Kode verifikasi belum tersedia. Silakan login ulang untuk membuat kode, lalu minta kodenya ke admin.' });
  }

  if (user.verificationExpires < new Date()) {
    return res.status(400).json({ message: 'Kode verifikasi sudah expired. Silakan login ulang untuk membuat kode baru, lalu minta kodenya ke admin.' });
  }

  if (user.verificationCode !== String(code)) {
    return res.status(400).json({ message: 'Kode verifikasi tidak valid' });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifiedAt: new Date(),
      verificationCode: null,
      verificationExpires: null,
    },
  });

  return res.json({ message: 'Akun berhasil diverifikasi. Silakan login.' });
}

