import { db } from "@/db";
import { eq } from "drizzle-orm";
import { checkIns, guardians, kids, serviceTeamMembers } from "@/db/schema";
import { SERVICE_OPTIONS } from "@/lib/constants";
import { getManilaMonthBoundsForMonthString, manilaDateString, manilaMonthString, shiftMonthString } from "@/lib/date";

export interface ReportServiceDay {
  date: string; // YYYY-MM-DD, Manila calendar date
  checkIns: number;
  uniqueKids: number;
  isSunday: boolean;
}

export interface ReportServiceRow {
  service: string;
  registeredKids: number;
  serviceTeam: number;
  checkIns: number;
  avgPerSunday: number;
}

export interface ReportAgeRow {
  age: number;
  male: number;
  female: number;
}

export interface ReportCountRow {
  label: string;
  count: number;
}

export interface ReportIdCardStatus {
  total: number;
  printed: number;
  given: number;
}

export interface ReportData {
  totals: {
    kids: number;
    serviceTeam: number;
    checkIns: number;
    kidsAttended: number;
    kidsNeverAttended: number;
    sundays: number;
    avgKidsPerSunday: number;
  };
  serviceDays: ReportServiceDay[];
  services: ReportServiceRow[];
  ages: ReportAgeRow[];
  registrationsByMonth: ReportCountRow[];
  attendanceFrequency: ReportCountRow[];
  kidIdCards: ReportIdCardStatus;
  serviceTeamIdCards: ReportIdCardStatus;
}

// Time window for check-in based stats, from the ?range= query param. Registration snapshots
// (ages, families, service team, ID cards) always cover everyone.
export const REPORT_RANGES = [
  { key: "all", label: "All time" },
  { key: "3m", label: "Last 3 months" },
  { key: "month", label: "This month" },
] as const;
export type ReportRange = (typeof REPORT_RANGES)[number]["key"];

export function parseReportRange(value: unknown): ReportRange {
  return REPORT_RANGES.some((r) => r.key === value) ? (value as ReportRange) : "all";
}

// Start of the window (Manila month boundary), or undefined for all time.
export function reportRangeStart(range: ReportRange): Date | undefined {
  if (range === "all") return undefined;
  const month = range === "month" ? manilaMonthString() : shiftMonthString(manilaMonthString(), -2);
  return getManilaMonthBoundsForMonthString(month).start;
}

function inRange(d: Date, since: Date | undefined): boolean {
  return !since || d >= since;
}

// Distinct service days a kid attended → bucket label, in display order.
const FREQUENCY_BUCKETS = [
  { label: "Never", min: 0, max: 0 },
  { label: "1 day", min: 1, max: 1 },
  { label: "2–3 days", min: 2, max: 3 },
  { label: "4–7 days", min: 4, max: 7 },
  { label: "8+ days", min: 8, max: Infinity },
];

