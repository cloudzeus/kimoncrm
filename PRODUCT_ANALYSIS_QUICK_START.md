# Product Analysis - Quick Start Guide

## 🚀 Quick Start

### Generate a Document
1. Go to any product detail page
2. Click the **"GENERATE ANALYSIS"** button (blue button in header)
3. Wait a few seconds for the document to generate
4. Document will automatically download
5. Open in Microsoft Word to view

### Customize the Template
1. **Locate the template:**
   ```
   /public/templates/product-analysis-template.docx
   ```

2. **Open in Microsoft Word:**
   ```bash
   open public/templates/product-analysis-template.docx
   ```

3. **Edit as needed:**
   - Change fonts, colors, layout
   - Add your company logo
   - Adjust spacing and margins
   - Modify section order

4. **Important - Keep these placeholders intact:**
   - `{productName}`
   - `{description}`
   - `{#hasBrand}{brandName}{/hasBrand}`
   - `{#hasSpecifications}{#specifications}{name}: {value}{/specifications}{/hasSpecifications}`
   - Image placeholders: `{%mainImage}`, `{%this}`

5. **Save the file** - Changes take effect immediately!

## 📝 Greek Labels Reference

All labels are in uppercase Greek **without accents**:

```
ΑΝΑΛΥΣΗ ΠΡΟΪΟΝΤΟΣ     - Product Analysis
ΠΕΡΙΓΡΑΦΗ              - Description  
ΜΑΡΚΑ                  - Brand
ΚΑΤΗΓΟΡΙΑ              - Category
ΔΙΑΣΤΑΣΕΙΣ             - Dimensions
ΒΑΡΟΣ                  - Weight
ΧΑΡΑΚΤΗΡΙΣΤΙΚΑ         - Specifications
ΕΠΙΠΛΕΟΝ ΕΙΚΟΝΕΣ       - Additional Images
```

## 🎨 Template Customization Examples

### Add Company Logo
1. Open template in Word
2. Insert > Pictures > Select your logo
3. Position at top of page
4. Save template

### Change Color Scheme
1. Select section headers
2. Change color to your brand color
3. Apply same color to borders/lines
4. Save template

### Modify Layout
1. Drag sections to reorder
2. Add/remove sections as needed
3. Adjust spacing between sections
4. Save template

## 🔧 Troubleshooting

### Template not found
```bash
# Regenerate the base template
./node_modules/.bin/tsx scripts/generate-product-template.ts
```

### Images not showing
- Check that product has images uploaded
- Verify image URLs are accessible
- Wait longer for image download (up to 10 seconds per image)

### Greek characters not displaying
- Change template font to Arial, Calibri, or Times New Roman
- These fonts support Greek characters

### Document won't open
- Verify template syntax is correct
- Don't remove or rename placeholders
- Check template opens in Word before generating

## 📚 Detailed Documentation

For complete documentation, see:
- **Full Documentation:** `/PRODUCT_ANALYSIS_DOCUMENTATION.md`
- **Implementation Summary:** `/PRODUCT_ANALYSIS_IMPLEMENTATION_SUMMARY.md`
- **Template Guide:** `/public/templates/README.md`

## 🎯 What's Included in the Document

The generated document contains:

✅ Product name (in Greek if translation exists)
✅ Product description (in Greek)
✅ Main product image
✅ Brand name (if exists)
✅ Category (if exists)
✅ Dimensions (if exists)
✅ Weight (if exists)
✅ All specifications with Greek names/values
✅ Additional images (up to 3)
✅ Generation date

## ❌ What's NOT Included (As Requested)

- ❌ ERP Code
- ❌ Manufacturer Code
- ❌ EAN Code
- ❌ Language labels for descriptions

## 💡 Tips

1. **Best Products for Testing:**
   - Products with Greek translations
   - Products with multiple images
   - Products with specifications

2. **Performance:**
   - Documents with no images: < 1 second
   - Documents with images: 2-4 seconds

3. **Customization:**
   - Changes to template are instant (no restart needed)
   - Keep backup of template before major changes
   - Test template with sample product before deploying

## 🆘 Need Help?

1. Check troubleshooting section above
2. Review full documentation
3. Check console for error messages
4. Verify template placeholders are correct

## 🎉 You're All Set!

The system is ready to use. Start by:
1. Customizing the template to match your brand
2. Testing with a product that has good data
3. Sharing with your team

**Template Location:**
```
/Volumes/EXTERNALSSD/kimoncrm/public/templates/product-analysis-template.docx
```

