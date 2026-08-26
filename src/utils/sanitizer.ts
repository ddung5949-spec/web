/**
 * Lightweight & Robust HTML Sanitizer
 * Removes harmful scripts, inline event handlers (onload, onerror, onclick),
 * dangerous javascript: urls and malicious tags while preserving rich text formatting.
 */

const ALLOWED_TAGS = new Set([
  'p', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'sub', 'sup',
  'blockquote', 'q', 'pre', 'code',
  'ul', 'ol', 'li',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
  'div', 'span', 'section', 'article',
  'img', 'figure', 'figcaption',
  'a',
  'iframe',
]);

const ALLOWED_ATTRS = new Set([
  'href', 'src', 'alt', 'title', 'class', 'style', 'width', 'height',
  'target', 'rel', 'colspan', 'rowspan', 'align', 'valign',
  'allow', 'allowfullscreen', 'frameborder', 'referrerpolicy',
  'data-author', 'data-id', 'id'
]);

export function sanitizeHtml(rawHtml: string): string {
  if (!rawHtml || typeof rawHtml !== 'string') return '';

  try {
    if (typeof DOMParser === 'undefined') {
      // Fallback for SSR or non-browser env
      return rawHtml
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+="[^"]*"/gi, '')
        .replace(/on\w+='[^']*'/gi, '');
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, 'text/html');

    function cleanNode(node: Node) {
      const children = Array.from(node.childNodes);
      for (const child of children) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          const el = child as HTMLElement;
          const tagName = el.tagName.toLowerCase();

          // Reject disallowed tags
          if (!ALLOWED_TAGS.has(tagName)) {
            // Unwrap or remove
            if (['script', 'style', 'link', 'meta', 'object', 'embed'].includes(tagName)) {
              el.remove();
              continue;
            } else {
              // Convert to text or preserve inner elements
              const textNode = doc.createTextNode(el.textContent || '');
              el.replaceWith(textNode);
              continue;
            }
          }

          // Filter attributes
          const attrs = Array.from(el.attributes);
          for (const attr of attrs) {
            const attrName = attr.name.toLowerCase();
            const attrVal = attr.value.trim().toLowerCase();

            // Strip event handlers
            if (attrName.startsWith('on')) {
              el.removeAttribute(attr.name);
              continue;
            }

            // Strip javascript: / vbscript: urls
            if (
              (attrName === 'href' || attrName === 'src') &&
              (attrVal.startsWith('javascript:') || attrVal.startsWith('data:text/html') || attrVal.startsWith('vbscript:'))
            ) {
              el.removeAttribute(attr.name);
              continue;
            }

            // For links, enforce secure rel
            if (tagName === 'a' && attrName === 'target' && el.getAttribute('target') === '_blank') {
              el.setAttribute('rel', 'noopener noreferrer');
            }

            // Check against allowed attributes
            if (!ALLOWED_ATTRS.has(attrName)) {
              el.removeAttribute(attr.name);
            }
          }

          // Recursively clean children
          cleanNode(el);
        }
      }
    }

    cleanNode(doc.body);
    return doc.body.innerHTML;
  } catch (err) {
    console.warn('HTML Sanitization error:', err);
    return rawHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }
}