function isSundayDateString(dateStr: string): boolean {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay() === 0;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;

function manilaHour(d: Date): number {
  return new Date(d.getTime() + MANILA_OFFSET_MS).getUTCHours();
}

// Aggregates for the /reports overview; check-in stats and new registrations are limited to
// `since` when given. The tables are small (hundreds of kids, a few
// thousand check-ins), so this loads the needed columns once and buckets by Manila
// calendar date in JS — same approach as getAttendanceDatesInMonth — rather than
// pushing timezone-aware grouping into SQL.
export async function getReportData(since?: Date): Promise<ReportData> {
  const [kidRows, allCheckInRows, teamRows] = await Promise.all([
    db
      .select({
        id: kids.id,
        age: kids.age,
        gender: kids.gender,
        service: kids.serviceAttending,
        idPrinted: kids.idPrinted,
        idGiven: kids.idGiven,
        createdAt: kids.createdAt,
      })
      .from(kids),
    db
      .select({ kidId: checkIns.kidId, service: checkIns.serviceAttending, checkedInAt: checkIns.checkedInAt })
      .from(checkIns),
    db
      .select({
        service: serviceTeamMembers.serviceAttending,
        idPrinted: serviceTeamMembers.idPrinted,
        idGiven: serviceTeamMembers.idGiven,
      })
      .from(serviceTeamMembers),
  ]);
  const checkInRows = allCheckInRows.filter((row) => inRange(row.checkedInAt, since));

  // Service days
  const dayBuckets = new Map<string, { checkIns: number; kids: Set<number> }>();
  const daysByKid = new Map<number, Set<string>>();
  const sundayCheckInsByService = new Map<string, number>();
  const checkInsByService = new Map<string, number>();
  for (const row of checkInRows) {
    const date = manilaDateString(row.checkedInAt);
    const bucket = dayBuckets.get(date) ?? { checkIns: 0, kids: new Set<number>() };
    bucket.checkIns += 1;
    bucket.kids.add(row.kidId);
    dayBuckets.set(date, bucket);

    if (!daysByKid.has(row.kidId)) daysByKid.set(row.kidId, new Set());
    daysByKid.get(row.kidId)!.add(date);

    checkInsByService.set(row.service, (checkInsByService.get(row.service) ?? 0) + 1);
    if (isSundayDateString(date)) {
      sundayCheckInsByService.set(row.service, (sundayCheckInsByService.get(row.service) ?? 0) + 1);
    }
  }

  const serviceDays = Array.from(dayBuckets.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, bucket]) => ({
      date,
      checkIns: bucket.checkIns,
      uniqueKids: bucket.kids.size,
      isSunday: isSundayDateString(date),
    }));

  const sundays = serviceDays.filter((d) => d.isSunday);
  const avgKidsPerSunday = sundays.length
    ? round1(sundays.reduce((sum, d) => sum + d.uniqueKids, 0) / sundays.length)
    : 0;

  // Per service — fixed services first, then any free-text leftovers from older data.
  const serviceNames = [...SERVICE_OPTIONS];
  const registeredByService = new Map<string, number>();
  for (const kid of kidRows) registeredByService.set(kid.service, (registeredByService.get(kid.service) ?? 0) + 1);
  const teamByService = new Map<string, number>();
  for (const member of teamRows) teamByService.set(member.service, (teamByService.get(member.service) ?? 0) + 1);
  for (const name of [...registeredByService.keys(), ...teamByService.keys(), ...checkInsByService.keys()]) {
    if (!serviceNames.includes(name)) serviceNames.push(name);
  }

  const services = serviceNames.map((service) => ({
    service,
    registeredKids: registeredByService.get(service) ?? 0,
    serviceTeam: teamByService.get(service) ?? 0,
    checkIns: checkInsByService.get(service) ?? 0,
    avgPerSunday: sundays.length ? round1((sundayCheckInsByService.get(service) ?? 0) / sundays.length) : 0,
  }));

  // Ages by gender
  const ageMap = new Map<number, ReportAgeRow>();
  for (const kid of kidRows) {
    const row = ageMap.get(kid.age) ?? { age: kid.age, male: 0, female: 0 };
    if (kid.gender === "Male") row.male += 1;
    else row.female += 1;
    ageMap.set(kid.age, row);
  }
  const ages = Array.from(ageMap.values()).sort((a, b) => a.age - b.age);

  // New registrations per Manila month
  const monthMap = new Map<string, number>();
  for (const kid of kidRows) {
    if (!inRange(kid.createdAt, since)) continue;
    const month = manilaDateString(kid.createdAt).slice(0, 7);
    monthMap.set(month, (monthMap.get(month) ?? 0) + 1);
  }
  const registrationsByMonth = Array.from(monthMap.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([label, count]) => ({ label, count }));

  // How many distinct days each kid attended
  const frequencyCounts = FREQUENCY_BUCKETS.map(() => 0);
  for (const kid of kidRows) {
    const days = daysByKid.get(kid.id)?.size ?? 0;
    const i = FREQUENCY_BUCKETS.findIndex((b) => days >= b.min && days <= b.max);
    frequencyCounts[i] += 1;
  }
  const attendanceFrequency = FREQUENCY_BUCKETS.map((b, i) => ({ label: b.label, count: frequencyCounts[i] }));

  const kidsAttended = kidRows.filter((kid) => daysByKid.has(kid.id)).length;

  return {
    totals: {
      kids: kidRows.length,
      serviceTeam: teamRows.length,
      checkIns: checkInRows.length,
      kidsAttended,
      kidsNeverAttended: kidRows.length - kidsAttended,
      sundays: sundays.length,
      avgKidsPerSunday,
    },
    serviceDays,
    services,
    ages,
    registrationsByMonth,
    attendanceFrequency,
    kidIdCards: {
      total: kidRows.length,
      printed: kidRows.filter((kid) => kid.idPrinted).length,
      given: kidRows.filter((kid) => kid.idGiven).length,
    },
    serviceTeamIdCards: {
      total: teamRows.length,
      printed: teamRows.filter((member) => member.idPrinted).length,
      given: teamRows.filter((member) => member.idGiven).length,
    },
  };
}

