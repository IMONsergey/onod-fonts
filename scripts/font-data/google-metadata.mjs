const allQuoted = (text, key) => Array.from(text.matchAll(new RegExp(`^${key}:\\s*"([^"]*)"`, 'gm')), match => match[1]);
const firstQuoted = (text, key) => allQuoted(text, key)[0] || '';
const firstNumber = (text, key) => {
  const match = text.match(new RegExp(`^${key}:\\s*(-?\\d+(?:\\.\\d+)?)`, 'm'));
  return match ? Number(match[1]) : undefined;
};
const blocks = (text, blockName) => Array.from(text.matchAll(new RegExp(`${blockName}\\s*\\{([\\s\\S]*?)\\n\\}`, 'g')), match => match[1].replace(/^[ \t]+/gm, ''));

export const parseMetadata = (text, metadataPath, metadataSha) => {
  const axes = {};
  for (const block of blocks(text, 'axes')) {
    const tag = firstQuoted(block, 'tag');
    const min = firstNumber(block, 'min_value');
    const max = firstNumber(block, 'max_value');
    if (tag && Number.isFinite(min) && Number.isFinite(max)) axes[tag] = { min, max };
  }

  const weights = [];
  const styles = [];
  for (const block of blocks(text, 'fonts')) {
    const weight = firstNumber(block, 'weight');
    const style = firstQuoted(block, 'style');
    if (style === 'normal' && Number.isFinite(weight)) weights.push(weight);
    if (style) styles.push(style);
  }

  const repositoryUrl = firstQuoted(text, 'repository_url') || undefined;
  return {
    family: firstQuoted(text, 'name'),
    designer: firstQuoted(text, 'designer'),
    license: firstQuoted(text, 'license'),
    categories: Array.from(new Set(allQuoted(text, 'category'))),
    subsets: Array.from(new Set(allQuoted(text, 'subsets'))),
    axes,
    weights: Array.from(new Set(weights)).sort((a, b) => a - b),
    styles: Array.from(new Set(styles)).sort(),
    ...(repositoryUrl ? { repositoryUrl } : {}),
    metadataPath,
    metadataSha,
  };
};
