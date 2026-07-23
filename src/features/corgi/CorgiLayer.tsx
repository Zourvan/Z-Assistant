import { useEffect, useRef, useState } from "react";
import { CorgiManager } from "./CorgiManager";
import { getPetModeSettings, subscribePetModeSettings } from "./CorgiSettings";
import { SQUIGGLY_FILTERS_HTML } from "./squigglyFilters";
import type { PetModeSettings } from "./types";
import "./CorgiLayer.css";

/**
 * Decorative overlay host. Movement runs outside React via CorgiManager + rAF.
 * The layer node stays mounted so the manager can attach as soon as the setting turns on.
 */
export function CorgiLayer() {
  const layerRef = useRef<HTMLDivElement>(null);
  const managerRef = useRef<CorgiManager | null>(null);
  const [settings, setSettings] = useState<PetModeSettings>(() => getPetModeSettings());

  useEffect(() => subscribePetModeSettings(setSettings), []);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    const variants = settings.variants ?? [];
    if (!settings.enabled || !variants.length) {
      managerRef.current?.stop();
      managerRef.current = null;
      return;
    }

    const manager = new CorgiManager();
    managerRef.current = manager;
    manager.start(layer);

    return () => {
      manager.stop();
      if (managerRef.current === manager) managerRef.current = null;
    };
  }, [settings.enabled, settings.variants, settings.size, settings.speed]);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer || layer.querySelector("[data-squiggly-filters]")) return;
    const holder = document.createElement("div");
    holder.dataset.squigglyFilters = "1";
    holder.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none";
    holder.innerHTML = SQUIGGLY_FILTERS_HTML;
    layer.appendChild(holder);
  }, []);

  return (
    <div
      ref={layerRef}
      className="corgi-layer"
      data-enabled={settings.enabled ? "1" : "0"}
      aria-hidden="true"
    />
  );
}
