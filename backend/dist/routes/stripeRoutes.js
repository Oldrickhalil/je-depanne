import { Router } from 'express';
import { createStripeAccount, getOnboardingLink, handleDeposit, withdraw } from '../controllers/stripeController.js';
const router = Router();
router.post('/account', createStripeAccount);
router.post('/onboarding', getOnboardingLink);
router.post('/deposit', handleDeposit);
router.post('/withdraw', withdraw);
export default router;
