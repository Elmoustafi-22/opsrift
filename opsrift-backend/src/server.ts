import { config } from "dotenv";
config();

import app from "./app";
import connectDB from "./config/db";
import { initEscalationCron } from "./jobs/escalation.cron";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();
        // Initialize the scheduled hourly overdue checker
        initEscalationCron();
    } catch (error) {
        console.error("Database connection failed", error);
        // Continue to start server even if DB fails, for testing
    }

    app.listen(PORT, () => {
        console.log(`Server is now running on http://localhost:${PORT}`);
    });
}

startServer();