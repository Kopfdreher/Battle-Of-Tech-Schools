import Link from "next/link";
import { notFound } from "next/navigation";

import { AuthenticityCard } from "@/components/authenticity/authenticity-card";
import { BlurredName } from "@/components/mietmatch/components/BlurredName";
import { EvaluateButton } from "@/components/evaluate-button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPrisma, riskFlagList } from "@/lib/db";
import {
  affordability,
  contractSecurity,
  formatEuro,
  householdFit,
} from "@/lib/metrics";

export const dynamic = "force-dynamic";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function ApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!uuidPattern.test(id)) notFound();

  const result = await loadApplication(id);
  if (result.missing) notFound();

  if (result.error || !result.row) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-8">
        <Link href="/" className="text-sm text-zinc-600 hover:underline">
          Back to listings
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>Database unavailable</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  const { application, listing } = result.row;
  const flags = riskFlagList(application.riskFlags);
  const money = affordability(Number(application.income), Number(listing.rentAmount));
  const contract = contractSecurity(application);
  const fit = householdFit(application.householdSize, listing.rooms);
  const metrics = [
    { name: "Affordability", metric: money },
    { name: "Contract security", metric: contract },
    { name: "Fit", metric: fit },
  ];

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <Link
        href={`/?listing=${listing.id}`}
        className="text-sm text-zinc-600 hover:underline"
      >
        Back to {listing.title}
      </Link>

      <header className="flex flex-col gap-2">
        <p className="text-sm text-zinc-500">{listing.address}</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          <BlurredName as="span" name={application.applicantName} />
        </h1>
        <p className="text-sm capitalize text-zinc-600">
          Status: {application.status}
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        {metrics.map(({ name, metric }) => (
          <Card key={name}>
            <CardHeader>
              <CardDescription>{name}</CardDescription>
              <CardTitle>
                <Badge variant={metric.level}>{metric.label}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-zinc-600">
              {metric.detail}
            </CardContent>
          </Card>
        ))}
      </section>

      <AuthenticityCard
        applicant={{
          id: application.id,
          applicantName: application.applicantName,
          income: Number(application.income),
          hasPermanentContract: application.hasPermanentContract,
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Evaluation score</CardTitle>
          <CardDescription>
            {application.score === null
              ? "Awaiting n8n processing"
              : Number(application.score).toFixed(1)}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <EvaluateButton applicationId={application.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Application</CardTitle>
          <CardDescription>
            {formatEuro(application.income)} net / month · household{" "}
            {application.householdSize} · rent {formatEuro(listing.rentAmount)} ·{" "}
            {listing.rooms} rooms
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pt-0">
          <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
            <Fact label="Permanent contract" value={application.hasPermanentContract} />
            <Fact label="Schufa" value={application.hasSchufa} />
            <Fact
              label="Mietschuldenfreiheit"
              value={application.hasMietschuldenfrei}
            />
          </dl>
          <p className="whitespace-pre-wrap text-sm leading-6">
            {application.rawMessage}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fairness and GDPR flags</CardTitle>
          <CardDescription>
            Protected characteristics removed before scoring.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {flags.length === 0 ? (
            <p className="text-sm text-zinc-600">No flags recorded.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {flags.map((flag) => (
                <li key={flag}>
                  <Badge variant="outline">{flag}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

function Fact({ label, value }: { label: string; value: boolean }) {
  return (
    <div>
      <dt className="text-zinc-500">{label}</dt>
      <dd>{value ? "Yes" : "No"}</dd>
    </div>
  );
}

async function loadApplication(id: string) {
  try {
    const db = getPrisma();
    const application = await db.application.findUnique({
      where: { id },
      include: { listing: true },
    });

    if (!application) return { missing: true as const, error: null, row: null };
    return {
      missing: false as const,
      error: null,
      row: { application, listing: application.listing },
    };
  } catch (error) {
    return {
      missing: false as const,
      error: error instanceof Error ? error.message : "Could not load application",
      row: null,
    };
  }
}
