"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function SurveyCompletedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 sm:p-6">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center px-4 sm:px-6 pt-6 sm:pt-8">
          <div className="mx-auto mb-4 w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-green-600" />
          </div>
          <CardTitle className="text-xl sm:text-2xl">Survey Completed!</CardTitle>
          <CardDescription className="text-sm sm:text-base mt-2">
            Thank you for completing the site survey. Your responses have been saved.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4 sm:space-y-5 px-4 sm:px-6 pb-6 sm:pb-8">
          <p className="text-xs sm:text-sm text-gray-600">
            The survey administrator has been notified of your completion.
          </p>
          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="w-full min-h-[48px] sm:min-h-[44px] text-base sm:text-sm font-medium"
          >
            Return to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

