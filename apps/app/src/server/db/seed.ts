import { db } from "./index";
import {
  users,
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

async function seed() {
  console.log("🌱 Starting database seed...");

  try {
    // 1. Create demo user
    console.log("Creating demo user...");
    const hashedPassword = await bcrypt.hash("demo123", 10);

    const [demoUser] = await db
      .insert(users)
      .values({
        id: `user_${nanoid()}`,
        name: "Demo User",
        email: "demo@offerpulse.com",
        emailVerified: true,
      })
      .returning();

    console.log(`✓ Created user: ${demoUser.email}`);

    // 2. Create demo workspace
    console.log("Creating demo workspace...");
    const [workspace] = await db
      .insert(workspaces)
      .values({
        id: "workspace_demo",
        name: "Demo Store",
        slug: "demo-store",
        ownerId: demoUser.id,
      })
      .returning();

    console.log(`✓ Created workspace: ${workspace.name}`);

    // 3. Add user as workspace member
    await db.insert(workspaceMembers).values({
      id: `member_${nanoid()}`,
      workspaceId: workspace.id,
      userId: demoUser.id,
      role: "owner",
    });

    // 4. Create competitors
    console.log("Creating competitors...");
    const competitorsData = [
      {
        name: "Glossier",
        url: "https://www.glossier.com",
        domain: "glossier.com",
        description: "Beauty and skincare brand",
      },
      {
        name: "Allbirds",
        url: "https://www.allbirds.com",
        domain: "allbirds.com",
        description: "Sustainable footwear",
      },
      {
        name: "Gymshark",
        url: "https://www.gymshark.com",
        domain: "gymshark.com",
        description: "Fitness apparel",
      },
    ];

    const createdCompetitors = [];
    for (const comp of competitorsData) {
      const [competitor] = await db
        .insert(competitors)
        .values({
          id: `comp_${nanoid()}`,
          workspaceId: workspace.id,
          name: comp.name,
          url: comp.url,
          domain: comp.domain,
          description: comp.description,
          isActive: true,
        })
        .returning();

      createdCompetitors.push(competitor);

      // Create monitor settings for each competitor
      await db.insert(monitorSettings).values({
        id: `monitor_${nanoid()}`,
        competitorId: competitor.id,
        frequency: "6h",
        alertOnChange: true,
        screenshotEnabled: true,
      });

      console.log(`✓ Created competitor: ${competitor.name}`);
    }

    // 5. Create sample snapshots
    console.log("Creating sample snapshots...");
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    for (const competitor of createdCompetitors) {
      // Older snapshot
      const oldSnapshot = await db
        .insert(snapshots)
        .values({
          id: `snap_${nanoid()}`,
          competitorId: competitor.id,
          extractedSignals: {
            confidence: "high",
            promoText: "15% OFF SITEWIDE",
            discountPercent: 15,
            discountCode: "SAVE15",
            shippingThreshold: 50,
            shippingText: "Free shipping on orders over $50",
            shippingCurrency: "USD",
          },
          capturedAt: yesterday,
        })
        .returning();

      // Newer snapshot with changes
      const newSnapshot = await db
        .insert(snapshots)
        .values({
          id: `snap_${nanoid()}`,
          competitorId: competitor.id,
          extractedSignals: {
            confidence: "high",
            promoText: "20% OFF SITEWIDE",
            discountPercent: 20,
            discountCode: "SAVE20",
            shippingThreshold: 35,
            shippingText: "Free shipping on orders over $35",
            shippingCurrency: "USD",
          },
          capturedAt: now,
        })
        .returning();

      // Update competitor's lastSnapshotAt
      await db
        .update(competitors)
        .set({ lastSnapshotAt: now })
        .where(db.$with(competitors.id).eq(competitor.id));

      // Create change event
      const [changeEvent] = await db
        .insert(changeEvents)
        .values({
          id: `change_${nanoid()}`,
          competitorId: competitor.id,
          type: "PROMO",
          confidence: "high",
          summary: "Increased discount from 15% to 20% and lowered free shipping threshold",
          before: oldSnapshot[0].extractedSignals,
          after: newSnapshot[0].extractedSignals,
          snapshotBeforeId: oldSnapshot[0].id,
          snapshotAfterId: newSnapshot[0].id,
        })
        .returning();

      // Create recommendation
      const [recommendation] = await db
        .insert(recommendations)
        .values({
          id: `rec_${nanoid()}`,
          changeEventId: changeEvent.id,
          competitorId: competitor.id,
          strategy: "MATCH",
          impact: 8,
          effort: 4,
          title: "Consider matching competitor's improved offer",
          rationale:
            "This aggressive pricing move (20% off + lower shipping threshold) will likely impact conversion rates. Consider matching to remain competitive.",
          status: "open",
        })
        .returning();

      // Create checklist items
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
          done: i === 0, // Mark first item as done
          order: i + 1,
        });
      }

      console.log(`✓ Created snapshot and change event for: ${competitor.name}`);
    }

    // 6. Create alert settings
    console.log("Creating alert settings...");
    await db.insert(alertSettings).values({
      id: `alert_${nanoid()}`,
      workspaceId: workspace.id,
      emailEnabled: true,
      slackEnabled: false,
      minConfidence: "medium",
      eventTypes: ["PROMO", "SHIPPING", "BUNDLE"],
    });

    console.log("✓ Created alert settings");

    console.log("\n🎉 Database seeded successfully!");
    console.log("\nDemo credentials:");
    console.log("  Email: demo@offerpulse.com");
    console.log("  Password: demo123");
    console.log("  Workspace: Demo Store");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seed();
