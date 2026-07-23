import { useState, useMemo } from "react";
import { useI18n } from "../../../../i18n/LanguageProvider";
import { ToolWorkspace, ToolError, ToolOutputList } from "../../shared";
import { ToolDatePicker } from "../ToolDatePicker";
import { parseDateTime, formatAllCalendars } from "../utils/calendars";
import { findOccasionsForDate, OCCASIONS } from "../utils/occasions";

export function OccasionsPanel() {
  const { t } = useI18n();
  const [input, setInput] = useState("");

  const matches = useMemo(() => {
    const parsed = parseDateTime(input);
    if (!parsed) return null;
    const cals = formatAllCalendars(parsed.date);
    const found = findOccasionsForDate(cals.jalali, cals.hijri, cals.gregorian);
    return {
      calendars: cals,
      occasions: found.map((o) => ({
        label: t(`tools.dateTimeToolkit.occasions.items.${o.key}`),
        value: o.official ? t("tools.dateTimeToolkit.occasions.official") : t("tools.dateTimeToolkit.occasions.cultural"),
      })),
    };
  }, [input, t]);

  const upcoming = useMemo(
    () =>
      OCCASIONS.slice(0, 8).map((o) => ({
        label: t(`tools.dateTimeToolkit.occasions.items.${o.key}`),
        value: `${o.calendar} ${o.month}/${o.day}`,
      })),
    [t],
  );

  return (
    <ToolWorkspace layout="stack">
      <ToolDatePicker
        label={t("tools.dateTimeToolkit.common.input")}
        value={input}
        onChange={setInput}
        placeholder="1405/04/25"
        hint={t("tools.dateTimeToolkit.occasions.hint")}
      />
      {input && !matches ? (
        <ToolError message={t("tools.dateTimeToolkit.errors.invalidDate")} />
      ) : matches ? (
        <>
          <ToolOutputList
            items={[
              { label: t("tools.dateTimeToolkit.calendars.jalali"), value: matches.calendars.jalali },
              { label: t("tools.dateTimeToolkit.calendars.gregorian"), value: matches.calendars.gregorian },
              { label: t("tools.dateTimeToolkit.calendars.hijri"), value: matches.calendars.hijri },
            ]}
          />
          {matches.occasions.length > 0 ? (
            <ToolOutputList items={matches.occasions} columns={1} />
          ) : (
            <ToolOutputList items={[{ label: t("tools.dateTimeToolkit.occasions.none"), value: "—" }]} />
          )}
        </>
      ) : (
        <ToolOutputList items={upcoming} columns={1} />
      )}
    </ToolWorkspace>
  );
}
