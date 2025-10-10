"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import ExcelJS from "exceljs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, FileSpreadsheet, MapPin, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface XLSXImportProps {
  entityType: 'companies' | 'contacts' | 'leads' | 'products' | 'inventory';
  onImport: (data: any[]) => Promise<void>;
  sampleData?: any[];
}

interface FieldMapping {
  [key: string]: string; // Excel column -> Database field
}

const ENTITY_FIELDS = {
  companies: [
    { key: 'name', label: 'Company Name', required: true },
    { key: 'vatId', label: 'VAT ID', required: false },
    { key: 'email', label: 'Email', required: false },
    { key: 'phone', label: 'Phone', required: false },
    { key: 'website', label: 'Website', required: false },
  ],
  contacts: [
    { key: 'firstName', label: 'First Name', required: false },
    { key: 'lastName', label: 'Last Name', required: false },
    { key: 'email', label: 'Email', required: false },
    { key: 'phone', label: 'Phone', required: false },
    { key: 'mobile', label: 'Mobile', required: false },
    { key: 'jobTitle', label: 'Job Title', required: false },
    { key: 'department', label: 'Department', required: false },
    { key: 'companyName', label: 'Company Name', required: false },
  ],
  leads: [
    { key: 'name', label: 'Lead Name', required: true },
    { key: 'email', label: 'Email', required: false },
    { key: 'phone', label: 'Phone', required: false },
    { key: 'source', label: 'Source', required: false },
    { key: 'status', label: 'Status', required: false },
    { key: 'score', label: 'Score', required: false },
    { key: 'notes', label: 'Notes', required: false },
    { key: 'companyName', label: 'Company Name', required: false },
  ],
  products: [
    { key: 'sku', label: 'SKU', required: true },
    { key: 'ean', label: 'EAN', required: false },
    { key: 'name', label: 'Product Name', required: true },
    { key: 'nameEn', label: 'Product Name (EN)', required: false },
    { key: 'descriptionEl', label: 'Description (Greek)', required: false },
    { key: 'descriptionEn', label: 'Description (English)', required: false },
    { key: 'price', label: 'Price', required: false },
    { key: 'cost', label: 'Cost', required: false },
    { key: 'brandName', label: 'Brand', required: false },
    { key: 'categoryName', label: 'Category', required: false },
    { key: 'manufacturerName', label: 'Manufacturer', required: false },
  ],
  inventory: [
    { key: 'sku', label: 'SKU', required: true },
    { key: 'branchCode', label: 'Branch Code', required: true },
    { key: 'quantity', label: 'Quantity', required: true },
    { key: 'minQty', label: 'Min Quantity', required: false },
  ],
};

