"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ComprehensiveInfrastructureWizard } from "@/components/site-surveys/comprehensive-infrastructure-wizard";
import { toast } from "sonner";

interface SiteSurvey {
  id: string;
  title: string;
  type: string;
  status: string;
  customer: {
    id: string;
    name: string;
  };
}

export default function SiteSurveyWizardPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [siteSurvey, setSiteSurvey] = useState<SiteSurvey | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSiteSurvey();
  }, [id]);

  const fetchSiteSurvey = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/site-surveys/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch site survey');
      }

      const data = await response.json();
      setSiteSurvey(data);
    } catch (error) {
      console.error('Error fetching site survey:', error);
      toast.error('Failed to load site survey');
      router.push('/site-surveys');
    } finally {
      setLoading(false);
    }
  };

  const handleWizardComplete = () => {
    toast.success('Site survey completed successfully!');
    router.push(`/site-surveys/${id}/details`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading site survey...</p>
        </div>
      </div>
    );
  }

  if (!siteSurvey) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Site Survey Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              The requested site survey could not be found.
            </p>
            <Button onClick={() => router.push('/site-surveys')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Site Surveys
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/site-surveys/${id}/details`)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Site Survey Details
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{siteSurvey.title}</h1>
            <p className="text-muted-foreground mt-1">
              Complete the infrastructure, equipment, and pricing for this site survey
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Customer</p>
            <p className="font-semibold">{siteSurvey.customer.name}</p>
          </div>
        </div>
      </div>

      {/* Comprehensive Infrastructure Wizard */}
      <ComprehensiveInfrastructureWizard
        siteSurveyId={id}
        siteSurveyData={siteSurvey}
        onComplete={handleWizardComplete}
      />
    </div>
  );
}

