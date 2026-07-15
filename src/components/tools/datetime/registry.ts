import type { DateTimeToolkitGroup } from "./types";
import type { ToolkitSubTool } from "../ToolkitShell";
import { CalendarConverterPanel, DateFormatPanel, UnixTimestampPanel } from "./panels/CalendarPanels";
import {
  DateAddSubtractPanel,
  DateDifferencePanel,
  BusinessDaysPanel,
  WeekdayPanel,
  AgeCalculatorPanel,
  LeapYearPanel,
  IsoWeekPanel,
  DateRangePanel,
} from "./panels/CalculatorPanels";
import {
  TimeCalculatorPanel,
  DurationPanel,
  TimeUnitPanel,
  TimezonePanel,
  CountdownPanel,
  RelativeTimePanel,
  CronPanel,
  AddTimeToClockPanel,
} from "./panels/TimePanels";
import { OccasionsPanel } from "./panels/OccasionsPanel";

export interface SubToolEntry extends ToolkitSubTool {
  group: DateTimeToolkitGroup;
}

export const SUB_TOOLS: SubToolEntry[] = [
  {
    id: "calendarConverter",
    group: "calendar",
    keywords: ["jalali", "gregorian", "hijri", "شمسی", "میلادی", "قمری", "convert", "تبدیل", "datetime"],
    component: CalendarConverterPanel,
  },
  {
    id: "dateFormat",
    group: "calendar",
    keywords: ["format", "فرمت", "iso", "compact", "long"],
    component: DateFormatPanel,
  },
  {
    id: "dateAddSubtract",
    group: "calculator",
    keywords: ["add", "subtract", "plus", "minus", "جمع", "تفریق", "روز", "ماه", "سال"],
    component: DateAddSubtractPanel,
  },
  {
    id: "dateDifference",
    group: "calculator",
    keywords: ["difference", "diff", "between", "اختلاف", "فاصله"],
    component: DateDifferencePanel,
  },
  {
    id: "businessDays",
    group: "calculator",
    keywords: ["business", "working", "کاری", "تعطیل", "weekend"],
    component: BusinessDaysPanel,
  },
  {
    id: "weekday",
    group: "calculator",
    keywords: ["weekday", "day of week", "روز هفته", "پنجشنبه", "thursday"],
    component: WeekdayPanel,
  },
  {
    id: "age",
    group: "calculator",
    keywords: ["age", "birth", "سن", "تولد"],
    component: AgeCalculatorPanel,
  },
  {
    id: "leapYear",
    group: "calculator",
    keywords: ["leap", "کبیسه", "year"],
    component: LeapYearPanel,
  },
  {
    id: "timeCalculator",
    group: "time",
    keywords: ["time", "add time", "subtract", "ساعت", "جمع ساعت"],
    component: TimeCalculatorPanel,
  },
  {
    id: "addTimeToClock",
    group: "time",
    keywords: ["duration", "add to time", "مدت", "اضافه ساعت"],
    component: AddTimeToClockPanel,
  },
  {
    id: "duration",
    group: "time",
    keywords: ["duration", "مدت زمان", "days hours minutes"],
    component: DurationPanel,
  },
  {
    id: "timeUnit",
    group: "time",
    keywords: ["unit", "convert", "seconds", "minutes", "ثانیه", "میلی ثانیه"],
    component: TimeUnitPanel,
  },
  {
    id: "timezone",
    group: "time",
    keywords: ["timezone", "utc", "gmt", "tehran", "tokyo", "منطقه زمانی"],
    component: TimezonePanel,
  },
  {
    id: "countdown",
    group: "time",
    keywords: ["countdown", "شمارش معکوس", "نوروز"],
    component: CountdownPanel,
  },
  {
    id: "relativeTime",
    group: "time",
    keywords: ["relative", "ago", "later", "پیش", "دیگر", "قبل"],
    component: RelativeTimePanel,
  },
  {
    id: "unixTimestamp",
    group: "developer",
    keywords: ["unix", "timestamp", "epoch", "تایم استمپ", "milliseconds"],
    component: UnixTimestampPanel,
  },
  {
    id: "cron",
    group: "developer",
    keywords: ["cron", "schedule", "expression", "کرون"],
    component: CronPanel,
  },
  {
    id: "dateRange",
    group: "developer",
    keywords: ["range", "list", "generator", "بازه", "لیست تاریخ"],
    component: DateRangePanel,
  },
  {
    id: "isoWeek",
    group: "developer",
    keywords: ["iso", "week", "erp", "هفته iso"],
    component: IsoWeekPanel,
  },
  {
    id: "occasions",
    group: "occasions",
    keywords: ["holiday", "occasion", "تعطیل", "مناسبت", "نوروز", "عید"],
    component: OccasionsPanel,
  },
];

export const TOOLKIT_GROUPS: DateTimeToolkitGroup[] = ["calendar", "calculator", "time", "developer", "occasions"];

export function matchSubToolSearch(query: string, tool: ToolkitSubTool, t: (key: string) => string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const title = t(`tools.dateTimeToolkit.subTools.${tool.id}.title`).toLowerCase();
  const desc = t(`tools.dateTimeToolkit.subTools.${tool.id}.description`).toLowerCase();
  const group = t(`tools.dateTimeToolkit.groups.${tool.group}`).toLowerCase();
  return (
    title.includes(q) ||
    desc.includes(q) ||
    group.includes(q) ||
    tool.keywords.some((k) => k.toLowerCase().includes(q) || q.includes(k.toLowerCase()))
  );
}
