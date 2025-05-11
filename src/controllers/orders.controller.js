// src/controllers/orders.controller.js
import supabase from '../services/supabaseClient.js'

// Place a new order
export const createOrder = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Missing token' })

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error) return res.status(401).json({ error: 'Invalid token' })

  const { dish_id, quantity, delivery_address, special_instructions } = req.body
  if (!dish_id || !quantity || !delivery_address) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const { data: dish } = await supabase.from('dishes').select('*').eq('id', dish_id).single()
  if (!dish || !dish.available) return res.status(400).json({ error: 'Dish not available' })

  const total_price = dish.price * quantity

  const { data, error: orderError } = await supabase
    .from('orders')
    .insert([{
      customer_id: user.id,
      chef_id: dish.chef_id,
      dish_id,
      quantity,
      total_price,
      delivery_address,
      special_instructions,
      status: 'pending'
    }])
    .select()

  if (orderError) return res.status(500).json({ error: orderError.message })

  res.status(201).json({ message: 'Order placed', order: data[0] })
}

// Customer view
export const getOrdersByUser = async (req, res) => {
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
    .from('orders')
    .select(`
      *,
      dishes:dish_id (title, image_url, cuisine_type)
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

  res.status(200).json({ orders: data || [] })
}


// Chef view
export const getOrdersByChef = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]
  const { data: { user } } = await supabase.auth.getUser(token)

  const { data, error } = await supabase
    .from('orders')
    .select('*, dishes:dish_id(title), customer_id')
    .eq('chef_id', user.id)

  if (error) return res.status(500).json({ error: error.message })
  res.status(200).json({ orders: data })
}

// Update status (by chef)
export const updateOrderStatus = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]
  const { data: { user } } = await supabase.auth.getUser(token)

  const { id } = req.params
  const { status } = req.body

  const allowed = ['pending', 'accepted', 'preparing', 'ready', 'delivered', 'cancelled']
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' })

  const { data: existing } = await supabase.from('orders').select('*').eq('id', id).single()
  if (!existing || existing.chef_id !== user.id) return res.status(403).json({ error: 'Unauthorized' })

  const { data, error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date() })
    .eq('id', id)
    .select()

  if (error) return res.status(500).json({ error: error.message })
  res.status(200).json({ message: 'Status updated', order: data[0] })
}