import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import subjectRoutes from './subject.routes';
import examRoutes from './exam.routes';
import questionRoutes from './question.routes';
import attemptRoutes from './attempt.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/subjects', subjectRoutes);
router.use('/exams', examRoutes);
router.use('/questions', questionRoutes);
router.use('/attempts', attemptRoutes);

export default router;
