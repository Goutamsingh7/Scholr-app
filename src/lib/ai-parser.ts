import Anthropic from '@anthropic-ai/sdk';
import { ParseResult } from '@/types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function parseTimetableImage(
  base64Image: string,
  mimeType: string = 'image/jpeg'
): Promise<ParseResult> {
  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type:'base64', media_type: mimeType as any, data: base64Image },
        },
        {
          type: 'text',
          text: `Analyze this college timetable image and extract all class sessions.

Return ONLY a valid JSON object (no markdown, no backticks, no preamble):
{
  "slots": [
    { "day": "Monday", "subject": "Mathematics", "startTime": "09:00", "endTime": "10:00" }
  ],
  "confidence": 0.95,
  "warnings": []
}

Rules:
- day: full name — Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday
- startTime / endTime: HH:MM in 24-hour format (e.g. "14:30")
- Expand abbreviations: Maths→Mathematics, Phy→Physics, Chem→Chemistry, CS→Computer Science, Eng→English, etc.
- Skip free periods, lunch breaks, and empty slots
- confidence: 0.0–1.0 based on image clarity and parse certainty
- warnings: list any merged cells, unclear text, overlapping slots, or abbreviations you had to guess
- If you cannot read the image clearly, set confidence below 0.5 and explain in warnings`,
        },
      ],
    }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
  const clean = text.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim();

  try {
    return JSON.parse(clean) as ParseResult;
  } catch {
    throw new Error('AI returned invalid JSON. Please try again with a clearer image.');
  }
}
