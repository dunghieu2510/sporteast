import Image from "next/image";
import type { TeamSummary } from "@arena/types";

const sizes = { sm: "size-9 text-[10px]", md: "size-12 text-xs", lg: "size-14 sm:size-20 text-sm sm:text-base" };
const px = { sm: 36, md: 48, lg: 80 };

/** Logo đội; khi chưa có ảnh thì vẽ huy hiệu từ màu đội. */
export function TeamCrest({ team, size = "md" }: { team: TeamSummary; size?: keyof typeof sizes }) {
  if (team.logoUrl) {
    return (
      <Image
        src={team.logoUrl}
        alt={team.name}
        width={px[size]}
        height={px[size]}
        className={`${sizes[size]} object-contain`}
      />
    );
  }
  return (
    <span
      aria-label={team.name}
      className={`${sizes[size]} pixel-tag grid shrink-0 place-items-center font-display font-bold`}
      style={{
        background: team.primaryColor,
        color: team.secondaryColor,
        boxShadow: "inset 3px 3px 0 0 rgb(255 255 255 / 0.3), inset -3px -3px 0 0 rgb(0 0 0 / 0.35), 0 0 0 2px #141414",
      }}
    >
      {team.shortName}
    </span>
  );
}
