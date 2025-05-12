import supabase from '../services/supabaseClient.js'

// Signup controller
export const signupUser = async (req, res) => {
  const { email, password, role, ...profile } = req.body

  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Email, password, and role are required' })
  }

  // Create user in Supabase Auth
  const { data: signupData, error: signupError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role },
    }
  })

  if (signupError) {
    return res.status(400).json({ error: signupError.message })
  }

  const user = signupData.user
  if (!user) {
    return res.status(400).json({ error: 'User creation failed' })
  }

  // If the user is a chef, insert into `chefs` table
  if (role === 'chef') {
    const chefDetails = {
      id: user.id,
      name: profile.name,
      phone: profile.phone,
      location: profile.location,
      about: profile.about,
      experience: profile.experience,
      image_url: profile.image_url
    }

    const { error: insertError } = await supabase.from('chefs').insert([chefDetails])
    if (insertError) {
      return res.status(500).json({ error: 'Chef profile creation failed: ' + insertError.message })
    }
  }

  res.status(201).json({ message: 'Signup successful', user })
}

// Login controller
export const loginUser = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return res.status(401).json({ error: error.message })
  }

  res.status(200).json({ message: 'Login successful', session: data.session, user: data.user })
}

// ✅ Get profile controller
export const getProfile = async (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid token' })
  }

  const token = authHeader.split(' ')[1]
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return res.status(401).json({ error: 'Invalid token' })
  }

  res.status(200).json({ user })
}
