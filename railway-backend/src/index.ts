import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { auth } from './middleware/auth';

// Import routes (we'll create these next)
import authRoutes from './routes/auth';
import trainRoutes from './routes/trains';
import bookingRoutes from './routes/bookings';
import pnrRoutes from './routes/pnr';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/trains', trainRoutes);
app.use('/api/bookings', auth, bookingRoutes);
app.use('/api/pnr', pnrRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 