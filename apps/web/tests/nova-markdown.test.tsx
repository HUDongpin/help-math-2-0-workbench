import assert from 'node:assert/strict';
import test from 'node:test';
import {renderToStaticMarkup} from 'react-dom/server';

import {NovaMarkdown} from '../components/nova-markdown';

test('Nova replies render Markdown structure, preserved text diagrams, and accessible LaTeX', () => {
  const markup = renderToStaticMarkup(<NovaMarkdown text={`A **number line** helps us see where numbers are.

\`\`\`text
-3 -2 -1  0  1  2  3
 |  |  |  |  |  |  |
\`\`\`

- Numbers **to the right** get bigger.
- Negative temperatures can be written as $-2^\\circ\\mathrm{C}$.

$$-4 < -1$$`} />);

  assert.match(markup, /<strong>number line<\/strong>/u);
  assert.match(markup, /<pre><code class="language-text">-3 -2 -1  0  1  2  3/u);
  assert.match(markup, /<ul>/u);
  assert.match(markup, /<strong>to the right<\/strong>/u);
  assert.match(markup, /class="katex"/u);
  assert.match(markup, /class="katex-display"/u);
  assert.match(markup, /<math/u);
});

test('Nova Markdown never executes provider HTML or loads provider images and links', () => {
  const markup = renderToStaticMarkup(<NovaMarkdown text={`<script>alert('unsafe')</script>

![external image](https://example.test/tracker.png)

[external link](https://example.test/student)`} />);

  assert.doesNotMatch(markup, /<script|<img|<a\b|onerror|tracker\.png/iu);
  assert.match(markup, /<span>external link<\/span>/u);
});
