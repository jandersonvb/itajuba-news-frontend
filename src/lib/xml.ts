const ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };

/** Text safe inside XML elements and attributes. Also drops the control characters XML 1.0 rejects. */
export const xmlEscape = (text: string) =>
  text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F￾￿]/g, '').replace(/[&<>"']/g, (c) => ENTITIES[c]);

export const xmlResponse = (body: string, contentType: string) =>
  new Response('<?xml version="1.0" encoding="UTF-8"?>\n' + body, {
    headers: { 'Content-Type': contentType + '; charset=utf-8' },
  });
