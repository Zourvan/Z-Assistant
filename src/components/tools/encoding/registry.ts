import type { ToolkitSubTool } from "../ToolkitShell";
import type { EncodingToolkitGroup } from "./types";
import {
  Base64Panel,
  UrlPanel,
  HtmlPanel,
  UnicodePanel,
  AsciiPanel,
  HexTextPanel,
  MorsePanel,
  NatoPanel,
} from "./panels/EncodingPanels";
import { NumberBasesPanel } from "./panels/NumberPanels";
import { HashPanel, CrcPanel, HmacPanel } from "./panels/HashPanels";
import {
  PasswordPanel,
  PasswordStrengthPanel,
  PassphrasePanel,
  UuidPanel,
  JwtPanel,
  TotpPanel,
  RandomPanel,
  SecretPanel,
} from "./panels/SecurityPanels";
import { EscapePanel, SlugPanel, CasePanel, QrPanel, AesPanel } from "./panels/UtilityPanels";
import { ComingSoonPanel } from "./panels/ComingSoonPanel";

export const TOOLKIT_GROUPS: EncodingToolkitGroup[] = [
  "encoding",
  "hash",
  "encryption",
  "security",
  "certificates",
  "utilities",
];

export const SUB_TOOLS: ToolkitSubTool[] = [
  // Encoding
  { id: "base64", group: "encoding", keywords: ["base64", "encode", "decode", "file", "image"], component: Base64Panel },
  { id: "url", group: "encoding", keywords: ["url", "uri", "percent", "encode"], component: UrlPanel },
  { id: "html", group: "encoding", keywords: ["html", "entities", "&lt;", "amp"], component: HtmlPanel },
  { id: "unicode", group: "encoding", keywords: ["unicode", "\\u", "utf", "یونیکد"], component: UnicodePanel },
  { id: "ascii", group: "encoding", keywords: ["ascii", "code point", "اسکی"], component: AsciiPanel },
  { id: "hexText", group: "encoding", keywords: ["hex", "text", "هگز"], component: HexTextPanel },
  { id: "numberBases", group: "encoding", keywords: ["binary", "decimal", "hex", "octal", "bin", "dec", "دودویی"], component: NumberBasesPanel },
  { id: "morse", group: "encoding", keywords: ["morse", "مورس", "dot", "dash"], component: MorsePanel },
  { id: "nato", group: "encoding", keywords: ["nato", "phonetic", "alphabet", "alpha", "bravo"], component: NatoPanel },

  // Hash
  { id: "hash", group: "hash", keywords: ["sha", "sha1", "sha256", "digest", "هش"], component: HashPanel },
  { id: "crc", group: "hash", keywords: ["crc32", "adler", "checksum"], component: CrcPanel },
  { id: "hmac", group: "hash", keywords: ["hmac", "secret", "mac"], component: HmacPanel },
  { id: "md5", group: "hash", keywords: ["md5"], component: ComingSoonPanel, comingSoon: true },
  { id: "blake2", group: "hash", keywords: ["blake2", "blake"], component: ComingSoonPanel, comingSoon: true },

  // Encryption
  { id: "aes", group: "encryption", keywords: ["aes", "encrypt", "decrypt", "gcm"], component: AesPanel },
  { id: "rsa", group: "encryption", keywords: ["rsa", "key pair"], component: ComingSoonPanel, comingSoon: true },
  { id: "chacha20", group: "encryption", keywords: ["chacha", "chacha20"], component: ComingSoonPanel, comingSoon: true },
  { id: "ecc", group: "encryption", keywords: ["ecc", "elliptic", "curve"], component: ComingSoonPanel, comingSoon: true },
  { id: "pgp", group: "encryption", keywords: ["pgp", "gpg", "openpgp"], component: ComingSoonPanel, comingSoon: true },

  // Security
  { id: "password", group: "security", keywords: ["password", "generator", "رمز"], component: PasswordPanel },
  { id: "passwordStrength", group: "security", keywords: ["strength", "weak", "strong", "قدرت"], component: PasswordStrengthPanel },
  { id: "passphrase", group: "security", keywords: ["passphrase", "words", "عبارت"], component: PassphrasePanel },
  { id: "jwt", group: "security", keywords: ["jwt", "token", "bearer"], component: JwtPanel },
  { id: "totp", group: "security", keywords: ["totp", "otp", "2fa", "hotp"], component: TotpPanel },
  { id: "uuid", group: "security", keywords: ["uuid", "guid", "nil"], component: UuidPanel },
  { id: "secret", group: "security", keywords: ["secret", "api key", "webhook", "cookie"], component: SecretPanel },
  { id: "random", group: "security", keywords: ["random", "bytes", "hex", "تصادفی"], component: RandomPanel },

  // Certificates
  { id: "pemDer", group: "certificates", keywords: ["pem", "der", "crt", "cer", "certificate"], component: ComingSoonPanel, comingSoon: true },
  { id: "csr", group: "certificates", keywords: ["csr", "certificate request"], component: ComingSoonPanel, comingSoon: true },
  { id: "certViewer", group: "certificates", keywords: ["certificate", "x509", "san", "issuer"], component: ComingSoonPanel, comingSoon: true },
  { id: "sshKeys", group: "certificates", keywords: ["ssh", "openssh", "pem", "public key"], component: ComingSoonPanel, comingSoon: true },
  { id: "fingerprint", group: "certificates", keywords: ["fingerprint", "ssh", "certificate"], component: ComingSoonPanel, comingSoon: true },
  { id: "openssl", group: "certificates", keywords: ["openssl", "helper"], component: ComingSoonPanel, comingSoon: true },

  // Utilities
  { id: "qr", group: "utilities", keywords: ["qr", "qrcode", "wifi", "barcode"], component: QrPanel },
  { id: "barcode", group: "utilities", keywords: ["barcode", "ean", "code128", "pdf417"], component: ComingSoonPanel, comingSoon: true },
  { id: "slug", group: "utilities", keywords: ["slug", "url slug", "اسلاگ"], component: SlugPanel },
  { id: "case", group: "utilities", keywords: ["camel", "snake", "kebab", "pascal", "case"], component: CasePanel },
  { id: "escape", group: "utilities", keywords: ["escape", "json", "regex", "xml", "sql", "csv", "shell"], component: EscapePanel },
];

export function matchEncodingSearch(query: string, tool: ToolkitSubTool, t: (key: string) => string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const title = t(`tools.encodingToolkit.subTools.${tool.id}.title`).toLowerCase();
  const desc = t(`tools.encodingToolkit.subTools.${tool.id}.description`).toLowerCase();
  const group = t(`tools.encodingToolkit.groups.${tool.group}`).toLowerCase();
  return (
    title.includes(q) ||
    desc.includes(q) ||
    group.includes(q) ||
    tool.keywords.some((k) => k.toLowerCase().includes(q) || q.includes(k.toLowerCase()))
  );
}
