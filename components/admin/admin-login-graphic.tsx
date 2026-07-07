type AdminLoginGraphicProps = {
  compact?: boolean;
};

export function AdminLoginGraphic({ compact = false }: AdminLoginGraphicProps) {
  return (
    <div
      className={`admin-login-graphic${compact ? " admin-login-graphic-compact" : ""}`}
      aria-hidden
    >
      <svg
        className="admin-login-graphic-svg"
        viewBox="0 0 360 360"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient
            id="admin-login-gold"
            x1="60"
            y1="40"
            x2="300"
            y2="320"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#d8b857" />
            <stop offset="1" stopColor="#b4922e" />
          </linearGradient>
          <radialGradient
            id="admin-login-glow"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(180 180) rotate(90) scale(160)"
          >
            <stop stopColor="#a63d6b" stopOpacity="0.22" />
            <stop offset="1" stopColor="#16233f" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="180" cy="180" r="158" fill="url(#admin-login-glow)" />

        <g className="admin-login-graphic-rules" opacity="0.35">
          {[88, 116, 144, 172, 200, 228, 256, 284].map((y) => (
            <line
              key={y}
              x1="52"
              y1={y}
              x2="308"
              y2={y}
              stroke="rgba(253, 251, 246, 0.22)"
              strokeWidth="0.75"
            />
          ))}
        </g>

        <circle
          cx="180"
          cy="180"
          r="148"
          stroke="url(#admin-login-gold)"
          strokeWidth="1"
          strokeOpacity="0.45"
        />
        <circle
          className="admin-login-graphic-orbit"
          cx="180"
          cy="180"
          r="132"
          stroke="url(#admin-login-gold)"
          strokeWidth="0.75"
          strokeOpacity="0.3"
          strokeDasharray="4 10"
        />
        <circle
          cx="180"
          cy="180"
          r="108"
          stroke="rgba(253, 251, 246, 0.18)"
          strokeWidth="0.75"
        />

        <g stroke="rgba(253, 251, 246, 0.14)" strokeWidth="0.75">
          <line x1="180" y1="72" x2="180" y2="288" />
          <line x1="72" y1="180" x2="288" y2="180" />
          <line x1="104" y1="104" x2="256" y2="256" />
          <line x1="256" y1="104" x2="104" y2="256" />
        </g>

        <circle
          cx="180"
          cy="180"
          r="54"
          fill="rgba(22, 35, 63, 0.55)"
          stroke="url(#admin-login-gold)"
          strokeWidth="1.25"
          strokeOpacity="0.85"
        />
        <circle
          cx="180"
          cy="180"
          r="38"
          stroke="rgba(253, 251, 246, 0.2)"
          strokeWidth="0.75"
        />
        <circle cx="180" cy="180" r="8" fill="#a63d6b" fillOpacity="0.9" />

        <path
          d="M180 126 L188 154 L218 154 L194 172 L202 200 L180 184 L158 200 L166 172 L142 154 L172 154 Z"
          fill="none"
          stroke="url(#admin-login-gold)"
          strokeWidth="0.85"
          strokeOpacity="0.55"
        />

        <g fill="url(#admin-login-gold)" fillOpacity="0.7">
          <circle cx="180" cy="52" r="2.5" />
          <circle cx="180" cy="308" r="2.5" />
          <circle cx="52" cy="180" r="2.5" />
          <circle cx="308" cy="180" r="2.5" />
        </g>
      </svg>
    </div>
  );
}
