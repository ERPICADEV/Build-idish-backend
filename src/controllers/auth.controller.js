// src/controllers/auth.controller.js
import supabase from '../services/supabaseClient.js'

export const signupUser = async (req, res) => {
  const { email, password, role } = req.body

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role }
    }
  })

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  res.status(200).json({ message: 'User registered', user: data.user })
}

export const loginUser = async (req, res) => {
  const { email, password } = req.body

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    return res.status(401).json({ error: error.message })
  }

  res.status(200).json({
    message: 'Login successful',
    user: data.user,
    session: data.session
  })
}

export const getProfile = async (req, res) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid token' })
  }

  const token = authHeader.split(' ')[1]

  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error) {
    return res.status(401).json({ error: error.message })
  }

  res.status(200).json({ user })
}
