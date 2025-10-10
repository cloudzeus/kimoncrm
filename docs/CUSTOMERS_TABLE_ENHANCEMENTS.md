# Customer Table Enhancements

## ✅ Features Implemented

### 1. **Advanced Search**
- **Search by Field**: Dropdown to select specific field to search
  - All Fields (default)
  - Name
  - AFM
  - Email  
  - Phone
- **Dynamic Placeholder**: Changes based on selected field
- **Backend Support**: API updated to handle field-specific searches

### 2. **Flexible Pagination**
- **Multiple Page Sizes**: 50, 100, 300, 500 records per page
- **Page Size Selector**: Dropdown to change records per page
- **Info Display**: Shows "Showing X to Y of Z customers"
- **Auto-reset**: Returns to page 1 when changing page size

### 3. **Resizable Columns** 
- **Drag to Resize**: Hover over column border to see resize handle
- **Visual Indicator**: GripVertical icon appears on hover
- **Minimum Width**: 80px minimum to prevent columns from disappearing
- **Persistent**: Column widths saved to localStorage
- **All Columns Resizable**: Every column including Actions

### 4. **Column Visibility Control**
- **Settings Icon**: Click settings gear icon in toolbar
- **Toggle Columns**: Checkbox to show/hide each column
- **Eye Icons**: Visual indicator for visible (👁) vs hidden (👁‍🗨) columns
- **Persistent**: Visibility preferences saved to localStorage
- **Reset View**: Button to restore default widths and visibility

### 5. **Field Labels**
- **Descriptive Bar**: Shows field descriptions above the table
- **Only Visible Columns**: Labels shown only for visible columns
- **Helpful Descriptions**:
  - Code: Customer Code
  - AFM: VAT Number
  - Name: Company Name
  - City: Location
  - Phone: Contact Number
  - Email: Email Address
  - Status: Active/Inactive
  - ERP: Sync Status

### 6. **Actions Column**
- **Update from AFM** (🔄): Updates customer details from Greek Tax Authority
  - Only shown if customer has AFM
  - Updates: name, sotitle, address, zip, city, irsdata, jobtypetrd, isactive
  - Preserves other fields (phone, email, etc.)
  - Shows which fields were updated
- **Edit Button** (✏️): Edit customer details
- **Delete Button** (🗑️): Delete customer (with confirmation)
- **Always Visible**: Actions column cannot be hidden
- **Right-aligned**: Actions positioned on the right for easy access

## 🎨 UI/UX Improvements

### Search Bar
```
[Search Field Dropdown ▼] [Search Input Field] [🔍]
```

### Column Settings Popover
```
⚙️ → Opens popover with:
    ✅ Column Settings
    [Reset View]
    
    ☑️ 👁 CODE
    ☑️ 👁 AFM
    ☑️ 👁 NAME
    ...
```

### Field Labels Bar
```
┌─────────────────────────────────────────────────┐
│ Code: Customer Code  |  AFM: VAT Number  |  ... │
└─────────────────────────────────────────────────┘
```

### Table Header (Resizable)
```
CODE ⋮ | AFM ⋮ | NAME ⋮ | CITY ⋮ | ...
       ↑ Drag handle appears on hover
```

## 💾 Persistence

All user preferences are saved to **localStorage**:

1. **Column Widths**: `customers-column-widths`
   ```json
   {
     "code": 120,
     "afm": 130,
     "name": 250,
     ...
   }
   ```

2. **Column Visibility**: `customers-visible-columns`
   ```json
   {
     "code": true,
     "afm": true,
     "name": false,
     ...
   }
   ```

## 🔍 Search Examples

### Search All Fields
```
Field: "All Fields"
Query: "Athens"
→ Searches name, afm, code, email, phone01, city
```

### Search Specific Field
```
Field: "AFM"
Query: "801946016"
→ Searches only the AFM field
```

### Search by Email
```
Field: "Email"
Query: "info@"
→ Searches only email addresses
```

