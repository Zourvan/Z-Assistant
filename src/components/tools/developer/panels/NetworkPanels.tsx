import { useState, useMemo } from "react";
import { useI18n } from "../../../../i18n/LanguageProvider";
import { ToolToolbar, ToolColumn, ToolTextarea, ToolField, ToolOutputList, ToolWorkspace } from "../../shared";
import { parseCidr, ipToNumber, numberToIp, calcSubnet } from "../utils/network";

export function CidrPanel() {
  const { t } = useI18n();
  const [input, setInput] = useState("192.168.1.0/24");

  const info = useMemo(() => parseCidr(input), [input]);

  return (
    <>
      <ToolField label="CIDR" value={input} onChange={setInput} dir="ltr" placeholder="192.168.1.0/24" />
      {info && (
        <ToolOutputList
          items={[
            { label: t("tools.developerToolkit.cidr.network"), value: info.network },
            { label: t("tools.developerToolkit.cidr.broadcast"), value: info.broadcast },
            { label: t("tools.developerToolkit.cidr.firstHost"), value: info.firstHost },
            { label: t("tools.developerToolkit.cidr.lastHost"), value: info.lastHost },
            { label: t("tools.developerToolkit.cidr.hostCount"), value: String(info.hostCount) },
            { label: t("tools.developerToolkit.cidr.subnetMask"), value: info.subnetMask },
          ]}
          columns={2}
        />
      )}
    </>
  );
}

export function IpConverterPanel() {
  const { t } = useI18n();
  const [ip, setIp] = useState("192.168.1.1");
  const [num, setNum] = useState("");

  const ipAsNum = useMemo(() => ipToNumber(ip) ?? "—", [ip]);
  const numAsIp = useMemo(() => (num ? numberToIp(num) ?? "—" : ""), [num]);

  return (
    <ToolWorkspace layout="split">
      <ToolColumn>
        <ToolField label="IP" value={ip} onChange={setIp} dir="ltr" />
        <ToolField label={t("tools.developerToolkit.ip.number")} value={ipAsNum} readOnly dir="ltr" />
      </ToolColumn>
      <ToolColumn>
        <ToolField label={t("tools.developerToolkit.ip.number")} value={num} onChange={setNum} dir="ltr" />
        <ToolField label="IP" value={numAsIp} readOnly dir="ltr" />
      </ToolColumn>
    </ToolWorkspace>
  );
}

export function SubnetPanel() {
  const { t } = useI18n();
  const [ip, setIp] = useState("192.168.1.0");
  const [prefix, setPrefix] = useState("24");

  const info = useMemo(() => calcSubnet(ip, Number(prefix)), [ip, prefix]);

  return (
    <>
      <ToolToolbar className="tools-toolbar--fields">
        <ToolField label="IP" value={ip} onChange={setIp} dir="ltr" compact />
        <ToolField label={t("tools.developerToolkit.subnet.prefix")} value={prefix} onChange={setPrefix} type="number" dir="ltr" compact />
      </ToolToolbar>
      {info && (
        <ToolOutputList
          items={[
            { label: t("tools.developerToolkit.cidr.network"), value: info.network },
            { label: t("tools.developerToolkit.cidr.broadcast"), value: info.broadcast },
            { label: t("tools.developerToolkit.cidr.firstHost"), value: info.firstHost },
            { label: t("tools.developerToolkit.cidr.lastHost"), value: info.lastHost },
            { label: t("tools.developerToolkit.cidr.hostCount"), value: String(info.hostCount) },
          ]}
          columns={2}
        />
      )}
    </>
  );
}

type DnsType = "A" | "AAAA" | "CNAME" | "TXT" | "MX" | "SRV";

export function DnsBuilderPanel() {
  const { t } = useI18n();
  const [type, setType] = useState<DnsType>("A");
  const [name, setName] = useState("www");
  const [value, setValue] = useState("192.168.1.1");
  const [ttl, setTtl] = useState("3600");
  const [priority, setPriority] = useState("10");

  const record = useMemo(() => {
    const n = name.trim() || "@";
    const ttlVal = ttl || "3600";
    switch (type) {
      case "A":
        return `${n}\t${ttlVal}\tIN\tA\t${value}`;
      case "AAAA":
        return `${n}\t${ttlVal}\tIN\tAAAA\t${value}`;
      case "CNAME":
        return `${n}\t${ttlVal}\tIN\tCNAME\t${value}`;
      case "TXT":
        return `${n}\t${ttlVal}\tIN\tTXT\t"${value}"`;
      case "MX":
        return `${n}\t${ttlVal}\tIN\tMX\t${priority}\t${value}`;
      case "SRV":
        return `_service._proto.${n}\t${ttlVal}\tIN\tSRV\t${priority}\t0\t8080\t${value}`;
      default:
        return "";
    }
  }, [type, name, value, ttl, priority]);

  const types: DnsType[] = ["A", "AAAA", "CNAME", "TXT", "MX", "SRV"];

  return (
    <>
      <ToolToolbar>
        <div className="tools-toggle tools-toggle--wrap">
          {types.map((ty) => (
            <button key={ty} type="button" className={`tools-toggle__btn ${type === ty ? "tools-toggle__btn--active" : ""}`} onClick={() => setType(ty)}>
              {ty}
            </button>
          ))}
        </div>
      </ToolToolbar>
      <ToolToolbar className="tools-toolbar--fields">
        <ToolField label={t("tools.developerToolkit.dns.name")} value={name} onChange={setName} dir="ltr" compact />
        <ToolField label={t("tools.developerToolkit.dns.value")} value={value} onChange={setValue} dir="ltr" compact />
        <ToolField label="TTL" value={ttl} onChange={setTtl} dir="ltr" compact />
        {(type === "MX" || type === "SRV") && <ToolField label={t("tools.developerToolkit.dns.priority")} value={priority} onChange={setPriority} dir="ltr" compact />}
      </ToolToolbar>
      <ToolTextarea label={t("tools.developerToolkit.common.output")} value={record} readOnly dir="ltr" />
    </>
  );
}
