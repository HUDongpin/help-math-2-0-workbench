'use client';

import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';

/**
 * Render provider-authored learning text without ever enabling provider HTML.
 * Links are left as readable text and images are discarded so a model reply
 * cannot create an external request or an unexpected navigation surface.
 */
export function NovaMarkdown({text}: {text: string}) {
  // remark-math intentionally treats a one-line `$$formula$$` as inline math.
  // Luna sometimes returns that compact spelling even when it intends a
  // display equation, so normalize only whole-line pairs before parsing.
  const normalizedText = text.replace(
    /^(\s*)\$\$([^\n]+)\$\$\s*$/gmu,
    (_match, indentation: string, formula: string) =>
      `${indentation}$$\n${formula}\n${indentation}$$`,
  );

  return <div className="lesson-shell2__nova-markdown">
    <ReactMarkdown
      components={{
        a: ({children}) => <span>{children}</span>,
        img: () => null,
      }}
      rehypePlugins={[[rehypeKatex, {
        strict: false,
        throwOnError: false,
        trust: false,
      }]]}
      remarkPlugins={[remarkMath]}
      skipHtml
    >
      {normalizedText}
    </ReactMarkdown>
  </div>;
}
