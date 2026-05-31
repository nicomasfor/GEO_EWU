import type { Business } from "@geosector/shared";

const exportFields = [
  "canonicalName",
  "primaryCategory",
  "address",
  "city",
  "country",
  "phone",
  "website",
  "email",
  "lat",
  "lng",
  "confidenceScore",
  "sourceName",
  "sourceExternalId",
] as const;

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function csvEscape(value: unknown): string {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function exportBusinessesJson(businesses: Business[], jobId: string | null) {
  downloadBlob(
    `${jobId ?? "geosector"}-businesses.json`,
    new Blob([JSON.stringify(businesses, null, 2)], { type: "application/json;charset=utf-8" }),
  );
}

export function exportBusinessesCsv(businesses: Business[], jobId: string | null) {
  const header = exportFields.join(",");
  const rows = businesses.map((business) => exportFields.map((field) => csvEscape(business[field])).join(","));
  downloadBlob(`${jobId ?? "geosector"}-businesses.csv`, new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8" }));
}
