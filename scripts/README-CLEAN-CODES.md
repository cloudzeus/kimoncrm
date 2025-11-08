# Clean MTRL and Service Codes Scripts

These scripts clean up MTRL codes in the Product table and codes in the Service table by removing trailing slashes and trimming whitespace.

## Problem

Some MTRL codes and service codes in the database have trailing slashes (e.g., `27042546/` instead of `27042546`). This causes issues when sending data to the ERP system.

## Solution

Run these scripts to clean all codes in the database at once.

## Usage

### Clean Product MTRL Codes

```bash
npx tsx scripts/clean-mtrl-codes.ts
```

This will:
- Find all products with MTRL codes
- Remove trailing slashes and trim whitespace
- Update the database
- Show a summary of changes

### Clean Service Codes

```bash
npx tsx scripts/clean-service-codes.ts
```

This will:
- Find all services with codes
- Remove trailing slashes and trim whitespace
- Update the database
- Show a summary of changes

### Clean Both

```bash
npx tsx scripts/clean-mtrl-codes.ts && npx tsx scripts/clean-service-codes.ts
```

## Example Output

```
🔍 Fetching products with MTRL codes...
📦 Found 150 products with MTRL codes
✅ Updated product 007.001.00001: "27042546/" → "27042546"
✅ Updated product 007.001.00002: "14265/" → "14265"

📊 Summary:
   Total products with MTRL: 150
   Products updated: 25
   Products unchanged: 125

✅ MTRL codes cleaned successfully!
```

## Safety

- The scripts use Prisma transactions
- Only updates codes that actually need cleaning
- Shows a detailed summary of all changes
- Can be run multiple times safely (idempotent)

## After Running

Once you've cleaned the database:
1. Restart your Next.js dev server
2. Test ERP integration to verify the codes work correctly
3. Consider adding validation to prevent dirty codes from being saved in the future

