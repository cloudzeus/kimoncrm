# ERP Code Generation Implementation

## Overview
ERP codes are generated in the format `CATEGORY.BRAND.XXXXX` by finding the highest existing code in the database and incrementing the 5-digit sequence by 1.

## Code Format
```
CATEGORY.BRAND.XXXXX
```
- **CATEGORY**: 3-digit padded code (e.g., "007")
- **BRAND**: Brand ERP code (3-digit padded, e.g., "001", "023")
- **XXXXX**: 5-digit sequential number (e.g., "00001", "00002", etc.)

## Examples
```
007.001.00001  → Category 7, Brand 1, Product 1
007.001.00002  → Category 7, Brand 1, Product 2
023.005.00001  → Category 23, Brand 5, Product 1
```

## Process

### Step 1: Pad Codes
- Category code: `"7"` → `"007"`
- Brand code: `"1"` → `"001"`

### Step 2: Find Highest Code
Query the database for all products with codes starting with `CATEGORY.BRAND.`:
```sql
SELECT code FROM Product 
WHERE code LIKE '007.001.%' 
ORDER BY code DESC 
LIMIT 1
```

### Step 3: Extract Counter
If a code is found, extract the last 5 digits:
- Found: `007.001.00015`
- Extract: `15`
- New counter: `16`

### Step 4: Generate New Code
If no code found, start at `00001`:
- Counter: `1` → `00001`
- Generated: `007.001.00001`

If code found, increment:
- Counter: `16` → `00016`
- Generated: `007.001.00016`

## Example

### Creating first product
```
Category: 7 → "007"
Brand: 1 → "001"
Database: No existing codes
Result: 007.001.00001
```

### Creating second product
```
Category: 7 → "007"
Brand: 1 → "001"
Database: 007.001.00001
Result: 007.001.00002
```

### Creating product after gap
```
Category: 7 → "007"
Brand: 1 → "001"
Database: Highest is 007.001.00015
Result: 007.001.00016
```

## Code Padding

### Category Code
```typescript
const categoryCodePadded = category.softoneCode.padStart(3, '0');
// "7" → "007"
// "23" → "023"
```

### Brand Code
```typescript
const brandCodePadded = brand.softoneCode.padStart(3, '0');
// "1" → "001"
// "23" → "023"
```

### Sequential Number
```typescript
const paddedNumber = counter.toString().padStart(5, '0');
// 1 → "00001"
// 16 → "00016"
```

## Implementation

```typescript
// Generate code using category and brand
const categoryCodePadded = category.softoneCode.padStart(3, '0'); // "007"
const brandCodePadded = brand.softoneCode.padStart(3, '0'); // "001"

const generatedCode = await generateNextAvailableCode(
  categoryCodePadded, // "007"
  brandCodePadded     // "001"
);

// Result: "007.001.00001"
```

## Notes
- Category code: **3 digits** (e.g., "007")
- Brand code: **3 digits** (e.g., "001")  
- Sequential number: **5 digits** (e.g., "00001")
- All codes are zero-padded
- Sequential numbering per category-brand combination
