import express, { type Request, type Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import stripeRoutes from './routes/stripeRoutes.js';
import loanRoutes from './routes/loanRoutes.js';
import activityRoutes from './routes/activityRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/activity', activityRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('Je Dépanne API is running');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
