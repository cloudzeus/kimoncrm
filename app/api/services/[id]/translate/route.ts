/**
 * API Route: Translate Service via DeepSeek
 * POST /api/services/[id]/translate
 * 
 * Generates translations for a service using DeepSeek AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only allow ADMIN, MANAGER, and EMPLOYEE roles
    if (!['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { targetLanguages } = body;

    if (!targetLanguages || !Array.isArray(targetLanguages) || targetLanguages.length === 0) {
      return NextResponse.json(
        { error: 'Target languages are required' },
        { status: 400 }
      );
    }

    // Get service
    const service = await prisma.service.findUnique({
      where: { id },
      select: {
        name: true,
        translations: {
          where: {
            languageCode: 'el', // Assuming Greek is the source
          },
          select: {
            description: true,
          },
        },
      },
    });

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';

    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: 'DeepSeek API key not configured' },
        { status: 500 }
      );
    }

    const sourceDescription = service.translations[0]?.description || '';
    const translations: any[] = [];

    // Translate to each target language
    for (const targetLang of targetLanguages) {
      try {
        // Call DeepSeek API
        const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              {
                role: 'system',
                content: `You are a professional translator. Translate the service name and description from Greek to ${targetLang}. Respond ONLY with a JSON object in this format: {"name": "translated name", "description": "translated description"}`,
              },
              {
                role: 'user',
                content: `Service name: ${service.name}\nDescription: ${sourceDescription}`,
              },
            ],
            temperature: 0.3,
            max_tokens: 1000,
          }),
        });

        if (!response.ok) {
          console.error(`DeepSeek API error for ${targetLang}:`, response.statusText);
          continue;
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (content) {
          // Parse the JSON response
          const translationData = JSON.parse(content);

          // Create or update translation
          const translation = await prisma.serviceTranslation.upsert({
            where: {
              serviceId_languageCode: {
                serviceId: id,
                languageCode: targetLang,
              },
            },
            create: {
              serviceId: id,
              languageCode: targetLang,
              name: translationData.name,
              description: translationData.description,
            },
            update: {
              name: translationData.name,
              description: translationData.description,
            },
          });

          translations.push(translation);
        }
      } catch (error) {
        console.error(`Error translating to ${targetLang}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Translated to ${translations.length} language(s)`,
      data: translations,
    });
  } catch (error) {
    console.error('Error translating service:', error);
    return NextResponse.json(
      { error: 'Failed to translate service' },
      { status: 500 }
    );
  }
}

