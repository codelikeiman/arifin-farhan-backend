import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { checkRole } from '../middleware/role.middleware';
import { catchAsync } from '../utils/catchAsync';
import {
  createQuestion,
  getQuestionsByExam,
  updateQuestion,
  deleteQuestion,
} from '../controllers/question.controller';

const router = Router();

router.use(authMiddleware);

router.get('/exam/:examId', catchAsync(getQuestionsByExam));
router.post('/exam/:examId', checkRole('admin', 'guru'), catchAsync(createQuestion));
router.put('/:id', checkRole('admin', 'guru'), catchAsync(updateQuestion));
router.delete('/:id', checkRole('admin', 'guru'), catchAsync(deleteQuestion));

export default router;
