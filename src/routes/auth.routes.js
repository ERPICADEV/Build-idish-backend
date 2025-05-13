import express from 'express'
import { signupUser, loginUser, getProfile, getUserById, getChefProfile } from '../controllers/auth.controller.js'

const router = express.Router()

router.post('/signup', signupUser)
router.post('/login', loginUser)
router.get('/profile', getProfile)
router.get('/users/:id', getUserById)
router.get('/chef/:id', getChefProfile)

export default router
