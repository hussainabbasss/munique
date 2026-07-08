"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Committee } from "@/lib/types/admin";

const TIER_LABELS: Record<Committee["difficulty_tier"], string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

type CommitteePickerProps = {
  id: string;
  label: string;
  committees: Committee[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  optionalLabel?: string;
};

export function CommitteePicker({
  id,
  label,
  committees,
  value,
  onChange,
  required = false,
  optionalLabel = "— Optional —",
}: CommitteePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selected = committees.find((committee) => committee.id === value);
  const displayLabel = selected
    ? `${selected.name} — ${TIER_LABELS[selected.difficulty_tier]}`
    : required
      ? "Select a committee"
      : optionalLabel;

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const choose = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
  };

  return (
    <div
      className={`registration-picker${open ? " registration-picker-open" : ""}`}
      ref={containerRef}
    >
      <label htmlFor={id} className="registration-label">
        {label}
      </label>

      <button
        type="button"
        id={id}
        className={`registration-picker-trigger${
          !value ? " registration-picker-trigger-placeholder" : ""
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        <span className="registration-picker-value">{displayLabel}</span>
        <span className="registration-picker-chevron" aria-hidden />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="registration-picker-menu"
          aria-labelledby={id}
        >
          {!required && (
            <li role="presentation">
              <button
                type="button"
                role="option"
                className="registration-picker-option"
                aria-selected={!value}
                onClick={() => choose("")}
              >
                {optionalLabel}
              </button>
            </li>
          )}
          {committees.map((committee) => {
            const isSelected = value === committee.id;
            return (
              <li key={committee.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  className={`registration-picker-option${
                    isSelected ? " registration-picker-option-selected" : ""
                  }`}
                  aria-selected={isSelected}
                  onClick={() => choose(committee.id)}
                >
                  <span className="registration-picker-option-name">
                    {committee.name}
                  </span>
                  <span className="tag registration-picker-option-tier">
                    {TIER_LABELS[committee.difficulty_tier]}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
