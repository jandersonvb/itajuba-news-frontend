import { isPending } from '@/lib/site';

/** Mailto link to the address, or the plain text while it is still a "[PREENCHER: ...]" placeholder. */
export default function MailLink({ address }: { address: string }) {
  return isPending(address) ? <span>{address}</span> : <a href={'mailto:' + address}>{address}</a>;
}
