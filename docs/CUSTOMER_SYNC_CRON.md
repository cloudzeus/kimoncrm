# Customer Sync Cron Job Documentation

## Overview

The customer sync cron job automatically synchronizes customer data from the SoftOne ERP system to the local database. It runs every 10 minutes using `node-cron` to keep customer data up-to-date.

> **Note**: There is an equivalent system for suppliers. See [SUPPLIERS_SYSTEM.md](./SUPPLIERS_SYSTEM.md) for details.

## How It Works

### Cron Schedule
- **Frequency**: Every 10 minutes
- **Pattern**: `*/10 * * * *`
- **Implementation**: Uses `node-cron` package

### Delta Sync Strategy

The ERP endpoint has been updated to return only customers that have been updated or newly created within a specific time window (typically the last 10 minutes). This delta sync approach is more efficient than fetching all customers.

### Response Structure

The ERP endpoint returns a response in this format:

```json
{
  "success": true,
  "code": 200,
  "message": "OK",
  "at": "2025-10-11 08:58:45",
  "window_start": "2025-10-11 08:48:45",
  "total": 0,
  "result": []
}
```

### Processing Logic

1. **Fetch Delta Data**: The cron job calls the ERP endpoint which returns only updated/newly created customers
2. **Check for Changes**: 
   - If `total === 0` or `result` array is empty, skip processing (no updates)
   - If there are results, process all customers in the array
3. **Process Each Customer**:
   - Check if customer exists in local database (by TRDR or AFM)
   - If exists: UPDATE the customer record
   - If not exists: CREATE a new customer record
4. **Return Results**: Report how many customers were created and updated

## Files Involved

### 1. `/app/api/cron/sync-customers/route.ts`
The API endpoint that performs the actual sync logic.

**Key Features**:
- Fetches customers from SoftOne ERP
- Handles ANSI 1253 (win1253) encoding conversion to UTF-8
- Checks if there are any updates (early return if `total === 0`)
- Processes all customers in the result array
- Creates or updates customer records in the database
- Returns detailed sync statistics

### 2. `/lib/jobs/cron-scheduler.ts`
The cron scheduler that triggers the sync job every 10 minutes.

**Key Features**:
- Uses `node-cron` to schedule jobs
- Runs every 10 minutes
- Calls the `/api/cron/sync-customers` endpoint
- Logs sync results to console
- Includes singleton pattern to prevent duplicate initialization

### 3. `/lib/jobs/index.ts`
Auto-initializes cron jobs on server startup.

**Key Features**:
- Automatically initializes cron jobs when the server starts
- Only runs on server-side (checks for `window === undefined`)
- Uses dynamic import to avoid client-side execution

## Initialization

The cron jobs are automatically initialized when the Next.js server starts through the `/lib/jobs/index.ts` module.

### Manual Initialization

You can also manually trigger the initialization by calling:

```bash
GET /api/jobs/init
```

This is useful for:
- Development/testing
- Restarting jobs without restarting the server
- Troubleshooting

## Security

The cron endpoint supports optional authentication using a secret token:

1. Set `CRON_SECRET` in your `.env` file
2. The cron scheduler will automatically include the secret as a Bearer token
3. The endpoint will verify the secret before executing

**Example `.env` configuration**:
```
CRON_SECRET=your-secure-secret-here
```

## Environment Variables

Required environment variables:

```env
# SoftOne ERP Credentials
SOFTONE_USERNAME=Service
SOFTONE_PASSWORD=Service
SOFTONE_COMPANY=1000

# App URL (for cron job to call itself)
NEXT_PUBLIC_APP_URL=https://your-domain.com
# or
APP_URL=http://localhost:3000

# Optional: Cron job security
CRON_SECRET=your-secure-secret-here
```

## Response Format

### Successful Sync with Updates

```json
{
  "success": true,
  "total": 5,
  "processed": 5,
  "created": 2,
  "updated": 3,
  "skipped": 0,
  "window_start": "2025-10-11 08:48:45",
  "at": "2025-10-11 08:58:45",
  "timestamp": "2025-10-11T08:58:45.123Z"
}
```

### Successful Sync with No Updates

