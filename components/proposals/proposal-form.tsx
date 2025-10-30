'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ProposalFormProps {
  rfpId: string;
  customerName: string;
  leadNumber?: string;
}

export function ProposalForm({ rfpId, customerName, leadNumber }: ProposalFormProps) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  
  // Form fields
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectScope, setProjectScope] = useState('');
  const [projectDuration, setProjectDuration] = useState('');
  const [projectStartDate, setProjectStartDate] = useState<Date | undefined>();
  const [projectEndDate, setProjectEndDate] = useState<Date | undefined>();

  const handleGenerateProposal = async () => {
    // Validation
    if (!projectTitle.trim()) {
      toast.error('ΣΦΑΛΜΑ', {
        description: 'Παρακαλώ εισάγετε τίτλο έργου',
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">ΔΗΜΙΟΥΡΓΙΑ ΠΡΟΤΑΣΗΣ</CardTitle>
        <CardDescription>
          Εισάγετε τις βασικές πληροφορίες για το έργο. Το AI θα δημιουργήσει την τεχνική περιγραφή.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Customer Info */}
        <div className="rounded-lg bg-muted/50 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">ΠΕΛΑΤΗΣ:</span>
            <span className="text-sm font-semibold">{customerName}</span>
          </div>
          {leadNumber && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">ΑΡΙΘΜΟΣ LEAD:</span>
              <span className="text-sm font-semibold">{leadNumber}</span>
            </div>
          )}
        </div>

        {/* Project Title - Required */}
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

        {/* Project Description */}
        <div className="space-y-2">
          <Label htmlFor="projectDescription" className="text-xs font-semibold">
            ΠΕΡΙΓΡΑΦΗ ΕΡΓΟΥ
          </Label>
          <Textarea
            id="projectDescription"
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            placeholder="Σύντομη περιγραφή του έργου..."
            rows={3}
          />
        </div>

        {/* Project Scope */}
        <div className="space-y-2">
          <Label htmlFor="projectScope" className="text-xs font-semibold">
            ΣΚΟΠΟΣ ΕΡΓΟΥ
          </Label>
          <Textarea
            id="projectScope"
            value={projectScope}
            onChange={(e) => setProjectScope(e.target.value)}
            placeholder="Τι θα επιτευχθεί με αυτό το έργο..."
            rows={3}
          />
        </div>

        {/* Project Duration */}
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

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Start Date */}
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

          {/* End Date */}
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

        {/* Generate Button */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={handleGenerateProposal}
            disabled={generating || !projectTitle.trim()}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ΔΗΜΙΟΥΡΓΙΑ ΜΕ AI...
              </>
            ) : (
              'ΔΗΜΙΟΥΡΓΙΑ ΠΡΟΤΑΣΗΣ ΜΕ AI'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

