import { Router } from 'express';
import { getTransactions, getNotifications, markNotificationsRead, getAllTransactions, updateTransactionStatus, getActivities } from '../controllers/activityController.js';

const router = Router();

router.get('/transactions/:userId', getTransactions);
router.get('/notifications/:userId', getNotifications);
router.post('/notifications/:userId/read', markNotificationsRead);

// Admin Routes
router.get('/admin/transactions', getAllTransactions);
router.patch('/admin/transactions/:transactionId/status', updateTransactionStatus);
router.get('/admin/activities', getActivities);

export default router;
