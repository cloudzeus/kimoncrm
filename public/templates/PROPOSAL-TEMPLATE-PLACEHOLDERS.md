# Proposal Template Placeholders

This document explains the placeholders you need to add to `proposal-template.docx` for the Complete Proposal generation.

## How to Add Placeholders

1. Open `proposal-template.docx` in Microsoft Word
2. Add placeholders using curly braces: `{placeholderName}`
3. Save the file

## Available Placeholders

### Basic Information
- `{proposalNumber}` → ERP Proposal Number (e.g., ΠΡΦ0000403) or "TRF>PENDING"
- `{date}` → Current date in Greek format (e.g., "6 Νοεμβρίου 2025")
- `{customerName}` → Customer name
- `{projectName}` → Project title/name

### Technical Description (Optional)
- `{technicalDescription}` → AI-generated technical description from Step 4
  - If not generated, shows: "Η τεχνική περιγραφή θα προστεθεί σύντομα."

### Products Loop
Use `{#products}` to start a loop and `{/products}` to end it:

```
{#products}
Προϊόν: {name}
Μάρκα: {brand}
Κατηγορία: {category}
Ποσότητα: {quantity}
Τιμή Μονάδας: €{unitPrice}
Περιθώριο: {margin}%
Σύνολο: €{totalPrice}

Προδιαγραφές:
{specifications}

{/products}
```

### Services Loop
Use `{#services}` to start a loop and `{/services}` to end it:

```
{#services}
Υπηρεσία: {name}
Κατηγορία: {category}
Ποσότητα: {quantity}
Τιμή Μονάδας: €{unitPrice}
Σύνολο: €{totalPrice}
{/services}
```

### Totals
- `{totalProductsAmount}` → Total for all products (formatted with 2 decimals)
- `{totalServicesAmount}` → Total for all services (formatted with 2 decimals)
- `{subtotal}` → Products + Services total
- `{vatAmount}` → VAT amount (24%)
- `{grandTotal}` → Final total including VAT

## Example Template Structure

```
Advanced Integrated Communication Ltd.
Αριθμός Προσφοράς: {proposalNumber}
Ημερομηνία: {date}

ΟΙΚΟΝΟΜΟΤΕΧΝΙΚΗ ΠΡΟΤΑΣΗ
{projectName}
{customerName}

ΤΕΧΝΙΚΗ ΠΡΟΤΑΣΗ
{technicalDescription}

ΠΡΟΪΟΝΤΑ
{#products}
{name} - {brand}
Ποσότητα: {quantity} × €{unitPrice} = €{totalPrice}
{specifications}
{/products}

ΥΠΗΡΕΣΙΕΣ
{#services}
{name} - Ποσότητα: {quantity} × €{unitPrice} = €{totalPrice}
{/services}

ΟΙΚΟΝΟΜΙΚΗ ΠΡΟΤΑΣΗ
Σύνολο Προϊόντων: €{totalProductsAmount}
Σύνολο Υπηρεσιών: €{totalServicesAmount}
Υποσύνολο: €{subtotal}
ΦΠΑ (24%): €{vatAmount}
ΓΕΝΙΚΟ ΣΥΝΟΛΟ: €{grandTotal}
```

## Notes
- All text in the template remains as-is
- Only placeholders get replaced with actual data
- Product/service loops automatically repeat for each item
- Greek characters are fully supported
- Specifications are automatically filtered (N/A values removed)

