import Image from "next/image";
import { SYSTEM_SUMMIT_LOGO_PATH } from "@/lib/sponsors/logo";

export function PartnerSeal() {
  return (
    <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="partner-seal-ring">
        <div className="partner-seal-inner partner-seal-inner-logo">
          <Image
            src={SYSTEM_SUMMIT_LOGO_PATH}
            alt=""
            width={40}
            height={40}
            className="partner-seal-logo"
          />
        </div>
      </div>
      <p className="partner-seal-copy">
        Official Digital Partner — System Summit
      </p>
    </div>
  );
}
