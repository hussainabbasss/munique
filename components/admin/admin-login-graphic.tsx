type AdminLoginGraphicProps = {
  compact?: boolean;
};

/**
 * Decorative assembly-instrument mark: monochrome line-art in currentColor
 * so it reads on the cobalt aside (on-dark) and the paper mobile mark
 * (cobalt) alike, with a single signal pip as the live accent.
 */
export function AdminLoginGraphic({ compact = false }: AdminLoginGraphicProps) {
  const signal = { fill: "var(--signal)" };

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
        <g className="admin-login-graphic-rules" stroke="currentColor">
          {[88, 116, 144, 172, 200, 228, 256, 284].map((y) => (
            <line
              key={y}
              x1="52"
              y1={y}
              x2="308"
              y2={y}
              strokeWidth="0.75"
              strokeOpacity="0.14"
            />
          ))}
        </g>

        <circle
          cx="180"
          cy="180"
          r="148"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeOpacity="0.55"
        />
        <circle
          className="admin-login-graphic-orbit"
          cx="180"
          cy="180"
          r="132"
          stroke="currentColor"
          strokeWidth="0.75"
          strokeOpacity="0.42"
          strokeDasharray="3 11"
        />
        <circle
          cx="180"
          cy="180"
          r="108"
          stroke="currentColor"
          strokeWidth="0.75"
          strokeOpacity="0.28"
        />

        <g stroke="currentColor" strokeWidth="0.75" strokeOpacity="0.22">
          <line x1="180" y1="72" x2="180" y2="288" />
          <line x1="72" y1="180" x2="288" y2="180" />
          <line x1="104" y1="104" x2="256" y2="256" />
          <line x1="256" y1="104" x2="104" y2="256" />
        </g>

        <circle
          cx="180"
          cy="180"
          r="54"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeOpacity="0.8"
        />
        <circle
          cx="180"
          cy="180"
          r="38"
          stroke="currentColor"
          strokeWidth="0.75"
          strokeOpacity="0.4"
        />

        <path
          d="M180 126 L188 154 L218 154 L194 172 L202 200 L180 184 L158 200 L166 172 L142 154 L172 154 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeOpacity="0.55"
        />

        <circle cx="180" cy="180" r="7" style={signal} />

        <g style={signal}>
          <circle cx="180" cy="52" r="2.5" />
          <circle cx="180" cy="308" r="2.5" />
          <circle cx="52" cy="180" r="2.5" />
          <circle cx="308" cy="180" r="2.5" />
        </g>
      </svg>
    </div>
  );
}
