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
    price_per_guest,
    image_url,
    available = true
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
      price_per_guest,
      image_url,
      available
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
    .eq('available', true)

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.status(200).json({ hostings: data || [] })
}

// Update a hosting
export const updateHosting = async (req, res) => {
  const user = req.user
  const { id } = req.params
  const {
    title,
    description,
    location,
    available_days,
    time_slots,
    max_guests,
    price_per_guest,
    image_url,
    available
  } = req.body

  if (!title || !location || !max_guests || !price_per_guest) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    const { data: existingHosting, error: fetchError } = await supabase
      .from('hosting')
      .select('*')
      .eq('id', id)
      .eq('chef_id', user.id)
      .single()

    if (fetchError || !existingHosting) {
      return res.status(404).json({ error: 'Hosting not found or unauthorized' })
    }

    const { data, error } = await supabase
      .from('hosting')
      .update({
        title,
        description,
        location,
        available_days,
        time_slots,
        max_guests,
        price_per_guest,
        image_url,
        ...(available !== undefined && { available }),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('chef_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Update error:', error)
      return res.status(500).json({ error: error.message })
    }

    res.status(200).json({ message: 'Hosting updated successfully', hosting: data })
  } catch (error) {
    console.error('Unexpected error:', error)
    res.status(500).json({ error: 'An unexpected error occurred' })
  }
}

// Get a single hosting by ID
export const getHostingById = async (req, res) => {
  const { id } = req.params

  try {
    const { data, error } = await supabase
      .from('hosting')
      .select(`
        *,
        chefs:chef_id (
          id,
          name,
          image_url
        )
      `)
      .eq('id', id)
      .single()

    if (error || !data) {
      return res.status(404).json({ error: 'Hosting not found' })
    }

    res.status(200).json({ hosting: data })
  } catch (error) {
    res.status(500).json({ error: 'An unexpected error occurred' })
  }
}

// Delete a hosting by ID
export const deleteHostingById = async (req, res) => {
  const user = req.user
  const { id } = req.params

  try {
    // Start a transaction
    const { data: hosting, error: fetchError } = await supabase
      .from('hosting')
      .select('*')
      .eq('id', id)
      .eq('chef_id', user.id)
      .single()

    if (fetchError) {
      console.error('Error fetching hosting:', fetchError)
      // Check if the error is due to no rows found
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ 
          error: 'Hosting not found',
          message: 'The hosting you are trying to delete does not exist'
        })
      }
      return res.status(500).json({ 
        error: 'Failed to fetch hosting details',
        message: 'There was an error while trying to fetch the hosting details'
      })
    }

    if (!hosting) {
      return res.status(404).json({ 
        error: 'Hosting not found',
        message: 'The hosting you are trying to delete does not exist or you do not have permission to delete it'
      })
    }

    // Check for existing bookings
    const { data: existingBookings, error: bookingCheckError } = await supabase
      .from('bookings')
      .select('id')
      .eq('hosting_id', id)
      .limit(1)

    if (bookingCheckError) {
      console.error('Error checking bookings:', bookingCheckError)
      return res.status(500).json({ error: 'Failed to check related bookings' })
    }

    if (existingBookings && existingBookings.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete hosting with existing bookings',
        message: 'Please cancel or complete all bookings before deleting this hosting'
      })
    }

    // Delete the hosting image if it exists
    if (hosting.image_url) {
      try {
        const imagePath = hosting.image_url.split('/').pop()
        const { error: deleteImageError } = await supabase
          .storage
          .from('hostings')
          .remove([imagePath])

        if (deleteImageError) {
          console.error('Error deleting hosting image:', deleteImageError)
          // Continue with deletion even if image deletion fails
        }
      } catch (imageError) {
        console.error('Error in image deletion process:', imageError)
        // Continue with deletion even if image deletion fails
      }
    }

    // Delete the hosting record
    const { error: deleteError } = await supabase
      .from('hosting')
      .delete()
      .eq('id', id)
      .eq('chef_id', user.id)

    if (deleteError) {
      // Check for foreign key constraint error
      if (
        deleteError.message &&
        deleteError.message.toLowerCase().includes('foreign key constraint')
      ) {
        return res.status(400).json({
          error: 'Cannot delete hosting with existing bookings',
          message: 'Please cancel or remove all bookings before deleting this hosting.'
        })
      }
      // Other errors
      console.error('Error deleting hosting:', deleteError)
      return res.status(500).json({ 
        error: 'Failed to delete hosting',
        details: deleteError.message
      })
    }

    res.status(200).json({ 
      message: 'Hosting deleted successfully',
      deletedHosting: {
        id: hosting.id,
        title: hosting.title
      }
    })
  } catch (error) {
    console.error('Unexpected error in deleteHostingById:', error)
    res.status(500).json({ 
      error: 'An unexpected error occurred while deleting the hosting',
      details: error.message
    })
  }
}
