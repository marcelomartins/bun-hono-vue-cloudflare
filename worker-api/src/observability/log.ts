export function structuredLog(
  level: "info" | "warn" | "error",
  event: Record<string, string | number | boolean | null>
): void {
  const safeEvent = { ...event, level };
  if (level === "error") console.error(safeEvent);
  else if (level === "warn") console.warn(safeEvent);
  else console.info(safeEvent);
}
