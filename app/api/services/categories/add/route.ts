/**
 * API Route: Add Service Category
 * POST /api/services/categories/add
 * 
 * Adds a new service category to SoftOne ERP
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import iconv from 'iconv-lite';

const ADD_CATEGORY_ENDPOINT = 'https://aic.oncloud.gr/s1services/JS/webservice.categories/addServiceCat';
const USERNAME = 'Service';
const PASSWORD = 'Service';

export async function POST(request: NextRequest) {
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
    const { name, code } = body;

    if (!name || !code) {
      return NextResponse.json(
        { error: 'Name and code are required' },
        { status: 400 }
      );
    }

    // Send request to SoftOne
    const response = await fetch(ADD_CATEGORY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: USERNAME,
        password: PASSWORD,
        name,
        code,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add service category to SoftOne');
    }

    // Get response as ArrayBuffer for proper encoding handling
    const arrayBuffer = await response.arrayBuffer();
    
    // Decode from ANSI 1253 (Greek) to UTF-8
    const decodedText = iconv.decode(Buffer.from(arrayBuffer), 'iso-8859-7');
    
    // Parse the JSON
    const data = JSON.parse(decodedText);

    if (!data.success) {
      return NextResponse.json(
        { error: data.message || 'Failed to add service category' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: data.message || 'Service category added successfully',
      data: data.result,
    });
  } catch (error) {
    console.error('Error adding service category:', error);
    return NextResponse.json(
      { error: 'Failed to add service category' },
      { status: 500 }
    );
  }
}


