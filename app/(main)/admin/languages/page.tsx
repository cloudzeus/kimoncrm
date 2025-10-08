"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, Star, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SupportedLanguage {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// Comprehensive list of country flags
const countryFlags = [
  { code: "🇦🇩", name: "Andorra" },
  { code: "🇦🇪", name: "United Arab Emirates" },
  { code: "🇦🇫", name: "Afghanistan" },
  { code: "🇦🇬", name: "Antigua and Barbuda" },
  { code: "🇦🇮", name: "Anguilla" },
  { code: "🇦🇱", name: "Albania" },
  { code: "🇦🇲", name: "Armenia" },
  { code: "🇦🇴", name: "Angola" },
  { code: "🇦🇶", name: "Antarctica" },
  { code: "🇦🇷", name: "Argentina" },
  { code: "🇦🇸", name: "American Samoa" },
  { code: "🇦🇹", name: "Austria" },
  { code: "🇦🇺", name: "Australia" },
  { code: "🇦🇼", name: "Aruba" },
  { code: "🇦🇽", name: "Åland Islands" },
  { code: "🇦🇿", name: "Azerbaijan" },
  { code: "🇧🇦", name: "Bosnia and Herzegovina" },
  { code: "🇧🇧", name: "Barbados" },
  { code: "🇧🇩", name: "Bangladesh" },
  { code: "🇧🇪", name: "Belgium" },
  { code: "🇧🇫", name: "Burkina Faso" },
  { code: "🇧🇬", name: "Bulgaria" },
  { code: "🇧🇭", name: "Bahrain" },
  { code: "🇧🇮", name: "Burundi" },
  { code: "🇧🇯", name: "Benin" },
  { code: "🇧🇱", name: "Saint Barthélemy" },
  { code: "🇧🇲", name: "Bermuda" },
  { code: "🇧🇳", name: "Brunei" },
  { code: "🇧🇴", name: "Bolivia" },
  { code: "🇧🇶", name: "Caribbean Netherlands" },
  { code: "🇧🇷", name: "Brazil" },
  { code: "🇧🇸", name: "Bahamas" },
  { code: "🇧🇹", name: "Bhutan" },
  { code: "🇧🇻", name: "Bouvet Island" },
  { code: "🇧🇼", name: "Botswana" },
  { code: "🇧🇾", name: "Belarus" },
  { code: "🇧🇿", name: "Belize" },
  { code: "🇨🇦", name: "Canada" },
  { code: "🇨🇨", name: "Cocos Islands" },
  { code: "🇨🇩", name: "Congo - Kinshasa" },
  { code: "🇨🇫", name: "Central African Republic" },
  { code: "🇨🇬", name: "Congo - Brazzaville" },
  { code: "🇨🇭", name: "Switzerland" },
  { code: "🇨🇮", name: "Côte d'Ivoire" },
  { code: "🇨🇰", name: "Cook Islands" },
  { code: "🇨🇱", name: "Chile" },
  { code: "🇨🇲", name: "Cameroon" },
  { code: "🇨🇳", name: "China" },
  { code: "🇨🇴", name: "Colombia" },
  { code: "🇨🇵", name: "Clipperton Island" },
  { code: "🇨🇷", name: "Costa Rica" },
  { code: "🇨🇺", name: "Cuba" },
  { code: "🇨🇻", name: "Cape Verde" },
  { code: "🇨🇼", name: "Curaçao" },
  { code: "🇨🇽", name: "Christmas Island" },
  { code: "🇨🇾", name: "Cyprus" },
  { code: "🇨🇿", name: "Czechia" },
  { code: "🇩🇪", name: "Germany" },
  { code: "🇩🇬", name: "Diego Garcia" },
  { code: "🇩🇯", name: "Djibouti" },
  { code: "🇩🇰", name: "Denmark" },
  { code: "🇩🇲", name: "Dominica" },
  { code: "🇩🇴", name: "Dominican Republic" },
  { code: "🇩🇿", name: "Algeria" },
  { code: "🇪🇦", name: "Ceuta & Melilla" },
  { code: "🇪🇨", name: "Ecuador" },
  { code: "🇪🇪", name: "Estonia" },
  { code: "🇪🇬", name: "Egypt" },
  { code: "🇪🇭", name: "Western Sahara" },
  { code: "🇪🇷", name: "Eritrea" },
  { code: "🇪🇸", name: "Spain" },
  { code: "🇪🇹", name: "Ethiopia" },
  { code: "🇪🇺", name: "European Union" },
  { code: "🇫🇮", name: "Finland" },
  { code: "🇫🇯", name: "Fiji" },
  { code: "🇫🇰", name: "Falkland Islands" },
  { code: "🇫🇲", name: "Micronesia" },
  { code: "🇫🇴", name: "Faroe Islands" },
  { code: "🇫🇷", name: "France" },
  { code: "🇬🇦", name: "Gabon" },
  { code: "🇬🇧", name: "United Kingdom" },
  { code: "🇬🇩", name: "Grenada" },
  { code: "🇬🇪", name: "Georgia" },
  { code: "🇬🇫", name: "French Guiana" },
  { code: "🇬🇬", name: "Guernsey" },
  { code: "🇬🇭", name: "Ghana" },
  { code: "🇬🇮", name: "Gibraltar" },
  { code: "🇬🇱", name: "Greenland" },
  { code: "🇬🇲", name: "Gambia" },
  { code: "🇬🇳", name: "Guinea" },
  { code: "🇬🇵", name: "Guadeloupe" },
  { code: "🇬🇶", name: "Equatorial Guinea" },
  { code: "🇬🇷", name: "Greece" },
  { code: "🇬🇸", name: "South Georgia & South Sandwich Islands" },
  { code: "🇬🇹", name: "Guatemala" },
  { code: "🇬🇺", name: "Guam" },
  { code: "🇬🇼", name: "Guinea-Bissau" },
  { code: "🇬🇾", name: "Guyana" },
  { code: "🇭🇰", name: "Hong Kong SAR China" },
  { code: "🇭🇲", name: "Heard & McDonald Islands" },
  { code: "🇭🇳", name: "Honduras" },
  { code: "🇭🇷", name: "Croatia" },
  { code: "🇭🇹", name: "Haiti" },
  { code: "🇭🇺", name: "Hungary" },
  { code: "🇮🇨", name: "Canary Islands" },
  { code: "🇮🇩", name: "Indonesia" },
  { code: "🇮🇪", name: "Ireland" },
  { code: "🇮🇱", name: "Israel" },
  { code: "🇮🇲", name: "Isle of Man" },
  { code: "🇮🇳", name: "India" },
  { code: "🇮🇴", name: "British Indian Ocean Territory" },
  { code: "🇮🇶", name: "Iraq" },
  { code: "🇮🇷", name: "Iran" },
  { code: "🇮🇸", name: "Iceland" },
  { code: "🇮🇹", name: "Italy" },
  { code: "🇯🇪", name: "Jersey" },
  { code: "🇯🇲", name: "Jamaica" },
  { code: "🇯🇴", name: "Jordan" },
  { code: "🇯🇵", name: "Japan" },
  { code: "🇰🇪", name: "Kenya" },
  { code: "🇰🇬", name: "Kyrgyzstan" },
  { code: "🇰🇭", name: "Cambodia" },
  { code: "🇰🇮", name: "Kiribati" },
  { code: "🇰🇲", name: "Comoros" },
  { code: "🇰🇳", name: "St. Kitts & Nevis" },
  { code: "🇰🇵", name: "North Korea" },
  { code: "🇰🇷", name: "South Korea" },
  { code: "🇰🇼", name: "Kuwait" },
  { code: "🇰🇾", name: "Cayman Islands" },
  { code: "🇰🇿", name: "Kazakhstan" },
  { code: "🇱🇦", name: "Laos" },
  { code: "🇱🇧", name: "Lebanon" },
  { code: "🇱🇨", name: "St. Lucia" },
  { code: "🇱🇮", name: "Liechtenstein" },
  { code: "🇱🇰", name: "Sri Lanka" },
  { code: "🇱🇷", name: "Liberia" },
  { code: "🇱🇸", name: "Lesotho" },
  { code: "🇱🇹", name: "Lithuania" },
  { code: "🇱🇺", name: "Luxembourg" },
  { code: "🇱🇻", name: "Latvia" },
  { code: "🇱🇾", name: "Libya" },
  { code: "🇲🇦", name: "Morocco" },
  { code: "🇲🇨", name: "Monaco" },
  { code: "🇲🇩", name: "Moldova" },
  { code: "🇲🇪", name: "Montenegro" },
  { code: "🇲🇫", name: "St. Martin" },
  { code: "🇲🇬", name: "Madagascar" },
  { code: "🇲🇭", name: "Marshall Islands" },
  { code: "🇲🇰", name: "North Macedonia" },
  { code: "🇲🇱", name: "Mali" },
  { code: "🇲🇲", name: "Myanmar (Burma)" },
  { code: "🇲🇳", name: "Mongolia" },
  { code: "🇲🇴", name: "Macao SAR China" },
  { code: "🇲🇵", name: "Northern Mariana Islands" },
  { code: "🇲🇶", name: "Martinique" },
  { code: "🇲🇷", name: "Mauritania" },
  { code: "🇲🇸", name: "Montserrat" },
  { code: "🇲🇹", name: "Malta" },
  { code: "🇲🇺", name: "Mauritius" },
  { code: "🇲🇻", name: "Maldives" },
  { code: "🇲🇼", name: "Malawi" },
  { code: "🇲🇽", name: "Mexico" },
  { code: "🇲🇾", name: "Malaysia" },
  { code: "🇲🇿", name: "Mozambique" },
  { code: "🇳🇦", name: "Namibia" },
  { code: "🇳🇨", name: "New Caledonia" },
  { code: "🇳🇪", name: "Niger" },
  { code: "🇳🇫", name: "Norfolk Island" },
  { code: "🇳🇬", name: "Nigeria" },
  { code: "🇳🇮", name: "Nicaragua" },
  { code: "🇳🇱", name: "Netherlands" },
  { code: "🇳🇴", name: "Norway" },
  { code: "🇳🇵", name: "Nepal" },
  { code: "🇳🇷", name: "Nauru" },
  { code: "🇳🇺", name: "Niue" },
  { code: "🇳🇿", name: "New Zealand" },
  { code: "🇴🇲", name: "Oman" },
  { code: "🇵🇦", name: "Panama" },
  { code: "🇵🇪", name: "Peru" },
  { code: "🇵🇫", name: "French Polynesia" },
  { code: "🇵🇬", name: "Papua New Guinea" },
  { code: "🇵🇭", name: "Philippines" },
  { code: "🇵🇰", name: "Pakistan" },
  { code: "🇵🇱", name: "Poland" },
  { code: "🇵🇲", name: "St. Pierre & Miquelon" },
  { code: "🇵🇳", name: "Pitcairn Islands" },
  { code: "🇵🇷", name: "Puerto Rico" },
  { code: "🇵🇸", name: "Palestinian Territories" },
  { code: "🇵🇹", name: "Portugal" },
  { code: "🇵🇼", name: "Palau" },
  { code: "🇵🇾", name: "Paraguay" },
  { code: "🇶🇦", name: "Qatar" },
  { code: "🇷🇪", name: "Réunion" },
  { code: "🇷🇴", name: "Romania" },
  { code: "🇷🇸", name: "Serbia" },
  { code: "🇷🇺", name: "Russia" },
  { code: "🇷🇼", name: "Rwanda" },
  { code: "🇸🇦", name: "Saudi Arabia" },
  { code: "🇸🇧", name: "Solomon Islands" },
  { code: "🇸🇨", name: "Seychelles" },
  { code: "🇸🇩", name: "Sudan" },
  { code: "🇸🇪", name: "Sweden" },
  { code: "🇸🇬", name: "Singapore" },
  { code: "🇸🇭", name: "St. Helena" },
  { code: "🇸🇮", name: "Slovenia" },
  { code: "🇸🇯", name: "Svalbard & Jan Mayen" },
  { code: "🇸🇰", name: "Slovakia" },
  { code: "🇸🇱", name: "Sierra Leone" },
  { code: "🇸🇲", name: "San Marino" },
  { code: "🇸🇳", name: "Senegal" },
  { code: "🇸🇴", name: "Somalia" },
  { code: "🇸🇷", name: "Suriname" },
  { code: "🇸🇸", name: "South Sudan" },
  { code: "🇸🇹", name: "São Tomé & Príncipe" },
  { code: "🇸🇻", name: "El Salvador" },
  { code: "🇸🇽", name: "Sint Maarten" },
  { code: "🇸🇾", name: "Syria" },
  { code: "🇸🇿", name: "Eswatini" },
  { code: "🇹🇦", name: "Tristan da Cunha" },
  { code: "🇹🇨", name: "Turks & Caicos Islands" },
  { code: "🇹🇩", name: "Chad" },
  { code: "🇹🇫", name: "French Southern Territories" },
  { code: "🇹🇬", name: "Togo" },
  { code: "🇹🇭", name: "Thailand" },
  { code: "🇹🇯", name: "Tajikistan" },
  { code: "🇹🇰", name: "Tokelau" },
  { code: "🇹🇱", name: "Timor-Leste" },
  { code: "🇹🇲", name: "Turkmenistan" },
  { code: "🇹🇳", name: "Tunisia" },
  { code: "🇹🇴", name: "Tonga" },
  { code: "🇹🇷", name: "Turkey" },
  { code: "🇹🇹", name: "Trinidad & Tobago" },
  { code: "🇹🇻", name: "Tuvalu" },
  { code: "🇹🇼", name: "Taiwan" },
  { code: "🇹🇿", name: "Tanzania" },
  { code: "🇺🇦", name: "Ukraine" },
  { code: "🇺🇬", name: "Uganda" },
  { code: "🇺🇲", name: "U.S. Outlying Islands" },
  { code: "🇺🇳", name: "United Nations" },
  { code: "🇺🇸", name: "United States" },
  { code: "🇺🇾", name: "Uruguay" },
  { code: "🇺🇿", name: "Uzbekistan" },
  { code: "🇻🇦", name: "Vatican City" },
  { code: "🇻🇨", name: "St. Vincent & Grenadines" },
  { code: "🇻🇪", name: "Venezuela" },
  { code: "🇻🇬", name: "British Virgin Islands" },
  { code: "🇻🇮", name: "U.S. Virgin Islands" },
  { code: "🇻🇳", name: "Vietnam" },
  { code: "🇻🇺", name: "Vanuatu" },
  { code: "🇼🇫", name: "Wallis & Futuna" },
  { code: "🇼🇸", name: "Samoa" },
  { code: "🇾🇪", name: "Yemen" },
  { code: "🇾🇹", name: "Mayotte" },
  { code: "🇿🇦", name: "South Africa" },
  { code: "🇿🇲", name: "Zambia" },
  { code: "🇿🇼", name: "Zimbabwe" },
];

