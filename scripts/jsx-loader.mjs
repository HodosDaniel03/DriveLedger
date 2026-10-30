import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/**
 * Recursive-descent / state-machine JSX-to-JS transpiler for Node v24 & browser dev server.
 * Converts JSX elements (<Tag a="1" b={x}>children</Tag>) into React.createElement(Tag, { a: "1", b: x }, ...children).
 */
export function transpileJsx(source) {
  let i = 0;
  const len = source.length;

  function isIdentStart(ch) {
    return /[A-Za-z_$]/.test(ch);
  }
  function isIdentChar(ch) {
    return /[A-Za-z0-9_$.-]/.test(ch);
  }

  // Context tracker to know whether '<' can be the start of a JSX tag vs less-than operator
  function canStartJsx(prevNonWsChar, prevWord) {
    if (!prevNonWsChar) return true;
    if ('([{,;:?=!&|+-*~^%<>'.includes(prevNonWsChar)) return true;
    if (['return', 'case', 'yield', 'throw', 'in', 'of', 'typeof', 'void', 'delete'].includes(prevWord)) {
      return true;
    }
    return false;
  }

  function parseCode(stopChar = null) {
    let out = '';
    let prevNonWs = '';
    let prevWord = '';

    while (i < len) {
      const ch = source[i];

      if (stopChar && ch === stopChar) {
        return out;
      }

      // Line comment
      if (ch === '/' && source[i + 1] === '/') {
        const start = i;
        i += 2;
        while (i < len && source[i] !== '\n') i++;
        out += source.slice(start, i);
        continue;
      }

      // Block comment
      if (ch === '/' && source[i + 1] === '*') {
        const start = i;
        i += 2;
        while (i < len && !(source[i] === '*' && source[i + 1] === '/')) i++;
        i += 2;
        out += source.slice(start, i);
        continue;
      }

      // Single or double quoted string
      if (ch === "'" || ch === '"') {
        const quote = ch;
        const start = i;
        i++;
        while (i < len && source[i] !== quote) {
          if (source[i] === '\\') i += 2;
          else i++;
        }
        i++;
        out += source.slice(start, i);
        prevNonWs = quote;
        prevWord = '';
        continue;
      }

      // Template literal
      if (ch === '`') {
        out += '`';
        i++;
        while (i < len && source[i] !== '`') {
          if (source[i] === '\\') {
            out += source.slice(i, i + 2);
            i += 2;
          } else if (source[i] === '$' && source[i + 1] === '{') {
            out += '${';
            i += 2;
            out += parseCode('}');
            if (source[i] === '}') {
              out += '}';
              i++;
            }
          } else {
            out += source[i];
            i++;
          }
        }
        if (source[i] === '`') {
          out += '`';
          i++;
        }
        prevNonWs = '`';
        prevWord = '';
        continue;
      }

      // Nested braces when stopChar === '}'
      if (ch === '{') {
        out += '{';
        i++;
        out += parseCode('}');
        if (source[i] === '}') {
          out += '}';
          i++;
        }
        prevNonWs = '}';
        prevWord = '';
        continue;
      }

      // Check for JSX tag start
      if (ch === '<' && canStartJsx(prevNonWs, prevWord)) {
        const next = source[i + 1];
        if (next === '>' || isIdentStart(next)) {
          const jsxExpr = parseJsxElement();
          out += jsxExpr;
          prevNonWs = ')';
          prevWord = '';
          continue;
        }
      }

      // Identifier word tracking
      if (isIdentStart(ch)) {
        const start = i;
        while (i < len && /[A-Za-z0-9_$]/.test(source[i])) i++;
        const word = source.slice(start, i);
        out += word;
        prevWord = word;
        prevNonWs = word[word.length - 1];
        continue;
      }

      if (!/\s/.test(ch)) {
        prevNonWs = ch;
        prevWord = '';
      }
      out += ch;
      i++;
    }

    return out;
  }

  function skipWs() {
    while (i < len && /\s/.test(source[i])) i++;
  }

  function parseJsxElement() {
    // Assumes source[i] === '<'
    i++; // consume '<'
    let tagName = '';
    if (source[i] === '>') {
      // Fragment <>
      i++; // consume '>'
      tagName = 'React.Fragment';
      const children = parseJsxChildren('');
      return `React.createElement(React.Fragment, null${children.length ? ', ' + children.join(', ') : ''})`;
    }

    const startTag = i;
    while (i < len && isIdentChar(source[i])) i++;
    tagName = source.slice(startTag, i);

    const isIntrinsic = /^[a-z]/.test(tagName) && !tagName.includes('.');
    const tagExpr = isIntrinsic ? JSON.stringify(tagName) : tagName;

    // Parse attributes
    const propsEntries = [];
    while (i < len) {
      skipWs();
      if (source[i] === '/' && source[i + 1] === '>') {
        i += 2;
        const propsCode = buildPropsCode(propsEntries);
        return `React.createElement(${tagExpr}, ${propsCode})`;
      }
      if (source[i] === '>') {
        i++;
        break;
      }
      if (source[i] === '{' && source[i + 1] === '.' && source[i + 2] === '.' && source[i + 3] === '.') {
        i += 4;
        const spreadExpr = parseCode('}');
        if (source[i] === '}') i++;
        propsEntries.push({ spread: true, expr: spreadExpr });
        continue;
      }

      // Attribute name
      const attrStart = i;
      while (i < len && /[A-Za-z0-9_:-]/.test(source[i])) i++;
      const attrName = source.slice(attrStart, i);
      if (!attrName) {
        // safety advance
        i++;
        continue;
      }
      skipWs();
      if (source[i] === '=') {
        i++; // consume '='
        skipWs();
        if (source[i] === "'" || source[i] === '"') {
          const q = source[i];
          const sStart = i;
          i++;
          while (i < len && source[i] !== q) {
            if (source[i] === '\\') i += 2;
            else i++;
          }
          i++;
          const rawStr = source.slice(sStart + 1, i - 1);
          propsEntries.push({ key: attrName, val: JSON.stringify(decodeHtmlEntities(rawStr)) });
        } else if (source[i] === '{') {
          i++; // consume '{'
          const expr = parseCode('}');
          if (source[i] === '}') i++;
          propsEntries.push({ key: attrName, val: `(${expr})` });
        }
      } else {
        propsEntries.push({ key: attrName, val: 'true' });
      }
    }

    const children = parseJsxChildren(tagName);
    const propsCode = buildPropsCode(propsEntries);
    return `React.createElement(${tagExpr}, ${propsCode}${children.length ? ', ' + children.join(', ') : ''})`;
  }

  function buildPropsCode(entries) {
    if (entries.length === 0) return 'null';
    const parts = entries.map((e) =>
      e.spread ? `...(${e.expr})` : `${JSON.stringify(e.key)}: ${e.val}`
    );
    return `{ ${parts.join(', ')} }`;
  }

  function parseJsxChildren(openingTagName) {
    const children = [];
    while (i < len) {
      // Check for closing tag </...>
      if (source[i] === '<' && source[i + 1] === '/') {
        i += 2;
        while (i < len && source[i] !== '>') i++;
        if (source[i] === '>') i++;
        return children;
      }

      // Nested JSX element
      if (source[i] === '<' && (source[i + 1] === '>' || isIdentStart(source[i + 1]))) {
        children.push(parseJsxElement());
        continue;
      }

      // JSX expression { ... }
      if (source[i] === '{') {
        i++; // consume '{'
        const expr = parseCode('}');
        if (source[i] === '}') i++;
        const withoutComments = expr.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '').trim();
        if (withoutComments.length > 0) {
          children.push(`(${expr})`);
        }
        continue;
      }

      // Plain JSX text
      const textStart = i;
      while (i < len && source[i] !== '<' && source[i] !== '{') {
        i++;
      }
      const rawText = source.slice(textStart, i);
      const cleaned = cleanJsxText(rawText);
      if (cleaned !== '') {
        children.push(JSON.stringify(decodeHtmlEntities(cleaned)));
      }
    }
    return children;
  }

  function cleanJsxText(raw) {
    const lines = raw.split(/\r?\n/);
    if (lines.length === 1) return lines[0];
    const trimmedLines = lines
      .map((line, idx) => {
        let s = line;
        if (idx > 0) s = s.replace(/^\s+/, '');
        if (idx < lines.length - 1) s = s.replace(/\s+$/, '');
        return s;
      })
      .filter((s) => s.length > 0);
    return trimmedLines.join(' ');
  }

  function decodeHtmlEntities(str) {
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&copy;/g, '©')
      .replace(/&Delta;/g, 'Δ');
  }

  const result = parseCode(null);
  if (!/import\s+React\b/.test(result)) {
    return `import React from 'react';\n${result}`;
  }
  return result;
}
