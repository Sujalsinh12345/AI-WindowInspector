const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export interface DetectionResult {
  /**
   * List of detected defects (cracks, chips, scratches, broken frame, etc.).
   * For backwards compatibility this is still called "cracks" in the data model.
   */
  cracks: Array<{
    type: string;
    severity: string;
    location: { x: number; y: number; width: number; height: number };
    confidence: number;
  }>;
  /**
   * High-level product type: window, door, frame, sliding, glass_panel, etc.
   * Stored in the "window_type" column in the database for compatibility.
   */
  window_type: string;
  overall_confidence: number;
  analysis: string;
  /**
   * Whether the image actually contains a relevant product (window/door/frame/etc.).
   * If false, the detection should be treated as invalid and not saved.
   */
  is_window?: boolean;
  /**
   * Optional explanation when is_window is false.
   */
  non_window_reason?: string;
  /**
   * Whether the product is considered defective overall.
   * If omitted, the app will infer this from whether any defects were found.
   */
  is_defective?: boolean;
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
              text: `You are an expert inspection AI for building products such as windows, doors, frames, sliding systems, and glass panels. Analyze images for any visible defects and classify the product type.

Respond ONLY with valid JSON in this exact format:
{
  "is_window": true|false,
  "non_window_reason": "Short reason when is_window is false, otherwise empty string",
  "cracks": [
    {
      "type": "crack|chip|scratch|shatter|dent|warp|misalignment|broken_frame|glass_breakage|other_defect",
      "severity": "minor|moderate|severe",
      "location": {"x": 0-100, "y": 0-100, "width": 0-100, "height": 0-100},
      "confidence": 0-100
    }
  ],
  "window_type": "window|door|frame|sliding|glass_panel|other|unknown",
  "overall_confidence": 0-100,
  "analysis": "Brief description of findings, including whether the product is defective overall",
  "is_defective": true|false
}

Location coordinates are percentages (0-100) of image dimensions. If no cracks found, return empty cracks array.

If the image does NOT contain a relevant product (for example: random objects, people, scenery, documents, etc.), then:
- Set "is_window" to false
- Set "non_window_reason" to a short explanation
- Set "cracks" to an empty array
- Set "window_type" to "unknown"
- Set "overall_confidence" to 0
- Set "analysis" to a short sentence explaining that no relevant product was detected.
- Set "is_defective" to false.

Now analyze this image for defects, classify the product type (window/door/frame/sliding/glass panel/etc.), and decide if the product is defective overall. Provide bounding box coordinates for any defects found.`
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

  // If the model indicates this is not a relevant product image, reject it so the caller
  // can show a message and avoid saving it to history.
  if (result.is_window === false) {
    const reason =
      result.non_window_reason ||
      'The uploaded image does not appear to contain a window.';
    throw new Error(
      `${reason} Please upload an image that clearly shows the product for defect detection.`
    );
  }

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
