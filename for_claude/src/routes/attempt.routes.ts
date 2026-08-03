import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { checkRole } from '../middleware/role.middleware';
import { catchAsync } from '../utils/catchAsync';
import {
  startAttempt,
  submitAnswer,
  finishAttempt,
  getMyAttempts,
  getAttemptResult,
} from '../controllers/attempt.controller';

const router = Router();

router.use(authMiddleware);

router.post('/start/:examId', checkRole('siswa'), catchAsync(startAttempt));
router.post('/:attemptId/answer', checkRole('siswa'), catchAsync(submitAnswer));
router.post('/:attemptId/finish', checkRole('siswa'), catchAsync(finishAttempt));
router.get('/my', checkRole('siswa'), catchAsync(getMyAttempts));
router.get('/:attemptId', catchAsync(getAttemptResult));

export default router;
