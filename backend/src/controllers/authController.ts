import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Cet utilisateur existe déjà.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        wallet: {
          create: {
            balance: 0,
            currency: 'EUR'
          }
        }
      },
      include: {
        wallet: true
      }
    });

    res.status(201).json({ message: 'Utilisateur créé avec succès', userId: user.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de l\'inscription.' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'secret_temp_jd',
      { expiresIn: '1h' }
    );

    res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        kycVerified: user.kycVerified,
        hasDeposited: user.hasDeposited,
        isInstalled: user.isInstalled,
        creditLimit: user.creditLimit
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la connexion.' });
  }
};

export const verifyKyc = async (req: Request, res: Response) => {
  try {
    const { userId, address, birthDate, idType, recto, verso, addressProof } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID est requis.' });
    }

    const user = await prisma.user.update({
      where: { id: userId as string },
      data: {
        kycVerified: true, // Auto-validation pour le flux démo
        address,
        birthDate,
        idType,
        kycRecto: recto,
        kycVerso: verso,
        kycAddressProof: addressProof
      }
    });

    res.status(200).json({ 
      message: 'Identité soumise avec succès.',
      kycVerified: user.kycVerified 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la vérification KYC.' });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        wallet: true,
        loans: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs.' });
  }
};

export const updateKycStatus = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { kycVerified } = req.body;

    const user = await prisma.user.update({
      where: { id: userId as string },
      data: { kycVerified }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: userId as string,
        title: kycVerified ? 'Identité Vérifiée' : 'Identité Rejetée',
        message: kycVerified ? 'Votre identité a été validée avec succès. Vous pouvez maintenant profiter de toutes les fonctionnalités.' : 'Votre document d\'identité n\'a pas pu être validé. Veuillez soumettre à nouveau.',
        type: kycVerified ? 'SUCCESS' : 'ERROR'
      }
    });

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour du KYC.' });
  }
};

export const updateInstallationStatus = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    
    const user = await prisma.user.update({
      where: { id: userId as string },
      data: { isInstalled: true }
    });

    res.status(200).json({ 
      message: 'Statut d\'installation mis à jour.',
      isInstalled: user.isInstalled
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour du statut d\'installation.' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, phone, address } = req.body;

    const user = await prisma.user.update({
      where: { id: userId as string },
      data: {
        firstName,
        lastName,
        phone,
        address
      }
    });

    res.status(200).json({ message: 'Profil mis à jour.', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du profil.' });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { notifPush, notifEmail, notifSms, notifMarketing } = req.body;

    const user = await prisma.user.update({
      where: { id: userId as string },
      data: {
        notifPush,
        notifEmail,
        notifSms,
        notifMarketing
      }
    });

    res.status(200).json({ message: 'Paramètres mis à jour.', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour des paramètres.' });
  }
};

export const getUserStatus = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId as string },
      include: {
        wallet: true,
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    res.status(200).json({
      kycVerified: user.kycVerified,
      hasDeposited: user.hasDeposited,
      isInstalled: user.isInstalled,
      creditLimit: user.creditLimit,
      balance: user.wallet?.balance || 0,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      address: user.address,
      notifPush: user.notifPush,
      notifEmail: user.notifEmail,
      notifSms: user.notifSms,
      notifMarketing: user.notifMarketing,
      iban: user.iban,
      bankName: user.bankName
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération du statut.' });
  }
};
