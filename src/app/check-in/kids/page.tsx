import { CheckInScreen } from "../CheckInScreen";

export default function KidsCheckInPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return <CheckInScreen kind="kid" searchParams={searchParams} />;
}
