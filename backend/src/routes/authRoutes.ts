import { Router } from 'express';
import { login, register, verifyEmail, resendVerification, requestPasswordReset, resetPassword, updatePinWithPassword, verifyKyc, updateInstallationStatus, getAllUsers, updateKycStatus, getUserStatus, updateProfile, updateSettings, subscribePush, setPin, verifyPin } from '../controllers/authController.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/password-reset-request', requestPasswordReset);
router.post('/password-reset-confirm', resetPassword);
router.post('/update-pin-secure', updatePinWithPassword);
router.post('/verify-kyc', verifyKyc);
router.post('/update-installation', updateInstallationStatus);
router.post('/push-subscribe', subscribePush);
router.post('/set-pin', setPin);
router.post('/verify-pin', verifyPin);
router.get('/status/:userId', getUserStatus);
router.put('/profile/:userId', updateProfile);
router.put('/settings/:userId', updateSettings);
router.get('/admin/users', getAllUsers);
router.patch('/admin/users/:userId/kyc', updateKycStatus);

export default router;
