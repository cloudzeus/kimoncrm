"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  RefreshCw,
  Save,
  X,
  PlayCircle,
  Eye
} from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface MtrGroup {
  mtrgroup: string;
  name: string;
}

interface GroupSpec {
  id?: string;
  specKey: string;
  specName: string;
  description?: string;
  isRequired: boolean;
  order: number;
}

interface AISuggestion {
  specKey: string;
  specName: string;
  mtrgroupCode: string;
  isRequired: boolean;
  order: number;
}

interface GroupWithSpecs extends MtrGroup {
  specCount: number;
  hasSpecs: boolean;
}

function GroupSpecsManagerContent() {
  const [mtrgroups, setMtrgroups] = useState<MtrGroup[]>([]);
  const [groupsWithSpecs, setGroupsWithSpecs] = useState<GroupWithSpecs[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [existingSpecs, setExistingSpecs] = useState<GroupSpec[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingSpecs, setLoadingSpecs] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [savingSpecs, setSavingSpecs] = useState(false);
  const [processingGroups, setProcessingGroups] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'manage' | 'overview'>('manage');

  // Load mtrgroups
  useEffect(() => {
    const loadGroups = async () => {
      try {
        const res = await fetch('/api/master-data/mtrgroups?sodtype=51');
        const data = await res.json();
        if (data.success) {
          const groups = data.data.map((g: any) => ({
            mtrgroup: g.mtrgroup,
            name: `${g.name} (${g.mtrgroup})`,
          }));
          setMtrgroups(groups);
          
          // Load spec counts for each group
          const groupsWithCounts = await Promise.all(
            groups.map(async (group: MtrGroup) => {
              try {
                const specsRes = await fetch(`/api/product-groupspecs?mtrgroupCode=${group.mtrgroup}`);
                const specsData = await specsRes.json();
                return {
                  ...group,
                  specCount: specsData.success ? specsData.data.length : 0,
                  hasSpecs: specsData.success && specsData.data.length > 0,
                };
              } catch {
                return {
                  ...group,
                  specCount: 0,
                  hasSpecs: false,
                };
              }
            })
          );
          setGroupsWithSpecs(groupsWithCounts);
        }
      } catch (error) {
        console.error('Error loading mtrgroups:', error);
      } finally {
        setLoadingGroups(false);
      }
    };
    loadGroups();
  }, []);

  // Load existing specs when groups change (load for first selected group)
  useEffect(() => {
    if (!selectedGroups || selectedGroups.length === 0) {
      setExistingSpecs([]);
      setAiSuggestions([]);
      return;
    }

    const loadSpecs = async () => {
      setLoadingSpecs(true);
      try {
        const res = await fetch(`/api/product-groupspecs?mtrgroupCode=${selectedGroups[0]}`);
        const data = await res.json();
        if (data.success) {
          setExistingSpecs(data.data);
        }
      } catch (error) {
        console.error('Error loading specs:', error);
      } finally {
        setLoadingSpecs(false);
      }
    };
    loadSpecs();
  }, [selectedGroups]);

  // Generate AI suggestions
  const generateAISuggestions = async () => {
    if (!selectedGroups || selectedGroups.length === 0) {
      toast.error('Please select at least one product group first');
      return;
    }

    setGeneratingAI(true);
    try {
      const res = await fetch('/api/product-groupspecs/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mtrgroupCodes: selectedGroups,
          mtrgroupCode: selectedGroups[0] // For backward compatibility
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        setAiSuggestions(data.suggestions);
        if (data.suggestions && data.suggestions.length > 0) {
          toast.success(`AI analyzed ${data.analyzedProducts} products and suggested ${data.suggestions.length} specifications`);
        } else {
          toast.info('AI could not generate specifications. Make sure products in this group have specifications.');
        }
      } else {
        // Show detailed error message
        const errorMsg = data.error || 'Failed to generate AI suggestions';
        const suggestion = data.suggestion || '';
        toast.error(`${errorMsg}${suggestion ? '. ' + suggestion : ''}`);
      }
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
      toast.error('Failed to generate AI suggestions');
    } finally {
      setGeneratingAI(false);
    }
  };

  // Toggle selection of a suggestion
  const toggleSuggestion = (index: string) => {
    console.log('Toggling suggestion:', index);
    setSelectedSuggestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
        console.log('Removed from selection');
      } else {
        newSet.add(index);
        console.log('Added to selection');
      }
      console.log('New selection:', Array.from(newSet));
      return newSet;
    });
  };

  // Save selected suggestions
  const saveSelectedSuggestions = async () => {
    if (selectedSuggestions.size === 0) {
      toast.error('Please select at least one specification to save');
      return;
    }

    setSavingSpecs(true);
    try {
      const specsToSave = Array.from(selectedSuggestions)
        .map(index => aiSuggestions[parseInt(index)])
        .map((spec, index) => ({
          ...spec,
          order: index,
        }));

      let savedCount = 0;
      let errorCount = 0;

      for (const spec of specsToSave) {
        try {
          const res = await fetch('/api/product-groupspecs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(spec),
          });

          const data = await res.json();
          if (data.success) {
            savedCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }

      toast.success(`Saved ${savedCount} specifications${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
      
      // Reload specs and clear selections
      if (selectedGroups && selectedGroups.length > 0) {
        const res = await fetch(`/api/product-groupspecs?mtrgroupCode=${selectedGroups[0]}`);
        const data = await res.json();
        if (data.success) {
          setExistingSpecs(data.data);
        }
      }
      
      setAiSuggestions([]);
      setSelectedSuggestions(new Set());
    } catch (error) {
      console.error('Error saving specs:', error);
      toast.error('Failed to save specifications');
    } finally {
      setSavingSpecs(false);
    }
  };

  // Generate specs for all products in a group
  const generateSpecsForGroup = async (mtrgroupCode: string) => {
    setProcessingGroups(prev => new Set(prev).add(mtrgroupCode));
    try {
      const res = await fetch(`/api/products/generate-specs-for-group?mtrgroupCode=${mtrgroupCode}`, {
        method: 'POST',
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success(`Generated specifications for ${data.processedCount || 0} products in group ${mtrgroupCode}`);
      } else {
        toast.error(data.error || 'Failed to generate specifications');
      }
    } catch (error) {
      console.error('Error generating specs:', error);
      toast.error('Failed to generate specifications');
    } finally {
      setProcessingGroups(prev => {
        const newSet = new Set(prev);
        newSet.delete(mtrgroupCode);
        return newSet;
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'overview' ? 'default' : 'outline'}
            onClick={() => setViewMode('overview')}
          >
            <Eye className="mr-2 h-4 w-4" />
            OVERVIEW
          </Button>
          <Button
            variant={viewMode === 'manage' ? 'default' : 'outline'}
            onClick={() => setViewMode('manage')}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            MANAGE SPECS
          </Button>
        </div>
      </div>

      {viewMode === 'overview' && (
        <Card>
          <CardHeader>
            <CardTitle>ALL PRODUCT GROUPS</CardTitle>
            <CardDescription>
              View specifications for each product group and generate specs for products
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingGroups ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading groups...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>GROUP CODE</TableHead>
                    <TableHead>GROUP NAME</TableHead>
                    <TableHead>SPECS COUNT</TableHead>
                    <TableHead>STATUS</TableHead>
                    <TableHead className="text-right">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupsWithSpecs.map((group) => (
                    <TableRow key={group.mtrgroup}>
                      <TableCell className="font-mono">{group.mtrgroup}</TableCell>
                      <TableCell>{group.name}</TableCell>
                      <TableCell>
                        <Badge variant={group.hasSpecs ? 'default' : 'secondary'}>
                          {group.specCount} specs
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {group.hasSpecs ? (
                          <Badge variant="outline" className="text-green-600">
                            ✓ Configured
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-orange-600">
                            Not configured
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {group.hasSpecs && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => generateSpecsForGroup(group.mtrgroup)}
                            disabled={processingGroups.has(group.mtrgroup)}
                          >
                            {processingGroups.has(group.mtrgroup) ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <PlayCircle className="mr-2 h-4 w-4" />
                                Generate Specs
                              </>
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {viewMode === 'manage' && (
        <>
          {/* Group Selection */}
          <Card>
        <CardHeader>
          <CardTitle>SELECT PRODUCT GROUP</CardTitle>
          <CardDescription>
            Choose a product group to manage its specifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="w-[500px]">
              <MultiSelect
                options={mtrgroups.map(g => ({ id: g.mtrgroup, name: g.name }))}
                selected={selectedGroups}
                onChange={setSelectedGroups}
                placeholder="Select product groups..."
              />
            </div>

            <Button
              onClick={generateAISuggestions}
              disabled={!selectedGroups || selectedGroups.length === 0 || generatingAI}
            >
              {generatingAI ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ANALYZING...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  GENERATE AI SUGGESTIONS
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Specifications */}
      {selectedGroups && selectedGroups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>EXISTING SPECIFICATIONS</CardTitle>
            <CardDescription>
              Current specifications for this product group
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSpecs ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading specifications...</p>
              </div>
            ) : existingSpecs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No specifications defined for this group yet
              </p>
            ) : (
              <div className="space-y-2">
                {existingSpecs.map((spec) => (
                  <div
                    key={spec.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{spec.specName}</p>
                      <p className="text-sm text-muted-foreground font-mono">{spec.specKey}</p>
                    </div>
                    {spec.isRequired && (
                      <Badge variant="default">REQUIRED</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* AI Suggestions */}
      {aiSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>AI-SUGGESTED SPECIFICATIONS</CardTitle>
                <CardDescription>
                  Select the specifications you want to save for these product groups
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (selectedSuggestions.size === aiSuggestions.length) {
                    // Deselect all
                    setSelectedSuggestions(new Set());
                  } else {
                    // Select all
                    const allIndices = aiSuggestions.map((_, index) => index.toString());
                    setSelectedSuggestions(new Set(allIndices));
                  }
                }}
              >
                {selectedSuggestions.size === aiSuggestions.length ? 'DESELECT ALL' : 'SELECT ALL'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-6">
              {aiSuggestions.map((suggestion, index) => {
                const key = index.toString();
                const isSelected = selectedSuggestions.has(key);
                
                return (
                  <div
                    key={index}
                    className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'bg-primary/5 border-primary' : 'hover:bg-accent'
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => {
                        console.log('Checkbox clicked for:', key);
                        toggleSuggestion(key);
                      }}
                    />
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => toggleSuggestion(key)}
                    >
                      <p className="font-medium">{suggestion.specName}</p>
                      <p className="text-sm text-muted-foreground font-mono">{suggestion.specKey}</p>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setAiSuggestions([]);
                  setSelectedSuggestions(new Set());
                }}
              >
                <X className="mr-2 h-4 w-4" />
                CANCEL
              </Button>
              <Button
                onClick={saveSelectedSuggestions}
                disabled={savingSpecs || selectedSuggestions.size === 0}
              >
                {savingSpecs ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    SAVING...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    SAVE {selectedSuggestions.size} SELECTED
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
        </>
      )}
    </div>
  );
}

export function GroupSpecsManager() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button variant="outline" disabled>
              <Eye className="mr-2 h-4 w-4" />
              OVERVIEW
            </Button>
            <Button variant="default" disabled>
              <Sparkles className="mr-2 h-4 w-4" />
              MANAGE SPECS
            </Button>
          </div>
        </div>
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <GroupSpecsManagerContent />;
}
