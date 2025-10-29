import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guards';

/**
 * GET /api/emails/mailboxes - Get all accessible mailboxes
 * Returns user's mailbox and any shared mailboxes they have access to
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    
    // Get access token from query params or fetch it
    const { searchParams } = new URL(request.url);
    const providedToken = searchParams.get('accessToken');
    const provider = searchParams.get('provider') || 'microsoft';

    let accessToken = providedToken;
    
    // If no token provided, fetch from session
    if (!accessToken) {
      const tokenResponse = await fetch(
        `${request.nextUrl.origin}/api/emails/token`,
        {
          headers: {
            cookie: request.headers.get('cookie') || '',
          },
        }
      );
      const tokenData = await tokenResponse.json();
      
      if (!tokenData.success) {
        return NextResponse.json({
          success: false,
          error: tokenData.error || 'No access token available',
        }, { status: 401 });
      }
      
      accessToken = tokenData.accessToken;
    }

    if (!accessToken) {
      return NextResponse.json({ 
        error: 'No access token available' 
      }, { status: 401 });
    }

    if (provider === 'microsoft') {
      return await getMicrosoftMailboxes(accessToken, session.user.email!);
    } else if (provider === 'google') {
      // Google doesn't have shared mailboxes in the same way
      return NextResponse.json({
        success: true,
        mailboxes: [
          {
            id: session.user.email,
            email: session.user.email,
            displayName: session.user.name || session.user.email,
            type: 'primary',
          },
        ],
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Unsupported provider',
    }, { status: 400 });
  } catch (error: any) {
    console.error('Error fetching mailboxes:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch mailboxes',
    }, { status: 500 });
  }
}

async function getMicrosoftMailboxes(accessToken: string, userEmail: string) {
  try {
    const mailboxes: Array<{
      id: string;
      email: string;
      displayName: string;
      type: 'primary' | 'shared';
    }> = [];

    // Get user's primary mailbox info
    const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (userResponse.ok) {
      const userData = await userResponse.json();
      mailboxes.push({
        id: userData.id,
        email: userData.mail || userData.userPrincipalName,
        displayName: userData.displayName || userData.mail || userData.userPrincipalName,
        type: 'primary',
      });
    }

    // Try to get shared mailboxes
    // Note: This requires Mail.Read.Shared or Mail.ReadWrite.Shared permission
    try {
      const sharedResponse = await fetch(
        'https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$top=1&$select=id',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      // Try to get list of users (for checking shared mailboxes)
      // This requires additional permissions
      const usersResponse = await fetch(
        'https://graph.microsoft.com/v1.0/users?$top=999&$select=id,mail,displayName,userPrincipalName&$filter=mail ne null',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        console.log(`Found ${usersData.value?.length || 0} users in tenant`);
        
        // Check which mailboxes the user can access
        // This is a simplified approach - in production you'd want to check permissions properly
        for (const user of (usersData.value || []).slice(0, 10)) { // Limit to first 10
          if (user.mail === userEmail) continue; // Skip user's own mailbox
          
          try {
            const checkAccess = await fetch(
              `https://graph.microsoft.com/v1.0/users/${user.id}/mailFolders/inbox?$select=id`,
              {
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                },
              }
            );
            
            if (checkAccess.ok) {
              mailboxes.push({
                id: user.id,
                email: user.mail || user.userPrincipalName,
                displayName: user.displayName || user.mail || user.userPrincipalName,
                type: 'shared',
              });
            }
          } catch (err) {
            // User doesn't have access to this mailbox
            console.log(`No access to mailbox: ${user.mail}`);
          }
        }
      }
    } catch (sharedError) {
      console.log('Cannot access shared mailboxes (may need additional permissions):', sharedError);
    }

    return NextResponse.json({
      success: true,
      mailboxes,
      count: mailboxes.length,
    });
  } catch (error: any) {
    console.error('Error fetching Microsoft mailboxes:', error);
    throw error;
  }
}

