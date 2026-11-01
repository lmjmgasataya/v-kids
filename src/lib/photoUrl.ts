export type PhotoVariant = "thumb" | "card" | "full";

// Same-origin, login-protected link to a service team member's photo (served by
// src/app/service-team/[id]/photo/route.ts from a cache, not straight from B2). The object key
// is part of the URL so a retaken photo gets a new URL, which lets browsers cache each one forever.
export function serviceTeamPhotoUrl(
  memberId: number,
  photoKey: string,
  variant: PhotoVariant,
  downloadFileName?: string
): string {
  const params = new URLSearchParams({ size: variant, v: photoKey });
  if (downloadFileName) params.set("download", downloadFileName);
  return `/service-team/${memberId}/photo?${params}`;
}
