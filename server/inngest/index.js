import { Inngest } from "inngest";
import Connection from "../models/Connection.js";
import sendEmail from "../configs/nodeMailer.js";
import Story from "../models/Story.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

// Create Inngest client
export const inngest = new Inngest({
    id: "pingup-app"
});


// Send Reminder when a new connection request is added
const sendNewConnectionRequestReminder = inngest.createFunction(
    {
        id: "send-new-connection-request-reminder"
    },
    {
        event: "app/connection-request"
    },
    async ({ event, step }) => {

        const { connectionId } = event.data;

        // Send first email
        await step.run(
            "send-connection-request-mail",
            async () => {

                const connection =
                    await Connection.findById(connectionId)
                        .populate("from_user_id to_user_id");

                if (!connection) {
                    return {
                        message: "Connection not found"
                    };
                }

                const subject = "👋 New Connection Request";

                const body = `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Hi ${connection.to_user_id.full_name},</h2>

                    <p>
                        You have a new connection request from
                        ${connection.from_user_id.full_name}
                        - @${connection.from_user_id.username}
                    </p>

                    <p>
                        Click
                        <a href="${process.env.FRONTEND_URL}/connections"
                           style="color: #10b981;">
                           here
                        </a>
                        to accept or reject the request
                    </p>

                    <br/>

                    <p>
                        Thanks,<br/>
                        PingUp - Stay Connected
                    </p>
                </div>
                `;

                await sendEmail({
                    to: connection.to_user_id.email,
                    subject,
                    body
                });
            }
        );


        // Wait 24 hours
        const in24Hours =
            new Date(Date.now() + 24 * 60 * 60 * 1000);

        await step.sleepUntil(
            "wait-for-24-hours",
            in24Hours
        );


        // Send reminder
        await step.run(
            "send-connection-request-reminder",
            async () => {

                const connection =
                    await Connection.findById(connectionId)
                        .populate("from_user_id to_user_id");

                if (!connection) {
                    return {
                        message: "Connection not found"
                    };
                }

                if (connection.status === "accepted") {
                    return {
                        message: "Already accepted"
                    };
                }

                const subject = "👋 New Connection Request";

                const body = `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Hi ${connection.to_user_id.full_name},</h2>

                    <p>
                        You have a new connection request from
                        ${connection.from_user_id.full_name}
                        - @${connection.from_user_id.username}
                    </p>

                    <p>
                        Click
                        <a href="${process.env.FRONTEND_URL}/connections"
                           style="color: #10b981;">
                           here
                        </a>
                        to accept or reject the request
                    </p>

                    <br/>

                    <p>
                        Thanks,<br/>
                        PingUp - Stay Connected
                    </p>
                </div>
                `;

                await sendEmail({
                    to: connection.to_user_id.email,
                    subject,
                    body
                });

                return {
                    message: "Reminder sent."
                };
            }
        );
    }
);


// Delete story after 24 hours
const deleteStory = inngest.createFunction(
    {
        id: "story-delete"
    },
    {
        event: "app/story.delete"
    },
    async ({ event, step }) => {

        const { storyId } = event.data;

        // Wait until the story's 24-hour expiry time
        const story = await Story.findById(storyId);

        if (!story) {
            return {
                message: "Story not found"
            };
        }

        await step.sleepUntil(
            "wait-until-story-expires",
            story.expiresAt
        );

        // Delete story
        await step.run(
            "delete-story",
            async () => {

                await Story.findByIdAndDelete(storyId);

                return {
                    message: "Story deleted successfully"
                };
            }
        );
    }
);


// Send notification for unseen messages
const sendNotificationOfUnseenMessages = inngest.createFunction(
    {
        id: "send-unseen-messages-notification"
    },
    {
        cron: "TZ=America/New_York 0 9 * * *"
    },
    async ({ step }) => {

        const messages =
            await Message.find({
                seen: false
            }).populate("to_user_id");

        const unseenCount = {};

        messages.forEach(message => {

            const userId = message.to_user_id._id;

            unseenCount[userId] =
                (unseenCount[userId] || 0) + 1;
        });


        for (const userId in unseenCount) {

            const user = await User.findById(userId);

            if (!user) {
                continue;
            }

            const subject =
                `📬 You have ${unseenCount[userId]} unseen messages`;

            const body = `
            <div style="font-family: Arial, sans-serif; padding: 20px;">

                <h2>Hi ${user.full_name},</h2>

                <p>
                    You have ${unseenCount[userId]} unseen messages.
                </p>

                <p>
                    Click
                    <a href="${process.env.FRONTEND_URL}/messages"
                       style="color: #10b981;">
                       here
                    </a>
                    to view them.
                </p>

                <br/>

                <p>
                    Thanks,<br/>
                    PingUp - Stay Connected
                </p>

            </div>
            `;

            await sendEmail({
                to: user.email,
                subject,
                body
            });
        }

        return {
            message: "Notification sent."
        };
    }
);


// Export Inngest functions
export const functions = [
    sendNewConnectionRequestReminder,
    deleteStory,
    sendNotificationOfUnseenMessages
];