import { NextResponse } from "next/server";
import { Resend } from "resend";
import type { TailoredResume } from "@/lib/types";

const resendClient = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function POST(request: Request) {
  if (!resendClient) {
    return NextResponse.json(
      { error: "Missing RESEND_API_KEY environment variable" },
      { status: 500 },
    );
  }

  const payload = (await request.json()) as {
    resume: TailoredResume;
    to: string;
    resumePlainText: string;
  };

  if (!payload.to) {
    return NextResponse.json(
      { error: "Recipient email address is required" },
      { status: 400 },
    );
  }

  try {
    await resendClient.emails.send({
      from: "Healthcare Agent <onboarding@resend.dev>",
      to: payload.to,
      subject: `Application: ${payload.resume.contact.fullName} for ${payload.resume.sourceJob.title}`,
      html: renderHtmlEmail(payload.resume),
      text: payload.resumePlainText,
    });

    return NextResponse.json({ status: "sent" });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Unable to send application" },
      { status: 500 },
    );
  }
}

function renderHtmlEmail(resume: TailoredResume) {
  const job = resume.sourceJob;
  const highlights = resume.keywordHighlights
    .map((keyword) => `<span style="margin-right:8px;">#${keyword}</span>`)
    .join("");
  const experience = resume.optimizedExperience
    .map((line) => `<li>${line}</li>`)
    .join("");
  const achievements = resume.achievements
    .map((line) => `<li>${line}</li>`)
    .join("");

  return `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #0f172a;">
      <h1 style="font-size: 20px; margin-bottom: 8px;">
        ${resume.contact.fullName}
      </h1>
      <p style="margin: 0 0 12px;">
        ${resume.contact.headline} · ${resume.contact.location} · ${resume.contact.phone} · ${resume.contact.email}
      </p>
      <h2 style="font-size: 16px; margin-top: 24px;">Cover Letter</h2>
      <p style="white-space: pre-line;">${resume.coverLetter}</p>

      <h2 style="font-size: 16px; margin-top: 24px;">Role Targeted</h2>
      <p>
        <strong>${job.title}</strong> — ${job.company}<br/>
        Location: ${job.location}<br/>
        <a href="${job.url}">${job.url}</a>
      </p>

      <h2 style="font-size: 16px; margin-top: 24px;">Summary</h2>
      <p>${resume.summary}</p>

      <h2 style="font-size: 16px; margin-top: 24px;">Keyword Alignment</h2>
      <p>${highlights}</p>

      <h2 style="font-size: 16px; margin-top: 24px;">Core Strengths</h2>
      <ul>
        ${resume.alignedSkills.map((skill) => `<li>${skill}</li>`).join("")}
      </ul>

      <h2 style="font-size: 16px; margin-top: 24px;">Experience Highlights</h2>
      <ul>${experience}</ul>

      <h2 style="font-size: 16px; margin-top: 24px;">Achievements</h2>
      <ul>${achievements}</ul>

      <h2 style="font-size: 16px; margin-top: 24px;">Education</h2>
      <p>${resume.education}</p>
    </div>
  `;
}
