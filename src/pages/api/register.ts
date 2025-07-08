import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs'; 

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { name, email, password, country } = req.body;

  if (!name || !email || !password || !country) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'User already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: { name, email, password: hashedPassword, country }
    });

    return res.status(200).json({ success: true, message: 'Registration successful!' });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
}