import { inngest } from "../client.js";
import Ticket from "../../../models/ticket.js";
import User from "../../../models/user.js";
import { NonRetriableError } from "inngest";
import { sendMail } from "../../../utils/mailer.js";
import analyzeTicket from "../../../utils/ai.js";

export const onTicketCreated = inngest.createFunction(
  { id: "on-ticket-created", retries: 2 },
  { event: "ticket/created" }, // the name of event that will be triggerd to run this function

  // the event handler
  async ({ event, step }) => {
    try {
      const { ticketId } = event.data;
      // step 1 fetch ticket from DB
      const ticket = await step.run("fetch-ticket", async () => {
        const ticketObject = await Ticket.findById(ticketId);
        if (!ticketObject) throw new NonRetriableError("Ticket not found");
        return ticketObject;
      });

      await step.run("update-ticket-status", async () => {
        await Ticket.findByIdAndUpdate(ticket._id, { status: "TODO" });
      });

      const aiResponse = await analyzeTicket(ticket);

      const relatedskills = await step.run("ai-processing", async () => {
        let skills = [];
        if (aiResponse) {
          await Ticket.findByIdAndUpdate(ticket._id, {
            priority: !["low", "medium", "high"].includes(aiResponse.priority)
              ? "medium"
              : aiResponse.priority,
            helpfulNotes: aiResponse.helpfulNotes,
            status: "IN_PROGRESS",
            relatedSkills: aiResponse.relatedSkills,
          });

          skills = aiResponse.relatedSkills;
        }
        return skills;
      });

      const moderator = await step.run("assign-moderator", async () => {
        let user = await User.findOne({
          role: "moderator",
          skills: {
            $elemMatch: {
              $regex: relatedskills.join("|"),
              $options: "i", // case insensitive
            },
          },
        });

        if (!user) {
          user = await User.findOne({
            role: "admin",
          });
        }
        // assign ticket to moderator
        await Ticket.findByIdAndUpdate(ticket._id, {
          assignedTo: user?._id || null,
        });

        return user;
      });

      await step.run("send-email-notification", async () => {
        if (moderator) {
          const assigentTicket = await Ticket.findById(ticket._id);
          await sendMail(
            moderator.email,
            "Ticket Assigned",
            `A new ticket is assigned to you ${assigentTicket.title}`
          );
        }
      });
      return { success: true };
    } catch (error) {
      console.error("❌ Error running the step", error.message);
      return { success: false };
    }
  }
);
