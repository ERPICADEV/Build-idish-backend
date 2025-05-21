import supabase from '../services/supabaseClient.js'

// Create a new booking
export const createBooking = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Missing token' })

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error) return res.status(401).json({ error: 'Invalid token' })

  const { hosting_id, date, time_slot, number_of_guests, special_requests } = req.body
  if (!hosting_id || !date || !time_slot || !number_of_guests) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const { data: hosting } = await supabase.from('hosting').select('*').eq('id', hosting_id).single()
  if (!hosting) return res.status(400).json({ error: 'Hosting not found' })

  // Check if the date and time slot are available
  const { data: existingBookings } = await supabase
    .from('bookings')
    .select('*')
    .eq('hosting_id', hosting_id)
    .eq('date', date)
    .eq('time_slot', time_slot)

  if (existingBookings && existingBookings.length > 0) {
    return res.status(400).json({ error: 'This time slot is already booked' })
  }

  const total_price = Math.round(hosting.price_per_guest * number_of_guests)

  const { data, error: bookingError } = await supabase
    .from('bookings')
    .insert([{
      customer_id: user.id,
      chef_id: hosting.chef_id,
      hosting_id,
      date,
      time_slot,
      number_of_guests,
      total_price,
      special_requests,
      status: 'pending'
    }])
    .select()

  if (bookingError) return res.status(500).json({ error: bookingError.message })

  res.status(201).json({ message: 'Booking created', booking: data[0] })
}

// Customer view
export const getBookingsByUser = async (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid token' })
  }

  const token = authHeader.split(' ')[1]
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError) {
    return res.status(401).json({ error: 'Invalid token' })
  }

  const { status } = req.query

  let query = supabase
    .from('bookings')
    .select(`
      *,
      hosting:hosting_id (title, location, image_url)
    `)
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.status(200).json({ bookings: data || [] })
}

// Chef view
export const getBookingsByChef = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]
  const { data: { user } } = await supabase.auth.getUser(token)

  const { data, error } = await supabase
    .from('bookings')
    .select('*, hosting:hosting_id(title), customer_id')
    .eq('chef_id', user.id)

  if (error) return res.status(500).json({ error: error.message })
  res.status(200).json({ bookings: data })
}

// Update status (by chef)
export const updateBookingStatus = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]
  const { data: { user } } = await supabase.auth.getUser(token)

  const { id } = req.params
  const { status } = req.body

  const allowed = ['pending', 'accepted', 'confirmed', 'completed', 'cancelled']
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' })

  const { data: existing } = await supabase.from('bookings').select('*').eq('id', id).single()
  if (!existing || existing.chef_id !== user.id) return res.status(403).json({ error: 'Unauthorized' })

  const { data, error } = await supabase
    .from('bookings')
    .update({ status, updated_at: new Date() })
    .eq('id', id)
    .select()

  if (error) return res.status(500).json({ error: error.message })
  res.status(200).json({ message: 'Status updated', booking: data[0] })
}
