import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { checkRole } from '../middleware/role.middleware';
import { catchAsync } from '../utils/catchAsync';
import {
  createExam,
  getAllExams,
  getActiveExams,
  getExamById,
  updateExam,
  deleteExam,
} from '../controllers/exam.controller';
import {
  getQuestionsByExam,
  attachQuestionsToExam,
  detachQuestionFromExam,
} from '../controllers/question.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', catchAsync(getAllExams));
router.get('/active', catchAsync(getActiveExams)); // siswa: lihat ujian yang aktif
router.get('/:id', catchAsync(getExamById));
router.post('/', checkRole('admin', 'guru'), catchAsync(createExam));
router.put('/:id', checkRole('admin', 'guru'), catchAsync(updateExam));
router.delete('/:id', checkRole('admin', 'guru'), catchAsync(deleteExam));

router.get('/:examId/questions', catchAsync(getQuestionsByExam));
router.post('/:examId/questions', checkRole('admin', 'guru'), catchAsync(attachQuestionsToExam));
router.delete('/:examId/questions/:questionId', checkRole('admin', 'guru'), catchAsync(detachQuestionFromExam));

export default router;