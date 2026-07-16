import { useEffect, useRef, useState } from "react";
import { CorgiManager } from "./CorgiManager";
import { isCorgiModeEnabled, subscribeCorgiMode } from "./CorgiSettings";
import "./CorgiLayer.css";

/**
 * Decorative overlay host. Movement runs outside React via CorgiManager + rAF.
 * The layer node stays mounted so the manager can attach as soon as the setting turns on.
 */
export function CorgiLayer() {
  const layerRef = useRef<HTMLDivElement>(null);
  const managerRef = useRef<CorgiManager | null>(null);
  const [enabled, setEnabled] = useState(() => isCorgiModeEnabled());

  useEffect(() => subscribeCorgiMode(setEnabled), []);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    if (!enabled) {
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
  }, [enabled]);

  return (
    <div
      ref={layerRef}
      className="corgi-layer"
      data-enabled={enabled ? "1" : "0"}
      aria-hidden="true"
    />
  );
}
