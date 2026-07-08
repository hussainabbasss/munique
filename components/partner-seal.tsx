import Image from "next/image";
import { SYSTEM_SUMMIT_LOGO_PATH } from "@/lib/sponsors/logo";

export function PartnerSeal() {
  return (
    <div className="partner-line">
      <div className="partner-line-logo">
        <Image
          src={SYSTEM_SUMMIT_LOGO_PATH}
          alt=""
          width={40}
          height={40}
        />
      </div>
      <p className="partner-line-copy">
        Official Digital Partner — System Summit
      </p>
    </div>
  );
}
