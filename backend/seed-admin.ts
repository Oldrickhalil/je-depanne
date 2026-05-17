import prisma from './src/utils/prisma.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

async function seed() {
  try {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      console.error('ERREUR : ADMIN_EMAIL ou ADMIN_PASSWORD non définis dans les variables d\'environnement.');
      process.exit(1);
    }

    const existingAdmin = await prisma.user.findUnique({ where: { email } });
    if (existingAdmin) {
      console.log('L\'administrateur existe déjà.');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'System',
        role: 'ADMIN',
        emailVerified: true,
        wallet: {
          create: {
            balance: 1000000,
            currency: 'EUR'
          }
        }
      }
    });
    console.log(`Compte Administrateur créé avec succès : ${email}`);
  } catch (error) {
    console.error('Erreur lors du seed admin:', error);
  } finally {
    process.exit(0);
  }
}

seed();
