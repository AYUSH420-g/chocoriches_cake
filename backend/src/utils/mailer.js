import { Resend } from "resend";

export const sendEmail = async (options) => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY environment variable is not set on the server.");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    from: "ChocoRiches <onboarding@resend.dev>",
    to: [options.to],
    subject: options.subject,
    html: options.html,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};
