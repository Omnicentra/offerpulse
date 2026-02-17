/**
 * Modular database seed. Run specific phases via:
 *   pnpm db:seed                    # run all phases
 *   pnpm db:seed -- --only=users,workspaces
 *   pnpm db:seed users workspaces   # alternative: positional phase names
 *
 * Phases: users | workspaces | workspace-members | competitors | snapshots | alerts
 * Order matters when running a subset: users → workspaces → workspace-members → competitors → snapshots → alerts
 */

import { db } from "./index";
import {
  users,
  accounts,
  workspaces,
  workspaceMembers,
  competitors,
  monitorSettings,
  snapshots,
  changeEvents,
  recommendations,
  recommendationChecklistItems,
  alertSettings,
} from "./schema";
import { nanoid } from "nanoid";
import * as bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

// Fixed IDs so phases can be re-run or run in isolation when dependencies exist
const DEMO_USER_ID = "user_demo";
const DEMO_WORKSPACE_ID = "workspace_demo";
const DEMO_COMPETITOR_IDS = {
  glossier: "comp_glossier",
  allbirds: "comp_allbirds",
  gymshark: "comp_gymshark",
} as const;

const PHASES = [
  "users",
  "workspaces",
  "workspace-members",
  "competitors",
  "snapshots",
  "alerts",
] as const;
type Phase = (typeof PHASES)[number];

function parseArgs(): Phase[] {
  const argv = process.argv.slice(2);
  const onlyFlag = argv.find((a) => a.startsWith("--only="));
  if (onlyFlag) {
    const list = onlyFlag.replace("--only=", "").trim();
    const requested = list.split(",").map((s) => s.trim().toLowerCase());
    const valid = requested.filter((p): p is Phase =>
      PHASES.includes(p as Phase)
    );
    if (valid.length === 0) {
      console.error("No valid phases. Valid: " + PHASES.join(", "));
      process.exit(1);
    }
    return valid;
  }
  const positional = argv.filter((a) => !a.startsWith("--"));
  if (positional.length > 0) {
    const valid = positional.filter((p): p is Phase =>
      PHASES.includes(p.toLowerCase() as Phase)
    );
    if (valid.length === 0) {
      console.error("No valid phases. Valid: " + PHASES.join(", "));
      process.exit(1);
    }
    return valid;
  }
  return [...PHASES];
}

// Demo user matches staging (Neon offerpulse/staging): Chisom Oguibe / chipzstar.dev@googlemail.com
const DEMO_USER_EMAIL = "chipzstar.dev@googlemail.com";
const DEMO_USER_NAME = "Chisom Oguibe";
const DEMO_PASSWORD = "demo123";

// ---------------------------------------------------------------------------
// Phase: users (demo user + credential account for Better-auth login)
// ---------------------------------------------------------------------------
async function seedUsers(): Promise<void> {
  console.log("Phase: users — creating demo user and credential account...");
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

  await db.insert(users).values({
    id: DEMO_USER_ID,
    name: DEMO_USER_NAME,
    email: DEMO_USER_EMAIL,
    emailVerified: true,
  }).onConflictDoNothing({ target: users.id });

  await db.insert(accounts).values({
    id: "account_demo_credential",
    userId: DEMO_USER_ID,
    accountId: DEMO_USER_ID,
    providerId: "credential",
    password: hashedPassword,
  }).onConflictDoNothing({ target: accounts.id });

  console.log(`✓ Demo user: ${DEMO_USER_EMAIL} (password: ${DEMO_PASSWORD})`);
}

// ---------------------------------------------------------------------------
// Phase: workspaces
// ---------------------------------------------------------------------------
async function seedWorkspaces(): Promise<void> {
  console.log("Phase: workspaces — creating demo workspace...");
  await db.insert(workspaces).values({
    id: DEMO_WORKSPACE_ID,
    name: "Demo Store",
    slug: "demo-store",
  }).onConflictDoNothing({ target: workspaces.id });
  console.log("✓ Workspace: Demo Store");
}

// ---------------------------------------------------------------------------
// Phase: workspace-members
// ---------------------------------------------------------------------------
async function seedWorkspaceMembers(): Promise<void> {
  console.log("Phase: workspace-members — linking user to workspace...");
  await db.insert(workspaceMembers).values({
    id: "member_demo",
    workspaceId: DEMO_WORKSPACE_ID,
    userId: DEMO_USER_ID,
    role: "owner",
  }).onConflictDoNothing({ target: workspaceMembers.id });
  console.log("✓ Workspace member added");
}

