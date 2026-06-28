import { PDFDocument } from "pdf-lib";

export const dynamic = "force-dynamic";

type PdfRequest = {
  images?: Array<{
    url?: string;
    mimeType?: string | null;
  }>;
  imageUrls?: string[];
  title?: string;
};

function isAllowedImageUrl(url: string) {
  return url.startsWith("https://") || url.startsWith("data:image/");
}

async function imageBytesFromUrl(url: string) {
  if (url.startsWith("data:image/")) {
    const [, base64 = ""] = url.split(",", 2);
    return {
      bytes: Uint8Array.from(Buffer.from(base64, "base64")),
      contentType: url.slice(5, url.indexOf(";")),
    };
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not fetch image: HTTP ${response.status}`);
  }

  return {
    bytes: new Uint8Array(await response.arrayBuffer()),
    contentType: response.headers.get("content-type") ?? "",
  };
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as PdfRequest | null;
  const images =
    body?.images
      ?.map((image) => ({
        url: typeof image.url === "string" ? image.url : "",
        mimeType: image.mimeType ?? "",
      }))
      .filter((image) => image.url && isAllowedImageUrl(image.url)) ??
    body?.imageUrls
      ?.filter(
        (url): url is string => typeof url === "string" && isAllowedImageUrl(url),
      )
      .map((url) => ({ url, mimeType: "" }));

  if (!images || images.length === 0) {
    return Response.json(
      { error: "At least one HTTPS or data URL image is required." },
      { status: 400 },
    );
  }

  const pdf = await PDFDocument.create();

  for (const imageInput of images) {
    const { bytes, contentType } = await imageBytesFromUrl(imageInput.url);
    const mimeType = imageInput.mimeType || contentType;
    const image = mimeType.includes("png")
      ? await pdf.embedPng(bytes)
      : await pdf.embedJpg(bytes);
    const page = pdf.addPage();
    const { width: pageWidth, height: pageHeight } = page.getSize();
    const imageSize = image.scale(1);
    const margin = 36;
    const scale = Math.min(
      (pageWidth - margin * 2) / imageSize.width,
      (pageHeight - margin * 2) / imageSize.height,
    );
    const width = imageSize.width * scale;
    const height = imageSize.height * scale;

    page.drawImage(image, {
      x: (pageWidth - width) / 2,
      y: (pageHeight - height) / 2,
      width,
      height,
    });
  }

  const pdfBytes = await pdf.save();
  const fileName = `${(body?.title ?? "ruahnote-scan")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .slice(0, 80)}.pdf`;

  return new Response(Buffer.from(pdfBytes), {
    headers: {
      "content-disposition": `attachment; filename="${fileName}"`,
      "content-type": "application/pdf",
    },
  });
}
