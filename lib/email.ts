
import nodemailer from "nodemailer";

const adminEmail = "foundit.connect@gmail.com";
const adminPassword = "#FoundIt*by@TECHtitans"; // WARNING: Storing plain text password is not best practice, but using as per user request/credentials.
// Note: If 2FA is on, this will fail without an App Password.

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: adminEmail,
        pass: adminPassword,
    },
});

export async function sendEmail(to: string, subject: string, html: string) {
    try {
        const info = await transporter.sendMail({
            from: `"FoundIt (Company)" <${adminEmail}>`, // Custom Sender Name
            to,
            subject,
            html,
        });
        console.log("Message sent: %s", info.messageId);
        return { success: true };
    } catch (error) {
        console.error("Error sending email:", error);
        return { success: false, error };
    }
}
