export type MetricLevel = "good" | "tight" | "poor";

export type Metric = {
  level: MetricLevel;
  label: string;
  detail: string;
};

export function affordability(income: number, rent: number): Metric {
  if (!(rent > 0)) {
    return { level: "poor", label: "Strained", detail: "Rent unavailable" };
  }

  const ratio = income / rent;
  const detail = `${ratio.toFixed(1)}× rent`;

  if (ratio >= 3) return { level: "good", label: "Good", detail };
  if (ratio >= 2) return { level: "tight", label: "Tight", detail };
  return { level: "poor", label: "Strained", detail };
}

export function contractSecurity(application: {
  contractType: string | null;
  hasSchufa: boolean;
  hasArrearsLetter: boolean;
}): Metric {
  const count = [
    application.contractType === "permanent",
    application.hasSchufa,
    application.hasArrearsLetter,
  ].filter(Boolean).length;

  const detail = `${count}/3 checks`;

  if (count === 3) return { level: "good", label: "Strong", detail };
  if (count === 2) return { level: "tight", label: "Partial", detail };
  return { level: "poor", label: "Weak", detail };
}

export function householdFit(householdSize: number, rooms: number): Metric {
  const detail = `${householdSize} people / ${rooms} rooms`;

  if (householdSize <= rooms) {
    return { level: "good", label: "Comfortable", detail };
  }
  if (householdSize <= rooms + 1) {
    return { level: "tight", label: "Tight", detail };
  }
  return { level: "poor", label: "Overcrowded", detail };
}

export function formatEuro(value: string | number | { toString(): string }) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value));
}
