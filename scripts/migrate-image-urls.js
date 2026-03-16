/**
 * Migration Script: images.servitelv.com → images.enlaredve.com
 * 
 * Collections affected:
 *   - orders:     photoEvidence (array), customerSignature (string), certificateUrl (string)
 *   - recoveries: photoEvidence (array), customerSignature (string)
 * 
 * Usage:
 *   node scripts/migrate-image-urls.js            # Dry-run (default)
 *   node scripts/migrate-image-urls.js --execute   # Apply changes
 */

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// Load .env manually
const envPath = path.join(__dirname, "..", ".env");
const envContent = fs.readFileSync(envPath, "utf8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  let val = trimmed.slice(eqIdx + 1).trim();
  // Remove surrounding quotes
  if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
    val = val.slice(1, -1);
  }
  if (!process.env[key]) process.env[key] = val;
}

const OLD_DOMAIN = "images.servitelv.com";
const NEW_DOMAIN = "images.enlaredve.com";
const DRY_RUN = !process.argv.includes("--execute");

const MONGODB_URI = process.env.MONGODB;
if (!MONGODB_URI) {
  console.error("❌ MONGODB env variable is not set.");
  process.exit(1);
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  const db = mongoose.connection.db;

  if (DRY_RUN) {
    console.log("\n🔍 DRY-RUN MODE — No changes will be written.\n");
  } else {
    console.log("\n🚀 EXECUTE MODE — Changes will be applied.\n");
  }

  // ═══════════════════════════════════════════════════════════════
  // 1. Orders collection
  // ═══════════════════════════════════════════════════════════════
  const orders = db.collection("orders");

  // 1a. photoEvidence (array of strings)
  const ordersWithPhoto = await orders.find({
    photoEvidence: { $elemMatch: { $regex: OLD_DOMAIN } }
  }).toArray();
  console.log("📋 Orders with photoEvidence to migrate: " + ordersWithPhoto.length);

  for (const order of ordersWithPhoto) {
    const updated = order.photoEvidence.map((url) =>
      url.replace(new RegExp(OLD_DOMAIN, "g"), NEW_DOMAIN)
    );
    if (!DRY_RUN) {
      await orders.updateOne(
        { _id: order._id },
        { $set: { photoEvidence: updated } }
      );
    }
    console.log("  → Order " + order._id + " (subscriber: " + order.subscriberNumber + ") — " + order.photoEvidence.length + " URLs");
  }

  // 1b. customerSignature (string)
  const ordersWithSig = await orders.find({
    customerSignature: { $regex: OLD_DOMAIN }
  }).toArray();
  console.log("\n📋 Orders with customerSignature to migrate: " + ordersWithSig.length);

  for (const order of ordersWithSig) {
    const updated = order.customerSignature.replace(new RegExp(OLD_DOMAIN, "g"), NEW_DOMAIN);
    if (!DRY_RUN) {
      await orders.updateOne(
        { _id: order._id },
        { $set: { customerSignature: updated } }
      );
    }
    console.log("  → Order " + order._id + " (subscriber: " + order.subscriberNumber + ")");
  }

  // 1c. certificateUrl (string)
  const ordersWithCert = await orders.find({
    certificateUrl: { $regex: OLD_DOMAIN }
  }).toArray();
  console.log("\n📋 Orders with certificateUrl to migrate: " + ordersWithCert.length);

  for (const order of ordersWithCert) {
    const updated = order.certificateUrl.replace(new RegExp(OLD_DOMAIN, "g"), NEW_DOMAIN);
    if (!DRY_RUN) {
      await orders.updateOne(
        { _id: order._id },
        { $set: { certificateUrl: updated } }
      );
    }
    console.log("  → Order " + order._id + " (subscriber: " + order.subscriberNumber + ")");
  }

  // ═══════════════════════════════════════════════════════════════
  // 2. Recoveries collection
  // ═══════════════════════════════════════════════════════════════
  const recoveries = db.collection("recoveries");

  // 2a. photoEvidence (array of strings)
  const recoveriesWithPhoto = await recoveries.find({
    photoEvidence: { $elemMatch: { $regex: OLD_DOMAIN } }
  }).toArray();
  console.log("\n📋 Recoveries with photoEvidence to migrate: " + recoveriesWithPhoto.length);

  for (const rec of recoveriesWithPhoto) {
    const updated = rec.photoEvidence.map((url) =>
      url.replace(new RegExp(OLD_DOMAIN, "g"), NEW_DOMAIN)
    );
    if (!DRY_RUN) {
      await recoveries.updateOne(
        { _id: rec._id },
        { $set: { photoEvidence: updated } }
      );
    }
    console.log("  → Recovery " + rec._id);
  }

  // 2b. customerSignature (string)
  const recoveriesWithSig = await recoveries.find({
    customerSignature: { $regex: OLD_DOMAIN }
  }).toArray();
  console.log("\n📋 Recoveries with customerSignature to migrate: " + recoveriesWithSig.length);

  for (const rec of recoveriesWithSig) {
    const updated = rec.customerSignature.replace(new RegExp(OLD_DOMAIN, "g"), NEW_DOMAIN);
    if (!DRY_RUN) {
      await recoveries.updateOne(
        { _id: rec._id },
        { $set: { customerSignature: updated } }
      );
    }
    console.log("  → Recovery " + rec._id);
  }

  // ═══════════════════════════════════════════════════════════════
  // Summary
  // ═══════════════════════════════════════════════════════════════
  const totalAffected =
    ordersWithPhoto.length +
    ordersWithSig.length +
    ordersWithCert.length +
    recoveriesWithPhoto.length +
    recoveriesWithSig.length;

  console.log("\n" + "═".repeat(60));
  console.log("📊 Total documents affected: " + totalAffected);
  if (DRY_RUN) {
    console.log("\n⚠️  This was a DRY RUN. To apply changes, run:");
    console.log("   node scripts/migrate-image-urls.js --execute");
  } else {
    console.log("\n✅ Migration complete!");
  }
  console.log("═".repeat(60) + "\n");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