// ---------------------------------------------------------------------------
// /reports/attendance

export interface ReportNewVsReturningDay {
  date: string;
  firstTime: number;
  returning: number;
}

export interface ReportHourRow {
  hour: number; // 0–23, Manila time
  checkIns: number;
}

export interface ReportCrossServiceRow {
  service: string;
  checkIns: number;
  fromOtherServices: number;
}

export interface ReportKidRef {
  id: number;
  firstName: string;
  lastName: string;
  nickname: string | null;
  service: string; // registered service
}

export interface ReportFollowUpKid extends ReportKidRef {
  daysAttended: number;
  lastAttended: string; // YYYY-MM-DD
}

export interface ReportServiceMismatchKid extends ReportKidRef {
  usualService: string;
  usualCount: number;
  totalCheckIns: number;
}

export interface ReportSundayAges {
  date: string;
  ages: number[]; // one entry per unique kid checked in that Sunday
}

export interface AttendanceReport {
  totals: {
    checkIns: number;
    otherServiceCheckIns: number;
    latestSunday: ReportNewVsReturningDay | null;
  };
  newVsReturning: ReportNewVsReturningDay[];
  sundayAges: ReportSundayAges[];
  sundayHours: ReportHourRow[];
  crossService: ReportCrossServiceRow[];
  serviceMismatch: ReportServiceMismatchKid[];
  followUp: ReportFollowUpKid[];
  followUpSundays: string[];
}

// A kid needs this many attended days to count as a regular worth following up on…
export const FOLLOW_UP_MIN_DAYS = 2;
// …and has missed every one of this many most recent Sundays.
export const FOLLOW_UP_MISSED_SUNDAYS = 4;
// Kids need at least this many check-ins in the window before we suggest their
// registered service is wrong.
export const SERVICE_MISMATCH_MIN_CHECK_INS = 2;

