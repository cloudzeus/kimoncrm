"use client";

import dynamic from "next/dynamic";

// Dynamically import email components to avoid SSR issues
const EmailPageClient = dynamic(
  () => import("@/components/emails/email-page-client"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    ),
  }
);

export default function EmailsPage() {
  return <EmailPageClient />;
}
