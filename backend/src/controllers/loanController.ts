import type { Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import stripe from '../utils/stripe.js';
import { sendPushNotification } from '../utils/push.js';

export const createLoan = async (req: Request, res: Response) => {
  try {
    const { 
      userId, 
      amount, 
      termMonths,
      maritalStatus,
      employmentStatus,
      monthlyIncome,
      hasExistingCredits,
      loanPurpose
    } = req.body;

    if (!userId || !amount || !termMonths) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    if (parseFloat(amount) > 10000) {
        return res.status(400).json({ message: 'Le montant maximum est de 10 000 €.' });
    }

    if (parseInt(termMonths) > 60) {
        return res.status(400).json({ message: 'La durée maximum est de 5 ans (60 mois).' });
    }

    const interestRate = 0.03; // 3% flat

    const loan: any = await prisma.loan.create({
      data: {
        userId,
        amount: parseFloat(amount),
        termMonths: parseInt(termMonths),
        interestRate,
        status: 'PENDING',
        maritalStatus,
        employmentStatus,
        monthlyIncome: monthlyIncome ? parseFloat(monthlyIncome) : null,
        hasExistingCredits: hasExistingCredits === true,
        loanPurpose
      }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        title: 'Demande de Prêt Reçue',
        message: `Votre demande de prêt de ${amount}€ est en cours d'analyse.`,
        type: 'INFO'
      }
    });

    res.status(201).json(loan);
  } catch (error: any) {
    console.error('Create Loan Error:', error);
    res.status(500).json({ message: error.message || 'Error creating loan.' });
  }
};

export const getUserLoans = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const loans = await prisma.loan.findMany({
      where: { userId: userId as string },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json(loans);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching user loans.' });
  }
};

export const getAllLoans = async (req: Request, res: Response) => {
  try {
    const loans = await prisma.loan.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json(loans);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching all loans.' });
  }
};

export const updateLoanStatus = async (req: Request, res: Response) => {
  try {
    const { loanId } = req.params;
    const { status } = req.body;

    if (!['APPROVED', 'REJECTED', 'PAID_BACK'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }

    // 1. Get the loan and user data
    const loan: any = await prisma.loan.findUnique({
      where: { id: loanId as string },
      include: { 
        user: { 
          include: { wallet: true } 
        } 
      }
    });

    if (!loan) return res.status(404).json({ message: 'Loan not found.' });

    // 2. If status is APPROVED, handle Stripe logic
    if (status === 'APPROVED' && loan.status === 'PENDING') {
      let stripeAccountId = loan.user.wallet?.stripeAccountId;

      // Create Stripe Custom account if it doesn't exist
      if (!stripeAccountId) {
        try {
          const account = await stripe.accounts.create({
            type: 'custom',
            country: 'FR',
            email: loan.user.email,
            capabilities: {
              card_payments: { requested: true },
              transfers: { requested: true },
            },
            business_type: 'individual',
          });
          stripeAccountId = account.id;

          // Save it to database
          await prisma.wallet.update({
            where: { userId: loan.userId },
            data: { stripeAccountId }
          });
        } catch (stripeAccountErr: any) {
          console.warn('Stripe Account Creation Warning:', stripeAccountErr.message);
          // We continue because we want to update the internal wallet even if Stripe fails in dev
        }
      }

      // Simulation: Transfer funds from Platform to User Account
      try {
        if (stripeAccountId) {
          await stripe.transfers.create({
            amount: Math.round(loan.amount * 100), // Stripe uses cents
            currency: 'eur',
            destination: stripeAccountId,
            description: `Financement Prêt Je Dépanne #${loan.id.slice(0,8)}`,
          });
        }
      } catch (stripeErr: any) {
        console.warn('Stripe Transfer Warning:', stripeErr.message);
        // We continue even if transfer fails in dev mode (no real funds)
      }

      // Update wallet balance internally
      await prisma.wallet.update({
        where: { userId: loan.userId },
        data: {
          balance: { increment: loan.amount }
        }
      });

      // Create transaction record
      await prisma.transaction.create({
        data: {
          amount: loan.amount,
          type: 'LOAN_DISBURSEMENT',
          status: 'COMPLETED',
          wallet: {
            connect: { userId: loan.userId }
          }
        }
      });
    }

    // 3. Update loan status in DB
    const updatedLoan = await prisma.loan.update({
      where: { id: loanId as string },
      data: { status }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: loan.userId,
        title: status === 'APPROVED' ? 'Prêt Approuvé !' : (status === 'REJECTED' ? 'Prêt Refusé' : 'Mise à jour du prêt'),
        message: status === 'APPROVED' ? `Votre prêt de ${loan.amount}€ a été approuvé et les fonds ont été ajoutés à votre portefeuille.` : (status === 'REJECTED' ? `Votre demande de prêt de ${loan.amount}€ a été refusée.` : `Le statut de votre prêt est maintenant ${status}.`),
        type: status === 'APPROVED' ? 'SUCCESS' : (status === 'REJECTED' ? 'ERROR' : 'INFO')
      }
    });

    // Send Web Push Notification
    await sendPushNotification(
      loan.userId, 
      status === 'APPROVED' ? 'Prêt Approuvé !' : 'Prêt Refusé', 
      status === 'APPROVED' ? `Votre compte a été crédité de ${loan.amount}€.` : `Votre demande de prêt a été refusée.`,
      '/dashboard/loans'
    );

    res.status(200).json(updatedLoan);
  } catch (error: any) {
    console.error('Update Status Error:', error);
    res.status(500).json({ message: 'Error updating loan status.' });
  }
};