## 📊 API Updates

### GET /api/customers

**New Query Parameters:**
- `searchField` (string, optional): Field to search in
  - Values: `all`, `name`, `afm`, `email`, `phone01`
  - Default: `all`

**Example:**
```
GET /api/customers?search=801946016&searchField=afm&page=1&limit=100
```

**Response:**
```json
{
  "customers": [...],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 250,
    "totalPages": 3
  }
}
```

## 🎯 User Workflows

### Customize View
1. Click **⚙️ Settings** icon
2. Uncheck columns you don't need
3. Close popover
4. Resize remaining columns by dragging borders
5. Settings auto-save to localStorage

### Reset to Default
1. Click **⚙️ Settings** icon
2. Click **Reset View** button
3. All columns become visible with default widths

### Search Specific Data
1. Select field from dropdown (e.g., "AFM")
2. Enter search term
3. Press Enter or click 🔍
4. Results filtered by that field only

### Change Page Size
1. Click page size dropdown (bottom right)
2. Select: 50, 100, 300, or 500
3. Table refreshes with new page size
4. Returns to page 1

## 🔧 Technical Details

### Component Structure
```
CustomersManager
├── Search Bar (with field selector)
├── Column Settings Popover
├── Field Labels Bar
├── Info Bar (with page size selector)
├── Resizable Table
│   ├── ResizableTableHeader (for each column)
│   └── TableBody (conditional rendering)
└── Pagination Controls
```

### State Management
```typescript
// Search
const [searchField, setSearchField] = useState<string>("all");
const [searchTerm, setSearchTerm] = useState("");

// Pagination  
const [pageSize, setPageSize] = useState(50);
const [page, setPage] = useState(1);

// View Preferences
const [columnWidths, setColumnWidths] = useState({...});
const [visibleColumns, setVisibleColumns] = useState({...});
```

### localStorage Keys
- `customers-column-widths` - Column width settings
- `customers-visible-columns` - Column visibility settings

## 📝 Component Files

### Created
- `components/customers/resizable-table-header.tsx` - Resizable header component

### Modified
- `components/customers/customers-manager.tsx` - Main table component
- `app/api/customers/route.ts` - API endpoint with field search

## ✨ Features Summary

| Feature | Description | Persistent |
|---------|-------------|-----------|
| **Search by Field** | Search specific fields (name, AFM, email, phone) | No |
| **Page Size** | 50, 100, 300, 500 records per page | No |
| **Resizable Columns** | Drag column borders to resize | ✅ Yes |
| **Column Visibility** | Show/hide columns via settings | ✅ Yes |
| **Field Labels** | Descriptive labels above table | No |
| **Reset View** | Restore defaults with one click | N/A |
| **Update from AFM** | Refresh data from Greek Tax Authority | N/A |
| **Edit Action** | Edit customer inline | N/A |
| **Delete Action** | Delete with confirmation | N/A |

## 🚀 How to Use

### Search Customers
```
1. Select field: "All Fields" or specific field
2. Type search term
3. Press Enter or click search icon
4. Results appear instantly
```

### Customize Table View
```
1. Click ⚙️ icon
2. Toggle column checkboxes
3. Hover column borders
4. Drag to resize
5. View saves automatically
```

### Change Records Per Page
```
1. Find "Rows per page" dropdown
2. Select: 50 | 100 | 300 | 500
3. Table updates immediately
```

### Update Customer from AFM
```
1. Find customer with AFM in table
2. Click 🔄 Update icon (blue)
3. System fetches latest data from Greek Tax Authority
4. Updates: name, address, city, zip, tax office, etc.
5. Shows which fields were updated
6. Table refreshes automatically
```

### Edit/Delete Customer
```
1. Find customer in table
2. Click 🔄 Update → Updates from Greek Tax Authority (if has AFM)
3. Click ✏️ Edit → Opens edit dialog
4. Or click 🗑️ Delete → Confirms then deletes
```

---

**All features are production-ready and tested!** 🎉

