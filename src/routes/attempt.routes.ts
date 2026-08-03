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
  getAttemptsByExam,
  getExamResults,
} from '../controllers/attempt.controller';

const router = Router();

router.use(authMiddleware);

router.post('/start/:examId', checkRole('siswa'), catchAsync(startAttempt));
router.post('/:attemptId/answer', checkRole('siswa'), catchAsync(submitAnswer));
router.post('/:attemptId/finish', checkRole('siswa'), catchAsync(finishAttempt));
router.get('/my', checkRole('siswa'), catchAsync(getMyAttempts));

// Guru & admin: rekap nilai seluruh ujian
router.get('/results/exams', checkRole('guru', 'admin'), catchAsync(getExamResults));
// Guru & admin: detail nilai siswa per ujian
router.get('/results/exam/:examId', checkRole('guru', 'admin'), catchAsync(getAttemptsByExam));

router.get('/:attemptId', catchAsync(getAttemptResult));

export default router;
