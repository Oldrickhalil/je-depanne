import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Resend } from 'resend';
import prisma from '../utils/prisma.js';
import { sendPushNotification } from '../utils/push.js';

const resend = new Resend(process.env.RESEND_API_KEY);

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, phone, country } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Cet utilisateur existe déjà.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate verification token (expires in 24h)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        country,
        emailVerified: false,
        verificationToken,
        verificationExpires,
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

    // Send verification email via Resend
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const verificationLink = `${appUrl}/api/auth/verify-email?token=${verificationToken}`;
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

      await resend.emails.send({
        from: `Je Dépanne <${fromEmail}>`,
        to: [email],
        subject: 'Vérifiez votre adresse e-mail - Je Dépanne',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h1 style="color: #5120B3; text-align: center;">Bienvenue chez Je Dépanne !</h1>
            <p>Bonjour ${firstName},</p>
            <p>Merci de vous être inscrit sur Je Dépanne. Pour activer votre compte et accéder à nos services de micro-crédit, veuillez vérifier votre adresse e-mail en cliquant sur le bouton ci-dessous :</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" style="background-color: #5120B3; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Vérifier mon e-mail</a>
            </div>
            <p style="font-size: 12px; color: #666;">Ce lien expirera dans 24 heures.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 10px; color: #999; text-align: center;">&copy; 2026 Je Dépanne. Tous droits réservés.</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // We still return success because user is created, they can resend later (logic not yet implemented)
    }

    // Log Activity
    try {
      await prisma.activity.create({
        data: {
          type: 'REGISTER',
          title: 'Nouvelle Inscription',
          message: `${firstName} ${lastName} s'est inscrit sur la plateforme.`,
          userId: user.id
        }
      });
    } catch (actError) {
      console.error('Activity Log Error:', actError);
    }

    res.status(201).json({ message: 'Utilisateur créé. Veuillez vérifier votre email.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de l\'inscription.' });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: 'Jeton de vérification manquant.' });
    }

    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token as string,
        verificationExpires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({ message: 'Le lien est invalide ou a expiré.' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationExpires: null
      }
    });

    res.status(200).json({ message: 'E-mail vérifié avec succès.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Une erreur est survenue lors de la vérification.' });
  }
};

export const resendVerification = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'L\'adresse e-mail est requise.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: 'Cet e-mail est déjà vérifié.' });
    }

    // Generate new token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        verificationExpires
      }
    });

    // Send email via Resend
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const verificationLink = `${appUrl}/verify-email?token=${verificationToken}`;
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

      await resend.emails.send({
        from: `Je Dépanne <${fromEmail}>`,
        to: [email],
        subject: 'Vérifiez votre adresse e-mail - Je Dépanne',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h1 style="color: #5120B3; text-align: center;">Vérification de votre compte</h1>
            <p>Bonjour ${user.firstName},</p>
            <p>Vous avez demandé un nouveau lien de vérification. Veuillez cliquer sur le bouton ci-dessous pour activer votre compte :</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" style="background-color: #5120B3; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Vérifier mon e-mail</a>
            </div>
            <p style="font-size: 12px; color: #666;">Ce lien expirera dans 24 heures.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 10px; color: #999; text-align: center;">&copy; 2026 Je Dépanne. Tous droits réservés.</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Failed to resend verification email:', emailError);
    }

    res.status(200).json({ message: 'Un nouveau lien de vérification a été envoyé.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de l\'envoi du mail.' });
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

    if (!user.emailVerified) {
      return res.status(403).json({ message: 'Veuillez vérifier votre adresse e-mail avant de vous connecter.' });
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
        hasPin: !!(user as any).pinCode,
        creditLimit: user.creditLimit,
        role: user.role
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

    // Send Web Push Notification
    await sendPushNotification(
      userId as string,
      kycVerified ? 'Identité Vérifiée' : 'Identité Rejetée',
      kycVerified ? 'Votre compte est désormais actif.' : 'Votre document d\'identité a été rejeté.',
      '/dashboard/profile'
    );

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
      hasPin: !!(user as any).pinCode,
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

export const subscribePush = async (req: Request, res: Response) => {
  try {
    const { userId, subscription } = req.body;

    if (!userId || !subscription) {
      return res.status(400).json({ message: 'Paramètres manquants.' });
    }

    const { endpoint, keys } = subscription;

    // Check if subscription already exists
    const existingSub = await prisma.pushSubscription.findUnique({
      where: { endpoint }
    });

    if (!existingSub) {
      await prisma.pushSubscription.create({
        data: {
          userId: userId as string,
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth
        }
      });
    }

    res.status(201).json({ message: 'Abonnement Push enregistré.' });
  } catch (error) {
    console.error('Erreur Push Subscribe:', error);
    res.status(500).json({ message: 'Erreur lors de la souscription.' });
  }
};

export const setPin = async (req: Request, res: Response) => {
  try {
    const { userId, pinCode } = req.body;
    if (!userId || !pinCode || pinCode.length < 4) {
      return res.status(400).json({ message: 'Code PIN invalide.' });
    }

    const hashedPin = await bcrypt.hash(pinCode, 10);
    
    await prisma.user.update({
      where: { id: userId as string },
      data: { pinCode: hashedPin } as any
    });

    res.status(200).json({ message: 'Code PIN configuré avec succès.' });
  } catch (error) {
    console.error('Erreur Set PIN:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

export const verifyPin = async (req: Request, res: Response) => {
  try {
    const { userId, pinCode } = req.body;
    if (!userId || !pinCode) {
      return res.status(400).json({ message: 'Code PIN manquant.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId as string }
    });

    if (!user || !(user as any).pinCode) {
      return res.status(400).json({ message: 'Aucun code PIN configuré.' });
    }

    const isMatch = await bcrypt.compare(pinCode, (user as any).pinCode);
    if (isMatch) {
      res.status(200).json({ success: true });
    } else {
      res.status(401).json({ success: false, message: 'Code PIN incorrect.' });
    }
  } catch (error) {
    console.error('Erreur Verify PIN:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Pour des raisons de sécurité, ne pas confirmer si l'email existe ou non
      return res.status(200).json({ message: 'Si cet e-mail existe, un lien de réinitialisation a été envoyé.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 heure

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires
      }
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetLink = `${appUrl}/reset-password?token=${resetToken}`;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    await resend.emails.send({
      from: `Je Dépanne <${fromEmail}>`,
      to: [email],
      subject: 'Réinitialisation de votre mot de passe - Je Dépanne',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h1 style="color: #5120B3; text-align: center;">Changement de mot de passe</h1>
          <p>Bonjour ${user.firstName},</p>
          <p>Vous avez demandé à changer votre mot de passe. Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #5120B3; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Définir un nouveau mot de passe</a>
          </div>
          <p style="font-size: 12px; color: #666;">Ce lien expirera dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 10px; color: #999; text-align: center;">&copy; 2026 Je Dépanne. Tous droits réservés.</p>
        </div>
      `
    });

    res.status(200).json({ message: 'Lien de réinitialisation envoyé.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la demande de réinitialisation.' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ message: 'Lien invalide ou expiré.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null
      }
    });

    res.status(200).json({ message: 'Mot de passe mis à jour avec succès.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du mot de passe.' });
  }
};

export const updatePinWithPassword = async (req: Request, res: Response) => {
  try {
    const { userId, password, newPin } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Mot de passe incorrect.' });
    }

    const hashedPin = await bcrypt.hash(newPin, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { pinCode: hashedPin } as any
    });

    res.status(200).json({ message: 'Code PIN mis à jour avec succès.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du PIN.' });
  }
};
