import type { ToolkitSubTool } from "../ToolkitShell";
import type { DeveloperToolkitGroup } from "./types";
import {
  JsonFormatterPanel,
  YamlJsonPanel,
  XmlPanel,
  CsvPanel,
  TomlPanel,
  IniPanel,
} from "./panels/DataPanels";
import {
  DiffPanel,
  CasePanel,
  SlugPanel,
  LoremPanel,
  TextStatsPanel,
  LineSorterPanel,
  RemoveDuplicatesPanel,
} from "./panels/TextPanels";
import {
  CodeFormatterPanel,
  CodeMinifierPanel,
  EscapePanel,
  RegexTesterPanel,
  RegexGeneratorPanel,
} from "./panels/CodePanels";
import {
  UrlParserPanel,
  QueryParamsPanel,
  HttpStatusPanel,
  MimeTypePanel,
  UserAgentPanel,
} from "./panels/WebPanels";
import {
  JwtDecoderPanel,
  CurlParserPanel,
  CurlGeneratorPanel,
  GraphqlPanel,
  OpenApiPanel,
} from "./panels/ApiPanels";
import {
  ChmodPanel,
  SemverPanel,
  GitignorePanel,
  ConventionalCommitPanel,
  DockerIgnorePanel,
  DockerTagsPanel,
  K8sConverterPanel,
  EnvEditorPanel,
} from "./panels/DevOpsPanels";
import { CidrPanel, IpConverterPanel, SubnetPanel, DnsBuilderPanel } from "./panels/NetworkPanels";
import {
  ColorPickerPanel,
  CssGradientPanel,
  BoxShadowPanel,
  BorderRadiusPanel,
  CssUnitPanel,
  FlexboxPanel,
  CssGridPanel,
  SvgOptimizerPanel,
} from "./panels/FrontendPanels";
import {
  TokenCounterPanel,
  MarkdownPreviewPanel,
  MarkdownTablePanel,
  MermaidPreviewPanel,
  JsonSchemaPanel,
} from "./panels/AiPanels";
import { UuidPanel, NanoidPanel, RandomPanel, ByteConverterPanel, NumberBasePanel } from "./panels/UtilityPanels";

export const TOOLKIT_GROUPS: DeveloperToolkitGroup[] = [
  "dataConverter",
  "textTools",
  "codeTools",
  "webTools",
  "apiTools",
  "devops",
  "network",
  "frontend",
  "aiDeveloper",
  "utility",
];