export function XLSXImport({ entityType, onImport, sampleData }: XLSXImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  const [fieldMapping, setFieldMapping] = useState<FieldMapping>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);

  const entityFields = ENTITY_FIELDS[entityType];

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFile(file);
    parseExcelFile(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    multiple: false,
  });

  const parseExcelFile = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(arrayBuffer);

        const worksheet = workbook.getWorksheet(1);
        if (!worksheet) {
          toast.error("Excel file has no worksheets");
          return;
        }

        const jsonData: any[][] = [];
        worksheet.eachRow((row) => {
          jsonData.push(row.values as any[]);
        });

        // Remove first element (row.values includes an extra element at index 0)
        const cleanedData = jsonData.map(row => row.slice(1));

        if (cleanedData.length < 2) {
          toast.error("Excel file must have at least a header row and one data row");
          return;
        }

        const headers = cleanedData[0].map(h => h?.toString() || '');
        const rows = cleanedData.slice(1);
        
        const processedData = rows.map(row => {
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = row[index];
          });
          return obj;
        }).filter(row => Object.values(row).some(value => value !== undefined && value !== null && value !== ''));

        setExcelColumns(headers);
        setExcelData(processedData);
        setPreviewData(processedData.slice(0, 5)); // Show first 5 rows for preview
        toast.success(`Loaded ${processedData.length} rows from Excel file`);
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        toast.error("Failed to parse Excel file");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFieldMapping = (excelColumn: string, dbField: string) => {
    setFieldMapping(prev => ({
      ...prev,
      [excelColumn]: dbField
    }));
  };

  const validateMapping = () => {
    const requiredFields = entityFields.filter(field => field.required);
    const mappedFields = Object.values(fieldMapping);
    
    for (const requiredField of requiredFields) {
      if (!mappedFields.includes(requiredField.key)) {
        toast.error(`Required field "${requiredField.label}" is not mapped`);
        return false;
      }
    }
    return true;
  };

  const processImport = async () => {
    if (!validateMapping()) return;

    setIsProcessing(true);
    try {
      const processedData = excelData.map(row => {
        const mappedRow: any = {};
        
        // Apply field mapping
        Object.entries(fieldMapping).forEach(([excelCol, dbField]) => {
          if (row[excelCol] !== undefined && row[excelCol] !== null && row[excelCol] !== '') {
            mappedRow[dbField] = row[excelCol];
          }
        });

        // Special processing for specific entity types
        if (entityType === 'companies' && mappedRow.companyName) {
          mappedRow.name = mappedRow.companyName;
          delete mappedRow.companyName;
        }

        if (entityType === 'inventory') {
          // Convert quantity to number
          if (mappedRow.quantity) {
            mappedRow.quantity = parseInt(mappedRow.quantity) || 0;
          }
          if (mappedRow.minQty) {
            mappedRow.minQty = parseInt(mappedRow.minQty) || 0;
          }
        }

        return mappedRow;
      }).filter(row => Object.keys(row).length > 0);

      await onImport(processedData);
      toast.success(`Successfully imported ${processedData.length} records`);
      
      // Reset form
      setFile(null);
      setExcelData([]);
      setExcelColumns([]);
      setFieldMapping({});
      setPreviewData([]);
    } catch (error) {
      console.error('Import error:', error);
      toast.error("Failed to import data");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadSample = async () => {
    if (!sampleData || sampleData.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sample Data');

    // Add headers
    if (sampleData.length > 0) {
      const headers = Object.keys(sampleData[0]);
      worksheet.addRow(headers);
      
      // Add data rows
      sampleData.forEach(row => {
        worksheet.addRow(Object.values(row));
      });
    }

    // Generate and download the file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${entityType}_sample.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Upload className="mr-2 h-4 w-4" />
          Import from Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import {entityType.charAt(0).toUpperCase() + entityType.slice(1)} from Excel
          </DialogTitle>
          <DialogDescription>
            Upload an Excel file and map the columns to database fields
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload */}
          {!file && (
            <Card>
              <CardHeader>
                <CardTitle>Step 1: Upload Excel File</CardTitle>
                <CardDescription>
                  Drag and drop an Excel file or click to browse
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">
                    {isDragActive ? 'Drop the file here' : 'Drop Excel file here or click to browse'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Supports .xlsx and .xls files
                  </p>
                </div>
                
                {sampleData && sampleData.length > 0 && (
                  <div className="mt-4">
                    <Button variant="outline" onClick={downloadSample} className="w-full">
                      Download Sample Excel Template
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Field Mapping */}
          {file && excelColumns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Step 2: Map Excel Columns to Database Fields
                </CardTitle>
                <CardDescription>
                  Select which Excel column corresponds to each database field
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {entityFields.map((field) => (
                    <div key={field.key} className="flex items-center space-x-4">
                      <Label className="w-48 text-right">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <Select
                        value={Object.keys(fieldMapping).find(key => fieldMapping[key] === field.key) || ''}
                        onValueChange={(value) => handleFieldMapping(value, field.key)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select Excel column" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">-- Skip this field --</SelectItem>
                          {excelColumns.map((column) => (
                            <SelectItem key={column} value={column}>
                              {column}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview */}
          {previewData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Step 3: Preview Data
                </CardTitle>
                <CardDescription>
                  Preview of the first 5 rows that will be imported
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-border">
                    <thead>
                      <tr className="bg-muted">
                        {Object.keys(previewData[0] || {}).map((column) => (
                          <th key={column} className="border border-border p-2 text-left">
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, index) => (
                        <tr key={index}>
                          {Object.values(row).map((value: any, cellIndex) => (
                            <td key={cellIndex} className="border border-border p-2">
                              {value?.toString() || ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          {file && excelColumns.length > 0 && (
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setFile(null);
                  setExcelData([]);
                  setExcelColumns([]);
                  setFieldMapping({});
                  setPreviewData([]);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={processImport}
                disabled={isProcessing || !validateMapping()}
              >
                {isProcessing ? 'Importing...' : `Import ${excelData.length} Records`}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
