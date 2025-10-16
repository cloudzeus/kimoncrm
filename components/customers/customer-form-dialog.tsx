"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, CheckCircle } from "lucide-react";
import { Combobox } from "@/components/shared/combobox";

const customerSchema = z.object({
  code: z.string().optional(),
  afm: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  sotitle: z.string().optional(),
  jobtypetrd: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  zip: z.string().optional(),
  district: z.string().optional(),
  country: z.string().optional(),
  isactive: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  phone01: z.string().optional(),
  phone02: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  emailacc: z.string().email().optional().or(z.literal("")),
  irsdata: z.string().optional(),
  socurrency: z.string().optional(),
  webpage: z.string().url().optional().or(z.literal("")),
  syncToERP: z.boolean().default(false),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface Customer {
  id: string;
  trdr: number | null;
  code: string | null;
  afm: string | null;
  name: string;
  sotitle: string | null;
  jobtypetrd: string | null;
  address: string | null;
  city: string | null;
  zip: string | null;
  district: string | null;
  country: string | null;
  isactive: "ACTIVE" | "INACTIVE";
  erp: boolean;
  phone01: string | null;
  phone02: string | null;
  email: string | null;
  emailacc: string | null;
  irsdata: string | null;
  socurrency: number | null;
}

interface CustomerFormDialogProps {
  open: boolean;
  onClose: (refresh?: boolean) => void;
  customer?: Customer | null;
}

export function CustomerFormDialog({
  open,
  onClose,
  customer,
}: CustomerFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [validatingAFM, setValidatingAFM] = useState(false);
  const [countries, setCountries] = useState<Array<{ code: string; name: string }>>([]);
  const [districts, setDistricts] = useState<Array<{ name: string }>>([]);
  const [irsDataOptions, setIrsDataOptions] = useState<Array<{ name: string }>>([]);
  const [currencies, setCurrencies] = useState<Array<{ code: string; name: string; symbol: string | null }>>([]);

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      code: "",
      afm: "",
      name: "",
      sotitle: "",
      jobtypetrd: "",
      address: "",
      city: "",
      zip: "",
      district: "",
      country: "1000", // Default to Greece (Ελλάς)
      isactive: "ACTIVE",
      phone01: "",
      phone02: "",
      email: "",
      emailacc: "",
      irsdata: "",
      socurrency: "100", // Default to EUR
      syncToERP: false,
    },
  });

  // Load dropdown data
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [countriesRes, districtsRes, irsDataRes, currenciesRes] = await Promise.all([
          fetch("/api/countries/public"),
          fetch("/api/districts/public"),
          fetch("/api/irs-data/public"),
          fetch("/api/currencies/public"),
        ]);

        if (countriesRes.ok) {
          const countriesData = await countriesRes.json();
          setCountries(
            countriesData.countries?.map((c: any) => ({
              code: c.softoneCode,
              name: c.name,
            })) || []
          );
        }

        if (districtsRes.ok) {
          const districtsData = await districtsRes.json();
          setDistricts(
            districtsData.districts?.map((d: any) => ({
              name: d.name,
            })) || []
          );
        }

        if (irsDataRes.ok) {
          const irsData = await irsDataRes.json();
          setIrsDataOptions(
            irsData.irsData?.map((i: any) => ({
              name: i.name,
            })) || []
          );
        }

        if (currenciesRes.ok) {
          const currenciesData = await currenciesRes.json();
          setCurrencies(
            currenciesData.currencies?.map((c: any) => ({
              code: c.socurrency,
              name: c.name,
              symbol: c.symbol,
            })) || []
          );
        }
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
      }
    };

    if (open) {
      fetchDropdownData();
    }
  }, [open]);

  // Reset form when dialog opens/closes or customer changes
  useEffect(() => {
    if (open && customer) {
      form.reset({
        code: customer.code || "",
        afm: customer.afm || "",
        name: customer.name,
        sotitle: customer.sotitle || "",
        jobtypetrd: customer.jobtypetrd || "",
        address: customer.address || "",
        city: customer.city || "",
        zip: customer.zip || "",
        district: customer.district || "",
        country: customer.country || "",
        isactive: customer.isactive,
        phone01: customer.phone01 || "",
        phone02: customer.phone02 || "",
        email: customer.email || "",
      emailacc: customer.emailacc || "",
      irsdata: customer.irsdata || "",
      socurrency: customer.socurrency?.toString() || "",
      webpage: "",
      syncToERP: false,
    });
    } else if (open && !customer) {
      form.reset({
        code: "",
        afm: "",
        name: "",
        sotitle: "",
        jobtypetrd: "",
        address: "",
        city: "",
        zip: "",
        district: "",
        country: "1000", // Default to Greece (Ελλάς)
        isactive: "ACTIVE",
        phone01: "",
        phone02: "",
        email: "",
        emailacc: "",
        irsdata: "",
        socurrency: "100", // Default to EUR
        webpage: "",
        syncToERP: false,
      });
    }
  }, [open, customer, form]);

  const handleValidateAFM = async () => {
    const afm = form.getValues("afm");
    if (!afm) {
      toast.error("Please enter an AFM first");
      return;
    }

    try {
      setValidatingAFM(true);
      toast.loading("Validating AFM with Greek authorities...");

      const response = await fetch("/api/customers/validate-afm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ afm }),
      });

      const data = await response.json();
      toast.dismiss();

      if (response.ok && data.success) {
        toast.success("AFM validated successfully");
        
        // Auto-fill form with validated data
        if (data.data) {
          if (data.data.code) form.setValue("code", data.data.code);
          if (data.data.name) form.setValue("name", data.data.name);
          if (data.data.sotitle) form.setValue("sotitle", data.data.sotitle);
          if (data.data.address) form.setValue("address", data.data.address);
          if (data.data.zip) form.setValue("zip", data.data.zip);
          if (data.data.city) form.setValue("city", data.data.city);
          if (data.data.irsdata) form.setValue("irsdata", data.data.irsdata);
          if (data.data.jobtypetrd) form.setValue("jobtypetrd", data.data.jobtypetrd);
          if (data.data.isactive) form.setValue("isactive", data.data.isactive);
        }
      } else {
        toast.error(data.error || "Failed to validate AFM");
      }
    } catch (error) {
      console.error("Error validating AFM:", error);
      toast.dismiss();
      toast.error("Failed to validate AFM");
    } finally {
      setValidatingAFM(false);
    }
  };

  const onSubmit = async (data: CustomerFormData) => {
    try {
      setLoading(true);

      const url = customer
        ? `/api/customers/${customer.id}`
        : "/api/customers";
      const method = customer ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        if (result.warning) {
          toast.warning(result.warning);
        } else if (customer) {
          toast.success(
            result.erpSync
              ? "Customer updated in database and SoftOne ERP"
              : result.message || "Customer updated successfully"
          );
        } else {
          toast.success(
            result.erpSync
              ? "Customer created and synced to ERP"
              : "Customer created successfully"
          );
        }
        onClose(true);
      } else {
        toast.error(result.error || "Failed to save customer");
      }
    } catch (error) {
      console.error("Error saving customer:", error);
      toast.error("Failed to save customer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose(false)}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="uppercase">
            {customer ? "EDIT CUSTOMER" : "NEW CUSTOMER"}
          </DialogTitle>
          <DialogDescription>
            {customer
              ? "Update customer information"
              : "Create a new customer and optionally sync to SoftOne ERP"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* AFM with Validation Button */}
            <div className="flex gap-2">
              <FormField
                control={form.control}
                name="afm"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>AFM (VAT NUMBER)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter AFM" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleValidateAFM}
                  disabled={validatingAFM}
                >
                  {validatingAFM ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  <span className="ml-2">Validate</span>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CODE</FormLabel>
                    <FormControl>
                      <Input placeholder="Customer code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isactive"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>STATUS</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NAME *</FormLabel>
                  <FormControl>
                    <Input placeholder="Customer name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sotitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>COMMERCIAL TITLE</FormLabel>
                  <FormControl>
                    <Input placeholder="Commercial title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="jobtypetrd"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>JOB TYPE</FormLabel>
                  <FormControl>
                    <Input placeholder="Job type / Activity" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ADDRESS</FormLabel>
                  <FormControl>
                    <Input placeholder="Street address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CITY</FormLabel>
                    <FormControl>
                      <Input placeholder="City" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="zip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ZIP CODE</FormLabel>
                    <FormControl>
                      <Input placeholder="Postal code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>COUNTRY</FormLabel>
                    <FormControl>
                      <Combobox
                        options={countries.map((c) => ({
                          value: c.code,
                          label: c.name,
                        }))}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select country"
                        searchPlaceholder="Search countries..."
                        emptyText="No country found"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DISTRICT</FormLabel>
                    <FormControl>
                      <Combobox
                        options={districts.map((d) => ({
                          value: d.name,
                          label: d.name,
                        }))}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select district"
                        searchPlaceholder="Search districts..."
                        emptyText="No district found"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="irsdata"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>TAX OFFICE (IRS DATA)</FormLabel>
                  <FormControl>
                    <Combobox
                      options={irsDataOptions.map((i) => ({
                        value: i.name,
                        label: i.name,
                      }))}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select tax office"
                      searchPlaceholder="Search tax offices..."
                      emptyText="No tax office found"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone01"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PHONE 1</FormLabel>
                    <FormControl>
                      <Input placeholder="Primary phone" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone02"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PHONE 2</FormLabel>
                    <FormControl>
                      <Input placeholder="Secondary phone" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>EMAIL</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="contact@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emailacc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ACCOUNTING EMAIL</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="accounting@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="socurrency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CURRENCY</FormLabel>
                  <FormControl>
                    <Combobox
                      options={currencies.map((c) => ({
                        value: c.code,
                        label: `${c.name} ${c.symbol ? `(${c.symbol})` : ''}`,
                      }))}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select currency"
                      searchPlaceholder="Search currencies..."
                      emptyText="No currency found"
                    />
                  </FormControl>
                  <FormDescription>
                    Currency for transactions (typically EUR)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="webpage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WEBPAGE</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Company website URL
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!customer && (
              <FormField
                control={form.control}
                name="syncToERP"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-4 shadow-sm">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Sync to SoftOne ERP</FormLabel>
                      <FormDescription>
                        Create this customer in SoftOne ERP system immediately
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            )}

            {customer && customer.erp && (
              <div className="rounded-lg border p-4 bg-blue-50">
                <p className="text-sm text-blue-800 font-medium">
                  ℹ️ This customer is synced to SoftOne ERP
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Changes will be automatically synced to SoftOne ERP (TRDR: {customer.trdr})
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onClose(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : customer ? (
                  "Update Customer"
                ) : (
                  "Create Customer"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

