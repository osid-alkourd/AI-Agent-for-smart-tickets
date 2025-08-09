import express from "express";
import { authenticate } from "../middlewares/auth.js";
import { createTicket, getTicket, getTickets } from "../controllers/ticketController.js";

const router = express.Router();


router.get("/", authenticate, getTickets);
router.post("/", authenticate, createTicket);
router.get("/:id", authenticate, getTicket);

export default router;
