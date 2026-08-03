import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { checkRole } from '../middleware/role.middleware';
import { catchAsync } from '../utils/catchAsync';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/user.controller';

const router = Router();

router.use(authMiddleware, checkRole('admin'));

router.get('/', catchAsync(getAllUsers));
router.get('/:id', catchAsync(getUserById));
router.post('/', catchAsync(createUser));
router.put('/:id', catchAsync(updateUser));
router.delete('/:id', catchAsync(deleteUser));

export default router;