// Check-in stats are limited to `since` when given. First-time detection and the follow-up
// list always look at full history — a kid isn't "first time" just because the window
// starts after their first visit, and "missed the last N Sundays" doesn't depend on it.
export async function getAttendanceReport(since?: Date): Promise<AttendanceReport> {
  const [kidRows, checkInRows] = await Promise.all([
    db
      .select({
        id: kids.id,
        firstName: kids.firstName,
        lastName: kids.lastName,
        nickname: kids.nickname,
        age: kids.age,
        service: kids.serviceAttending,
      })
      .from(kids),
    db
      .select({ kidId: checkIns.kidId, service: checkIns.serviceAttending, checkedInAt: checkIns.checkedInAt })
      .from(checkIns),
  ]);
  const kidById = new Map(kidRows.map((kid) => [kid.id, kid]));
  const kidRef = (kid: (typeof kidRows)[number]): ReportKidRef => ({
    id: kid.id,
    firstName: kid.firstName,
    lastName: kid.lastName,
    nickname: kid.nickname,
    service: kid.service,
  });

  // Full history
  const allDaysByKid = new Map<number, Set<string>>();
  for (const row of checkInRows) {
    const date = manilaDateString(row.checkedInAt);
    if (!allDaysByKid.has(row.kidId)) allDaysByKid.set(row.kidId, new Set());
    allDaysByKid.get(row.kidId)!.add(date);
  }
  const firstDateByKid = new Map<number, string>();
  for (const [kidId, days] of allDaysByKid) firstDateByKid.set(kidId, [...days].sort()[0]);
  const allSundays = [
    ...new Set(checkInRows.map((row) => manilaDateString(row.checkedInAt)).filter(isSundayDateString)),
  ].sort();

  // Within the window
  const kidsByDate = new Map<string, Set<number>>();
  const hourCounts = new Map<number, number>();
  const crossByService = new Map<string, { checkIns: number; fromOtherServices: number }>();
  const servicesByKid = new Map<number, Map<string, number>>();
  let windowCheckIns = 0;
  let otherServiceCheckIns = 0;

  for (const row of checkInRows) {
    if (!inRange(row.checkedInAt, since)) continue;
    windowCheckIns += 1;
    const date = manilaDateString(row.checkedInAt);
    if (!kidsByDate.has(date)) kidsByDate.set(date, new Set());
    kidsByDate.get(date)!.add(row.kidId);

    if (isSundayDateString(date)) {
      const hour = manilaHour(row.checkedInAt);
      hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);
    }

    const cross = crossByService.get(row.service) ?? { checkIns: 0, fromOtherServices: 0 };
    cross.checkIns += 1;
    const home = kidById.get(row.kidId)?.service;
    if (home && home !== row.service) {
      cross.fromOtherServices += 1;
      otherServiceCheckIns += 1;
    }
    crossByService.set(row.service, cross);

    if (!servicesByKid.has(row.kidId)) servicesByKid.set(row.kidId, new Map());
    const counts = servicesByKid.get(row.kidId)!;
    counts.set(row.service, (counts.get(row.service) ?? 0) + 1);
  }

  const sundays = [...kidsByDate.keys()].filter(isSundayDateString).sort();
  const newVsReturning = sundays.map((date) => {
    let firstTime = 0;
    for (const kidId of kidsByDate.get(date)!) if (firstDateByKid.get(kidId) === date) firstTime += 1;
    return { date, firstTime, returning: kidsByDate.get(date)!.size - firstTime };
  });
  const sundayAges = sundays.map((date) => ({
    date,
    ages: [...kidsByDate.get(date)!].map((kidId) => kidById.get(kidId)?.age).filter((age) => age !== undefined),
  }));

  const hours = [...hourCounts.keys()];
  const sundayHours = hours.length
    ? Array.from({ length: Math.max(...hours) - Math.min(...hours) + 1 }, (_, i) => {
        const hour = Math.min(...hours) + i;
        return { hour, checkIns: hourCounts.get(hour) ?? 0 };
      })
    : [];

  const serviceNames = [...SERVICE_OPTIONS];
  for (const name of crossByService.keys()) if (!serviceNames.includes(name)) serviceNames.push(name);
  const crossService = serviceNames.map((service) => ({
    service,
    ...(crossByService.get(service) ?? { checkIns: 0, fromOtherServices: 0 }),
  }));

  // Kids who mostly check in somewhere other than their registered service.
  const serviceMismatch: ReportServiceMismatchKid[] = [];
  for (const [kidId, counts] of servicesByKid) {
    const kid = kidById.get(kidId);
    const total = [...counts.values()].reduce((sum, n) => sum + n, 0);
    if (!kid || total < SERVICE_MISMATCH_MIN_CHECK_INS) continue;
    const [usualService, usualCount] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (usualService === kid.service || (counts.get(kid.service) ?? 0) * 2 >= total) continue;
    serviceMismatch.push({ ...kidRef(kid), usualService, usualCount, totalCheckIns: total });
  }
  serviceMismatch.sort((a, b) => b.usualCount - a.usualCount || a.lastName.localeCompare(b.lastName));

  // Regulars who missed the most recent Sundays.
  const followUpSundays = allSundays.slice(-FOLLOW_UP_MISSED_SUNDAYS);
  const followUp: ReportFollowUpKid[] = [];
  if (followUpSundays.length === FOLLOW_UP_MISSED_SUNDAYS) {
    const cutoff = followUpSundays[0];
    for (const [kidId, days] of allDaysByKid) {
      const sorted = [...days].sort();
      const lastAttended = sorted.at(-1)!;
      const kid = kidById.get(kidId);
      if (!kid || sorted.length < FOLLOW_UP_MIN_DAYS || lastAttended >= cutoff) continue;
      followUp.push({ ...kidRef(kid), daysAttended: sorted.length, lastAttended });
    }
    followUp.sort((a, b) => b.daysAttended - a.daysAttended || (a.lastAttended < b.lastAttended ? 1 : -1));
  }

  return {
    totals: {
      checkIns: windowCheckIns,
      otherServiceCheckIns,
      latestSunday: newVsReturning.at(-1) ?? null,
    },
    newVsReturning,
    sundayAges,
    sundayHours,
    crossService,
    serviceMismatch,
    followUp,
    followUpSundays,
  };
}

