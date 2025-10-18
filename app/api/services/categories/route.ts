/**
 * API Route: Service Categories
 * GET /api/services/categories - Fetch all service categories from SoftOne
 * 
 * Uses iconv-lite to decode ANSI 1253 encoded data to UTF-8
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import iconv from 'iconv-lite';

const SERVICE_CATEGORIES_ENDPOINT = 'https://aic.oncloud.gr/s1services/JS/webservice.categories/getServiceCat';
const USERNAME = 'Service';
const PASSWORD = 'Service';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch service categories from SoftOne
    const response = await fetch(SERVICE_CATEGORIES_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: USERNAME,
        password: PASSWORD,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch service categories from SoftOne');
    }

    // Get response as ArrayBuffer for proper encoding handling
    const arrayBuffer = await response.arrayBuffer();
    
    // Decode from ANSI 1253 (Greek) to UTF-8
    const decodedText = iconv.decode(Buffer.from(arrayBuffer), 'iso-8859-7');
    
    // Parse the JSON
    const data = JSON.parse(decodedText);

    if (!data.success) {
      return NextResponse.json(
        { error: data.message || 'Failed to fetch service categories' },
        { status: 400 }
      );
    }

    // Transform the data to a more user-friendly format
    const categories = (data.result || []).map((cat: any) => ({
      mtrcategory: cat.MTRCATEGORY,
      code: cat.CODE,
      name: cat.NAME,
      sodtype: cat.SODTYPE,
      isActive: cat.ISACTIVE === '1',
      unit: cat.MTRUNIT1,
      vat: cat.VAT,
    }));

    return NextResponse.json({
      success: true,
      data: categories,
      total: data.total || categories.length,
      company: data.company,
      sodtype: data.sodtype,
    });
  } catch (error) {
    console.error('Error fetching service categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service categories' },
      { status: 500 }
    );
  }
}


