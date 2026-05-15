import { Router } from 'express';
import { createLoan, getAllLoans, getUserLoans, updateLoanStatus, repayLoan } from '../controllers/loanController.js';
const router = Router();
router.post('/', createLoan);
router.get('/user/:userId', getUserLoans);
router.get('/admin/all', getAllLoans);
router.patch('/:loanId/status', updateLoanStatus);
router.post('/:loanId/repay', repayLoan);
export default router;