export const SUB_TOOLS: ToolkitSubTool[] = [
  // Data Converter
  { id: "jsonFormatter", group: "dataConverter", keywords: ["json", "format", "minify", "validate", "pretty"], component: JsonFormatterPanel },
  { id: "yamlJson", group: "dataConverter", keywords: ["yaml", "yml", "json", "convert"], component: YamlJsonPanel },
  { id: "xml", group: "dataConverter", keywords: ["xml", "json", "format", "convert"], component: XmlPanel },
  { id: "csv", group: "dataConverter", keywords: ["csv", "table", "json", "spreadsheet"], component: CsvPanel },
  { id: "toml", group: "dataConverter", keywords: ["toml", "json", "yaml", "config"], component: TomlPanel },
  { id: "ini", group: "dataConverter", keywords: ["ini", "config", "parse"], component: IniPanel },

  // Text Tools
  { id: "diff", group: "textTools", keywords: ["diff", "compare", "text", "changes"], component: DiffPanel },
  { id: "case", group: "textTools", keywords: ["camel", "snake", "kebab", "pascal", "case"], component: CasePanel },
  { id: "slug", group: "textTools", keywords: ["slug", "url", "seo"], component: SlugPanel },
  { id: "lorem", group: "textTools", keywords: ["lorem", "ipsum", "placeholder", "text"], component: LoremPanel },
  { id: "textStats", group: "textTools", keywords: ["words", "characters", "lines", "bytes", "count"], component: TextStatsPanel },
  { id: "lineSorter", group: "textTools", keywords: ["sort", "lines", "order"], component: LineSorterPanel },
  { id: "removeDuplicates", group: "textTools", keywords: ["duplicate", "unique", "lines"], component: RemoveDuplicatesPanel },

  // Code Tools
  { id: "codeFormatter", group: "codeTools", keywords: ["format", "javascript", "typescript", "html", "css", "sql"], component: CodeFormatterPanel },
  { id: "codeMinifier", group: "codeTools", keywords: ["minify", "compress", "code"], component: CodeMinifierPanel },
  { id: "escape", group: "codeTools", keywords: ["escape", "unescape", "json", "html", "regex", "sql"], component: EscapePanel },
  { id: "regexTester", group: "codeTools", keywords: ["regex", "regular expression", "test", "match"], component: RegexTesterPanel },
  { id: "regexGenerator", group: "codeTools", keywords: ["regex", "pattern", "email", "url", "generate"], component: RegexGeneratorPanel },

  // Web Tools
  { id: "urlParser", group: "webTools", keywords: ["url", "parse", "protocol", "host", "query"], component: UrlParserPanel },
  { id: "queryParams", group: "webTools", keywords: ["query", "params", "url", "string"], component: QueryParamsPanel },
  { id: "httpStatus", group: "webTools", keywords: ["http", "status", "404", "500"], component: HttpStatusPanel },
  { id: "mimeType", group: "webTools", keywords: ["mime", "content-type", "extension"], component: MimeTypePanel },
  { id: "userAgent", group: "webTools", keywords: ["user-agent", "browser", "parse"], component: UserAgentPanel },

  // API Tools
  { id: "curlParser", group: "apiTools", keywords: ["curl", "parse", "http", "request"], component: CurlParserPanel },
  { id: "curlGenerator", group: "apiTools", keywords: ["curl", "generate", "http", "request"], component: CurlGeneratorPanel },
  { id: "jwt", group: "apiTools", keywords: ["jwt", "token", "decode", "payload"], component: JwtDecoderPanel },
  { id: "graphql", group: "apiTools", keywords: ["graphql", "query", "format"], component: GraphqlPanel },
  { id: "openApi", group: "apiTools", keywords: ["openapi", "swagger", "api", "spec"], component: OpenApiPanel },

  // DevOps
  { id: "chmod", group: "devops", keywords: ["chmod", "permissions", "linux", "rwx"], component: ChmodPanel },
  { id: "semver", group: "devops", keywords: ["semver", "version", "major", "minor", "patch"], component: SemverPanel },
  { id: "gitignore", group: "devops", keywords: ["gitignore", "git", "ignore"], component: GitignorePanel },
  { id: "conventionalCommit", group: "devops", keywords: ["commit", "conventional", "feat", "fix"], component: ConventionalCommitPanel },
  { id: "dockerIgnore", group: "devops", keywords: ["dockerignore", "docker"], component: DockerIgnorePanel },
  { id: "dockerTags", group: "devops", keywords: ["docker", "tag", "image"], component: DockerTagsPanel },
  { id: "k8sConverter", group: "devops", keywords: ["kubernetes", "k8s", "cpu", "memory", "mi", "gi"], component: K8sConverterPanel },
  { id: "envEditor", group: "devops", keywords: ["env", "dotenv", "environment", "variables"], component: EnvEditorPanel },

  // Network
  { id: "cidr", group: "network", keywords: ["cidr", "subnet", "network", "ip"], component: CidrPanel },
  { id: "ipConverter", group: "network", keywords: ["ip", "integer", "convert"], component: IpConverterPanel },
  { id: "subnet", group: "network", keywords: ["subnet", "mask", "network"], component: SubnetPanel },
  { id: "dnsBuilder", group: "network", keywords: ["dns", "a", "aaaa", "cname", "mx", "txt"], component: DnsBuilderPanel },

  // Frontend
  { id: "colorPicker", group: "frontend", keywords: ["color", "hex", "rgb", "hsl", "picker"], component: ColorPickerPanel },
  { id: "cssGradient", group: "frontend", keywords: ["gradient", "css", "linear", "radial"], component: CssGradientPanel },
  { id: "boxShadow", group: "frontend", keywords: ["box-shadow", "css", "shadow"], component: BoxShadowPanel },
  { id: "borderRadius", group: "frontend", keywords: ["border-radius", "css", "rounded"], component: BorderRadiusPanel },
  { id: "cssUnit", group: "frontend", keywords: ["px", "rem", "em", "vw", "vh", "unit"], component: CssUnitPanel },
  { id: "flexbox", group: "frontend", keywords: ["flexbox", "flex", "css", "layout"], component: FlexboxPanel },
  { id: "cssGrid", group: "frontend", keywords: ["grid", "css", "layout"], component: CssGridPanel },
  { id: "svgOptimizer", group: "frontend", keywords: ["svg", "optimize", "minify"], component: SvgOptimizerPanel },

  // AI Developer
  { id: "tokenCounter", group: "aiDeveloper", keywords: ["token", "llm", "gpt", "count"], component: TokenCounterPanel },
  { id: "markdownPreview", group: "aiDeveloper", keywords: ["markdown", "md", "preview", "render"], component: MarkdownPreviewPanel },
  { id: "markdownTable", group: "aiDeveloper", keywords: ["markdown", "table", "generate"], component: MarkdownTablePanel },
  { id: "mermaid", group: "aiDeveloper", keywords: ["mermaid", "diagram", "chart", "flowchart"], component: MermaidPreviewPanel },
  { id: "jsonSchema", group: "aiDeveloper", keywords: ["json schema", "validate", "ajv"], component: JsonSchemaPanel },

  // Utility
  { id: "uuid", group: "utility", keywords: ["uuid", "guid", "v4", "v7", "generate"], component: UuidPanel },
  { id: "nanoid", group: "utility", keywords: ["nanoid", "id", "short", "unique"], component: NanoidPanel },
  { id: "random", group: "utility", keywords: ["random", "number", "string", "hex", "color"], component: RandomPanel },
  { id: "byteConverter", group: "utility", keywords: ["byte", "kb", "mb", "gb", "size"], component: ByteConverterPanel },
  { id: "numberBase", group: "utility", keywords: ["binary", "hex", "octal", "decimal", "base"], component: NumberBasePanel },
];

export function matchDeveloperSearch(query: string, tool: ToolkitSubTool, t: (key: string) => string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const title = t(`tools.developerToolkit.subTools.${tool.id}.title`).toLowerCase();
  const desc = t(`tools.developerToolkit.subTools.${tool.id}.description`).toLowerCase();
  const group = t(`tools.developerToolkit.groups.${tool.group}`).toLowerCase();
  return (
    title.includes(q) ||
    desc.includes(q) ||
    group.includes(q) ||
    tool.keywords.some((k) => k.toLowerCase().includes(q) || q.includes(k.toLowerCase()))
  );
}
