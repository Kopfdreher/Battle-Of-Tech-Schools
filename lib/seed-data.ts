export const seedListings = [
  {
    title: "2-Zimmer Altbau, Prenzlauer Berg",
    address: "Oderberger Straße 12, 10435 Berlin",
    rentAmount: "1450.00",
    rooms: 2,
  },
  {
    title: "3-Zimmer Wohnung, Neukölln",
    address: "Weserstraße 48, 12045 Berlin",
    rentAmount: "1680.00",
    rooms: 3,
  },
] as const;

export type SeedApplication = {
  listingIndex: number;
  applicantName: string;
  income: string;
  hasPermanentContract: boolean;
  householdSize: number;
  hasMietschuldenfrei: boolean;
  hasSchufa: boolean;
  rawMessage: string;
  riskFlags: string[];
};

export const seedApplications: SeedApplication[] = [
  {
    listingIndex: 0,
    applicantName: "Anna Berger",
    income: "5200.00",
    hasPermanentContract: true,
    householdSize: 1,
    hasMietschuldenfrei: true,
    hasSchufa: true,
    rawMessage:
      "Guten Tag, ich bin Softwareentwicklerin in unbefristeter Anstellung und suche die Wohnung für mich allein. Mietschuldenfreiheitsbescheinigung und Schufa-Auskunft liegen bei.",
    riskFlags: [],
  },
  {
    listingIndex: 0,
    applicantName: "Jonas Klein",
    income: "4100.00",
    hasPermanentContract: true,
    householdSize: 2,
    hasMietschuldenfrei: false,
    hasSchufa: true,
    rawMessage:
      "Wir sind ein Paar, beide berufstätig. Die Schufa ist unauffällig. Eine Mietschuldenfreiheitsbescheinigung kann ich erst nach dem Auszug vom aktuellen Vermieter bekommen.",
    riskFlags: [],
  },
  {
    listingIndex: 0,
    applicantName: "Leyla Demir",
    income: "3600.00",
    hasPermanentContract: false,
    householdSize: 1,
    hasMietschuldenfrei: true,
    hasSchufa: true,
    rawMessage:
      "Ich arbeite seit zwei Jahren als Grafikerin auf einem befristeten Vertrag, der im nächsten Jahr verlängert werden soll. Unterlagen zur Mietschuldenfreiheit und Schufa füge ich bei.",
    riskFlags: [],
  },
  {
    listingIndex: 0,
    applicantName: "Familie Okonkwo",
    income: "6100.00",
    hasPermanentContract: true,
    householdSize: 5,
    hasMietschuldenfrei: true,
    hasSchufa: true,
    rawMessage:
      "Wir sind eine fünfköpfige Familie und hätten gern die Wohnung ab dem übernächsten Monat. Beide Elternteile sind unbefristet angestellt. Alle Bescheinigungen können wir nachreichen.",
    riskFlags: ["Stripped nationality from message"],
  },
  {
    listingIndex: 1,
    applicantName: "Mara Hoffmann",
    income: "3400.00",
    hasPermanentContract: true,
    householdSize: 2,
    hasMietschuldenfrei: true,
    hasSchufa: false,
    rawMessage:
      "Mein Partner und ich suchen eine größere Wohnung. Ich habe einen unbefristeten Vertrag. Die Schufa-Auskunft warte ich noch, die Mietschuldenfreiheitsbescheinigung ist angehängt.",
    riskFlags: [],
  },
  {
    listingIndex: 1,
    applicantName: "Samir Haddad",
    income: "2900.00",
    hasPermanentContract: true,
    householdSize: 3,
    hasMietschuldenfrei: true,
    hasSchufa: true,
    rawMessage:
      "Ich bewerbe mich mit meiner Partnerin und unserem Kind. Das Haushaltsnettoeinkommen deckt die Miete, die Unterlagen sind vollständig.",
    riskFlags: ["Stripped religion from message"],
  },
  {
    listingIndex: 1,
    applicantName: "Elena Vogt",
    income: "2400.00",
    hasPermanentContract: false,
    householdSize: 1,
    hasMietschuldenfrei: false,
    hasSchufa: false,
    rawMessage:
      "Ich bin freiberufliche Übersetzerin und kann Einkommensnachweise der letzten zwölf Monate schicken. Eine Mietschuldenfreiheitsbescheinigung und eine aktuelle Schufa habe ich gerade nicht vorliegen.",
    riskFlags: [],
  },
  {
    listingIndex: 1,
    applicantName: "Paul und Nina Krüger",
    income: "7300.00",
    hasPermanentContract: true,
    householdSize: 2,
    hasMietschuldenfrei: true,
    hasSchufa: true,
    rawMessage:
      "Wir sind beide unbefristet im öffentlichen Dienst und suchen die Wohnung für uns zwei. Bescheinigungen und Schufa sind aktuell und liegen dieser Nachricht bei.",
    riskFlags: [],
  },
];