```json
{
  "success": true,
  "total": 0,
  "processed": 0,
  "created": 0,
  "updated": 0,
  "skipped": 0,
  "message": "No new or updated customers to sync",
  "window_start": "2025-10-11 08:48:45",
  "at": "2025-10-11 08:58:45",
  "timestamp": "2025-10-11T08:58:45.123Z"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message here",
  "timestamp": "2025-10-11T08:58:45.123Z"
}
```

## Monitoring

### Console Logs

The cron job logs its activity to the console:

**When sync starts**:
```
⏰ Running customer sync cron job...
```

**When no updates are found**:
```
✅ No new or updated customers to sync
✅ Customer sync completed: No new or updated customers
```

**When updates are processed**:
```
✅ Customer sync completed: 2 created, 3 updated (5 total in window)
```

**On error**:
```
❌ Customer sync failed: Error message
❌ Error executing customer sync cron job: Error details
```

## Customer Data Mapping

The sync maps ERP fields to local database fields:

| ERP Field | Database Field | Type | Notes |
|-----------|---------------|------|-------|
| TRDR | trdr | Integer | Unique customer ID in ERP |
| CODE | code | String | Customer code |
| AFM | afm | String | Tax ID (Greek VAT number) |
| NAME | name, sotitle | String | Customer name |
| JOBTYPETRD | jobtypetrd | String | Job type |
| ADDRESS | address | String | Street address |
| CITY | city | String | City |
| ZIP | zip | String | Postal code |
| DISTRICT | district | String | District/region |
| COUNTRY | country | String | Country |
| ISPROSP | isactive | Enum | "1" = ACTIVE, else INACTIVE |
| PHONE01 | phone01 | String | Primary phone |
| IRSDATA/IRSDATA_1 | irsdata | String | IRS data |
| SOCURRENCY | socurrency | Integer | Currency ID |
| UPDDATE | update | DateTime | Last update timestamp |

## Error Handling

The sync job includes comprehensive error handling:

1. **Network Errors**: Caught and logged, sync continues on next scheduled run
2. **Invalid Response**: Throws error if ERP returns invalid data
3. **Database Errors**: Each customer is processed individually, errors for specific customers are logged but don't stop the sync
4. **Encoding Issues**: Uses `iconv-lite` to handle ANSI 1253 encoding from ERP

## Testing

### Test the Endpoint Manually

```bash
# Without authentication
curl -X POST http://localhost:3000/api/cron/sync-customers

# With authentication (if CRON_SECRET is set)
curl -X POST http://localhost:3000/api/cron/sync-customers \
  -H "Authorization: Bearer your-secret-here"
```

### Initialize Cron Jobs

```bash
curl http://localhost:3000/api/jobs/init
```

## Troubleshooting

### Cron Job Not Running

1. Check if the server is running
2. Verify cron jobs are initialized: check console for "✅ Cron job scheduler initialized"
3. Check if `lib/jobs/index.ts` is being loaded
4. Try manual initialization: `GET /api/jobs/init`

### No Customers Being Synced

1. Verify ERP credentials in `.env` file
2. Check if ERP endpoint is returning data
3. Test the endpoint manually: `POST /api/cron/sync-customers`
4. Check console logs for errors
5. Verify the ERP delta endpoint is working correctly

### Encoding Issues

The sync uses `iconv-lite` with `win1253` encoding to handle Greek characters. If you see garbled text:

1. Verify the encoding in the ERP response
2. Check that `iconv-lite` is installed
3. Ensure the ArrayBuffer → Buffer → decode chain is working

### Authentication Errors

If you get 401 Unauthorized:

1. Check if `CRON_SECRET` is set in `.env`
2. Verify the secret matches in both the scheduler and endpoint
3. Ensure the Bearer token is being sent correctly

## Performance Considerations

- **Delta Sync**: Only processes changed/new customers, not entire database
- **Individual Processing**: Each customer is processed individually to prevent one error from stopping the entire sync
- **10-Minute Interval**: Balances freshness with system load
- **Early Return**: If no changes, returns immediately without database operations

## Future Enhancements

Potential improvements:

1. **Bulk Operations**: Use Prisma's `createMany`/`updateMany` for better performance
2. **Retry Logic**: Add exponential backoff for failed syncs
3. **Metrics**: Track sync performance and errors over time
4. **Notifications**: Alert on repeated failures
5. **Rate Limiting**: Protect against ERP API rate limits
6. **Parallel Processing**: Process customers in batches with Promise.all()