export const repayLoan = async (req: Request, res: Response) => {
  try {
    const { loanId } = req.params;
    const { userId, paymentAmount } = req.body;

    if (!userId || !paymentAmount) {
      return res.status(400).json({ message: 'User ID et montant du paiement sont requis.' });
    }

    const loan: any = await prisma.loan.findUnique({
      where: { id: loanId as string },
      include: { user: { include: { wallet: true } } }
    });

    if (!loan || loan.userId !== userId) {
      return res.status(404).json({ message: 'Prêt non trouvé.' });
    }

    if (loan.status !== 'APPROVED') {
      return res.status(400).json({ message: 'Ce prêt ne peut pas être remboursé dans son état actuel.' });
    }

    const totalDue = loan.amount * (1 + loan.interestRate);
    const amountToRepay = parseFloat(paymentAmount);

    if (amountToRepay <= 0) {
      return res.status(400).json({ message: 'Montant de remboursement invalide.' });
    }

    if (!loan.user.wallet || loan.user.wallet.balance < amountToRepay) {
      return res.status(400).json({ message: 'Solde insuffisant pour rembourser. Veuillez alimenter votre compte.' });
    }

    // Deduct from wallet
    await prisma.wallet.update({
      where: { userId: userId as string },
      data: { balance: { decrement: amountToRepay } }
    });

    const newAmountRepaid = loan.amountRepaid + amountToRepay;
    const isFullyPaid = newAmountRepaid >= (totalDue - 0.01); // 1 cent tolerance for float precision

    // Update loan status and amountRepaid
    const updatedLoan = await prisma.loan.update({
      where: { id: loanId as string },
      data: { 
        amountRepaid: newAmountRepaid,
        status: isFullyPaid ? 'PAID_BACK' : 'APPROVED'
      }
    });

    // Create transaction
    await prisma.transaction.create({
      data: {
        amount: amountToRepay,
        type: 'REPAYMENT',
        status: 'COMPLETED',
        wallet: { connect: { userId } }
      }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        title: isFullyPaid ? 'Prêt Totalement Remboursé' : 'Mensualité Payée',
        message: isFullyPaid 
          ? `Vous avez remboursé avec succès la totalité de votre prêt (Total: ${totalDue.toFixed(2)}€). Merci pour votre confiance !`
          : `Votre paiement de ${amountToRepay.toFixed(2)}€ a bien été pris en compte.`,
        type: 'SUCCESS'
      }
    });

    // Send Web Push Notification
    await sendPushNotification(
      userId,
      isFullyPaid ? 'Prêt Totalement Remboursé' : 'Mensualité Payée',
      isFullyPaid 
          ? `Vous avez remboursé la totalité de votre prêt. Merci !`
          : `Votre paiement de ${amountToRepay.toFixed(2)}€ a bien été reçu.`,
      '/dashboard/schedule'
    );

    res.status(200).json({ message: 'Remboursement réussi.', loan: updatedLoan });
  } catch (error: any) {
    console.error('Repay Loan Error:', error);
    res.status(500).json({ message: 'Erreur lors du remboursement.' });
  }
};

