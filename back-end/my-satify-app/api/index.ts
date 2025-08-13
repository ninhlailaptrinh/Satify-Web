import app from "../src/app";
import { connectDB } from "../src/config/db";

// Ensure database connection on serverless cold start
connectDB().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to connect to database:", error);
});

export default app;
