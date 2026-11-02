import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DEFAULT_OG_IMAGE } from '@/lib/seo';

// Share image of every page; articles with a photo use the photo instead. Generated at build time.
export const alt = DEFAULT_OG_IMAGE.alt;
export const size = { width: DEFAULT_OG_IMAGE.width, height: DEFAULT_OG_IMAGE.height };
export const contentType = 'image/png';

const logo = 'data:image/png;base64,' + (await readFile(join(process.cwd(), 'public/logo-dark.png'), 'base64'));

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#141416',
        }}
      >
        {/* logo-dark.png is 400×220 */}
        <img src={logo} width={560} height={308} alt=""/>
        <div style={{ marginTop: 28, color: '#fff', fontSize: 48, letterSpacing: '-0.01em' }}>A cidade acontece aqui.</div>
        <div style={{ width: 120, height: 8, marginTop: 32, background: '#e3141d' }}/>
      </div>
    ),
    size,
  );
}
