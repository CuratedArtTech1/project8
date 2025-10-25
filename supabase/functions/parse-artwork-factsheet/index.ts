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

    const prompt = `This document contains a list of artworks. Extract information for EACH artwork.

For EACH entry/line, parse:
- artist: artist name (the part before the first comma)
- title: artwork title (the part after artist name, before the price)
- appraisedValue: appraised value as a number (extract the dollar amount, remove $ and commas)

Example:
"Carlos Cruz-Diez, Chromointerférence Spatiale SCAD, 1964/2016    $320,000"
Should become:
{
  "artist": "Carlos Cruz-Diez",
  "title": "Chromointerférence Spatiale SCAD, 1964/2016",
  "appraisedValue": 320000
}

Return ONLY a JSON array:
[
  {
    "artist": "Artist Name",
    "title": "Artwork Title",
    "year": "",
    "dimensions": "",
    "materials": "",
    "appraisedValue": 320000
  },
  ...
]

For simple lists, leave year, dimensions, and materials as empty strings.`;

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
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

    let artworks;
    try {
      const jsonMatch = extractedText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        artworks = JSON.parse(jsonMatch[0]);
      } else {
        artworks = JSON.parse(extractedText);
      }
    } catch (_e) {
      console.error('Failed to parse extracted data:', extractedText);
      throw new Error('Failed to parse extracted artwork data');
    }

    return new Response(
      JSON.stringify({ artworks }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error parsing artwork factsheet:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to parse artwork factsheet' }),
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
