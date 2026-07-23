type CronField = "minute" | "hour" | "dayOfMonth" | "month" | "dayOfWeek";

function describeField(value: string, type: CronField): string {
  if (value === "*") {
    if (type === "minute") return "every minute";
    if (type === "hour") return "every hour";
    if (type === "dayOfMonth") return "every day";
    if (type === "month") return "every month";
    return "every day of week";
  }
  if (value.startsWith("*/")) {
    const step = value.slice(2);
    return `every ${step} ${type === "minute" ? "minutes" : type === "hour" ? "hours" : "units"}`;
  }
  if (type === "hour" && /^\d+$/.test(value)) return `at ${value.padStart(2, "0")}:00`;
  if (type === "minute" && /^\d+$/.test(value)) return `at minute ${value}`;
  return value;
}

export function interpretCron(expression: string): string[] {
  const parts = expression.trim().split(/\s+/);
  if (parts.length < 5) return ["Invalid cron expression (need 5 fields)"];

  const [minute, hour, dom, month, dow] = parts;
  const lines: string[] = [];

  if (minute !== "*" && hour !== "*" && dom === "*" && month === "*" && dow === "*") {
    lines.push(`Every day at ${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`);
    return lines;
  }

  lines.push(`Minute: ${describeField(minute, "minute")}`);
  lines.push(`Hour: ${describeField(hour, "hour")}`);
  lines.push(`Day of month: ${describeField(dom, "dayOfMonth")}`);
  lines.push(`Month: ${describeField(month, "month")}`);
  lines.push(`Day of week: ${describeField(dow, "dayOfWeek")}`);

  return lines;
}

export function buildCron(fields: { minute: string; hour: string; dom: string; month: string; dow: string }): string {
  return `${fields.minute} ${fields.hour} ${fields.dom} ${fields.month} ${fields.dow}`;
}
