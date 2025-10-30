'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Package, Wrench, Save, X } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  quantity: number;
  price: number;
  margin: number;
}

interface Service {
  id: string;
  name: string;
  category?: string;
  quantity: number;
  price: number;
  margin: number;
}

interface EditPricingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rfpId: string;
  products: Product[];
  services: Service[];
  onSuccess: () => void;
}

export function EditPricingDialog({
  open,
  onOpenChange,
  rfpId,
  products: initialProducts,
  services: initialServices,
  onSuccess,
}: EditPricingDialogProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [services, setServices] = useState<Service[]>(initialServices);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setProducts(initialProducts);
    setServices(initialServices);
  }, [initialProducts, initialServices]);

  const handleProductChange = (index: number, field: keyof Product, value: string) => {
    const updated = [...products];
    if (field === 'quantity' || field === 'price' || field === 'margin') {
      updated[index][field] = parseFloat(value) || 0;
    } else {
      updated[index][field] = value as any;
    }
    setProducts(updated);
  };

  const handleServiceChange = (index: number, field: keyof Service, value: string) => {
    const updated = [...services];
    if (field === 'quantity' || field === 'price' || field === 'margin') {
      updated[index][field] = parseFloat(value) || 0;
    } else {
      updated[index][field] = value as any;
    }
    setServices(updated);
  };

  const calculateTotal = (quantity: number, price: number, margin: number) => {
    const subtotal = quantity * price;
    const total = subtotal + (subtotal * margin / 100);
    return total.toFixed(2);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/rfps/${rfpId}/update-pricing`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products, services }),
      });

      if (!response.ok) {
        throw new Error('Failed to update pricing');
      }

      toast.success('ΤΙΜΕΣ ΕΝΗΜΕΡΩΘΗΚΑΝ', {
        description: 'Οι τιμές και τα περιθώρια αποθηκεύτηκαν επιτυχώς.',
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating pricing:', error);
      toast.error('ΣΦΑΛΜΑ', {
        description: 'Αποτυχία ενημέρωσης τιμών. Παρακαλώ δοκιμάστε ξανά.',
      });
    } finally {
      setSaving(false);
    }
  };

  const productsTotal = products.reduce((sum, p) => {
    const subtotal = p.quantity * p.price;
    return sum + subtotal + (subtotal * p.margin / 100);
  }, 0);

  const servicesTotal = services.reduce((sum, s) => {
    const subtotal = s.quantity * s.price;
    return sum + subtotal + (subtotal * s.margin / 100);
  }, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">ΕΠΕΞΕΡΓΑΣΙΑ ΤΙΜΩΝ RFP</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Products Section */}
          {products.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">ΠΡΟΪΟΝΤΑ</h3>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-blue-900 text-white">
                      <tr>
                        <th className="px-4 py-3 text-left">#</th>
                        <th className="px-4 py-3 text-left">ΠΡΟΪΟΝ</th>
                        <th className="px-4 py-3 text-center">BRAND</th>
                        <th className="px-4 py-3 text-center">ΠΟΣ.</th>
                        <th className="px-4 py-3 text-right">ΤΙΜΗ (€)</th>
                        <th className="px-4 py-3 text-right">MARGIN (%)</th>
                        <th className="px-4 py-3 text-right">ΣΥΝΟΛΟ (€)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {products.map((product, index) => (
                        <tr key={product.id} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                          <td className="px-4 py-3 text-center">{index + 1}</td>
                          <td className="px-4 py-3">
                            <span className="font-medium">{product.name}</span>
                          </td>
                          <td className="px-4 py-3 text-center text-xs text-gray-600">
                            {product.brand || '-'}
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              value={product.quantity}
                              onChange={(e) => handleProductChange(index, 'quantity', e.target.value)}
                              className="w-20 text-center"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={product.price}
                              onChange={(e) => handleProductChange(index, 'price', e.target.value)}
                              className="w-28 text-right"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              min="0"
                              step="0.1"
                              value={product.margin}
                              onChange={(e) => handleProductChange(index, 'margin', e.target.value)}
                              className="w-24 text-right"
                            />
                          </td>
                          <td className="px-4 py-3 text-right font-bold">
                            {calculateTotal(product.quantity, product.price, product.margin)} €
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-yellow-100 font-bold">
                        <td colSpan={6} className="px-4 py-3 text-right">ΣΥΝΟΛΟ ΠΡΟΪΟΝΤΩΝ:</td>
                        <td className="px-4 py-3 text-right text-lg">{productsTotal.toFixed(2)} €</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Services Section */}
          {services.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold">ΥΠΗΡΕΣΙΕΣ</h3>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-blue-900 text-white">
                      <tr>
                        <th className="px-4 py-3 text-left">#</th>
                        <th className="px-4 py-3 text-left">ΥΠΗΡΕΣΙΑ</th>
                        <th className="px-4 py-3 text-center">ΚΑΤΗΓΟΡΙΑ</th>
                        <th className="px-4 py-3 text-center">ΠΟΣ.</th>
                        <th className="px-4 py-3 text-right">ΤΙΜΗ (€)</th>
                        <th className="px-4 py-3 text-right">MARGIN (%)</th>
                        <th className="px-4 py-3 text-right">ΣΥΝΟΛΟ (€)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {services.map((service, index) => (
                        <tr key={service.id} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                          <td className="px-4 py-3 text-center">{index + 1}</td>
                          <td className="px-4 py-3">
                            <span className="font-medium">{service.name}</span>
                          </td>
                          <td className="px-4 py-3 text-center text-xs text-gray-600">
                            {service.category || '-'}
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              value={service.quantity}
                              onChange={(e) => handleServiceChange(index, 'quantity', e.target.value)}
                              className="w-20 text-center"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={service.price}
                              onChange={(e) => handleServiceChange(index, 'price', e.target.value)}
                              className="w-28 text-right"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              min="0"
                              step="0.1"
                              value={service.margin}
                              onChange={(e) => handleServiceChange(index, 'margin', e.target.value)}
                              className="w-24 text-right"
                            />
                          </td>
                          <td className="px-4 py-3 text-right font-bold">
                            {calculateTotal(service.quantity, service.price, service.margin)} €
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-yellow-100 font-bold">
                        <td colSpan={6} className="px-4 py-3 text-right">ΣΥΝΟΛΟ ΥΠΗΡΕΣΙΩΝ:</td>
                        <td className="px-4 py-3 text-right text-lg">{servicesTotal.toFixed(2)} €</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Grand Total */}
          <div className="bg-gradient-to-r from-pink-900 to-purple-900 text-white rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold">ΓΕΝΙΚΟ ΣΥΝΟΛΟ:</span>
              <span className="text-3xl font-bold">{(productsTotal + servicesTotal).toFixed(2)} €</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            <X className="h-4 w-4 mr-2" />
            ΑΚΥΡΩΣΗ
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'ΑΠΟΘΗΚΕΥΣΗ...' : 'ΑΠΟΘΗΚΕΥΣΗ ΤΙΜΩΝ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

