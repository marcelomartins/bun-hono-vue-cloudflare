import { useHead } from "@unhead/vue";

export function usePublicHead(title: string, description?: string): void {
  useHead({
    title,
    meta: description === undefined ? [] : [{ name: "description", content: description }]
  });
}
