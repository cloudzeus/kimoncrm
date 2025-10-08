import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/guards';
import { createMicrosoftGraphClient } from '@/lib/microsoft/graph';
import { validateMicrosoftAccessToken, MicrosoftGraphError } from '@/lib/microsoft/validation';

/**
 * POST /api/microsoft/users - Fetch all users from the tenant (admin only)
 * Body: { accessToken: string }
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    let { accessToken } = body || {};

    // If no user token provided, obtain an app token using client credentials
    if (!accessToken) {
      const tenantId = process.env.TENANT_ID;
      const clientId = process.env.AUTH_MICROSOFT_ENTRA_ID_ID;
      const clientSecret = process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET;

      if (!tenantId || !clientId || !clientSecret) {
        return NextResponse.json({ error: 'Microsoft client credentials missing in environment' }, { status: 500 });
      }

      const form = new URLSearchParams();
      form.set('client_id', clientId);
      form.set('client_secret', clientSecret);
      form.set('grant_type', 'client_credentials');
      form.set('scope', 'https://graph.microsoft.com/.default');

      const tokenRes = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
      });

    if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        return NextResponse.json({ error: `Failed to obtain app token: ${errText}` }, { status: tokenRes.status });
      }

      const tokenJson = await tokenRes.json();
      accessToken = tokenJson.access_token;
    } else {
      const tokenValidation = validateMicrosoftAccessToken(accessToken);
      if (!tokenValidation.isValid) {
        return NextResponse.json({ error: tokenValidation.error || 'Invalid token' }, { status: 400 });
      }
    }

    // Call Microsoft Graph directly to avoid SDK differences
    const graphRes = await fetch('https://graph.microsoft.com/v1.0/users?$select=id,displayName,mail,userPrincipalName,jobTitle,department,officeLocation,mobilePhone&$top=999', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!graphRes.ok) {
      const errText = await graphRes.text();
      return NextResponse.json({ error: `Graph error ${graphRes.status}: ${errText}` }, { status: graphRes.status });
    }

    const graphJson = await graphRes.json();
    const items = Array.isArray(graphJson?.value) ? graphJson.value : [];

    const users = items.map((u: any) => ({
      id: u.id,
      name: u.displayName || null,
      email: u.mail || u.userPrincipalName || null,
      jobTitle: u.jobTitle || null,
      department: u.department || null,
      officeLocation: u.officeLocation || null,
      mobilePhone: u.mobilePhone || null,
    })).filter((u: any) => !!u.email);

    return NextResponse.json({ users });
  } catch (error: any) {
    if (error instanceof MicrosoftGraphError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode || 500 });
    }
    console.error('Error fetching tenant users:', error);
    const message = typeof error?.message === 'string' ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