// ---------------------------------------------------------------------------
// /reports/families

export interface SharedNumberKid extends ReportKidRef {
  guardianFirstName: string;
  guardianLastName: string;
}

export interface SharedNumberGroup {
  contactNumber: string;
  kids: SharedNumberKid[];
}

export interface FamiliesReport {
  totals: {
    guardianRecords: number;
    families: number;
    familiesWithSiblings: number;
    sharedNumbers: number;
    kidsOnSharedNumbers: number;
  };
  kidsPerFamily: ReportCountRow[];
  guardianGender: { male: number; female: number };
  siblingsSplitAcrossServices: number;
  sharedNumberGroups: SharedNumberGroup[];
}

// Guardians aren't deduplicated, so a family is approximated by contact number. A number
// with this many kids or more is almost certainly a shared/placeholder number, not one family.
export const SHARED_NUMBER_MIN_KIDS = 6;

// 09XXXXXXXXX, 639XXXXXXXXX and +639XXXXXXXXX are the same number.
function normalizeContactNumber(n: string): string {
  return n.replace(/^\+?63/, "0");
}

export async function getFamiliesReport(): Promise<FamiliesReport> {
  const rows = await db
    .select({
      id: kids.id,
      firstName: kids.firstName,
      lastName: kids.lastName,
      nickname: kids.nickname,
      service: kids.serviceAttending,
      guardianFirstName: guardians.firstName,
      guardianLastName: guardians.lastName,
      contactNumber: guardians.contactNumber,
      gender: guardians.gender,
    })
    .from(kids)
    .innerJoin(guardians, eq(kids.guardianId, guardians.id));

  const kidsByNumber = new Map<string, typeof rows>();
  let male = 0;
  let female = 0;
  for (const row of rows) {
    const key = normalizeContactNumber(row.contactNumber);
    if (!kidsByNumber.has(key)) kidsByNumber.set(key, []);
    kidsByNumber.get(key)!.push(row);
    if (row.gender === "Male") male += 1;
    else female += 1;
  }

  const sizeCounts = new Map<number, number>();
  const sharedNumberGroups: SharedNumberGroup[] = [];
  let familiesWithSiblings = 0;
  let siblingsSplitAcrossServices = 0;
  for (const [contactNumber, members] of kidsByNumber) {
    const size = members.length;
    if (size >= SHARED_NUMBER_MIN_KIDS) {
      sharedNumberGroups.push({
        contactNumber,
        kids: members
          .map(({ contactNumber: _n, gender: _g, ...kid }) => kid)
          .sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName)),
      });
      continue;
    }
    sizeCounts.set(size, (sizeCounts.get(size) ?? 0) + 1);
    if (size > 1) {
      familiesWithSiblings += 1;
      if (new Set(members.map((m) => m.service)).size > 1) siblingsSplitAcrossServices += 1;
    }
  }
  sharedNumberGroups.sort((a, b) => b.kids.length - a.kids.length);

  const kidsPerFamily = Array.from({ length: SHARED_NUMBER_MIN_KIDS - 1 }, (_, i) => {
    const size = i + 1;
    return { label: `${size} kid${size === 1 ? "" : "s"}`, count: sizeCounts.get(size) ?? 0 };
  });

  return {
    totals: {
      guardianRecords: rows.length,
      families: kidsByNumber.size - sharedNumberGroups.length,
      familiesWithSiblings,
      sharedNumbers: sharedNumberGroups.length,
      kidsOnSharedNumbers: sharedNumberGroups.reduce((sum, g) => sum + g.kids.length, 0),
    },
    kidsPerFamily,
    guardianGender: { male, female },
    siblingsSplitAcrossServices,
    sharedNumberGroups,
  };
}