export default function LanguagesManagementPage() {
  const [languages, setLanguages] = useState<SupportedLanguage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<SupportedLanguage | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    nativeName: "",
    flag: "",
    isActive: true,
    isDefault: false,
    sortOrder: 0
  });
  const { toast } = useToast();

  // Fetch languages
  const fetchLanguages = async () => {
    try {
      const response = await fetch("/api/admin/languages");
      if (response.ok) {
        const data = await response.json();
        setLanguages(data.languages);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch languages",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch languages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLanguages();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingLanguage 
        ? `/api/admin/languages/${editingLanguage.id}`
        : "/api/admin/languages";
      
      const method = editingLanguage ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: editingLanguage 
            ? "Language updated successfully" 
            : "Language created successfully"
        });
        setIsDialogOpen(false);
        setEditingLanguage(null);
        setFormData({
          code: "",
          name: "",
          nativeName: "",
          flag: "",
          isActive: true,
          isDefault: false,
          sortOrder: 0
        });
        fetchLanguages();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to save language",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save language",
        variant: "destructive"
      });
    }
  };

  // Handle edit
  const handleEdit = (language: SupportedLanguage) => {
    setEditingLanguage(language);
    setFormData({
      code: language.code,
      name: language.name,
      nativeName: language.nativeName,
      flag: language.flag,
      isActive: language.isActive,
      isDefault: language.isDefault,
      sortOrder: language.sortOrder
    });
    setIsDialogOpen(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/languages/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Language deleted successfully"
        });
        fetchLanguages();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to delete language",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete language",
        variant: "destructive"
      });
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      nativeName: "",
      flag: "",
      isActive: true,
      isDefault: false,
      sortOrder: 0
    });
    setEditingLanguage(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading languages...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Languages Management</h1>
          <p className="text-muted-foreground">
            Manage supported languages for the application
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Language
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingLanguage ? "Edit Language" : "Add New Language"}
              </DialogTitle>
              <DialogDescription>
                {editingLanguage 
                  ? "Update the language settings below." 
                  : "Add a new language to the system."
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Language Code</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="en"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flag">Country Flag</Label>
                  <Select
                    value={formData.flag}
                    onValueChange={(value) => setFormData({ ...formData, flag: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a flag" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {countryFlags.map((flag) => (
                        <SelectItem key={flag.code} value={flag.code}>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{flag.code}</span>
                            <span>{flag.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">English Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="English"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nativeName">Native Name</Label>
                <Input
                  id="nativeName"
                  value={formData.nativeName}
                  onChange={(e) => setFormData({ ...formData, nativeName: e.target.value })}
                  placeholder="English"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isDefault"
                    checked={formData.isDefault}
                    onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
                  />
                  <Label htmlFor="isDefault">Default</Label>
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingLanguage ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Supported Languages
          </CardTitle>
          <CardDescription>
            Configure which languages are available to users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Flag</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Native Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sort Order</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {languages.map((language) => (
                <TableRow key={language.id}>
                  <TableCell className="text-2xl">{language.flag}</TableCell>
                  <TableCell className="font-mono">{language.code}</TableCell>
                  <TableCell>{language.name}</TableCell>
                  <TableCell>{language.nativeName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={language.isActive ? "default" : "secondary"}>
                        {language.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {language.isDefault && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          Default
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{language.sortOrder}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(language)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {!language.isDefault && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Language</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{language.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(language.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
