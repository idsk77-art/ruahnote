export const dynamic = "force-dynamic";

type TranscribeRequest = {
  audioUrl?: string;
  fileName?: string;
};

function hasValue(value: string | undefined) {
  return Boolean(value && value.trim());
}

export async function POST(request: Request) {
  if (!hasValue(process.env.OPENAI_API_KEY)) {
    return Response.json(
      { error: "OPENAI_API_KEY is not configured." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | TranscribeRequest
    | null;
  const audioUrl = typeof body?.audioUrl === "string" ? body.audioUrl.trim() : "";

  if (!audioUrl || !audioUrl.startsWith("https://")) {
    return Response.json(
      { error: "audioUrl must be an HTTPS URL." },
      { status: 400 },
    );
  }

  const audioResponse = await fetch(audioUrl);
  if (!audioResponse.ok) {
    return Response.json(
      { error: `Audio download failed with HTTP ${audioResponse.status}.` },
      { status: 400 },
    );
  }

  const audioBlob = await audioResponse.blob();
  const formData = new FormData();
  formData.append(
    "file",
    audioBlob,
    body?.fileName?.trim() || "ruahnote-recording.webm",
  );
  formData.append(
    "model",
    process.env.OPENAI_STT_MODEL ?? "gpt-4o-mini-transcribe",
  );

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: formData,
  });

  const data = (await response.json().catch(() => null)) as
    | { text?: unknown; error?: unknown }
    | null;

  if (!response.ok) {
    return Response.json(
      {
        error:
          data && typeof data === "object" && "error" in data
            ? data
            : `OpenAI transcription failed with HTTP ${response.status}.`,
      },
      { status: response.status },
    );
  }

  return Response.json({
    text: typeof data?.text === "string" ? data.text.trim() : "",
  });
}