// ---------------------------------------------------------------------------
// /reports/service-team

export interface ServiceTeamReport {
  totals: { members: number; withPhoto: number; male: number; female: number; unknownGender: number };
  ageGroups: { label: string; male: number; female: number; unknown: number }[];
  byService: { service: string; male: number; female: number; unknown: number }[];
  birthdaysThisMonth: number;
  invalidBirthdays: number;
}

const STM_AGE_GROUPS = [
  { label: "Under 13", min: 0, max: 12 },
  { label: "13–17", min: 13, max: 17 },
  { label: "18–24", min: 18, max: 24 },
  { label: "25–34", min: 25, max: 34 },
  { label: "35–44", min: 35, max: 44 },
  { label: "45–54", min: 45, max: 54 },
  { label: "55+", min: 55, max: Infinity },
];

// Anyone "younger" than this has a birthday that's almost certainly mistyped.
const STM_MIN_PLAUSIBLE_AGE = 8;

function ageOn(birthday: string, today: string): number {
  const [by, bm, bd] = birthday.split("-").map(Number);
  const [ty, tm, td] = today.split("-").map(Number);
  return ty - by - (tm < bm || (tm === bm && td < bd) ? 1 : 0);
}

export async function getServiceTeamReport(): Promise<ServiceTeamReport> {
  const rows = await db
    .select({
      birthday: serviceTeamMembers.birthday,
      gender: serviceTeamMembers.gender,
      service: serviceTeamMembers.serviceAttending,
      photoKey: serviceTeamMembers.photoKey,
    })
    .from(serviceTeamMembers);

  const today = manilaDateString();
  const genderKey = (g: string | null) => (g === "Male" ? "male" : g === "Female" ? "female" : "unknown");

  const ageGroups = STM_AGE_GROUPS.map((g) => ({ label: g.label, male: 0, female: 0, unknown: 0 }));
  const serviceMap = new Map<string, { male: number; female: number; unknown: number }>();
  for (const service of SERVICE_OPTIONS) serviceMap.set(service, { male: 0, female: 0, unknown: 0 });
  let invalidBirthdays = 0;
  let birthdaysThisMonth = 0;

  for (const row of rows) {
    const g = genderKey(row.gender);
    const age = ageOn(row.birthday, today);
    if (age < STM_MIN_PLAUSIBLE_AGE) invalidBirthdays += 1;
    else ageGroups[STM_AGE_GROUPS.findIndex((b) => age >= b.min && age <= b.max)][g] += 1;
    if (row.birthday.slice(5, 7) === today.slice(5, 7)) birthdaysThisMonth += 1;

    const bucket = serviceMap.get(row.service) ?? { male: 0, female: 0, unknown: 0 };
    bucket[g] += 1;
    serviceMap.set(row.service, bucket);
  }

  return {
    totals: {
      members: rows.length,
      withPhoto: rows.filter((r) => r.photoKey).length,
      male: rows.filter((r) => r.gender === "Male").length,
      female: rows.filter((r) => r.gender === "Female").length,
      unknownGender: rows.filter((r) => !r.gender).length,
    },
    ageGroups,
    byService: Array.from(serviceMap.entries()).map(([service, counts]) => ({ service, ...counts })),
    birthdaysThisMonth,
    invalidBirthdays,
  };
}
