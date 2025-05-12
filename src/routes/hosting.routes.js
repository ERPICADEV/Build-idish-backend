import express from 'express'
import { createHosting, getHostingByChef, getAllHostings } from '../controllers/hosting.controller.js'
import { requireChef } from '../middleware/roleCheck.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.post('/create', requireChef, createHosting)
router.get('/by-chef', requireChef, getHostingByChef)
router.get('/all', getAllHostings)

export default router
