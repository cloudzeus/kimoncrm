# Customer Management System - Quick Start Guide

## 🚀 Ready to Use!

Your customer management system is fully implemented and ready to use. Here's how to get started:

## Step 1: Start Your Development Server

```bash
npm run dev
```

## Step 2: Access the Customers Page

Navigate to: **http://localhost:3000/customers**

## Step 3: Initial Sync from SoftOne

Click the **"Sync SoftOne"** button in the UI, or run:

```bash
curl -X POST http://localhost:3000/api/customers/sync-softone
```

This will import all customers from your SoftOne ERP system.

## Step 4: Initialize Cron Jobs (Optional)

The cron jobs auto-initialize on server start. To manually initialize:

```bash
curl http://localhost:3000/api/jobs/init
```

## Quick Test

### Test AFM Validation (Greek Tax Authority)

```bash
curl -X POST http://localhost:3000/api/customers/validate-afm \
  -H "Content-Type: application/json" \
  -d '{"afm":"801946016"}'
```

Expected response: Customer data from Greek authorities

### Test Creating a Customer

1. Go to http://localhost:3000/customers
2. Click **"New Customer"**
3. Notice **Country is pre-set to Greece (Ελλάς)** and Currency to EUR
4. Enter an AFM (e.g., `801946016`)
5. Click **"Validate"** - watch the form auto-fill!
6. Check **"Sync to SoftOne ERP"** if you want it in ERP
7. Click **"Create Customer"**

## What's Working

✅ **Full CRUD**: Create, read, update, delete customers  
✅ **AFM Validation**: Validate Greek VAT numbers with authorities  
✅ **ERP Sync**: Two-way sync with SoftOne ERP  
✅ **Auto Sync**: Cron job runs every 10 minutes  
✅ **Search**: Find customers quickly  
✅ **Smart UI**: Dropdowns with search for Country, District, Tax Office  

## Key Features

### 1. AFM Validation
- Enter a Greek AFM (VAT number)
- Click "Validate"
- System fetches data from Greek Tax Authority
- Auto-fills name, address, tax office, etc.

### 2. ERP Integration
- **Import**: Click "Sync SoftOne" to import from ERP
- **Export**: Check "Sync to ERP" when creating new customers
- **Auto-sync**: System syncs every 10 minutes automatically
- **Status**: Green badge shows if customer is in ERP

### 3. Search & Filter
- Search by name, AFM, code, email, or city
- Press Enter or click search icon
- Results update instantly

### 4. Edit & Delete
- Click the edit icon to update customer info
- Click the delete icon to remove (with confirmation)

## Environment Variables

All required variables are already in your `.env`:

```env
SOFTONE_USERNAME=Service
SOFTONE_PASSWORD=Service
SOFTONE_COMPANY=1000
APP_URL=http://localhost:3000
CRON_SECRET=your-secret-key-here-change-in-production
```

⚠️ **Important**: Change `CRON_SECRET` before deploying to production!

## API Endpoints

All endpoints are ready:

- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `PATCH /api/customers/[id]` - Update customer
- `DELETE /api/customers/[id]` - Delete customer
- `POST /api/customers/validate-afm` - Validate AFM
- `POST /api/customers/sync-softone` - Sync from ERP
- `POST /api/cron/sync-customers` - Cron endpoint

## Cron Job Schedule

The system automatically syncs customers every 10 minutes using delta sync (only processes changes).

**Cron Expression**: `*/10 * * * *` (every 10 minutes)

**What it does**:
1. Checks last sync timestamp
2. Fetches only updated customers from SoftOne
3. Updates local database
4. Logs results to console

## Character Encoding

The system properly handles Greek characters:
- Incoming data from SoftOne: ANSI 1253 → UTF-8 conversion
- Database: UTF-8 storage
- UI: Proper Greek character display

## Troubleshooting

### Cron not running?
```bash
# Check logs in terminal - you should see:
# "⏰ Running customer sync cron job..."
# "✅ Customer sync completed: X created, Y updated, Z skipped"
```

### ERP sync failing?
- Check `.env` has correct SoftOne credentials
- Verify network access to aic.oncloud.gr
- Check console logs for detailed error messages

### AFM validation not working?
- Verify network access to vat.wwa.gr
- Check that AFM is valid (9 digits)
- Try a known AFM like "801946016"

## Next Steps

1. ✅ Navigate to `/customers` and explore the UI
2. ✅ Try creating a customer with AFM validation
3. ✅ Run a full sync from SoftOne
4. ✅ Watch the cron job logs (every 10 minutes)
5. ✅ Check the comprehensive docs: `docs/CUSTOMERS_SYSTEM.md`

## Need Help?

- 📖 **Full Documentation**: `docs/CUSTOMERS_SYSTEM.md`
- 📝 **Implementation Details**: `docs/CUSTOMERS_IMPLEMENTATION_SUMMARY.md`
- 🐛 **Issues**: Check console logs and terminal output

---

**Everything is set up and ready to use!** 🎉

Just start your dev server and navigate to `/customers`.

