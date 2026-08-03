import nodemailer from 'nodemailer';

// Konfigurasi transporter SMTP.
// Bisa dipakai untuk Mailtrap (development) atau Gmail SMTP (production).
// Semua nilai diambil dari file .env agar mudah diganti tanpa mengubah kode.
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT) || 587,
  secure: process.env.MAIL_ENCRYPTION === 'ssl', // true untuk port 465 (SSL), false untuk TLS/587
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
});

interface SendVerificationEmailParams {
  to: string;
  name: string;
  code: string;
}

// Kirim email berisi kode verifikasi 6 digit ke user yang baru registrasi.
export async function sendVerificationEmail({ to, name, code }: SendVerificationEmailParams) {
  const fromAddress = process.env.MAIL_FROM_ADDRESS || 'no-reply@cbt.test';
  const fromName = process.env.MAIL_FROM_NAME || 'CBT App';

  await transporter.sendMail({
    from: `"${fromName}" <${fromAddress}>`,
    to,
    subject: 'Verifikasi Email - CBT App',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Verifikasi Email Anda</h2>
        <p>Halo <b>${name}</b>,</p>
        <p>Terima kasih telah mendaftar di CBT App. Gunakan kode verifikasi berikut untuk mengaktifkan akun Anda:</p>
        <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; background: #f0f2f5; padding: 16px; text-align: center; border-radius: 8px; margin: 16px 0;">
          ${code}
        </div>
        <p>Kode ini berlaku selama 15 menit. Jika Anda tidak melakukan registrasi ini, silakan abaikan email ini.</p>
      </div>
    `,
  });
}

export default transporter;
