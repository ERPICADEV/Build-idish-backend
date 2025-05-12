// src/routes/hosting.routes.js
import express from 'express'
import { createHosting, getHostingByChef, getAllHostings, bookHosting } from '../controllers/hosting.controller.js'
import { requireChef } from '../middleware/roleCheck.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.post('/create', requireChef, createHosting)
router.get('/by-chef', requireChef, getHostingByChef)
router.get('/all', getAllHostings)
router.post('/book/:id', requireAuth, bookHosting)

export default router