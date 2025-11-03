"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// Dynamically import email components to avoid SSR issues
const EmailPageClient = dynamic(() => import("@/components/emails/email-page-client"), {
  ssr: false,
  loading: () => <Skeleton className="h-screen w-full" />,
});

export default function EmailsPage() {
  return <EmailPageClient />;
}
