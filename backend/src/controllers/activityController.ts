import type { Request, Response } from 'express';
import prisma from '../utils/prisma.js';

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user: any = await prisma.user.findUnique({
      where: { id: userId as string },
      include: { wallet: true }
    });

    if (!user || !user.wallet) {
      return res.status(404).json({ message: 'Portefeuille non trouvé.' });
    }

    const transactions = await prisma.transaction.findMany({
      where: { walletId: user.wallet.id },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'historique.' });
  }
};

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const notifications = await prisma.notification.findMany({
      where: { userId: userId as string },
      orderBy: { createdAt: 'desc' },
      take: 20 // Limit to last 20
    });

    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des notifications.' });
  }
};

export const markNotificationsRead = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    await prisma.notification.updateMany({
      where: { userId: userId as string, read: false },
      data: { read: true }
    });

    res.status(200).json({ message: 'Notifications marquées comme lues.' });
  } catch (error) {
    console.error('Error marking notifications read:', error);
    res.status(500).json({ message: 'Erreur.' });
  }
};

export const getAllTransactions = async (req: Request, res: Response) => {
  try {
    const transactions = await prisma.transaction.findMany({
      include: {
        wallet: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                iban: true,
                bankName: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json(transactions);
  } catch (error) {
    console.error('Error fetching all transactions:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des transactions.' });
  }
};

export const updateTransactionStatus = async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;
    const { status } = req.body; // COMPLETED or FAILED (Rejected)

    if (!['COMPLETED', 'FAILED'].includes(status)) {
      return res.status(400).json({ message: 'Statut invalide.' });
    }

    const transaction: any = await prisma.transaction.findUnique({
      where: { id: transactionId as string },
      include: { 
        wallet: { 
          include: { user: true } 
        } 
      }
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction non trouvée.' });
    }

    // If rejecting a withdrawal, refund the user
    if (status === 'FAILED' && transaction.type === 'WITHDRAWAL' && transaction.status === 'PENDING') {
      await prisma.wallet.update({
        where: { id: transaction.walletId },
        data: {
          balance: { increment: transaction.amount }
        }
      });

      // Notify user
      await prisma.notification.create({
        data: {
          userId: transaction.wallet.userId,
          title: 'Retrait Refusé',
          message: `Votre demande de retrait de ${transaction.amount}€ a été refusée. Les fonds ont été replacés sur votre solde.`,
          type: 'ERROR'
        }
      });
    }

    // If approving a withdrawal
    if (status === 'COMPLETED' && transaction.type === 'WITHDRAWAL' && transaction.status === 'PENDING') {
       // Notify user
       await prisma.notification.create({
        data: {
          userId: transaction.wallet.userId,
          title: 'Retrait Terminé',
          message: `Votre demande de retrait de ${transaction.amount}€ a été validée et envoyée vers votre compte bancaire.`,
          type: 'SUCCESS'
        }
      });
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId as string },
      data: { status }
    });

    res.status(200).json(updatedTransaction);
  } catch (error) {
    console.error('Error updating transaction status:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour.' });
  }
};

export const getActivities = async (req: Request, res: Response) => {
  try {
    const activities = await prisma.activity.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // Only last 50 events
    });

    res.status(200).json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du journal.' });
  }
};
