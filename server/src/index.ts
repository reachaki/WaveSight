import express from 'express';
import cors from 'cors';
import { getDb } from './db';
import { healthRouter } from './routes/health';
import { floorsRouter } from './routes/floors';
import { readingsRouter } from './routes/readings';
import { dashboardRouter } from './routes/dashboard';
import { seedIfEmpty } from './seed';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialise database and seed if empty
getDb();
seedIfEmpty();

// Routes
app.use('/api', healthRouter);
app.use('/api', floorsRouter);
app.use('/api', readingsRouter);
app.use('/api', dashboardRouter);

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 WaveSight server running at http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});
