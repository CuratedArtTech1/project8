// @ts-nocheck
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string;

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const fileBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(fileBuffer);
    const base64 = btoa(String.fromCharCode(...uint8Array));
    const mimeType = file.type || 'application/pdf';

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    let prompt = '';
    if (documentType === 'ucc') {
      prompt = `Extract the following information from this UCC filing document. Return ONLY a JSON object with these exact fields (use null for missing values):
{
  "jurisdiction": "state code or jurisdiction",
  "filingNumber": "the UCC filing number",
  "filingDate": "date in YYYY-MM-DD format",
  "continuationDue": "continuation due date in YYYY-MM-DD format if available",
  "collateralDescription": "description of the collateral"
}

If you cannot find specific information, use null for that field.`;
    } else if (documentType === 'coi') {
      prompt = `Extract the following information from this Certificate of Insurance document. Return ONLY a JSON object with these exact fields (use null for missing values):
{
  "carrier": "insurance carrier/company name",
  "policyNumber": "policy number",
  "expirationDate": "expiration date in YYYY-MM-DD format",
  "coverageLimit": "coverage limit as a number (without currency symbols or commas)"
}

If you cannot find specific information, use null for that field.`;
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid document type' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mimeType,
                  data: base64,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error('Anthropic API error:', errorText);
      throw new Error('Failed to process document with AI');
    }

    const result = await anthropicResponse.json();
    const extractedText = result.content[0].text;

    let extractedData;
    try {
      const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        extractedData = JSON.parse(extractedText);
      }
    } catch (_e) {
      console.error('Failed to parse extracted data:', extractedText);
      throw new Error('Failed to parse extracted data from document');
    }

    return new Response(
      JSON.stringify(extractedData),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error extracting document data:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to extract document data' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
