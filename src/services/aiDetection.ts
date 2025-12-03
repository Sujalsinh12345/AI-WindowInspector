const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export interface DetectionResult {
  cracks: Array<{
    type: string;
    severity: string;
    location: { x: number; y: number; width: number; height: number };
    confidence: number;
  }>;
  window_type: string;
  overall_confidence: number;
  analysis: string;
}

export async function analyzeWindowImage(
  imageFile: File
): Promise<DetectionResult> {
  const base64Image = await fileToBase64(imageFile);

  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `You are an expert window inspection AI. Analyze images for cracks, damage, and classify window types.

Respond ONLY with valid JSON in this exact format:
{
  "cracks": [
    {
      "type": "crack|chip|scratch|shatter",
      "severity": "minor|moderate|severe",
      "location": {"x": 0-100, "y": 0-100, "width": 0-100, "height": 0-100},
      "confidence": 0-100
    }
  ],
  "window_type": "single-hung|double-hung|casement|sliding|fixed|bay|awning|unknown",
  "overall_confidence": 0-100,
  "analysis": "Brief description of findings"
}

Location coordinates are percentages (0-100) of image dimensions. If no cracks found, return empty cracks array.

Now analyze this window image for cracks, damage, and classify the window type. Provide bounding box coordinates for any defects found.`
            },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Image,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1000,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Gemini API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  const content =
    data.candidates?.[0]?.content?.parts?.[0]?.text ||
    JSON.stringify(data.candidates?.[0]?.content ?? {});

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse AI response');
  }

  const result: DetectionResult = JSON.parse(jsonMatch[0]);

  return result;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}
