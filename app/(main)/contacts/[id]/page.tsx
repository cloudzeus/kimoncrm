import { ContactDetailView } from "@/components/contacts/contact-detail-view";

interface ContactDetailPageProps {
  params: {
    id: string;
  };
}

export default function ContactDetailPage({ params }: ContactDetailPageProps) {
  return (
    <div className="container mx-auto py-6">
      <ContactDetailView contactId={params.id} />
    </div>
  );
}


