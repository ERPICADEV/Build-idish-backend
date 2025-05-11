// src/controllers/dishes.controller.js
import supabase from '../services/supabaseClient.js'

export const addDish = async (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid token' })
  }

  const token = authHeader.split(' ')[1]
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)

  if (authError) {
    return res.status(401).json({ error: 'Invalid token' })
  }

  const { title, description, price, image_url, cuisine_type } = req.body

  if (!title || !price) {
    return res.status(400).json({ error: 'Title and price are required' })
  }

  const { data, error } = await supabase
    .from('dishes')
    .insert([
      {
        title,
        description,
        price,
        image_url,
        cuisine_type,
        chef_id: user.id,
        available: true
      }
    ])
    .select()

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  if (!data || !data.length) {
    return res.status(500).json({ error: 'Insert succeeded but no data returned' })
  }

  res.status(201).json({ message: 'Dish added successfully', dish: data[0] })
}
// This function retrieves all dishes for a specific chef
export const getChefDishes = async (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid token' })
  }

  const token = authHeader.split(' ')[1]
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)

  if (authError) {
    return res.status(401).json({ error: 'Invalid token' })
  }

  const { data, error } = await supabase
    .from('dishes')
    .select('*')
    .eq('chef_id', user.id)

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.status(200).json({ dishes: data })
}
// This function retrieves a specific dish by its ID
export const getDishById = async (req, res) => {
  const { id } = req.params

  const { data, error } = await supabase
    .from('dishes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return res.status(404).json({ error: 'Dish not found' })
  }

  res.status(200).json({ dish: data })
}

// This function updates a specific dish by its ID

export const updateDishById = async (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid token' })
  }

  const token = authHeader.split(' ')[1]
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)

  if (authError) {
    return res.status(401).json({ error: 'Invalid token' })
  }

  const { id } = req.params

  // Get existing dish to verify ownership
  const { data: existingDish, error: fetchError } = await supabase
    .from('dishes')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !existingDish) {
    return res.status(404).json({ error: 'Dish not found' })
  }

  if (existingDish.chef_id !== user.id) {
    return res.status(403).json({ error: 'Unauthorized: You do not own this dish' })
  }

  // Update with provided fields only
  const { title, description, price, image_url, cuisine_type, available } = req.body

  const { data, error: updateError } = await supabase
    .from('dishes')
    .update({
      ...(title && { title }),
      ...(description && { description }),
      ...(price && { price }),
      ...(image_url && { image_url }),
      ...(cuisine_type && { cuisine_type }),
      ...(available !== undefined && { available })
    })
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    return res.status(500).json({ error: updateError.message })
  }

  res.status(200).json({ message: 'Dish updated successfully', dish: data })
}
// This function deletes a specific dish by its ID
export const deleteDishById = async (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid token' })
  }

  const token = authHeader.split(' ')[1]
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)

  if (authError) {
    return res.status(401).json({ error: 'Invalid token' })
  }

  const { id } = req.params

  // Check if dish exists and belongs to the user
  const { data: dish, error: fetchError } = await supabase
    .from('dishes')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !dish) {
    return res.status(404).json({ error: 'Dish not found' })
  }

  if (dish.chef_id !== user.id) {
    return res.status(403).json({ error: 'Unauthorized: You do not own this dish' })
  }

  // ✅ Check if dish is used in any orders
  const { data: existingOrders, error: orderCheckError } = await supabase
    .from('orders')
    .select('id')
    .eq('dish_id', id)
    .limit(1)  // just check existence

  if (orderCheckError) {
    return res.status(500).json({ error: 'Failed to check related orders' })
  }

  if (existingOrders.length > 0) {
    return res.status(400).json({ error: 'Cannot delete dish with existing orders' })
  }

  // ✅ Delete the dish
  const { error: deleteError } = await supabase
    .from('dishes')
    .delete()
    .eq('id', id)

  if (deleteError) {
    return res.status(500).json({ error: deleteError.message })
  }

  res.status(200).json({ message: 'Dish deleted successfully' })
}

// This function retrieves all dishes

export const getAllAvailableDishes = async (req, res) => {
  const { data, error } = await supabase
    .from('dishes')
    .select('*')
    .eq('available', true)

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  // ✅ Respond with empty array, NOT 404
  res.status(200).json({ dishes: data || [] })
}

// This function searches for dishes based on various criteria
export const searchDishes = async (req, res) => {
  let query = supabase.from('dishes').select('*').eq('available', true)

  const { title, cuisine_type, min_price, max_price } = req.query

  if (title) {
    query = query.ilike('title', `%${title}%`) // case-insensitive
  }

  if (cuisine_type) {
    query = query.eq('cuisine_type', cuisine_type)
  }

  if (min_price) {
    query = query.gte('price', Number(min_price))
  }

  if (max_price) {
    query = query.lte('price', Number(max_price))
  }

  const { data, error } = await query

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.status(200).json({ dishes: data || [] })
}
