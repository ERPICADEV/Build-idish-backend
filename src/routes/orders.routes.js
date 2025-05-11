import express from 'express'
import {
  createOrder,
  getOrdersByUser,
  getOrdersByChef,
  updateOrderStatus
} from '../controllers/orders.controller.js'

import { requireCustomer, requireChef } from '../middleware/roleCheck.js' // ✅ Add this

const router = express.Router()

// Customer routes
router.post('/create', requireCustomer, createOrder)
router.get('/by-user', requireCustomer, getOrdersByUser)

// Chef routes
router.get('/by-chef', requireChef, getOrdersByChef)
router.put('/status/:id', requireChef, updateOrderStatus)

export default router
