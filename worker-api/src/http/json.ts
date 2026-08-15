import type { Context } from "hono";
import type { z } from "zod";

import { badRequest, bodyTooLarge } from "./errors";

function zodDetails(error: z.ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const field = issue.path.length === 0 ? "$" : issue.path.join(".");
    (details[field] ??= []).push(issue.code);
  }
  return details;
}

export async function readJson<T extends z.ZodType>(
  context: Context,
  schema: T,
  maximumBytes: number
): Promise<z.output<T>> {
  const contentType = context.req.header("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (contentType !== "application/json") throw badRequest("JSON_REQUIRED");

  const declaredLength = Number(context.req.header("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > maximumBytes) {
    throw bodyTooLarge();
  }

  const bytes = await context.req.raw.arrayBuffer();
  if (bytes.byteLength > maximumBytes) throw bodyTooLarge();

  let value: unknown;
  try {
    value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw badRequest("INVALID_JSON");
  }
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw badRequest("INVALID_REQUEST", zodDetails(parsed.error));
  return parsed.data;
}
