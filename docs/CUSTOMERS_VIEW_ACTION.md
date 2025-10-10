# Customer View Action & Detail Page

## ✅ Feature Implemented

A **View** action button has been added to each customer row that redirects to a dedicated customer detail page showing all customer information in an organized, easy-to-read format.

## 🔍 What Was Added

### 1. **View Action Button**
- **Icon:** ExternalLink (↗)
- **Color:** Primary (theme color)
- **Position:** First button in actions column
- **Function:** Navigates to customer detail page
- **Tooltip:** "View customer details"

### 2. **Customer Detail Page**
- **Route:** `/customers/[id]`
- **Layout:** Clean card-based layout with sections
- **Features:**
  - Back button to return to customers list
  - Status badges (Active/Inactive, ERP Synced)
  - Edit button
  - Update from AFM button
  - All customer information organized by category

## 📊 Page Layout

### Header Section
```
[← Back Button]  CUSTOMER NAME
                 Commercial Title

                 [Update from AFM] [Edit Customer]
```

### Status Badges
- **Active/Inactive** - Green/Gray badge
- **Synced to ERP** - Green badge if synced
- **TRDR** - Shows TRDR number if available

### Information Cards

#### 1. Company Information
- Customer Code
- AFM (VAT Number)
- Business Activity
- Tax Office

#### 2. Contact Information
- Primary Phone (clickable tel: link)
- Secondary Phone (clickable tel: link)
- Email (clickable mailto: link)
- Accounting Email (clickable mailto: link)

#### 3. Address
- Street Address
- City
- Postal Code
- District
- Country

#### 4. Additional Information
- Currency Code
- Last Updated (formatted date/time)
- Created At (formatted date/time)

## 🎯 Action Buttons Order

```
[↗️ View] [🔄 Update] [✏️ Edit] [🗑️ Delete]
  Primary    Blue      Gray     Red
```

### All Actions
1. **View** (↗) - Navigate to detail page
2. **Update from AFM** (🔄) - Update from Greek Tax Authority (if has AFM)
3. **Edit** (✏️) - Open edit dialog
4. **Delete** (🗑️) - Delete customer with confirmation

## 🚀 User Workflow

### From Table to Detail Page
```
1. User browses customers table
2. Clicks View (↗️) button
3. Redirected to /customers/[id]
4. Sees full customer information
5. Can edit or update from AFM
6. Clicks back button to return to table
```

### Actions on Detail Page
```
1. Update from AFM
   └─> Updates customer data from Greek authorities
   └─> Shows which fields updated
   └─> Refreshes detail view

2. Edit Customer
   └─> Opens edit dialog
   └─> Same form as table edit
   └─> Saves and refreshes detail view

3. Back Button
   └─> Returns to /customers table
   └─> Preserves table state
```

## 📱 Responsive Design

### Desktop (md+)
- 2-column card layout
- Full-width cards
- Side-by-side information

### Mobile
- Single column stack
- Full-width cards
- Vertical layout

## 🎨 UI Components Used

```typescript
- Card / CardHeader / CardTitle / CardContent
- Badge (status indicators)
- Button (actions)
- Icons from lucide-react
- Separator (visual dividers)
- Loading spinner
```

## 🔗 Navigation

### To Detail Page
```typescript
// From table row
<Button onClick={() => handleView(customer.id)}>
  <ExternalLink className="h-4 w-4 text-primary" />
</Button>

// Navigates to
router.push(`/customers/${customer.id}`)
// Example: /customers/cm3x1y2z3
```

### From Detail Page
```typescript
// Back button
<Button onClick={() => router.push("/customers")}>
  <ArrowLeft className="h-4 w-4" />
</Button>
```

## 📁 Files Created/Modified

### Created
- `app/(main)/customers/[id]/page.tsx` - Detail page route
- `components/customers/customer-detail-view.tsx` - Detail view component
- `docs/CUSTOMERS_VIEW_ACTION.md` - This documentation

