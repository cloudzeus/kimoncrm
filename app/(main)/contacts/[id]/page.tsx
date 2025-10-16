import { ContactDetailView } from "@/components/contacts/contact-detail-view";

interface ContactDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ContactDetailPage({ params }: ContactDetailPageProps) {
  const { id } = await params;
  
  return (
    <div className="container mx-auto py-6">
      <ContactDetailView contactId={id} />
    </div>
  );
}


