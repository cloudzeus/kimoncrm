/**
 * API Route: Update Service Category
 * PUT /api/services/categories/update
 * 
 * Updates a service category name in SoftOne ERP
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import iconv from 'iconv-lite';

const UPDATE_CATEGORY_ENDPOINT = 'https://aic.oncloud.gr/s1services/JS/webservice.categories/putServiceCat';
const USERNAME = 'Service';
const PASSWORD = 'Service';

export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { mtrcategory, name } = body;

    if (!mtrcategory || !name) {
      return NextResponse.json(
        { error: 'MTRCATEGORY and name are required' },
        { status: 400 }
      );
    }

    // Send request to SoftOne
    const response = await fetch(UPDATE_CATEGORY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: USERNAME,
        password: PASSWORD,
        MTRCATEGORY: mtrcategory,
        name,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update service category in SoftOne');
    }

    // Get response as ArrayBuffer for proper encoding handling
    const arrayBuffer = await response.arrayBuffer();
    
    // Decode from ANSI 1253 (Greek) to UTF-8
    const decodedText = iconv.decode(Buffer.from(arrayBuffer), 'iso-8859-7');
    
    // Parse the JSON
    const data = JSON.parse(decodedText);

    if (!data.success) {
      return NextResponse.json(
        { error: data.message || 'Failed to update service category' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: data.message || 'Service category updated successfully',
      data: data.result,
    });
  } catch (error) {
    console.error('Error updating service category:', error);
    return NextResponse.json(
      { error: 'Failed to update service category' },
      { status: 500 }
    );
  }
}

