import express from 'express'
import { signupUser, loginUser, getProfile } from '../controllers/auth.controller.js'

const router = express.Router()

router.post('/signup', signupUser)
router.post('/login', loginUser)
router.get('/profile', getProfile) // ✅ Add this

export default router
