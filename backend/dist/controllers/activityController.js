import prisma from '../utils/prisma.js';
export const getTransactions = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await prisma.user.findUnique({
            where: { id: userId },
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
    }
    catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération de l\'historique.' });
    }
};
export const getNotifications = async (req, res) => {
    try {
        const { userId } = req.params;
        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20 // Limit to last 20
        });
        res.status(200).json(notifications);
    }
    catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des notifications.' });
    }
};
export const markNotificationsRead = async (req, res) => {
    try {
        const { userId } = req.params;
        await prisma.notification.updateMany({
            where: { userId, read: false },
            data: { read: true }
        });
        res.status(200).json({ message: 'Notifications marquées comme lues.' });
    }
    catch (error) {
        console.error('Error marking notifications read:', error);
        res.status(500).json({ message: 'Erreur.' });
    }
};
