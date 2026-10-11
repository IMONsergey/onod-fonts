export type WorkbenchExportFormat = "css" | "tailwind-v4" | "tailwind-v3" | "json";
export type WorkbenchRole = "heading" | "body" | "ui";
export interface WorkbenchFontToken {
  role: WorkbenchRole;
  family: string;
  stack: string;
  fallback: string;
  fontSize?: number;
  weight: number;
  style: "normal" | "italic";
  lineHeight: number;
  tracking: number;
  sourceLabel: string;
  sourceUrl: string;
  sourceCss: string;
}
export interface WorkbenchExportConfig {
  version: 1;
  baseSize?: number;
  scaleRatio?: number;
  roles: WorkbenchFontToken[];
}
export const WORKBENCH_EXPORT_LABELS: Record<WorkbenchExportFormat, string> = {
  css: "CSS variables", "tailwind-v4": "Tailwind CSS v4", "tailwind-v3": "Tailwind CSS v3 (legacy)", json: "JSON tokens",
};
export function closestAvailableWeight(weights: readonly string[], target = 400) {
  const numeric = Array.from(new Set(weights.map(Number).filter(value => Number.isFinite(value) && value >= 1 && value <= 1000)));
  return numeric.length ? numeric.sort((a,b)=>Math.abs(a-target)-Math.abs(b-target)||a-b)[0] : target;
}
const size = (role: WorkbenchFontToken) => role.fontSize ?? 16;
const sourceHeader = (roles: WorkbenchFontToken[]) => {
  const snippets = [...new Set(roles.map(role=>role.sourceCss.trim()).filter(Boolean))];
  return snippets.length ? `${snippets.join('\n')}\n\n` : '';
};
const cssVariables = (roles: WorkbenchFontToken[]) => roles.map(role=>[
  `  --onod-font-${role.role}: ${role.stack};`,
  `  --onod-fallback-${role.role}: ${role.fallback};`,
  `  --onod-size-${role.role}: ${size(role)}px;`,
  `  --onod-weight-${role.role}: ${role.weight};`,
  `  --onod-style-${role.role}: ${role.style};`,
  `  --onod-line-${role.role}: ${role.lineHeight};`,
  `  --onod-tracking-${role.role}: ${role.tracking}em;`,
].join('\n')).join('\n');
const roleRules = (roles: WorkbenchFontToken[]) => roles.map(role=>`.onod-${role.role} {
  font-family: var(--onod-font-${role.role});
  font-size: var(--onod-size-${role.role});
  font-weight: var(--onod-weight-${role.role});
  font-style: var(--onod-style-${role.role});
  font-synthesis: none;
  line-height: var(--onod-line-${role.role});
  letter-spacing: var(--onod-tracking-${role.role});
}`).join('\n\n');
const buildCss = (config: WorkbenchExportConfig) => `${sourceHeader(config.roles)}:root {
${cssVariables(config.roles)}
}

${roleRules(config.roles)}`;
const buildTailwindV4 = (config: WorkbenchExportConfig) => `${sourceHeader(config.roles)}:root {
${cssVariables(config.roles)}
}

@theme inline {
${config.roles.map(role=>[
  `  --font-${role.role}: var(--onod-font-${role.role});`,
  `  --text-${role.role}: var(--onod-size-${role.role});`,
  `  --font-weight-${role.role}: var(--onod-weight-${role.role});`,
  `  --leading-${role.role}: var(--onod-line-${role.role});`,
  `  --tracking-${role.role}: var(--onod-tracking-${role.role});`,
].join('\n')).join('\n')}
}

/* Complete role classes preserve normal/italic and disable synthetic styles. */
${roleRules(config.roles)}`;
const js = (value: string) => JSON.stringify(value);
const buildTailwindV3 = (config: WorkbenchExportConfig) => `// Legacy Tailwind CSS v3 config. Save as tailwind.config.cjs.
// Load source CSS and matching role classes from the CSS export separately.
${config.roles.map(role=>`// ${role.role}: ${role.sourceCss}`).join('\n')}
module.exports = {
  theme: {
    extend: {
      fontFamily: {
${config.roles.map(role=>`        ${role.role}: [${js(role.family)}, ${js(role.fallback)}],`).join('\n')}
      },
      fontSize: {
${config.roles.map(role=>`        ${role.role}: ${js(`${size(role)}px`)},`).join('\n')}
      },
      fontWeight: {
${config.roles.map(role=>`        ${role.role}: ${js(String(role.weight))},`).join('\n')}
      },
      lineHeight: {
${config.roles.map(role=>`        ${role.role}: ${js(String(role.lineHeight))},`).join('\n')}
      },
      letterSpacing: {
${config.roles.map(role=>`        ${role.role}: ${js(`${role.tracking}em`)},`).join('\n')}
      },
    },
  },
};`;
const buildJson = (config: WorkbenchExportConfig) => JSON.stringify({
  version: config.version,
  scale: {baseSize: config.baseSize ?? 16, ratio: config.scaleRatio ?? 1.25},
  roles: Object.fromEntries(config.roles.map(role=>[role.role,{
    family: role.family, stack: role.stack, fallback: role.fallback,
    fontSize: `${size(role)}px`, weight: role.weight, style: role.style,
    lineHeight: role.lineHeight, tracking: `${role.tracking}em`,
    source: {label: role.sourceLabel, url: role.sourceUrl, css: role.sourceCss},
  }])),
},null,2);
export function buildWorkbenchExport(format: WorkbenchExportFormat, config: WorkbenchExportConfig) {
  if(format==='tailwind-v4') return buildTailwindV4(config);
  if(format==='tailwind-v3') return buildTailwindV3(config);
  if(format==='json') return buildJson(config);
  return buildCss(config);
}
