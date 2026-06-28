import "server-only";

import { createDecipheriv, createHmac } from "node:crypto";

function hasValue(value: string | undefined) {
  return Boolean(value && value.trim());
}

function encryptionKey() {
  const secret = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;
  if (!hasValue(secret)) {
    throw new Error("GOOGLE_TOKEN_ENCRYPTION_KEY is not configured.");
  }

  return createHmac("sha256", "ruahnote-google-token")
    .update(secret as string)
    .digest();
}

export function decryptGoogleToken(encryptedToken: string) {
  const [version, ivBase64, tagBase64, encryptedBase64] =
    encryptedToken.split(".");
  if (version !== "v1" || !ivBase64 || !tagBase64 || !encryptedBase64) {
    throw new Error("Unsupported encrypted Google token format.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(ivBase64, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagBase64, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedBase64, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
