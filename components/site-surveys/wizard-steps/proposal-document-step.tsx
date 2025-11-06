// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BuildingData } from "@/types/building-data";
import { useToast } from "@/hooks/use-toast";
import { FileText, Save, Sparkles, Eye, EyeOff, AlertCircle, RefreshCw } from "lucide-react";

interface ProposalDocumentStepProps {
  buildings: BuildingData[];
  onComplete: () => void;
  siteSurveyId: string;
}

export default function ProposalDocumentStep({
  buildings,
  onComplete,
  siteSurveyId
}: ProposalDocumentStepProps) {
  const { toast } = useToast();
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSavingAI, setIsSavingAI] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // Project context for AI generation
  const [infrastructureBrief, setInfrastructureBrief] = useState('');
  const [technicalBrief, setTechnicalBrief] = useState('');
  
  // AI-generated content (editable)
  const [aiTechnicalDescription, setAiTechnicalDescription] = useState('');

  // Load existing AI content from database
  useEffect(() => {
    const loadAIContent = async () => {
      try {
        const response = await fetch(`/api/site-surveys/${siteSurveyId}/ai-content`);
        if (response.ok) {
          const data = await response.json();
          if (data.aiContent) {
            setInfrastructureBrief(data.aiContent.infrastructureBrief || '');
            setTechnicalBrief(data.aiContent.technicalBrief || '');
            setAiTechnicalDescription(data.aiContent.technicalDescription || '');
          }
        }
      } catch (error) {
        console.error('Error loading AI content:', error);
      }
    };
    
    loadAIContent();
  }, [siteSurveyId]);

  // Generate AI technical description
  const handleGenerateAI = async () => {
    if (!infrastructureBrief.trim() && !technicalBrief.trim()) {
      toast({
        title: "Απαιτείται Πληροφορία",
        description: "Παρακαλώ εισάγετε τουλάχιστον μία από τις περιγραφές για να δημιουργηθεί το τεχνικό κείμενο.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingAI(true);
    try {
      // Call DeepSeek API to generate technical description
      const response = await fetch('/api/ai/generate-technical-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteSurveyId,
          infrastructureBrief,
          technicalBrief,
          buildings,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate AI description');
      }

      const data = await response.json();
      setAiTechnicalDescription(data.technicalDescription || '');
      setShowPreview(true);
      
      toast({
        title: "Επιτυχία",
        description: "Η τεχνική περιγραφή δημιουργήθηκε επιτυχώς με AI!",
      });
    } catch (error) {
      console.error('Error generating AI description:', error);
      toast({
        title: "Σφάλμα",
        description: error instanceof Error ? error.message : "Failed to generate AI description",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Save AI content to database
  const handleSaveAIContent = async () => {
    setIsSavingAI(true);
    try {
      const response = await fetch(`/api/site-surveys/${siteSurveyId}/ai-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aiContent: {
            infrastructureBrief,
            technicalBrief,
            technicalDescription: aiTechnicalDescription,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save AI content');
      }

      toast({
        title: "Επιτυχία",
        description: "Το περιεχόμενο AI αποθηκεύτηκε επιτυχώς!",
      });
    } catch (error) {
      console.error('Error saving AI content:', error);
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία αποθήκευσης. Παρακαλώ δοκιμάστε ξανά.",
        variant: "destructive",
      });
    } finally {
      setIsSavingAI(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <FileText className="h-8 w-8 text-purple-600" />
          <h2 className="text-xl font-bold">Τεχνική Περιγραφή Προσφοράς</h2>
        </div>
        <p className="text-muted-foreground">
          Δημιουργήστε την τεχνική περιγραφή της προσφοράς με τη βοήθεια AI
        </p>
      </div>

      {/* AI Technical Description Generation */}
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Δημιουργία Τεχνικής Περιγραφής με AI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Infrastructure Brief Input */}
          <div className="space-y-2">
            <Label htmlFor="infrastructure-brief" className="text-base font-semibold">
              Περιγραφή Υποδομής
            </Label>
            <p className="text-sm text-muted-foreground">
              Περιγράψτε τη υφιστάμενη υποδομή και τα προβλήματα που αντιμετωπίζει ο πελάτης
            </p>
            <Textarea
              id="infrastructure-brief"
              value={infrastructureBrief}
              onChange={(e) => setInfrastructureBrief(e.target.value)}
              placeholder="π.χ. Ο πελάτης διαθέτει παλαιό τηλεφωνικό κέντρο που δεν υποστηρίζει VoIP, 4 ορόφους με 25 χρήστες, ανεπαρκή δικτυακή υποδομή..."
              className="min-h-[120px] resize-none"
            />
          </div>

          {/* Technical Brief Input */}
          <div className="space-y-2">
            <Label htmlFor="technical-brief" className="text-base font-semibold">
              Τεχνική Περιγραφή (Σύντομο)
            </Label>
            <p className="text-sm text-muted-foreground">
              Προσθέστε τεχνικές λεπτομέρειες και απαιτήσεις του έργου
            </p>
            <Textarea
              id="technical-brief"
              value={technicalBrief}
              onChange={(e) => setTechnicalBrief(e.target.value)}
              placeholder="π.χ. Απαιτείται εγκατάσταση IP PBX με 100 εσωτερικές, VoIP trunks, νέα δομημένη καλωδίωση Cat6A, PoE switches..."
              className="min-h-[120px] resize-none"
            />
          </div>

          {/* Generate Button */}
          <div className="flex gap-3">
            <Button
              onClick={handleGenerateAI}
              disabled={isGeneratingAI}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isGeneratingAI ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Δημιουργία AI...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Δημιουργία Τεχνικής Περιγραφής με AI
                </>
              )}
            </Button>

            {aiTechnicalDescription && (
              <Button
                onClick={() => setShowPreview(!showPreview)}
                variant="outline"
              >
                {showPreview ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Απόκρυψη
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Προβολή
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Generated Content Preview/Edit */}
          {showPreview && aiTechnicalDescription && (
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">
                  Τεχνική Περιγραφή (AI - Επεξεργάσιμη)
                </Label>
                <Button
                  onClick={handleSaveAIContent}
                  disabled={isSavingAI}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSavingAI ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      Αποθήκευση...
                    </>
                  ) : (
                    <>
                      <Save className="h-3 w-3 mr-1" />
                      Αποθήκευση
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                value={aiTechnicalDescription}
                onChange={(e) => setAiTechnicalDescription(e.target.value)}
                className="min-h-[400px] resize-none font-mono text-sm"
                placeholder="Το AI θα δημιουργήσει την τεχνική περιγραφή εδώ..."
              />
              <p className="text-xs text-muted-foreground">
                💡 Μπορείτε να επεξεργαστείτε το κείμενο πριν το αποθηκεύσετε
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-blue-900">
                Πληροφορίες Δημιουργίας Προσφοράς
              </p>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Η τεχνική περιγραφή είναι <strong>προαιρετική</strong> - μπορείτε να δημιουργήσετε την προσφορά χωρίς AI</li>
                <li>Χρησιμοποιήστε το κουμπί <strong>"Proposal"</strong> στην κεφαλίδα για δημιουργία του τελικού εγγράφου</li>
                <li>Η προσφορά θα περιλαμβάνει όλα τα προϊόντα, τιμές και προδιαγραφές από τα προηγούμενα βήματα</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
