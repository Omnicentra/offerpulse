import { router, workspaceProcedure } from "../trpc";
import { z } from "zod";
import { competitors, changeEvents, recommendations } from "../../db/schema";
import { and, desc, eq, inArray, or, sql, type SQL } from "drizzle-orm";
import type { AnyColumn } from "drizzle-orm";

const PALETTE_LIMIT = 5;
const CANDIDATE_CAP = 40;

function escapeIlikeFragment(raw: string): string {
  return raw.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

function ilikeContains(column: AnyColumn, raw: string): SQL {
  const escaped = escapeIlikeFragment(raw);
  return sql`(${column} ILIKE ${`%${escaped}%`} ESCAPE '\\')`;
}

function rankTextMatch(text: string, qLower: string): number {
  const t = text.toLowerCase();
  if (t === qLower) return 100;
  if (t.startsWith(qLower)) return 80;
  if (t.includes(qLower)) return 60;
  return 0;
}

function rankCompetitor(
  row: { name: string; domain: string; baseUrl: string },
  qLower: string
): number {
  return Math.max(
    rankTextMatch(row.name, qLower),
    rankTextMatch(row.domain, qLower),
    rankTextMatch(row.baseUrl, qLower)
  );
}

export const searchRouter = router({
  globalSearch: workspaceProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        q: z.string().max(200).default(""),
      })
    )
    .query(async ({ ctx, input }) => {
      const trimmed = input.q.trim();
      const qLower = trimmed.toLowerCase();

      const workspaceCompetitors = await ctx.db.query.competitors.findMany({
        where: eq(competitors.workspaceId, input.workspaceId),
        columns: { id: true },
      });
      const competitorIds = workspaceCompetitors.map((c) => c.id);

      if (competitorIds.length === 0) {
        return {
          competitors: [] as Array<{
            id: string;
            name: string;
            domain: string;
          }>,
          changeEvents: [] as Array<{
            id: string;
            summary: string;
            type: string;
            detectedAt: Date;
            competitorId: string;
            competitorName: string;
          }>,
          recommendations: [] as Array<{
            id: string;
            title: string;
            status: string;
            competitorId: string;
            competitorName: string;
          }>,
        };
      }

      if (!trimmed) {
        const [recentCompetitors, recentChanges, recentRecs] = await Promise.all([
          ctx.db.query.competitors.findMany({
            where: eq(competitors.workspaceId, input.workspaceId),
            orderBy: [desc(competitors.updatedAt)],
            limit: PALETTE_LIMIT,
            columns: { id: true, name: true, domain: true },
          }),
          ctx.db.query.changeEvents.findMany({
            where: inArray(changeEvents.competitorId, competitorIds),
            orderBy: [desc(changeEvents.detectedAt)],
            limit: PALETTE_LIMIT,
            columns: {
              id: true,
              summary: true,
              type: true,
              detectedAt: true,
              competitorId: true,
            },
            with: {
              competitor: { columns: { name: true } },
            },
          }),
          ctx.db.query.recommendations.findMany({
            where: inArray(recommendations.competitorId, competitorIds),
            orderBy: [desc(recommendations.updatedAt)],
            limit: PALETTE_LIMIT,
            columns: {
              id: true,
              title: true,
              status: true,
              competitorId: true,
            },
            with: {
              competitor: { columns: { name: true } },
            },
          }),
        ]);

        return {
          competitors: recentCompetitors,
          changeEvents: recentChanges.map((e) => ({
            id: e.id,
            summary: e.summary,
            type: e.type,
            detectedAt: e.detectedAt,
            competitorId: e.competitorId,
            competitorName: e.competitor?.name ?? "Unknown",
          })),
          recommendations: recentRecs.map((r) => ({
            id: r.id,
            title: r.title,
            status: r.status,
            competitorId: r.competitorId,
            competitorName: r.competitor?.name ?? "Unknown",
          })),
        };
      }

      const competitorWhere = and(
        eq(competitors.workspaceId, input.workspaceId),
        or(
          ilikeContains(competitors.name, trimmed),
          ilikeContains(competitors.domain, trimmed),
          ilikeContains(competitors.baseUrl, trimmed)
        )
      );

      const changeWhere = and(
        inArray(changeEvents.competitorId, competitorIds),
        ilikeContains(changeEvents.summary, trimmed)
      );

      const recWhere = and(
        inArray(recommendations.competitorId, competitorIds),
        or(
          ilikeContains(recommendations.title, trimmed),
          ilikeContains(recommendations.rationale, trimmed)
        )
      );

      const [competitorHits, changeHits, recHits] = await Promise.all([
        ctx.db
          .select({
            id: competitors.id,
            name: competitors.name,
            domain: competitors.domain,
            baseUrl: competitors.baseUrl,
          })
          .from(competitors)
          .where(competitorWhere)
          .limit(CANDIDATE_CAP),
        ctx.db.query.changeEvents.findMany({
          where: changeWhere,
          limit: CANDIDATE_CAP,
          columns: {
            id: true,
            summary: true,
            type: true,
            detectedAt: true,
            competitorId: true,
          },
          with: {
            competitor: { columns: { name: true } },
          },
        }),
        ctx.db.query.recommendations.findMany({
          where: recWhere,
          limit: CANDIDATE_CAP,
          columns: {
            id: true,
            title: true,
            status: true,
            competitorId: true,
            rationale: true,
            updatedAt: true,
          },
          with: {
            competitor: { columns: { name: true } },
          },
        }),
      ]);

      const rankedCompetitors = [...competitorHits]
        .sort(
          (a, b) =>
            rankCompetitor(b, qLower) - rankCompetitor(a, qLower) ||
            a.name.localeCompare(b.name)
        )
        .slice(0, PALETTE_LIMIT)
        .map(({ id, name, domain }) => ({ id, name, domain }));

      const rankedChanges = [...changeHits]
        .map((e) => ({
          row: e,
          score: rankTextMatch(e.summary, qLower),
        }))
        .sort((a, b) => b.score - a.score || +b.row.detectedAt - +a.row.detectedAt)
        .slice(0, PALETTE_LIMIT)
        .map(({ row: e }) => ({
          id: e.id,
          summary: e.summary,
          type: e.type,
          detectedAt: e.detectedAt,
          competitorId: e.competitorId,
          competitorName: e.competitor?.name ?? "Unknown",
        }));

      const rankedRecs = [...recHits]
        .map((r) => ({
          row: r,
          score: Math.max(
            rankTextMatch(r.title, qLower),
            rankTextMatch(r.rationale, qLower)
          ),
        }))
        .sort((a, b) => b.score - a.score || +b.row.updatedAt - +a.row.updatedAt)
        .slice(0, PALETTE_LIMIT)
        .map(({ row: r }) => ({
          id: r.id,
          title: r.title,
          status: r.status,
          competitorId: r.competitorId,
          competitorName: r.competitor?.name ?? "Unknown",
        }));

      return {
        competitors: rankedCompetitors,
        changeEvents: rankedChanges,
        recommendations: rankedRecs,
      };
    }),
});
