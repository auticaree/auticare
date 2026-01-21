import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { feedbackType, message, rating } = await request.json();

    if (!message || message.trim().length < 10) {
      return NextResponse.json(
        { error: "Feedback message must be at least 10 characters" },
        { status: 400 }
      );
    }

    const userName = session.user.name || "Unknown User";
    const userEmail = session.user.email || "No email";
    const userId = session.user.id;

    const emailSubject = `[AutiCare Feedback] ${feedbackType || "General"} - from ${userName}`;
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2D5A4A;">New Feedback from AutiCare</h2>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>From:</strong> ${userName}</p>
          <p><strong>Email:</strong> ${userEmail}</p>
          <p><strong>User ID:</strong> ${userId}</p>
          <p><strong>Type:</strong> ${feedbackType || "General Feedback"}</p>
          ${rating ? `<p><strong>Rating:</strong> ${"⭐".repeat(rating)} (${rating}/5)</p>` : ""}
          <p><strong>Date:</strong> ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</p>
        </div>
        
        <div style="background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h3 style="color: #333; margin-top: 0;">Message:</h3>
          <p style="white-space: pre-wrap; color: #555;">${message}</p>
        </div>
        
        <p style="color: #888; font-size: 12px; margin-top: 20px;">
          This feedback was submitted through the AutiCare platform.
        </p>
      </div>
    `;

    const emailText = `
New Feedback from AutiCare

From: ${userName}
Email: ${userEmail}
User ID: ${userId}
Type: ${feedbackType || "General Feedback"}
${rating ? `Rating: ${rating}/5` : ""}
Date: ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}

Message:
${message}

---
This feedback was submitted through the AutiCare platform.
    `.trim();

    if (resend) {
      await resend.emails.send({
        from: "AutiCare Feedback <feedback@auticare.app>",
        to: "ricardoauticare@gmail.com",
        replyTo: userEmail,
        subject: emailSubject,
        html: emailHtml,
        text: emailText,
      });
    } else {
      // Dev mode - log to console
      console.log("\n========== FEEDBACK EMAIL ==========");
      console.log(`To: ricardoauticare@gmail.com`);
      console.log(`Subject: ${emailSubject}`);
      console.log(emailText);
      console.log("=====================================\n");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Feedback submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}
