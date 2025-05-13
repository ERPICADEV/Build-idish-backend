// src/index.js
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.routes.js'
import dishRoutes from './routes/dishes.routes.js'
import orderRoutes from './routes/orders.routes.js'  // Import the new routes
import hostingRoutes from './routes/hosting.routes.js'  // Import hosting routes

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

// Routes
app.use('/auth', authRoutes)
app.use('/dishes', dishRoutes)
app.use('/orders', orderRoutes)  // Add the orders routes
app.use('/hosting', hostingRoutes)  // Add the hosting routes


app.get('/', (req, res) => res.send('iDISH Backend is running'))

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})