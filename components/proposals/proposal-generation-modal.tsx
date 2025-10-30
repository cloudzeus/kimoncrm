'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, FileText, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ProposalGenerationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rfpId?: string;
  leadId?: string;
  siteSurveyId?: string;
  customerName: string;
  leadNumber?: string;
}

export function ProposalGenerationModal({
  open,
  onOpenChange,
  rfpId,
  leadId,
  siteSurveyId,
  customerName,
  leadNumber,
}: ProposalGenerationModalProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [generating, setGenerating] = useState(false);
  
  // Form fields
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectScope, setProjectScope] = useState('');
  const [projectDuration, setProjectDuration] = useState('');
  const [projectStartDate, setProjectStartDate] = useState<Date | undefined>();
  const [projectEndDate, setProjectEndDate] = useState<Date | undefined>();

  const totalSteps = 3;

  const handleNext = () => {
    if (step === 1 && !projectTitle.trim()) {
      toast.error('ΣΦΑΛΜΑ', {
        description: 'Παρακαλώ εισάγετε τίτλο έργου',
      });
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleGenerateProposal = async () => {
    if (!rfpId) {
      toast.error('ΣΦΑΛΜΑ', {
        description: 'Δεν βρέθηκε RFP για αυτό το lead',
      });
      return;
    }

    setGenerating(true);
    
    try {
      const response = await fetch(`/api/rfps/${rfpId}/generate-proposal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectTitle,
          projectDescription,
          projectScope,
          projectDuration,
          projectStartDate: projectStartDate?.toISOString(),
          projectEndDate: projectEndDate?.toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate proposal');
      }

      toast.success('ΕΠΙΤΥΧΙΑ', {
        description: 'Η πρόταση δημιουργήθηκε με επιτυχία με AI περιεχόμενο',
      });

      // Close modal
      onOpenChange(false);
      
      // Navigate to proposal editor
      router.push(`/proposals/${data.proposal.id}/edit`);
    } catch (error: any) {
      console.error('Error generating proposal:', error);
      toast.error('ΣΦΑΛΜΑ', {
        description: error.message || 'Αποτυχία δημιουργίας πρότασης',
      });
    } finally {
      setGenerating(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setProjectTitle('');
    setProjectDescription('');
    setProjectScope('');
    setProjectDuration('');
    setProjectStartDate(undefined);
    setProjectEndDate(undefined);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <FileText className="h-6 w-6" />
            ΔΗΜΙΟΥΡΓΙΑ ΤΕΧΝΙΚΗΣ ΠΡΟΤΑΣΗΣ
          </DialogTitle>
          <DialogDescription>
            Βήμα {step} από {totalSteps} - {step === 1 ? 'Βασικές Πληροφορίες' : step === 2 ? 'Λεπτομέρειες Έργου' : 'Επισκόπηση & Δημιουργία'}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-full transition-colors',
                  s < step
                    ? 'bg-green-600 text-white'
                    : s === step
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                )}
              >
                {s < step ? <Check className="h-5 w-5" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={cn(
                    'w-20 h-1 mx-2 transition-colors',
                    s < step ? 'bg-green-600' : 'bg-gray-200'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="space-y-6">
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <>
              <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">ΠΕΛΑΤΗΣ:</span>
                  <span className="text-sm font-semibold">{customerName}</span>
                </div>
                {leadNumber && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">LEAD:</span>
                    <span className="text-sm font-semibold">{leadNumber}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectTitle" className="text-xs font-semibold">
                  ΤΙΤΛΟΣ ΕΡΓΟΥ <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="projectTitle"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="π.χ. ΑΝΑΒΑΘΜΙΣΗ ΔΙΚΤΥΑΚΗΣ ΥΠΟΔΟΜΗΣ"
                  className="uppercase"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectDescription" className="text-xs font-semibold">
                  ΠΕΡΙΓΡΑΦΗ ΕΡΓΟΥ
                </Label>
                <Textarea
                  id="projectDescription"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Σύντομη περιγραφή του έργου..."
                  rows={4}
                />
              </div>
            </>
          )}

          {/* Step 2: Project Details */}
          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="projectScope" className="text-xs font-semibold">
                  ΣΚΟΠΟΣ ΕΡΓΟΥ
                </Label>
                <Textarea
                  id="projectScope"
                  value={projectScope}
                  onChange={(e) => setProjectScope(e.target.value)}
                  placeholder="Τι θα επιτευχθεί με αυτό το έργο..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectDuration" className="text-xs font-semibold">
                  ΔΙΑΡΚΕΙΑ ΕΡΓΟΥ
                </Label>
                <Input
                  id="projectDuration"
                  value={projectDuration}
                  onChange={(e) => setProjectDuration(e.target.value)}
                  placeholder="π.χ. 3 μήνες, 6 εβδομάδες"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">ΗΜΕΡΟΜΗΝΙΑ ΕΝΑΡΞΗΣ</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !projectStartDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {projectStartDate ? format(projectStartDate, 'dd/MM/yyyy') : 'Επιλέξτε ημερομηνία'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={projectStartDate}
                        onSelect={setProjectStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">ΗΜΕΡΟΜΗΝΙΑ ΛΗΞΗΣ</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !projectEndDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {projectEndDate ? format(projectEndDate, 'dd/MM/yyyy') : 'Επιλέξτε ημερομηνία'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={projectEndDate}
                        onSelect={setProjectEndDate}
                        initialFocus
                        disabled={(date) => projectStartDate ? date < projectStartDate : false}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </>
          )}

          {/* Step 3: Review & Generate */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-6 border-2 border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  ΕΠΙΣΚΟΠΗΣΗ ΠΡΟΤΑΣΗΣ
                </h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-muted-foreground">Τίτλος:</span>
                    <span className="font-semibold">{projectTitle}</span>
                  </div>
                  {projectDescription && (
                    <div>
                      <span className="font-medium text-muted-foreground">Περιγραφή:</span>
                      <p className="mt-1 text-sm">{projectDescription}</p>
                    </div>
                  )}
                  {projectScope && (
                    <div>
                      <span className="font-medium text-muted-foreground">Σκοπός:</span>
                      <p className="mt-1 text-sm">{projectScope}</p>
                    </div>
                  )}
                  {projectDuration && (
                    <div className="flex justify-between">
                      <span className="font-medium text-muted-foreground">Διάρκεια:</span>
                      <span className="font-semibold">{projectDuration}</span>
                    </div>
                  )}
                  {(projectStartDate || projectEndDate) && (
                    <div className="flex justify-between">
                      <span className="font-medium text-muted-foreground">Ημερομηνίες:</span>
                      <span className="font-semibold">
                        {projectStartDate && format(projectStartDate, 'dd/MM/yyyy')}
                        {projectStartDate && projectEndDate && ' - '}
                        {projectEndDate && format(projectEndDate, 'dd/MM/yyyy')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                <h4 className="font-semibold text-sm mb-2">ΤΙ ΘΑ ΔΗΜΙΟΥΡΓΗΘΕΙ:</h4>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>✓ AI-Generated περιγραφή υποδομής στα ελληνικά</li>
                  <li>✓ Τεχνική περιγραφή λύσης</li>
                  <li>✓ Περιγραφή προϊόντων ανά κατηγορία/brand</li>
                  <li>✓ Περιγραφή υπηρεσιών</li>
                  <li>✓ Εμβέλεια εργασιών (Scope of Work)</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {step > 1 && (
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={generating}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                ΠΙΣΩ
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={handleClose}
              disabled={generating}
            >
              ΑΚΥΡΩΣΗ
            </Button>
            
            {step < totalSteps ? (
              <Button onClick={handleNext}>
                ΕΠΟΜΕΝΟ
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleGenerateProposal}
                disabled={generating || !projectTitle.trim()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ΔΗΜΙΟΥΡΓΙΑ...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    ΔΗΜΙΟΥΡΓΙΑ ΜΕ AI
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

