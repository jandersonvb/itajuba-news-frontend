import { cx } from '@/lib/styles';
import Icon, { type IconName } from './admin/Icon';

type Tone = 'info' | 'success' | 'warning' | 'error';

/** Neutral for information, green for success, red only for errors. */
const tones: Record<Tone, { icon: IconName; box: string; mark: string }> = {
  info: { icon: 'info', box: 'border-[#e4e4e7] bg-[#f8f8f9] text-[#27272a]', mark: 'text-[#52525b]' },
  success: { icon: 'check', box: 'border-[#cce8d6] bg-[#f2faf5] text-[#14532d]', mark: 'text-[#16a34a]' },
  warning: { icon: 'warning', box: 'border-[#f0dfaa] bg-[#fffbeb] text-[#713f12]', mark: 'text-[#ca8a04]' },
  error: { icon: 'alert', box: 'border-[#f4cdc9] bg-[#fef4f3] text-[#8f1d17]', mark: 'text-[#dc2626]' },
};

/**
 * Message of the login screens: icon, optional title and text, colored by tone. `spaced` adds the
 * gap above it; inside a form, the form's own gap is used instead.
 */
export default function Alert({ tone, title, spaced = true, className, children }: { tone: Tone; title?: string; spaced?: boolean; className?: string; children: React.ReactNode }) {
  const look = tones[tone];
  return (
    <div className={cx('flex items-start gap-3 rounded-[10px] border px-4 py-3.5 text-14 leading-[1.5] [&_a]:font-bold [&_a]:underline [&_a]:underline-offset-2', spaced && 'mt-[22px]', look.box, className)} role={tone === 'error' ? 'alert' : 'status'}>
      <Icon name={look.icon} className={cx('mt-px size-[18px]', look.mark)}/>
      <div>
        {title && <b className="mb-0.5 block font-bold">{title}</b>}
        <p className="opacity-90">{children}</p>
      </div>
    </div>
  );
}
