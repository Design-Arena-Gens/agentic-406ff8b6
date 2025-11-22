import { NextResponse, type NextRequest } from "next/server";
import type { JobPosting } from "@/lib/types";

type RemotiveJob = {
  id?: string | number;
  url?: string;
  job_url?: string;
  job_apply_link?: string;
  title?: string;
  company_name?: string;
  company?: string;
  candidate_required_location?: string;
  location?: string;
  job_type?: string;
  description?: string;
  job_description?: string;
  tags?: string[];
  job_tags?: string[];
  salary?: string;
  salary_is_estimated?: string;
  publication_date?: string;
  created_at?: string;
};

export const dynamic = "force-dynamic";

function mapJob(job: RemotiveJob): JobPosting {
  return {
    id: String(job.id ?? job.url ?? Math.random().toString(36).slice(2)),
    title: job.title ?? "Healthcare Manager",
    company: job.company_name ?? job.company ?? "Healthcare Organization",
    location:
      job.candidate_required_location ??
      job.location ??
      job.job_type ??
      "United States",
    url: job.url ?? job.job_url ?? job.job_apply_link ?? "#",
    description: job.description ?? job.job_description ?? "",
    tags: Array.isArray(job.tags)
      ? job.tags
      : Array.isArray(job.job_tags)
        ? job.job_tags
        : [],
    salary: job.salary ?? job.salary_is_estimated ?? null,
    publishedAt: job.publication_date ?? job.created_at ?? null,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get("query") ?? "Healthcare Manager";
  const location = searchParams.get("location") ?? "United States";
  const limit = Number(searchParams.get("limit") ?? 20);

  const apiUrl = new URL("https://remotive.com/api/remote-jobs");
  apiUrl.searchParams.set("search", query);
  apiUrl.searchParams.set("limit", String(limit));
  apiUrl.searchParams.set("category", "medical-health");

  try {
    const response = await fetch(apiUrl.toString(), {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch jobs" },
        { status: response.status },
      );
    }

    const data = await response.json();
    const jobs: JobPosting[] = Array.isArray(data.jobs)
      ? data.jobs.map(mapJob)
      : [];

    const filtered = jobs.filter((job) =>
      job.location.toLowerCase().includes(location.toLowerCase()),
    );

    return NextResponse.json({ jobs: filtered.length ? filtered : jobs });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Unexpected error" },
      { status: 500 },
    );
  }
}
