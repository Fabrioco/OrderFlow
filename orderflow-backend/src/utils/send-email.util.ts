import nodemailer from 'nodemailer';

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  const user = process.env.EMAIL_FROM?.trim();
  const pass = process.env.GOOGLE_PASS?.trim();

  if (!user || !pass) {
    console.warn('Missing email credentials');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: user,
    to,
    subject,
    html,
  });
}
