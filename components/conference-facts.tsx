const facts = [
  { label: "Conference dates", value: "TBD", mono: true },
  { label: "Venue", value: "TBD", mono: false },
  { label: "Delegate capacity", value: "250–300", mono: true },
  { label: "Edition", value: "I", mono: false },
] as const;

export function ConferenceFacts() {
  return (
    <section className="facts-band" aria-label="Conference facts">
      <div className="facts-band-inner">
        {facts.map((fact) => (
          <div key={fact.label} className="facts-cell">
            <p className="facts-label">{fact.label}</p>
            <p
              className={
                fact.mono ? "facts-value facts-value-mono" : "facts-value"
              }
            >
              {fact.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
