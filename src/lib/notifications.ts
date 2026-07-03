import nodemailer from "nodemailer";
import { prisma } from "./prisma";

type Notice = {
  appointmentId: string;
  type: string;
  channel: "EMAIL" | "CALENDAR";
  to?: string;
  subject?: string;
  text?: string;
  action?: () => Promise<void>;
};

export async function recordAndSendNotice(notice: Notice) {
  const log = await prisma.notificationLog.create({
    data: {
      appointmentId: notice.appointmentId,
      type: notice.type,
      channel: notice.channel,
      status: "RETRYING",
    },
  });

  try {
    if (notice.channel === "EMAIL") {
      await sendEmail(notice.to!, notice.subject!, notice.text!);
    } else if (notice.action) {
      await notice.action();
    }

    return prisma.notificationLog.update({
      where: { id: log.id },
      data: { status: "SENT", attempts: { increment: 1 } },
    });
  } catch (error) {
    const attempts = log.attempts + 1;
    return prisma.notificationLog.update({
      where: { id: log.id },
      data: {
        attempts,
        status: attempts >= 3 ? "FAILED" : "RETRYING",
        lastError: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
}

export async function sendEmail(to: string, subject: string, text: string) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("SMTP credentials are not configured");
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: Number(process.env.SMTP_PORT ?? 465) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text,
  });
}
