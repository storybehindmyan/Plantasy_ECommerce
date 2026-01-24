import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Nodemailer from 'nodemailer';
import { MailtrapTransport } from 'mailtrap';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: 'http://localhost:3000', // or 5173, depending on your frontend
}));
app.use(express.json());

// -------- Mailtrap Transport (Nodemailer) --------
const transport = Nodemailer.createTransport(
  MailtrapTransport({
    token: process.env.MAILTRAP_TOKEN as string,
  })
);

const sender = {
  address: process.env.FROM_EMAIL || 'hello@demomailtrap.co',
  name: 'Mailtrap Test',
};

// -------- API route used by SupportPage --------
app.post('/api/send-support-email', async (req, res) => {
  const { to, subject, body } = req.body as {
    to?: string;
    subject?: string;
    body?: string;
  };

  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'Missing to/subject/body' });
  }

  try {
    await transport.sendMail({
      from: sender,
      to: [to],
      subject,
      text: body,
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('Mailtrap send error:', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