// ---------------------------------------------------------------------------
// Phase: competitors (+ monitor settings)
// ---------------------------------------------------------------------------
async function seedCompetitors(): Promise<void> {
  console.log("Phase: competitors — creating competitors and monitor settings...");
  const data = [
    {
      id: DEMO_COMPETITOR_IDS.glossier,
      name: "Glossier",
      baseUrl: "https://www.glossier.com",
      domain: "glossier.com",
    },
    {
      id: DEMO_COMPETITOR_IDS.allbirds,
      name: "Allbirds",
      baseUrl: "https://www.allbirds.com",
      domain: "allbirds.com",
    },
    {
      id: DEMO_COMPETITOR_IDS.gymshark,
      name: "Gymshark",
      baseUrl: "https://www.gymshark.com",
      domain: "gymshark.com",
    },
  ];

  for (const comp of data) {
    await db.insert(competitors).values({
      id: comp.id,
      workspaceId: DEMO_WORKSPACE_ID,
      name: comp.name,
      domain: comp.domain,
      baseUrl: comp.baseUrl,
      isActive: true,
    }).onConflictDoNothing({ target: competitors.id });

    await db.insert(monitorSettings).values({
      id: `monitor_${comp.id}`,
      competitorId: comp.id,
      frequency: "6h",
      trackPromos: true,
      trackShipping: true,
      trackBundles: true,
      trackCart: true,
      trackDeliveryReturns: true,
    }).onConflictDoNothing({ target: monitorSettings.id });
    console.log(`✓ Competitor: ${comp.name}`);
  }
}

// ---------------------------------------------------------------------------
// Phase: snapshots (snapshots, change events, recommendations, checklist items)
// ---------------------------------------------------------------------------
async function seedSnapshots(): Promise<void> {
  console.log("Phase: snapshots — creating sample snapshots and change data...");
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const competitorIds = Object.values(DEMO_COMPETITOR_IDS);

  for (const competitorId of competitorIds) {
    const beforeSignals = {
      confidence: "high" as const,
      promoText: "15% OFF SITEWIDE",
      discountPercent: 15,
      discountCode: "SAVE15",
      shippingThreshold: 50,
      shippingText: "Free shipping on orders over $50",
    };
    const afterSignals = {
      confidence: "high" as const,
      promoText: "20% OFF SITEWIDE",
      discountPercent: 20,
      discountCode: "SAVE20",
      shippingThreshold: 35,
      shippingText: "Free shipping on orders over $35",
    };

    const [oldSnapshot] = await db
      .insert(snapshots)
      .values({
        id: `snap_${nanoid()}`,
        competitorId,
        extractedSignals: beforeSignals,
        capturedAt: yesterday,
      })
      .returning();

    const [newSnapshot] = await db
      .insert(snapshots)
      .values({
        id: `snap_${nanoid()}`,
        competitorId,
        extractedSignals: afterSignals,
        capturedAt: now,
      })
      .returning();

    await db
      .update(competitors)
      .set({ lastSnapshotAt: now })
      .where(eq(competitors.id, competitorId));

    const [changeEvent] = await db
      .insert(changeEvents)
      .values({
        id: `change_${nanoid()}`,
        competitorId,
        type: "PROMO",
        confidence: "high",
        summary:
          "Increased discount from 15% to 20% and lowered free shipping threshold",
        before: oldSnapshot.extractedSignals as Record<string, unknown>,
        after: newSnapshot.extractedSignals as Record<string, unknown>,
        snapshotBeforeId: oldSnapshot.id,
        snapshotAfterId: newSnapshot.id,
      })
      .returning();

    const [recommendation] = await db
      .insert(recommendations)
      .values({
        id: `rec_${nanoid()}`,
        changeEventId: changeEvent.id,
        competitorId,
        strategy: "MATCH",
        impact: 8,
        effort: 4,
        title: "Consider matching competitor's improved offer",
        rationale:
          "This aggressive pricing move (20% off + lower shipping threshold) will likely impact conversion rates. Consider matching to remain competitive.",
        status: "open",
      })
      .returning();

    const checklistItems = [
      "Review the cost impact on margins",
      "Set up matching 20% discount code",
      "Update free shipping threshold to $35",
      "Monitor conversion rate impact for 7 days",
    ];
    for (let i = 0; i < checklistItems.length; i++) {
      await db.insert(recommendationChecklistItems).values({
        id: `item_${nanoid()}`,
        recommendationId: recommendation.id,
        text: checklistItems[i],
        done: i === 0,
        order: i + 1,
      });
    }
  }
  console.log("✓ Snapshots, change events, and recommendations created");
}

// ---------------------------------------------------------------------------
// Phase: alerts
// ---------------------------------------------------------------------------
async function seedAlerts(): Promise<void> {
  console.log("Phase: alerts — creating alert settings...");
  await db.insert(alertSettings).values({
    id: "alert_demo",
    workspaceId: DEMO_WORKSPACE_ID,
    emailEnabled: true,
    slackEnabled: false,
    minConfidence: "medium",
    eventTypes: ["PROMO", "SHIPPING", "BUNDLE"],
  }).onConflictDoNothing({ target: alertSettings.workspaceId });
  console.log("✓ Alert settings created");
}

const RUNNERS: Record<Phase, () => Promise<void>> = {
  users: seedUsers,
  workspaces: seedWorkspaces,
  "workspace-members": seedWorkspaceMembers,
  competitors: seedCompetitors,
  snapshots: seedSnapshots,
  alerts: seedAlerts,
};

async function main(): Promise<void> {
  const phases = parseArgs();
  console.log("🌱 Database seed — phases:", phases.join(", "));

  try {
    for (const phase of phases) {
      await RUNNERS[phase]();
    }
    console.log("\n🎉 Seed completed successfully.");
    if (phases.includes("users")) {
      console.log(`\nDemo credentials: ${DEMO_USER_EMAIL} / ${DEMO_PASSWORD}`);
    }
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

main();
