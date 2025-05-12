// src/controllers/hosting.controller.js
import supabase from '../services/supabaseClient.js'

// Create new hosting availability
export const createHosting = async (req, res) => {
  const user = req.user

  const {
    title,
    description,
    location,
    available_days,
    time_slots,
    max_guests,
    price_per_guest
  } = req.body

  if (!title || !location || !max_guests || !price_per_guest) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const { data, error } = await supabase
    .from('hosting')
    .insert([{
      chef_id: user.id,
      title,
      description,
      location,
      available_days,
      time_slots,
      max_guests,
      price_per_guest
    }])
    .select()

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.status(201).json({ message: 'Hosting created successfully', hosting: data[0] })
}

// Get hostings by the current chef
export const getHostingByChef = async (req, res) => {
  const user = req.user

  const { data, error } = await supabase
    .from('hosting')
    .select('*')
    .eq('chef_id', user.id)

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.status(200).json({ hostings: data || [] })
}

// Public route to get all hostings
export const getAllHostings = async (_req, res) => {
  const { data, error } = await supabase
    .from('hosting')
    .select('*')

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.status(200).json({ hostings: data || [] })
}

// Book a hosting
export const bookHosting = async (req, res) => {
  const user = req.user
  const { id } = req.params // hosting_id
  const { seats } = req.body

  if (!seats || seats <= 0) {
    return res.status(400).json({ error: 'Number of seats must be greater than 0' })
  }

  // Confirm the hosting exists
  const { data: hosting, error: hostingError } = await supabase
    .from('hosting')
    .select('*')
    .eq('id', id)
    .single()

  if (hostingError || !hosting) {
    return res.status(404).json({ error: 'Hosting not found' })
  }

  // Insert booking (customer_id must match auth.uid() due to RLS)
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert([
      {
        customer_id: user.id,
        hosting_id: id,
        seats
      }
    ])
    .select()

  if (bookingError) {
    return res.status(500).json({ error: bookingError.message })
  }

  res.status(201).json({ message: 'Booking successful', booking: booking[0] })
}
