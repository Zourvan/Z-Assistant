export interface Occasion {
  month: number;
  day: number;
  calendar: "jalali" | "hijri" | "gregorian";
  key: string;
  official?: boolean;
}

export const OCCASIONS: Occasion[] = [
  { month: 1, day: 1, calendar: "jalali", key: "nowruz", official: true },
  { month: 1, day: 2, calendar: "jalali", key: "nowruzHoliday", official: true },
  { month: 1, day: 3, calendar: "jalali", key: "nowruzHoliday", official: true },
  { month: 1, day: 4, calendar: "jalali", key: "nowruzHoliday", official: true },
  { month: 1, day: 12, calendar: "jalali", key: "revolutionDay", official: true },
  { month: 1, day: 13, calendar: "jalali", key: "natureDay", official: true },
  { month: 3, day: 14, calendar: "jalali", key: "deathKhomeini", official: true },
  { month: 3, day: 15, calendar: "jalali", key: "uprisingKhordad", official: true },
  { month: 11, day: 22, calendar: "jalali", key: "victoryRevolution", official: true },
  { month: 12, day: 29, calendar: "jalali", key: "nationalOilDay", official: true },
  { month: 1, day: 10, calendar: "hijri", key: "ashura" },
  { month: 3, day: 17, calendar: "hijri", key: "mabath" },
  { month: 9, day: 1, calendar: "hijri", key: "ramadanStart" },
  { month: 10, day: 1, calendar: "hijri", key: "eidFitr", official: true },
  { month: 12, day: 10, calendar: "hijri", key: "eidAdha", official: true },
  { month: 1, day: 1, calendar: "gregorian", key: "newYear" },
  { month: 12, day: 25, calendar: "gregorian", key: "christmas" },
  { month: 2, day: 14, calendar: "gregorian", key: "valentines" },
  { month: 10, day: 31, calendar: "gregorian", key: "halloween" },
];

export function findOccasionsForDate(jalali: string, hijri: string, gregorian: string) {
  const parseJ = (s: string) => {
    const [y, m, d] = s.split(/[/-]/).map(Number);
    return { y, m, d };
  };
  const j = parseJ(jalali);
  const h = parseJ(hijri);
  const g = parseJ(gregorian);

  return OCCASIONS.filter((o) => {
    if (o.calendar === "jalali") return o.month === j.m && o.day === j.d;
    if (o.calendar === "hijri") return o.month === h.m && o.day === h.d;
    return o.month === g.m && o.day === g.d;
  });
}
