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

// (Optional) Public: Get all hostings
export const getAllHostings = async (_req, res) => {
  const { data, error } = await supabase
    .from('hosting')
    .select('*')

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.status(200).json({ hostings: data || [] })
}