import app from './app';
import { connectDB } from './config/db';
import config from './config';

connectDB();

app.listen(config.port, () => {
    console.log(`Backend listening on http://localhost:${config.port}`);
});
