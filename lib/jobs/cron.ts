import { 
  slaCheckQueue, 
  softoneDeltaQueue, 
  backupsQueue, 
  emailRemindersQueue, 
  calendarRemindersQueue 
} from '@/lib/redis/client';

export async function setupCronJobs() {
  // SLA Check - Every 5 minutes
  await slaCheckQueue.add(
    'sla-check',
    {},
    {
      repeat: {
        pattern: '*/5 * * * *', // Every 5 minutes
      },
      removeOnComplete: 10,
      removeOnFail: 5,
    }
  );

  // SoftOne Delta Sync - Every 10 minutes (if enabled)
  if (process.env.SOFTONE_BASE_URL) {
    await softoneDeltaQueue.add(
      'softone-delta',
      {},
      {
        repeat: {
          pattern: '*/10 * * * *', // Every 10 minutes
        },
        removeOnComplete: 10,
        removeOnFail: 5,
      }
    );
  }

  // Email Reminders - Every hour
  await emailRemindersQueue.add(
    'email-reminders',
    {},
    {
      repeat: {
        pattern: '0 * * * *', // Every hour
      },
      removeOnComplete: 10,
      removeOnFail: 5,
    }
  );

  // Calendar Reminders - Every 30 minutes
  await calendarRemindersQueue.add(
    'calendar-reminders',
    {},
    {
      repeat: {
        pattern: '*/30 * * * *', // Every 30 minutes
      },
      removeOnComplete: 10,
      removeOnFail: 5,
    }
  );

  // Database Backup - Daily at 2 AM
  await backupsQueue.add(
    'backup',
    {},
    {
      repeat: {
        pattern: '0 2 * * *', // Daily at 2 AM
      },
      removeOnComplete: 5,
      removeOnFail: 3,
    }
  );

  console.log('✅ Cron jobs configured successfully');
}
