import { badRequest } from "./errors.js";

export interface ParsedMultipartFile {
  fieldName: string;
  originalName: string;
  mimeType: string;
  buffer: Buffer;
}

function getBoundary(contentType: string) {
  const match = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  const boundary = match?.[1] ?? match?.[2];
  if (!boundary) {
    throw badRequest("Multipart boundary is missing");
  }

  return `--${boundary}`;
}

function parseContentDisposition(header: string) {
  const fieldName = header.match(/name="([^"]+)"/i)?.[1];
  const originalName = header.match(/filename="([^"]*)"/i)?.[1];

  return {
    fieldName: fieldName ?? "file",
    originalName: originalName ?? "file"
  };
}

export function parseSingleMultipartFile(body: Buffer, contentType: string): ParsedMultipartFile {
  const boundary = Buffer.from(getBoundary(contentType));
  const headerSeparator = Buffer.from("\r\n\r\n");
  let offset = body.indexOf(boundary);

  while (offset !== -1) {
    let partStart = offset + boundary.length;
    if (body.subarray(partStart, partStart + 2).toString() === "--") {
      break;
    }

    if (body.subarray(partStart, partStart + 2).toString() === "\r\n") {
      partStart += 2;
    }

    const headerEnd = body.indexOf(headerSeparator, partStart);
    if (headerEnd === -1) {
      break;
    }

    const headerText = body.subarray(partStart, headerEnd).toString("utf8");
    const nextBoundary = body.indexOf(boundary, headerEnd + headerSeparator.length);
    if (nextBoundary === -1) {
      break;
    }

    const contentStart = headerEnd + headerSeparator.length;
    const contentEnd = nextBoundary >= 2 ? nextBoundary - 2 : nextBoundary;
    const fileBuffer = body.subarray(contentStart, contentEnd);

    const dispositionHeader = headerText
      .split("\r\n")
      .find((header) => header.toLowerCase().startsWith("content-disposition:"));
    if (!dispositionHeader) {
      offset = nextBoundary;
      continue;
    }

    const { fieldName, originalName } = parseContentDisposition(dispositionHeader);
    const mimeType =
      headerText
        .split("\r\n")
        .find((header) => header.toLowerCase().startsWith("content-type:"))
        ?.split(":")
        .slice(1)
        .join(":")
        .trim() ?? "application/octet-stream";

    if (!originalName) {
      offset = nextBoundary;
      continue;
    }

    return {
      fieldName,
      originalName,
      mimeType,
      buffer: Buffer.from(fileBuffer)
    };
  }

  throw badRequest("File is required");
}
