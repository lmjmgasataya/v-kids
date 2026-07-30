export const KID_IMPORT_HEADERS = [
  "First Name",
  "Last Name",
  "Nickname",
  "Age",
  "Gender (Male/Female)",
  "Service Attending",
  "Guardian First Name",
  "Guardian Last Name",
  "Guardian Contact Number",
  "Guardian Gender (Male/Female)",
] as const;

const TEMPLATE_EXAMPLE_ROW = [
  "Alex",
  "Reyes",
  "Lex",
  "7",
  "Male",
  "9AM - Mandurriao",
  "Maria",
  "Reyes",
  "09171234567",
  "Female",
];

function escapeCsvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildKidImportTemplate(): string {
  return [KID_IMPORT_HEADERS, TEMPLATE_EXAMPLE_ROW]
    .map((row) => row.map(escapeCsvField).join(","))
    .join("\r\n");
}

export const SERVICE_TEAM_IMPORT_HEADERS = [
  "First Name",
  "Last Name",
  "Nickname",
  "Birthday (YYYY-MM-DD)",
  "Service Attending",
] as const;

const SERVICE_TEAM_TEMPLATE_EXAMPLE_ROW = ["Juan", "Dela Cruz", "Jun", "1995-04-12", "9AM - Mandurriao"];

export function buildServiceTeamImportTemplate(): string {
  return [SERVICE_TEAM_IMPORT_HEADERS, SERVICE_TEAM_TEMPLATE_EXAMPLE_ROW]
    .map((row) => row.map(escapeCsvField).join(","))
    .join("\r\n");
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ""));
}
