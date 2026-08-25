import { formatTicketAge, isUrgent } from '../utils/ticket';

interface Props { firedAt: string; }

// `text-red-400` kept literal for the urgent state — same legibility
// reasoning as `constants.ts`'s badge colors: dark `--danger` is the
// `-500` token tuned for backgrounds/borders, one shade darker than
// this hand-picked `-400` for small body text on near-black.
export function Timer({ firedAt }: Props) {
  const urgent = isUrgent(firedAt);
  const age = formatTicketAge(firedAt);

  return (
    <p className={`text-xs mt-1 ${urgent ? 'text-red-400 font-bold' : 'text-text-secondary'}`}>{age}</p>
  );
}
