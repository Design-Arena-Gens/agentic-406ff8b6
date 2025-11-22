"use client";

import { useMemo, useState } from "react";
import { tailorResume, formatResumeText } from "@/lib/tailor";
import type { JobPosting, ResumeInput, TailoredResume } from "@/lib/types";

const defaultResume: ResumeInput = {
  fullName: "Jordan Blake",
  headline: "Senior Healthcare Operations Manager",
  email: "jordan.blake@email.com",
  phone: "+1 (555) 219-3044",
  location: "Austin, TX",
  summary:
    "Specializing in US healthcare service lines with a focus on value-based care, payer collaboration, and scalable operational excellence.",
  coreSkills:
    "Value-Based Care, CMS Compliance, Quality Metrics, EMR Optimization, Change Management, Lean Six Sigma, Payer Relations, Team Leadership, Budget Oversight, Workforce Planning",
  achievements: [
    "Delivered 18% cost reduction across ambulatory clinics through performance dashboards and staffing redesign.",
    "Implemented interdisciplinary rounding improving HCAHPS satisfaction by 21% within twelve months.",
    "Expanded population health programs to 14 states, adding $42M annual recurring revenue.",
  ].join("\n"),
  experience: [
    "Directed 250+ FTE healthcare delivery network covering acute and ambulatory service lines.",
    "Negotiated payer contracts aligned with Medicare quality incentives and bundled payments.",
    "Built analytics PMO integrating Epic, Salesforce, and Tableau to monitor provider performance.",
    "Launched leadership accelerators to improve RN manager retention by 15%.",
    "Managed $120M operating budget with variance consistently under 2%.",
  ].join("\n"),
  education:
    "Master of Health Administration, University of Michigan — Bachelor of Science in Nursing, Emory University",
};

const gradientCard =
  "rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/70";

