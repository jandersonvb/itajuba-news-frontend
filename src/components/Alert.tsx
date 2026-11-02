import Icon, { type IconName } from './admin/Icon';

type Tone = 'info' | 'success' | 'warning' | 'error';

const icons: Record<Tone, IconName> = { info: 'info', success: 'check', warning: 'warning', error: 'alert' };

/** Message of the login screens: icon, optional title and text, colored by tone. Red is for errors only. */
export default function Alert({ tone, title, children }: { tone: Tone; title?: string; children: React.ReactNode }) {
  return (
    <div className={'alert ' + tone} role={tone === 'error' ? 'alert' : 'status'}>
      <Icon name={icons[tone]}/>
      <div>
        {title && <b>{title}</b>}
        <p>{children}</p>
      </div>
    </div>
  );
}
