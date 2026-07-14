import type { StylesConfig } from "react-select";
import { withAlpha } from "./themeUtils";

export interface SelectOption {
  value: string;
  label: string;
}

export const createSettingsSelectStyles = (
  textColor: string,
  backgroundColor: string
): StylesConfig<SelectOption, false> => {
  const border = withAlpha(textColor, 0.18);
  const surface = withAlpha(textColor, 0.08);
  const surfaceHover = withAlpha(textColor, 0.14);
  const surfaceActive = withAlpha(textColor, 0.24);
  const muted = withAlpha(textColor, 0.6);
  const menuBg = withAlpha(backgroundColor, 0.95);

  return {
    menuPortal: (provided) => ({
      ...provided,
      zIndex: 10001,
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 10001,
      backgroundColor: menuBg,
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      border: `1px solid ${border}`,
      borderRadius: 8,
      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)",
      overflow: "hidden",
      marginTop: 4,
      marginBottom: 4,
    }),
    menuList: (provided) => ({
      ...provided,
      backgroundColor: menuBg,
      padding: 4,
    }),
    option: (provided, state) => ({
      ...provided,
      color: textColor,
      backgroundColor: state.isSelected ? surfaceActive : state.isFocused ? surfaceHover : menuBg,
      cursor: "pointer",
      borderRadius: 6,
      padding: "8px 12px",
    }),
    control: (provided, state) => ({
      ...provided,
      backgroundColor: surface,
      borderColor: state.isFocused ? withAlpha(textColor, 0.35) : border,
      boxShadow: state.isFocused ? `0 0 0 1px ${withAlpha(textColor, 0.35)}` : "none",
      color: textColor,
      minHeight: 40,
      borderRadius: 8,
      cursor: "pointer",
    }),
    valueContainer: (provided) => ({ ...provided, color: textColor, padding: "2px 8px" }),
    singleValue: (provided) => ({ ...provided, color: textColor }),
    input: (provided) => ({ ...provided, color: textColor, margin: 0, padding: 0 }),
    placeholder: (provided) => ({ ...provided, color: muted }),
    indicatorSeparator: () => ({ display: "none" }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: muted,
      padding: 8,
    }),
  };
};
