import { Router } from 'express';
import { register, login, verifyEmail } from '../controllers/auth.controller';
import { catchAsync } from '../utils/catchAsync';

const router = Router();

router.post('/register', catchAsync(register));
router.post('/login', catchAsync(login));
router.post('/verify-email', catchAsync(verifyEmail));

export default router;
