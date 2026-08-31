import { formatTicketAge, isUrgent } from "@/features/kitchen/utils/ticket";

interface Props {
  firedAt: string | null;
}

export const Timer = ({ firedAt }: Props) => {
  const urgent = isUrgent(firedAt);
  const age = formatTicketAge(firedAt);

  return (
    <p
      className={`text-xs mt-1 ${urgent ? "text-red-400 font-bold" : "text-text-secondary"}`}
    >
      {age}
    </p>
  );
};
