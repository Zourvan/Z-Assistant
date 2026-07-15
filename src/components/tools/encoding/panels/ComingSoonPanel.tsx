import { Construction } from "lucide-react";
import { useI18n } from "../../../../i18n/LanguageProvider";

export function ComingSoonPanel() {
  const { t } = useI18n();

  return (
    <div className="tools-coming-soon">
      <Construction size={28} className="tools-coming-soon__icon" aria-hidden />
      <p className="tools-coming-soon__text">{t("tools.encodingToolkit.comingSoonMessage")}</p>
    </div>
  );
}
