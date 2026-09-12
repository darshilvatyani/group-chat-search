import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'group-chat-search-server',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`[server] Server listening on http://localhost:${PORT}`);
});
