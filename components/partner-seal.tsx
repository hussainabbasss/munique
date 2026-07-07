import { SealImage } from "@/components/seal-image";

export function PartnerSeal() {
  return (
    <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="partner-seal-ring">
        <div className="partner-seal-inner">
          <SealImage
            alt=""
            width={36}
            height={36}
            decorative
            className="size-9"
          />
        </div>
      </div>
      <p className="partner-seal-copy">
        Official Digital Partner — System Summit
      </p>
    </div>
  );
}
