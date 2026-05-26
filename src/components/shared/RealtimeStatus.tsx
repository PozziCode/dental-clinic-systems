"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function RealtimeStatus({ table }: { table: string }) {
  const [status, setStatus] = useState("Connecting");

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`realtime-${table}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => setStatus("Updated")
      )
      .subscribe((value) => setStatus(value === "SUBSCRIBED" ? "Live" : value));

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table]);

  return (
    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
      {status}
    </span>
  );
}
