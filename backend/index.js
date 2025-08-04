import express from "express";
import cors from 'cors';
import dotenv from 'dotenv'
import { serve } from "inngest/express";

import connectDB from "./db/database.js";
import userRoutes from "./routes/userRouter.js";
import ticketRoutes from "./routes/ticketRouter.js";
import { inngest } from "./services/inngest/client.js";
import { onUserSignup } from "./services/inngest/functions/on-signup.js";
import { onTicketCreated } from "./services/inngest/functions/on-ticket-create.js";


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth',userRoutes);
app.use("/api/tickets", ticketRoutes);

// the following route will recieve any event from inggest server (inggest server send request to my backend app)
app.use(
  "/api/inngest",
  serve({
    client: inngest,
    functions: [onUserSignup, onTicketCreated],
  })
);


connectDB();


app.listen(PORT, () => {
  console.log(`🟢 Server is running on port ${PORT}`);
});