export default function Home() {
  const [resumeInput, setResumeInput] = useState<ResumeInput>(defaultResume);
  const [query, setQuery] = useState("Healthcare Manager");
  const [location, setLocation] = useState("United States");
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [jobError, setJobError] = useState<string | null>(null);
  const [tailoredResume, setTailoredResume] = useState<TailoredResume | null>(
    null,
  );
  const [applicationEmail, setApplicationEmail] = useState("");
  const [applyStatus, setApplyStatus] = useState<{
    state: "idle" | "sending" | "success" | "error";
    message: string | null;
  }>({ state: "idle", message: null });

  const resumePlainText = useMemo(() => {
    if (!tailoredResume) return "";
    return formatResumeText(tailoredResume);
  }, [tailoredResume]);

  const handleResumeChange = (
    field: keyof ResumeInput,
    value: string,
  ) => {
    setResumeInput((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const fetchJobs = async () => {
    try {
      setLoadingJobs(true);
      setJobError(null);
      const response = await fetch(
        `/api/jobs?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&limit=25`,
      );
      if (!response.ok) {
        throw new Error("Unable to pull remote job listings.");
      }
      const data = (await response.json()) as { jobs: JobPosting[] };
      setJobs(data.jobs ?? []);
    } catch (error) {
      setJobError((error as Error).message);
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleTailor = (job: JobPosting) => {
    const tailored = tailorResume(resumeInput, job);
    setTailoredResume(tailored);
    setApplyStatus({ state: "idle", message: null });
  };

  const handleDownload = () => {
    if (!tailoredResume || !resumePlainText) return;
    const blob = new Blob([resumePlainText], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${tailoredResume.contact.fullName.replace(/\s+/g, "_")}_${tailoredResume.sourceJob.title.replace(/\s+/g, "_")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    if (!resumePlainText) return;
    await navigator.clipboard.writeText(resumePlainText);
    setApplyStatus({
      state: "success",
      message: "Tailored resume copied to clipboard.",
    });
    setTimeout(() => setApplyStatus({ state: "idle", message: null }), 3000);
  };

  const handleApply = async () => {
    if (!tailoredResume) return;
    if (!applicationEmail) {
      setApplyStatus({
        state: "error",
        message: "Add the hiring manager email before auto applying.",
      });
      return;
    }

    setApplyStatus({ state: "sending", message: null });

    try {
      const response = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume: tailoredResume,
          resumePlainText,
          to: applicationEmail,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Failed to submit application.");
      }

      setApplyStatus({
        state: "success",
        message: "Application email sent successfully.",
      });
    } catch (error) {
      setApplyStatus({
        state: "error",
        message: (error as Error).message ?? "Failed to send application.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-slate-50">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-12 lg:px-10">
        <header className="space-y-4">
          <p className="inline-flex items-center gap-2 rounded-full bg-slate-800/60 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-300 shadow-lg shadow-slate-900/60">
            Agent mode
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
          </p>
          <h1 className="text-4xl font-bold sm:text-5xl">
            Manager Talent Agent – US Healthcare
          </h1>
          <p className="max-w-3xl text-lg text-slate-300">
            Configure the candidate profile, scan live healthcare management
            postings across the United States, auto-tailor the resume, and send
            targeted applications with one click.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[420px,1fr]">
          <div className="space-y-6">
            <div className={gradientCard}>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Candidate Profile
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Update the base resume once — the agent tailors it automatically
                for every opportunity.
              </p>
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Full Name
                  </label>
                  <input
                    value={resumeInput.fullName}
                    onChange={(event) =>
                      handleResumeChange("fullName", event.target.value)
                    }
                    className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100"
                  />
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Executive Headline
                  </label>
                  <input
                    value={resumeInput.headline}
                    onChange={(event) =>
                      handleResumeChange("headline", event.target.value)
                    }
                    className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Email
                    </label>
                    <input
                      value={resumeInput.email}
                      onChange={(event) =>
                        handleResumeChange("email", event.target.value)
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Phone
                    </label>
                    <input
                      value={resumeInput.phone}
                      onChange={(event) =>
                        handleResumeChange("phone", event.target.value)
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Location
                  </label>
                  <input
                    value={resumeInput.location}
                    onChange={(event) =>
                      handleResumeChange("location", event.target.value)
                    }
                    className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100"
                  />
                </div>
                <fieldset className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Executive Summary
                  </label>
                  <textarea
                    value={resumeInput.summary}
                    onChange={(event) =>
                      handleResumeChange("summary", event.target.value)
                    }
                    rows={4}
                    className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100"
                  />
                </fieldset>
                <fieldset className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Core Skills (comma separated)
                  </label>
                  <textarea
                    value={resumeInput.coreSkills}
                    onChange={(event) =>
                      handleResumeChange("coreSkills", event.target.value)
                    }
                    rows={3}
                    className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100"
                  />
                </fieldset>
                <fieldset className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Signature Achievements (one per line)
                  </label>
                  <textarea
                    value={resumeInput.achievements}
                    onChange={(event) =>
                      handleResumeChange("achievements", event.target.value)
                    }
                    rows={4}
                    className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100"
                  />
                </fieldset>
                <fieldset className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Experience Highlights (one per line)
                  </label>
                  <textarea
                    value={resumeInput.experience}
                    onChange={(event) =>
                      handleResumeChange("experience", event.target.value)
                    }
                    rows={5}
                    className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100"
                  />
                </fieldset>
                <fieldset className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Education
                  </label>
                  <textarea
                    value={resumeInput.education}
                    onChange={(event) =>
                      handleResumeChange("education", event.target.value)
                    }
                    rows={3}
                    className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100"
                  />
                </fieldset>
              </div>
            </div>

            <div className={gradientCard}>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Auto Application
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Provide the hiring manager or talent inbox email. The agent
                packages the tailored resume and cover letter through Resend.
                Configure the <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-emerald-200">RESEND_API_KEY</code> environment variable before deploying.
              </p>
              <div className="mt-4 space-y-3">
                <input
                  value={applicationEmail}
                  onChange={(event) => setApplicationEmail(event.target.value)}
                  placeholder="talent@healthsystem.com"
                  className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100"
                />
                <button
                  onClick={handleApply}
                  disabled={!tailoredResume || applyStatus.state === "sending"}
                  className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                >
                  {applyStatus.state === "sending"
                    ? "Submitting Application..."
                    : "Send Tailored Application"}
                </button>
                {applyStatus.message && (
                  <p
                    className={`text-sm ${
                      applyStatus.state === "error"
                        ? "text-rose-300"
                        : "text-emerald-300"
                    }`}
                  >
                    {applyStatus.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className={gradientCard}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Live Role Discovery
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Search management openings and let the agent adapt the resume instantly.
                  </p>
                </div>
                <button
                  onClick={fetchJobs}
                  disabled={loadingJobs}
                  className="inline-flex items-center rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-50 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-700/60"
                >
                  {loadingJobs ? "Scanning…" : "Scan US Healthcare"}
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Role focus
                  </label>
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Target geography
                  </label>
                  <input
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100"
                  />
                </div>
              </div>

              {jobError && (
                <p className="mt-3 rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                  {jobError}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4">
              {jobs.map((job) => (
                <article key={job.id} className={gradientCard}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                        {job.title}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {job.company} · {job.location}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:items-end">
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded-2xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-800/60"
                      >
                        Open posting
                      </a>
                      <button
                        onClick={() => handleTailor(job)}
                        className="inline-flex items-center rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
                      >
                        Tailor resume
                      </button>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-400">
                    {job.description.replace(/<[^>]+>/g, "").slice(0, 320)}…
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {job.tags.slice(0, 6).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-slate-800/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
              {!jobs.length && !loadingJobs && (
                <div className="rounded-3xl border border-dashed border-slate-600/60 p-12 text-center text-sm text-slate-400">
                  Launch a scan to populate relevant openings for healthcare
                  management talent in the United States.
                </div>
              )}
            </div>

            {tailoredResume && (
              <div className={gradientCard}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Tailored Resume Blueprint
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Auto generated for {tailoredResume.sourceJob.title} —{" "}
                      {tailoredResume.sourceJob.company}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleCopy}
                      className="rounded-2xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800/60"
                    >
                      Copy text
                    </button>
                    <button
                      onClick={handleDownload}
                      className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-50 transition hover:bg-slate-700"
                    >
                      Download .txt
                    </button>
                  </div>
                </div>

                <div className="mt-6 space-y-6 text-sm text-slate-200">
                  <section>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
                      Executive Summary
                    </h3>
                    <p className="mt-2 leading-relaxed text-slate-200">
                      {tailoredResume.summary}
                    </p>
                  </section>
                  <section>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
                      Keyword Alignment
                    </h3>
                    <p className="mt-2 flex flex-wrap gap-2 text-xs text-emerald-200">
                      {tailoredResume.keywordHighlights.map((keyword) => (
                        <span
                          key={keyword}
                          className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200"
                        >
                          #{keyword.replace(/\s+/g, "")}
                        </span>
                      ))}
                    </p>
                  </section>
                  <section>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
                      Core Strengths
                    </h3>
                    <div className="mt-2 grid grid-cols-1 gap-y-1 sm:grid-cols-2">
                      {tailoredResume.alignedSkills.map((skill) => (
                        <p key={skill} className="text-sm">
                          • {skill}
                        </p>
                      ))}
                    </div>
                  </section>
                  <section>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
                      Experience Impact
                    </h3>
                    <ul className="mt-2 space-y-2">
                      {tailoredResume.optimizedExperience.map((line) => (
                        <li key={line} className="leading-relaxed">
                          • {line}
                        </li>
                      ))}
                    </ul>
                  </section>
                  <section>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
                      Proof Points
                    </h3>
                    <ul className="mt-2 space-y-2">
                      {tailoredResume.achievements.map((line) => (
                        <li key={line} className="leading-relaxed">
                          • {line}
                        </li>
                      ))}
                    </ul>
                  </section>
                  <section>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
                      Education
                    </h3>
                    <p className="mt-2">{tailoredResume.education}</p>
                  </section>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
