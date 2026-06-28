export const dynamic = "force-dynamic";

type OcrRequest = {
  imageDataUrl?: string;
  imageUrl?: string;
};

function hasValue(value: string | undefined) {
  return Boolean(value && value.trim());
}

function extractOutputText(response: unknown) {
  if (!response || typeof response !== "object") return "";

  const outputText = (response as { output_text?: unknown }).output_text;
  if (typeof outputText === "string") return outputText.trim();

  const output = (response as { output?: unknown }).output;
  if (!Array.isArray(output)) return "";

  return output
    .flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const content = (item as { content?: unknown }).content;
      return Array.isArray(content) ? content : [];
    })
    .map((contentItem) => {
      if (!contentItem || typeof contentItem !== "object") return "";
      const text = (contentItem as { text?: unknown }).text;
      return typeof text === "string" ? text : "";
    })
    .filter(Boolean)
    .join("\n")
    .trim();
}

export async function POST(request: Request) {
  if (!hasValue(process.env.OPENAI_API_KEY)) {
    return Response.json(
      { error: "OPENAI_API_KEY is not configured." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as OcrRequest | null;
  const imageInput =
    typeof body?.imageDataUrl === "string"
      ? body.imageDataUrl.trim()
      : typeof body?.imageUrl === "string"
        ? body.imageUrl.trim()
        : "";

  if (!imageInput) {
    return Response.json(
      { error: "imageDataUrl or imageUrl is required." },
      { status: 400 },
    );
  }

  if (
    !imageInput.startsWith("data:image/") &&
    !imageInput.startsWith("https://")
  ) {
    return Response.json(
      { error: "Image input must be a data URL or HTTPS URL." },
      { status: 400 },
    );
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_OCR_MODEL ?? "gpt-5.5",
      store: false,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: "Extract all readable text from this image. Preserve line breaks where useful. Return only the extracted text.",
            },
            {
              type: "input_image",
              image_url: imageInput,
            },
          ],
        },
      ],
    }),
  });

  const data = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    return Response.json(
      {
        error:
          data && typeof data === "object" && "error" in data
            ? data
            : `OpenAI OCR request failed with HTTP ${response.status}.`,
      },
      { status: response.status },
    );
  }

  return Response.json({
    text: extractOutputText(data),
  });
}
