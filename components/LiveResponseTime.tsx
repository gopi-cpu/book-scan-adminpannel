"use client";

import { useEffect, useState } from "react";

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}h ${m}m ${s}s`;
}

export default function LiveResponseTime({
  createdAt,
  assignedAt
}: {
  createdAt: string;
  assignedAt: string | null;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (assignedAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [assignedAt]);

  const end = assignedAt ? new Date(assignedAt).getTime() : now;
  const ms = end - new Date(createdAt).getTime();

  return <span>{formatDuration(ms)}</span>;
}
