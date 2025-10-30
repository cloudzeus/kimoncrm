'use client';

import { useEffect, useState } from 'react';
import { sanitizeFilename, toGreeklish } from '@/lib/utils/greeklish';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface FilenamePreviewProps {
  /**
   * Original filename (may contain Greek characters)
   */
  originalFilename?: string;
  /**
   * Callback when sanitized filename changes
   */
  onFilenameChange?: (sanitized: string) => void;
  /**
   * Show the input field for editing
   */
  showInput?: boolean;
  /**
   * Label for the input field
   */
  inputLabel?: string;
}

/**
 * FilenamePreview Component
 * Shows a preview of how Greek characters will be converted to Greeklish for safe filenames
 */
export function FilenamePreview({
  originalFilename = '',
  onFilenameChange,
  showInput = true,
  inputLabel = 'Filename',
}: FilenamePreviewProps) {
  const [filename, setFilename] = useState(originalFilename);
  const [sanitized, setSanitized] = useState('');

  useEffect(() => {
    setFilename(originalFilename);
  }, [originalFilename]);

  useEffect(() => {
    const sanitizedFilename = sanitizeFilename(filename);
    setSanitized(sanitizedFilename);
    onFilenameChange?.(sanitizedFilename);
  }, [filename, onFilenameChange]);

  const handleFilenameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilename(e.target.value);
  };

  return (
    <div className="space-y-4">
      {showInput && (
        <div className="space-y-2">
          <Label htmlFor="filename-input">{inputLabel}</Label>
          <Input
            id="filename-input"
            type="text"
            value={filename}
            onChange={handleFilenameChange}
            placeholder="Enter filename (Greek characters will be converted)"
            className="font-mono"
          />
        </div>
      )}

      {filename && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Safe Filename Preview</CardTitle>
            <CardDescription className="text-xs">
              Greek characters converted to Greeklish (Latin alphabet)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Original:</div>
                <code className="block p-2 bg-muted rounded text-sm break-all">
                  {filename}
                </code>
              </div>
              
              <div>
                <div className="text-xs text-muted-foreground mb-1">Greeklish:</div>
                <code className="block p-2 bg-muted rounded text-sm break-all">
                  {toGreeklish(filename)}
                </code>
              </div>

              <div>
                <div className="text-xs text-muted-foreground mb-1">Safe Filename:</div>
                <code className="block p-2 bg-primary/10 rounded text-sm break-all font-semibold">
                  {sanitized}
                </code>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Example usage:
 * 
 * <FilenamePreview 
 *   originalFilename="ΞΕΝΟΔΟΧΕΙΑ & ΕΠΙΧΕΙΡΗΣΕΙΣ - RFP.xlsx"
 *   onFilenameChange={(safe) => console.log('Safe filename:', safe)}
 * />
 */

