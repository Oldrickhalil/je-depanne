import { Router } from 'express';
import { createPortalSession, createPaymentIntent, withdraw, createStripeAccount, getOnboardingLink } from '../controllers/stripeController.js';

const router = Router();

router.post('/account', createStripeAccount);
router.post('/onboarding', getOnboardingLink);
router.post('/deposit', createPaymentIntent);
router.post('/withdraw', withdraw);
router.post('/create-portal-session', createPortalSession);

export default router;
