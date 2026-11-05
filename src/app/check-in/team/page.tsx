import { CheckInScreen } from "../CheckInScreen";

export default function TeamCheckInPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return <CheckInScreen kind="team" searchParams={searchParams} />;
}
