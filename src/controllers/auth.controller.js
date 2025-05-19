import supabase from '../services/supabaseClient.js'
import supabaseAdmin from '../services/supabaseAdminClient.js'

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
    let imageUrl = '';
    
    // If there's a profile image, upload it to Supabase storage using admin client
    if (profile.profile_image) {
      try {
        // Convert base64 to buffer
        const base64Data = profile.profile_image.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Generate a unique filename
        const fileName = `${user.id}-${Date.now()}.png`;
        
        // Upload to Supabase storage using admin client
        const { data, error } = await supabaseAdmin.storage
          .from('chefs')
          .upload(fileName, buffer, {
            contentType: 'image/png',
            upsert: true
          });
          
        if (error) {
          console.error('Error uploading image:', error);
        } else {
          // Get the public URL using admin client
          const { data: { publicUrl } } = supabaseAdmin.storage
            .from('chefs')
            .getPublicUrl(fileName);
          imageUrl = publicUrl;
        }
      } catch (err) {
        console.error('Error processing image:', err);
      }
    }

    const chefDetails = {
      id: user.id,
      name: profile.name,
      phone: profile.phone,
      location: profile.location,
      about: profile.about,
      experience: profile.experience,
      image_url: imageUrl
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
  const { data: { user }, error: userError } = await supabase.auth.getUser(token)

  if (userError || !user) {
    return res.status(401).json({ error: 'Invalid token' })
  }

  const userId = user.id
  const role = user.user_metadata?.role || 'customer' // fallback to 'customer'

  // 👨‍🍳 If the user is a chef, fetch extended profile from chefs table
  if (role === 'chef') {
    const { data: chefProfile, error: profileError } = await supabase
      .from('chefs')
      .select('name, phone, location, about, experience, image_url')
      .eq('id', userId)
      .single()

    if (profileError || !chefProfile) {
      return res.status(404).json({ error: 'Chef profile not found' })
    }

    return res.status(200).json({
      user: {
        id: userId,
        email: user.email,
        user_metadata: {
          role: 'chef',
          ...chefProfile
        }
      }
    })
  }

  // 👤 If customer (just return Auth metadata)
  return res.status(200).json({
    user: {
      id: userId,
      email: user.email,
      user_metadata: {
        role: 'customer',
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at
      }
    }
  })
}

// Get user by ID controller
export const getUserById = async (req, res) => {
  const { id } = req.params;

  // Fetch chef profile from chefs table
  const { data: chefProfile, error: profileError } = await supabase
    .from('chefs')
    .select('name, phone, location, about, experience, image_url')
    .eq('id', id)
    .single();

  if (profileError || !chefProfile) {
    return res.status(404).json({ error: 'Chef profile not found' });
  }

  // Return the chef profile in the expected format
  return res.status(200).json({
    user: {
      id: id,
      user_metadata: {
        role: 'chef',
        ...chefProfile
      }
    }
  });
};

// Get chef profile by ID
export const getChefProfile = async (req, res) => {
  const { id } = req.params;

  // Fetch chef profile from chefs table
  const { data: chefProfile, error: profileError } = await supabase
    .from('chefs')
    .select('name, phone, location, about, experience, image_url')
    .eq('id', id)
    .single();

  if (profileError || !chefProfile) {
    return res.status(404).json({ error: 'Chef profile not found' });
  }

  return res.status(200).json({
    id,
    ...chefProfile
  });
};
