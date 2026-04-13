import OpenAI from 'openai';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type ParsedEmployeeData = {
  fullName: string;
  dateOfBirth: string;
  homeTown: string;
  mobile: string;
  email: string;
  currentAddress: string;
  permanentAddress: string;
  aadharNumber: string;
  panCard: string;
};

const defaultData: ParsedEmployeeData = {
  fullName: '',
  dateOfBirth: '',
  homeTown: '',
  mobile: '',
  email: '',
  currentAddress: '',
  permanentAddress: '',
  aadharNumber: '',
  panCard: '',
};

const sanitize = (raw: any): ParsedEmployeeData => ({
  fullName: String(raw?.fullName || '').trim(),
  dateOfBirth: String(raw?.dateOfBirth || '').trim(),
  homeTown: String(raw?.homeTown || '').trim(),
  mobile: String(raw?.mobile || '').trim(),
  email: String(raw?.email || '').trim(),
  currentAddress: String(raw?.currentAddress || '').trim(),
  permanentAddress: String(raw?.permanentAddress || '').trim(),
  aadharNumber: String(raw?.aadharNumber || '').trim(),
  panCard: String(raw?.panCard || '').trim(),
});

export async function POST(request: Request) {
  try {
    const rawApiKey =
      process.env.OPENAI_API_KEY ||
      process.env.NEXT_PUBLIC_OPENAI_API_KEY ||
      process.env.OPENAI_APIKEY ||
      '';
    const apiKey = String(rawApiKey).trim().replace(/^['"]|['"]$/g, '');
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not configured on server. Please set it in hrms/.env and restart the dev server.' },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const text = String(body?.text || '').trim();
    if (!text) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    const client = new OpenAI({ apiKey });
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0,
      messages: [
        {
          role: 'system',
          content:
            'Extract employee details from input text and return ONLY a JSON object with exactly these keys: fullName, dateOfBirth, homeTown, mobile, email, currentAddress, permanentAddress, aadharNumber, panCard. Keep unknown values as empty strings.',
        },
        {
          role: 'user',
          content: text,
        },
      ],
    });

    const content = completion.choices?.[0]?.message?.content || '{}';
    let parsed: ParsedEmployeeData = defaultData;
    try {
      parsed = sanitize(JSON.parse(content));
    } catch {
      parsed = defaultData;
    }

    return NextResponse.json(parsed, { status: 200 });
  } catch (error) {
    console.error('parse-employee route error:', error);
    return NextResponse.json({ error: 'Failed to parse employee details' }, { status: 500 });
  }
}
