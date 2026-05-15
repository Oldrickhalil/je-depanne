import { Router } from 'express';
import { getTransactions, getNotifications, markNotificationsRead } from '../controllers/activityController.js';
const router = Router();
router.get('/transactions/:userId', getTransactions);
router.get('/notifications/:userId', getNotifications);
router.post('/notifications/:userId/read', markNotificationsRead);
export default router;
