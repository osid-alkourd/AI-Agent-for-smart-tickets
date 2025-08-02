import { inngest } from "../client.js";
import User from "../../../models/user.js";
import { NonRetriableError } from "inngest";
import { sendMail } from "../../../utils/mailer.js";
// import { use } from "react";

// the following function will listen to user/signup event and run code when event is triggerd
export const onUserSignup = inngest.createFunction(
  { id: "on-user-signup", retries: 2 }, // id for this function 
  { event: "user/signup" },   // the name of event that will be triggerd to run this function 
  // the following function is event handler
  async ({ event, step }) => {
    try {
      const { email } = event.data;
      const user = await step.run("get-user-email", async () => {
        const userObject = await User.findOne({ email });
        if (!userObject) {
          throw new NonRetriableError("User not exist");
        }
        return userObject;
      });

      await step.run("send-welcome-email", async () => {
        const subject = `Welcome to the app`;
        const message = `Hi,
        \n\n
        Thanks for signing up.`;
        await sendMail(user.email, subject, message);
      });
      return { success: true };
    } catch (err) {
      console.error("❌ Error running step", err.message);
       return { success: false };
    }
  }
);
