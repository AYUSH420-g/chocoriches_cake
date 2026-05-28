import nodemailer from "nodemailer";

export const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const message = {
    from: `ChocoRiches <${process.env.SMTP_USER}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  const info = await transporter.sendMail(message);
  return info;
};
