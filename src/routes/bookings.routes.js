import express from 'express'
import {
  createBooking,
  getBookingsByUser,
  getBookingsByChef,
  updateBookingStatus
} from '../controllers/bookings.controller.js'

import { requireCustomer, requireChef } from '../middleware/roleCheck.js'

const router = express.Router()

// Customer routes
router.post('/create', requireCustomer, createBooking)
router.get('/by-user', requireCustomer, getBookingsByUser)

// Chef routes
router.get('/by-chef', requireChef, getBookingsByChef)
router.put('/status/:id', requireChef, updateBookingStatus)

export default router