### Modified
- `components/customers/customers-manager.tsx`
  - Added View button
  - Added `handleView` function
  - Imported `useRouter` and `ExternalLink`
  - Increased actions column width to 180px

## 🎯 Features

### On Detail Page

✅ **View All Customer Data**
- All fields visible in organized sections
- No scrolling required
- Clear labels and formatting

✅ **Quick Actions**
- Edit directly from detail page
- Update from AFM without leaving page
- Navigate back easily

✅ **Clickable Links**
- Phone numbers open dialer
- Email addresses open email client
- Improved user experience

✅ **Status at a Glance**
- Visual badges for status
- ERP sync status
- TRDR number if available

✅ **Loading States**
- Skeleton on initial load
- Spinner animation
- Loading message

✅ **Error Handling**
- Customer not found → redirects to table
- API errors → shows toast notification
- Graceful fallbacks

## 💡 Use Cases

### 1. Quick Customer Lookup
```
Need to see all details for a customer?
1. Find in table
2. Click View
3. See everything at once
```

### 2. Verify Information Before Calling
```
1. Open customer detail
2. Review all contact information
3. Click phone number to call
4. All info visible while on call
```

### 3. Update and Verify
```
1. View customer details
2. Click "Update from AFM"
3. See what changed
4. Verify information is correct
5. Edit if needed
```

### 4. Print/Export Customer Info
```
1. Open detail page
2. Use browser print (Ctrl+P / Cmd+P)
3. Clean layout prints well
4. All information included
```

## 🔐 Security

- **API Endpoint:** Uses existing `/api/customers/[id]` GET endpoint
- **Authentication:** Inherits from main layout (auth required)
- **Authorization:** Only authenticated users can view
- **Data Validation:** Server-side validation on all updates

## 📊 API Integration

### GET Customer Detail
```typescript
GET /api/customers/[id]

Response:
{
  "customer": {
    "id": "...",
    "name": "...",
    "afm": "...",
    "countryRel": {
      "name": "Greece",
      "softoneCode": "1000"
    },
    ...
  }
}
```

### Update from AFM
```typescript
PATCH /api/customers/[id]/update-from-afm

Response:
{
  "success": true,
  "customer": {...},
  "updatedFields": ["name", "address", "city"],
  "message": "Customer updated successfully"
}
```

## ✨ User Experience Improvements

### Before
- Could only see limited info in table row
- Had to edit to see all fields
- Multiple clicks to update

### After
- ✅ Complete customer view in one page
- ✅ Organized by category
- ✅ Quick actions at top
- ✅ One-click navigation
- ✅ Clean, professional layout

## 📝 Code Example

### Using the View Button
```typescript
// In customers-manager.tsx
const handleView = (customerId: string) => {
  router.push(`/customers/${customerId}`);
};

// In table row
<Button
  variant="ghost"
  size="icon"
  onClick={() => handleView(customer.id)}
  title="View customer details"
>
  <ExternalLink className="h-4 w-4 text-primary" />
</Button>
```

### Detail Page Component
```typescript
// In customer-detail-view.tsx
export function CustomerDetailView({ customerId }: Props) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  
  useEffect(() => {
    fetchCustomer();
  }, [customerId]);
  
  // Organized card-based layout
  return (
    <div className="space-y-6">
      <Header />
      <StatusBadges />
      <InfoCards />
    </div>
  );
}
```

## 🎉 Summary

The View action provides a comprehensive, dedicated page for viewing all customer information in a clean, organized manner. Users can:

1. ✅ Click View from any customer row
2. ✅ See all information at a glance
3. ✅ Edit or update directly from detail page
4. ✅ Navigate back easily
5. ✅ Enjoy a professional, card-based layout
6. ✅ Access clickable phone/email links

**The customer detail page is production-ready and fully functional!** 🚀

