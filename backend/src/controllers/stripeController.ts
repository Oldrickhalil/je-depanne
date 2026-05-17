import type { Request, Response } from 'express';
import stripe from '../utils/stripe.js';
import prisma from '../utils/prisma.js';
import { sendPushNotification } from '../utils/push.js';

export const createStripeAccount = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.wallet?.stripeAccountId) {
      return res.status(200).json({ stripeAccountId: user.wallet.stripeAccountId });
    }

    const account = await stripe.accounts.create({
      type: 'express',
      country: 'FR',
      email: user.email,
      capabilities: {
        transfers: { requested: true },
        card_payments: { requested: true },
      },
      business_type: 'individual',
      business_profile: {
        name: `${user.firstName} ${user.lastName}`,
        product_description: 'Micro-loan platform user',
      }
    });

    await prisma.wallet.update({
      where: { userId: user.id },
      data: { stripeAccountId: account.id }
    });

    res.status(201).json({ stripeAccountId: account.id });
  } catch (error: any) {
    console.error('Stripe Account Error:', error);
    res.status(500).json({ message: error.message || 'Error creating Stripe account.' });
  }
};

export const getOnboardingLink = async (req: Request, res: Response) => {
  try {
    const { stripeAccountId, returnPath } = req.body;

    if (!stripeAccountId) {
      return res.status(400).json({ message: 'Stripe Account ID is required.' });
    }

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/loans/request`,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}${returnPath || '/dashboard/loans/request/return'}`,
      type: 'account_onboarding',
    });

    res.status(200).json({ url: accountLink.url });
  } catch (error: any) {
    console.error('Stripe Onboarding Error:', error);
    res.status(500).json({ message: error.message || 'Error creating onboarding link.' });
  }
};

export const withdraw = async (req: Request, res: Response) => {
  try {
    const { userId, amount, iban, bankName } = req.body;

    if (!userId || !amount || !iban || !bankName) {
      return res.status(400).json({ message: 'Tous les champs sont requis.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        wallet: true,
        loans: {
          where: { status: { in: ['APPROVED', 'PAID_BACK'] } }
        }
      }
    });

    if (!user || !user.wallet) {
      return res.status(404).json({ message: 'Utilisateur ou portefeuille non trouvé.' });
    }

    if (user.loans.length === 0) {
      return res.status(403).json({ message: 'Vous devez avoir obtenu au moins un crédit pour pouvoir effectuer un retrait.' });
    }

    const withdrawAmount = parseFloat(amount);

    if (withdrawAmount <= 0) {
      return res.status(400).json({ message: 'Le montant doit être supérieur à 0.' });
    }

    if (user.wallet.balance < withdrawAmount) {
      return res.status(400).json({ message: 'Solde insuffisant.' });
    }

    // Update IBAN and Bank Name in User profile
    await prisma.user.update({
      where: { id: userId },
      data: { iban, bankName }
    });

    // Deduct from wallet
    const updatedWallet = await prisma.wallet.update({
      where: { id: user.wallet.id },
      data: {
        balance: { decrement: withdrawAmount }
      }
    });

    // Create Transaction (PENDING for admin approval)
    await prisma.transaction.create({
      data: {
        amount: withdrawAmount,
        type: 'WITHDRAWAL',
        status: 'PENDING',
        wallet: { connect: { id: user.wallet.id } }
      }
    });

    // Create Notification
    await prisma.notification.create({
      data: {
        userId,
        title: 'Retrait en attente',
        message: `Votre demande de retrait de ${withdrawAmount}€ a été reçue. Elle est en attente de validation par notre service financier.`,
        type: 'INFO'
      }
    });

    // Send Web Push Notification
    await sendPushNotification(
      userId,
      'Retrait en attente',
      `Votre retrait de ${withdrawAmount}€ est en attente de validation.`,
      '/dashboard/transactions'
    );

    // Note: Here you would call stripe.payouts.create() or similar to actually move money to the user's bank account

    res.status(200).json({
      message: `Retrait de ${withdrawAmount}€ initié avec succès.`,
      balance: updatedWallet.balance
    });
  } catch (error: any) {
    console.error('Withdrawal Error:', error);
    res.status(500).json({ message: 'Erreur lors du retrait des fonds.' });
  }
};

export const handleDeposit = async (req: Request, res: Response) => {
  try {
    const { userId, amount } = req.body;

    if (!userId || !amount) {
      return res.status(400).json({ message: 'User ID et montant sont requis.' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé.' });

    const isFirstDeposit = !user.hasDeposited;
    const minAmount = isFirstDeposit ? 20 : 10;

    if (parseFloat(amount) < minAmount) {
      return res.status(400).json({ message: `Un dépôt de ${minAmount} € minimum est requis.` });
    }

    // Simulation Stripe Paylive
    console.log(`[Stripe Paylive] Dépôt de ${amount}€ pour l'utilisateur ${userId}`);

    const BONUS_AMOUNT = isFirstDeposit ? 80 : 0;

    // Update user onboarding status if first time
    if (isFirstDeposit) {
      await prisma.user.update({
        where: { id: userId },
        data: { hasDeposited: true }
      });
    }

    // Update wallet balance: amount deposited + Potential Bonus
    const updatedWallet = await prisma.wallet.update({
      where: { userId: userId },
      data: {
        balance: {
          increment: parseFloat(amount) + BONUS_AMOUNT
        }
      }
    });

    // Create a transaction record for the deposit
    await prisma.transaction.create({
      data: {
        amount: parseFloat(amount),
        type: 'DEPOSIT',
        status: 'COMPLETED',
        wallet: {
          connect: { userId: userId }
        }
      }
    });

    // Create a transaction record for the bonus if applicable
    if (BONUS_AMOUNT > 0) {
      await prisma.transaction.create({
        data: {
          amount: BONUS_AMOUNT,
          type: 'DEPOSIT',
          status: 'COMPLETED',
          wallet: {
            connect: { userId: userId }
          }
        }
      });
    }

    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        title: 'Dépôt Réussi',
        message: BONUS_AMOUNT > 0 ? `Votre compte a été crédité de ${amount}€ et un bonus de ${BONUS_AMOUNT}€ vous a été offert !` : `Votre compte a été crédité de ${amount}€.`,
        type: 'SUCCESS'
      }
    });

    // Send Web Push Notification
    await sendPushNotification(
      userId,
      'Compte crédité',
      BONUS_AMOUNT > 0 ? `Dépôt de ${amount}€ reçu + 80€ de bonus offert !` : `Votre dépôt de ${amount}€ a été validé.`,
      '/dashboard'
    );

    res.status(200).json({ 
      message: BONUS_AMOUNT > 0 
        ? `Dépôt réussi ! Un bonus de ${BONUS_AMOUNT}€ vous a été offert pour l'activation de votre compte.`
        : 'Votre compte a été crédité avec succès.',
      balance: updatedWallet.balance
    });
  } catch (error: any) {
    console.error('Deposit Error:', error);
    res.status(500).json({ message: 'Erreur lors de l\'alimentation du compte via Stripe.' });
  }
};
