# Product Analysis Template

## Overview
This directory contains the Word template used for generating Product Analysis documents.

## Template File
**File Name:** `product-analysis-template.docx`

## How to Create the Template

### Step 1: Create a New Word Document
Open Microsoft Word and create a new document.

### Step 2: Add Template Placeholders
Use the following placeholders in your Word document. These will be replaced with actual product data:

#### Basic Information Placeholders:
- `{productName}` - Product name in Greek
- `{description}` - Product description in Greek
- `{generatedDate}` - Date the document was generated

#### Optional Information (with conditional logic):
- `{#hasBrand}{brandName}{/hasBrand}` - Brand name (shown only if available)
- `{#hasCategory}{categoryName}{/hasCategory}` - Category name (shown only if available)
- `{#hasDimensions}{dimensions}{/hasDimensions}` - Dimensions (shown only if available)
- `{#hasWeight}{weight}{/hasWeight}` - Weight (shown only if available)
- `{#hasUnit}{unit}{/hasUnit}` - Unit of measurement (shown only if available)

#### Images:
- `{%mainImage}` - Main product image
- `{#hasAdditionalImages}{#additionalImages}{%this}{/additionalImages}{/hasAdditionalImages}` - Additional images loop

#### Specifications Table:
```
{#hasSpecifications}
Χαρακτηριστικά:

{#specifications}
{name}: {value}
{/specifications}
{/hasSpecifications}
```

### Step 3: Suggested Document Structure

```
═══════════════════════════════════════════════════
              ΑΝΑΛΥΣΗ ΠΡΟΪΟΝΤΟΣ
═══════════════════════════════════════════════════

{productName}

{%mainImage}

ΠΕΡΙΓΡΑΦΗ
────────────────────────────────────────────────────
{description}

{#hasBrand}
ΜΑΡΚΑ
────────────────────────────────────────────────────
{brandName}
{/hasBrand}

{#hasCategory}
ΚΑΤΗΓΟΡΙΑ
────────────────────────────────────────────────────
{categoryName}
{/hasCategory}

{#hasDimensions}
ΔΙΑΣΤΑΣΕΙΣ
────────────────────────────────────────────────────
{dimensions}
{/hasDimensions}

{#hasWeight}
ΒΑΡΟΣ
────────────────────────────────────────────────────
{weight}
{/hasWeight}

{#hasSpecifications}
ΧΑΡΑΚΤΗΡΙΣΤΙΚΑ
────────────────────────────────────────────────────

{#specifications}
• {name}: {value}
{/specifications}

{/hasSpecifications}

{#hasAdditionalImages}
ΕΠΙΠΛΕΟΝ ΕΙΚΟΝΕΣ
────────────────────────────────────────────────────

{#additionalImages}
{%this}
{/additionalImages}

{/hasAdditionalImages}

═══════════════════════════════════════════════════
Ημερομηνία Δημιουργίας: {generatedDate}
═══════════════════════════════════════════════════
```

### Step 4: Styling Tips
1. **Title Section**: Use Heading 1 style, center-aligned, large font (24-28pt), bold
2. **Product Name**: Use Heading 1 style, center-aligned, bold, color accent
3. **Section Headers**: Use Heading 2 style, left-aligned, bold, underline
4. **Body Text**: Use Normal style, justified alignment, 11-12pt
5. **Specifications**: Use a table or bulleted list for better readability
6. **Footer**: Use small text (9-10pt), center-aligned, light gray color

### Step 5: Greek Labels Reference
All labels should be in uppercase Greek without accents:
- ΠΕΡΙΓΡΑΦΗ (Description)
- ΜΑΡΚΑ (Brand)
- ΚΑΤΗΓΟΡΙΑ (Category)
- ΔΙΑΣΤΑΣΕΙΣ (Dimensions)
- ΒΑΡΟΣ (Weight)
- ΧΑΡΑΚΤΗΡΙΣΤΙΚΑ (Specifications)
- ΕΠΙΠΛΕΟΝ ΕΙΚΟΝΕΣ (Additional Images)
- ΗΜΕΡΟΜΗΝΙΑ ΔΗΜΙΟΥΡΓΙΑΣ (Creation Date)

### Step 6: Save the Template
Save the file as `product-analysis-template.docx` in this directory.

## Usage
Once the template is created, the system will automatically use it to generate product analysis documents. The API endpoint is:

```
POST /api/products/{productId}/generate-analysis
```

## Testing the Template
You can test the template by calling the API endpoint with a product ID. The system will:
1. Fetch the product data from the database
2. Download product images
3. Get Greek translations
4. Fill in the template
5. Return a downloadable Word document

## Troubleshooting
- If images don't appear, check that the image placeholders use `{%imageName}` syntax
- If conditional sections don't work, ensure you're using `{#condition}...{/condition}` syntax
- If loops don't work, verify the `{#items}...{/items}` syntax
- Make sure all placeholders match the exact names in the template data

