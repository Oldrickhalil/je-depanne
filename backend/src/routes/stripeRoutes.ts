import { Router } from 'express';
import { 
    createPortalSession, 
    createPaymentIntent, 
    withdraw, 
    createStripeAccount, 
    getOnboardingLink,
    listPaymentMethods,
    deletePaymentMethod,
    createSetupIntent,
    payWithSavedCard,
    stripeWebhook
} from '../controllers/stripeController.js';

const router = Router();

router.post('/account', createStripeAccount);
router.post('/onboarding', getOnboardingLink);
router.post('/deposit', createPaymentIntent);
router.post('/withdraw', withdraw);
router.post('/create-portal-session', createPortalSession);

// Saved Cards Management
router.get('/payment-methods/:userId', listPaymentMethods);
router.delete('/payment-methods/:pmId', deletePaymentMethod);
router.post('/setup-intent', createSetupIntent);
router.post('/deposit/saved-card', payWithSavedCard);

export default router;
