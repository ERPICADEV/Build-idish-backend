// src/middleware/roleCheck.js
export const checkRole = (requiredRole) => {
  return async (req, res, next) => {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid token' })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await import('../services/supabaseClient.js').then(m => m.default.auth.getUser(token))

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    const role = user.user_metadata?.role
    if (role !== requiredRole) {
      return res.status(403).json({ error: `Only ${requiredRole}s can access this route` })
    }

    req.user = user
    next()
  }
}

// Short aliases
export const requireChef = checkRole('chef')
export const requireCustomer = checkRole('customer')
