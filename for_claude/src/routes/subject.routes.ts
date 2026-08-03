import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { checkRole } from '../middleware/role.middleware';
import { catchAsync } from '../utils/catchAsync';
import {
  getAllSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from '../controllers/subject.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', catchAsync(getAllSubjects));
router.post('/', checkRole('admin', 'guru'), catchAsync(createSubject));
router.put('/:id', checkRole('admin', 'guru'), catchAsync(updateSubject));
router.delete('/:id', checkRole('admin'), catchAsync(deleteSubject));

export default router;
