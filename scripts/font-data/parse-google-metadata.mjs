// Strict recursive-descent parser for the Google Fonts TextFormat metadata subset.
// Repeated fields remain arrays, so nested fields cannot masquerade as root fields.
export function parseTextProto(text) {
  if (typeof text !== 'string' || text.length > 2_000_000) throw new Error('Invalid metadata size');
  const tokens = []; let offset = 0;
  const lexer = /\s+|#[^\n]*|\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[A-Za-z_][\w./+-]*|[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?|[{}<>:[\],;]/y;
  while (offset < text.length) {
    lexer.lastIndex = offset;
    const match = lexer.exec(text);
    if (!match) throw new Error(`Unsupported textproto syntax at offset ${offset}: ${text.slice(offset, offset + 32)}`);
    offset = lexer.lastIndex;
    const token = match[0];
    if (!/^\s|^#|^\/\//.test(token) && !token.startsWith('/*')) tokens.push(token);
  }
  let cursor = 0;
  function scalar(token) {
    if (token?.startsWith('"') || token?.startsWith("'")) {
      const body = token.slice(1, -1);
      return body.replace(/\\(x[\da-fA-F]{2}|[0-7]{1,3}|u[\da-fA-F]{4}|U[\da-fA-F]{8}|[abfnrtv\\'"?])/g, (_, seq) => {
        const simple = {a:'\x07',b:'\b',f:'\f',n:'\n',r:'\r',t:'\t',v:'\v','\\':'\\',"'":"'",'"':'"','?':'?'};
        if (seq in simple) return simple[seq];
        return String.fromCodePoint(parseInt(seq[0] === 'x' || seq[0] === 'u' || seq[0] === 'U' ? seq.slice(1) : seq, /^[xuU]/.test(seq) ? 16 : 8));
      });
    }
    if (/^[-+]?(?:\d|\.\d)/.test(token || '')) return Number(token);
    if (token === 'true') return true;
    if (token === 'false') return false;
    if (/^[A-Za-z_][\w./+-]*$/.test(token || '')) return token;
    throw new Error(`Invalid scalar ${token}`);
  }
  function value(depth) {
    const token = tokens[cursor++];
    if (token === '{' || token === '<') return message(token === '{' ? '}' : '>', depth + 1);
    if (token === '[') {
      const result = [];
      while (tokens[cursor] !== ']') { result.push(value(depth + 1)); if (tokens[cursor] === ',') cursor++; if (cursor >= tokens.length) throw new Error('Unclosed list'); }
      cursor++; return result;
    }
    let result = scalar(token);
    // TextFormat permits adjacent quoted strings as a single string value.
    while (typeof result === 'string' && /^['"]/.test(token || '') && /^['"]/.test(tokens[cursor] || '')) result += scalar(tokens[cursor++]);
    return result;
  }
  function message(close, depth = 0) {
    if (depth > 64) throw new Error('Metadata nesting limit exceeded');
    const fields = Object.create(null);
    while (cursor < tokens.length && tokens[cursor] !== close) {
      if (tokens[cursor] === ',' || tokens[cursor] === ';') { cursor++; continue; }
      const key = tokens[cursor++];
      if (!/^[A-Za-z_]\w*$/.test(key || '')) throw new Error(`Invalid field ${key}`);
      if (tokens[cursor] === ':') cursor++;
      else if (!['{','<'].includes(tokens[cursor])) throw new Error(`Expected colon or message after ${key}`);
      const item = value(depth);
      (fields[key] ||= []).push(...(Array.isArray(item) ? item : [item]));
    }
    if (close && tokens[cursor++] !== close) throw new Error(`Unclosed message: expected ${close}`);
    return fields;
  }
  return message(undefined);
}

export function parseGoogleMetadata(text, metadataPath, metadataSha) {
  const root = parseTextProto(text);
  const first = (node, key) => node?.[key]?.[0];
  const unique = values => [...new Set(values)];
  const family = first(root, 'name'), license = first(root, 'license');
  if (typeof family !== 'string' || !family || typeof license !== 'string' || !license) throw new Error(`Missing identity/license at ${metadataPath}`);
  const faces = (root.fonts || []).map(font => {
    const style = first(font,'style'), weight = first(font,'weight'), filename = first(font,'filename');
    if (!['normal','italic'].includes(style) || !Number.isFinite(weight) || weight < 1 || weight > 1000 || typeof filename !== 'string' || !filename) throw new Error(`Invalid font face in ${family}`);
    return { style, weight, filename };
  });
  if (!faces.length) throw new Error(`No font faces parsed in ${family}; refuse to assert technical verification`);
  const axes = Object.fromEntries((root.axes || []).map(axis => {
    const tag = first(axis,'tag'), min = first(axis,'min_value'), max = first(axis,'max_value');
    if (typeof tag !== 'string' || tag.length !== 4 || !Number.isFinite(min) || !Number.isFinite(max) || min > max) throw new Error(`Invalid axis in ${family}`);
    return [tag, {min, max}];
  }));
  if (unique((root.axes || []).map(axis=>first(axis,'tag'))).length !== (root.axes || []).length) throw new Error(`Duplicate axis in ${family}`);
  const source = first(root,'source');
  const repositoryUrl = first(source,'repository_url');
  return {
    family, designer: first(root,'designer') || '', license,
    categories: unique(root.category || []), subsets: unique(root.subsets || []), axes,
    weights: unique(faces.map(face=>face.weight)).sort((a,b)=>a-b), styles: unique(faces.map(face=>face.style)).sort(), faces,
    ...(typeof repositoryUrl === 'string' && /^https:\/\//.test(repositoryUrl) ? {repositoryUrl} : {}),
    metadataPath, metadataSha, schemaVersion: 2,
    technicalVerified: true,
  };
}
