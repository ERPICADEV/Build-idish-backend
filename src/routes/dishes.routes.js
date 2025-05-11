import express from 'express'
import {
  addDish,
  getChefDishes,
  getDishById,
  updateDishById,
  deleteDishById,
  getAllAvailableDishes
} from '../controllers/dishes.controller.js'

import { requireChef } from '../middleware/roleCheck.js'
import { requireAuth } from '../middleware/auth.js'


const router = express.Router()

router.post('/add', requireChef, addDish)
router.get('/by-chef', requireChef, getChefDishes)
router.get('/all', getAllAvailableDishes)
router.get('/:id', requireAuth, getDishById)
router.put('/edit/:id', requireChef, updateDishById)
router.delete('/delete/:id', requireChef, deleteDishById)

export default router
