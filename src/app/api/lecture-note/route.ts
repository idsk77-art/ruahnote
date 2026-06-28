export const dynamic = "force-dynamic";

type LectureNoteRequest = {
  transcript?: string;
  title?: string;
};

type LectureNoteResponse = {
  summary: string;
  keywords: string[];
  assignments: string[];
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

function parseLectureNote(text: string): LectureNoteResponse {
  try {
    const parsed = JSON.parse(text) as Partial<LectureNoteResponse>;
    return {
      summary: typeof parsed.summary === "string" ? parsed.summary.trim() : "",
      keywords: Array.isArray(parsed.keywords)
        ? parsed.keywords.filter((keyword): keyword is string => typeof keyword === "string")
        : [],
      assignments: Array.isArray(parsed.assignments)
        ? parsed.assignments.filter(
            (assignment): assignment is string => typeof assignment === "string",
          )
        : [],
    };
  } catch {
    return {
      summary: text,
      keywords: [],
      assignments: [],
    };
  }
}

export async function POST(request: Request) {
  if (!hasValue(process.env.OPENAI_API_KEY)) {
    return Response.json(
      { error: "OPENAI_API_KEY is not configured." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | LectureNoteRequest
    | null;
  const transcript =
    typeof body?.transcript === "string" ? body.transcript.trim() : "";

  if (!transcript) {
    return Response.json({ error: "transcript is required." }, { status: 400 });
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_NOTE_MODEL ?? "gpt-5.5",
      store: false,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: [
                "Create a concise Korean lecture note from this transcript.",
                "Return strict JSON only with keys summary, keywords, assignments.",
                "summary must be a compact Korean paragraph.",
                "keywords must be an array of short Korean keyword strings.",
                "assignments must be an array of detected homework/action item strings.",
                `Title: ${body?.title ?? "RuahNote recording"}`,
                `Transcript:\n${transcript}`,
              ].join("\n"),
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
            : `OpenAI lecture note request failed with HTTP ${response.status}.`,
      },
      { status: response.status },
    );
  }

  return Response.json(parseLectureNote(extractOutputText(data)));
}
