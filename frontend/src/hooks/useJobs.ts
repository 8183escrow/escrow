"use client";

import { useEffect, useState } from "react";
import { DEMO_JOBS, type DemoJob } from "@/lib/demoJobs";

export interface UseJobsReturn {
  jobs: DemoJob[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useJobs(): UseJobsReturn {
  const [jobs, setJobs] = useState<DemoJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setJobs(DEMO_JOBS);
      setLoading(false);
    }, 180);

    return () => window.clearTimeout(timer);
  }, []);

  const refetch = () => {
    setLoading(true);
    window.setTimeout(() => {
      setJobs([...DEMO_JOBS]);
      setLoading(false);
    }, 180);
  };

  return { jobs, loading, error, refetch };
}
