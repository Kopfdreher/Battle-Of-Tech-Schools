import type { Application, Listing } from "@prisma/client";
import Link from "next/link";

import { AuthenticityBadge } from "@/components/authenticity/authenticity-badge";
import { SeedButton } from "@/components/seed-button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getPrisma } from "@/lib/db";
import {
  affordability,
  contractSecurity,
  formatEuro,
  householdFit,
} from "@/lib/metrics";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ listing?: string }>;
}) {
  const { listing: listingId } = await searchParams;
  const data = await loadDashboard(listingId);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-zinc-500">BOTTS 2026 Hackathon</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Landlord Tenant Screener
          </h1>
        </div>
        <SeedButton />
      </header>

      {data.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Database unavailable</CardTitle>
            <CardDescription>
              Set DATABASE_URL and run pnpm db:push, then generate
              sample applications.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-700">{data.error}</p>
          </CardContent>
        </Card>
      ) : null}

      {!data.error && data.listings.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No listings yet</CardTitle>
            <CardDescription>
              Generate sample applications to insert two Berlin listings and
              eight tenant applications.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {data.listings.length > 0 ? (
        <section className="grid gap-3 sm:grid-cols-2">
          {data.listings.map((listing) => {
            const selected = listing.id === data.selectedId;
            return (
              <Link key={listing.id} href={`/?listing=${listing.id}`}>
                <Card className={selected ? "border-zinc-900" : undefined}>
                  <CardHeader>
                    <CardTitle>{listing.title}</CardTitle>
                    <CardDescription>{listing.address}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 text-sm text-zinc-700">
                    {formatEuro(listing.rentAmount)} · {listing.rooms} rooms
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </section>
      ) : null}

      {data.selected ? (
        <Card>
          <CardHeader>
            <CardTitle>Applications</CardTitle>
            <CardDescription>{data.selected.title}</CardDescription>
          </CardHeader>
          <CardContent className="px-0 pt-0">
            {data.applications.length === 0 ? (
              <p className="px-5 text-sm text-zinc-600">
                No applications for this listing.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Authenticity</TableHead>
                    <TableHead>Affordability</TableHead>
                    <TableHead>Contract security</TableHead>
                    <TableHead>Fit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.applications.map((application) => {
                    const money = affordability(
                      Number(application.netIncomeMonthly),
                      Number(data.selected!.rentAmount),
                    );
                    const contract = contractSecurity(application);
                    const fit = householdFit(
                      application.householdSize,
                      data.selected!.rooms,
                    );

                    return (
                      <TableRow key={application.id}>
                        <TableCell>
                          <Link
                            href={`/applications/${application.id}`}
                            className="font-medium underline-offset-4 hover:underline"
                          >
                            {application.displayName}
                          </Link>
                          <p className="text-xs text-zinc-500">
                            {formatEuro(application.netIncomeMonthly)} / month ·{" "}
                            {application.householdSize} people
                          </p>
                        </TableCell>
                        <TableCell>
                          <AuthenticityBadge
                            applicant={{
                              id: application.id,
                              applicantName: application.displayName,
                              income: Number(application.netIncomeMonthly),
                              hasPermanentContract: application.contractType === 'permanent',
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant={money.level}>{money.label}</Badge>
                          <p className="mt-1 text-xs text-zinc-500">{money.detail}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant={contract.level}>{contract.label}</Badge>
                          <p className="mt-1 text-xs text-zinc-500">
                            {contract.detail}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge variant={fit.level}>{fit.label}</Badge>
                          <p className="mt-1 text-xs text-zinc-500">{fit.detail}</p>
                        </TableCell>
                        <TableCell className="capitalize">
                          {application.status}
                        </TableCell>
                        <TableCell>
                          {application.score === null
                            ? "Awaiting"
                            : Number(application.score).toFixed(1)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : null}
    </main>
  );
}

async function loadDashboard(listingId?: string): Promise<{
  error: string | null;
  listings: Listing[];
  applications: Application[];
  selected: Listing | null;
  selectedId: string | null;
}> {
  try {
    const db = getPrisma();
    const listingRows = await db.listing.findMany({
      orderBy: { createdAt: "desc" },
    });
    const selected =
      listingRows.find((listing) => listing.id === listingId) ??
      listingRows[0] ??
      null;
    const applicationRows = selected
      ? await db.application.findMany({
          where: { apartmentId: selected.id },
          orderBy: { createdAt: "desc" },
        })
      : [];

    return {
      error: null,
      listings: listingRows,
      applications: applicationRows,
      selected,
      selectedId: selected?.id ?? null,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not load listings",
      listings: [],
      applications: [],
      selected: null,
      selectedId: null,
    };
  }
}
