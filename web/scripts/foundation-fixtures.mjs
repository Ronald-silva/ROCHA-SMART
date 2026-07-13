import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const now = new Date();
const future = new Date(now.getTime() + 60 * 60 * 1000);
const past = new Date(now.getTime() - 60 * 1000);

async function seed() {
  await prisma.outboundClick.deleteMany({ where: { offer: { productId: { startsWith: "foundation-" } } } });
  await prisma.priceSnapshot.deleteMany({ where: { offer: { productId: { startsWith: "foundation-" } } } });
  await prisma.offer.deleteMany({ where: { productId: { startsWith: "foundation-" } } });
  await prisma.product.deleteMany({ where: { id: { startsWith: "foundation-" } } });
  await prisma.merchant.deleteMany({ where: { id: { startsWith: "foundation-" } } });
  await prisma.partner.deleteMany({ where: { id: { startsWith: "foundation-" } } });

  const partner = await prisma.partner.create({ data: { id: "foundation-partner", name: "Parceiro Teste", slug: "foundation-partner", allowedDomains: ["test.example"] } });
  const merchant = await prisma.merchant.create({ data: { id: "foundation-merchant", partnerId: partner.id, name: "Marketplace Teste", slug: "foundation-marketplace", domain: "test.example" } });
  const blockedPartner = await prisma.partner.create({ data: { id: "foundation-blocked-partner", name: "Parceiro Bloqueado", slug: "foundation-blocked", allowedDomains: ["approved.test"] } });
  const blockedMerchant = await prisma.merchant.create({ data: { id: "foundation-blocked-merchant", partnerId: blockedPartner.id, name: "Loja Bloqueada", slug: "foundation-blocked", domain: "approved.test" } });

  const products = [
    ["foundation-valid", "Produto Oferta Válida"], ["foundation-expired", "Produto Oferta Expirada"],
    ["foundation-paused", "Produto Oferta Pausada"], ["foundation-unavailable", "Produto Indisponível"],
    ["foundation-blocked", "Produto Domínio Bloqueado"], ["foundation-legacy", "Produto Legado Sem Oferta"],
    ["foundation-manufacturer", "Produto do Fabricante"],
  ];
  for (const [id, name] of products) await prisma.product.create({ data: { id, name, sku: id.toUpperCase(), price: "99.90", stockQuantity: 7, description: `Fixture isolada: ${name}`, ai_metadata: id === "foundation-legacy" ? { affiliate: { checkout_url: "https://legacy.invalid/never-use" } } : {} } });

  const common = { partnerId: partner.id, merchantId: merchant.id, price: "89.90", currency: "BRL", verificationSource: "fixture", verifiedAt: now, validUntil: future, commercialRelationship: "affiliate" };
  await prisma.offer.create({ data: { id: "foundation-offer-valid", productId: "foundation-valid", ...common, seller: "Vendedor Terceiro Teste", destinationUrl: "https://checkout.test.example/item", destinationType: "third_party_seller", availability: "in_stock", status: "active", affiliateMetadata: { tracking: { subidParam: "subid" } } } });
  await prisma.offer.create({ data: { id: "foundation-offer-expired", productId: "foundation-expired", ...common, destinationUrl: "https://checkout.test.example/expired", destinationType: "marketplace", availability: "in_stock", status: "active", verifiedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), validUntil: past } });
  await prisma.offer.create({ data: { id: "foundation-offer-paused", productId: "foundation-paused", ...common, destinationUrl: "https://checkout.test.example/paused", destinationType: "marketplace", availability: "in_stock", status: "paused" } });
  await prisma.offer.create({ data: { id: "foundation-offer-unavailable", productId: "foundation-unavailable", ...common, destinationUrl: "https://checkout.test.example/unavailable", destinationType: "marketplace", availability: "out_of_stock", status: "active" } });
  await prisma.offer.create({ data: { id: "foundation-offer-blocked", productId: "foundation-blocked", ...common, partnerId: blockedPartner.id, merchantId: blockedMerchant.id, destinationUrl: "https://evil.test/item", destinationType: "marketplace", availability: "in_stock", status: "active" } });
  await prisma.offer.create({ data: { id: "foundation-offer-manufacturer", productId: "foundation-manufacturer", ...common, destinationUrl: "https://www.test.example/direct", destinationType: "manufacturer", availability: "in_stock", status: "active" } });
  console.log("foundation fixtures seeded");
}

async function verifySqlAlchemyWrite() {
  const product = await prisma.product.findUnique({ where: { id: "foundation-sqlalchemy-write" } });
  if (!product || product.stockQuantity !== 4 || Number(product.price) !== 42) throw new Error("SQLAlchemy write not visible through Prisma");
  console.log("Prisma read SQLAlchemy write: ok");
}

async function verifyLegacy(stage) {
  const product = await prisma.product.findUnique({ where: { id: "legacy-product-preserved" }, include: { offers: true } });
  if (!product || product.stockQuantity !== 9 || product.ai_metadata?.affiliate?.checkout_url !== "https://legacy.invalid/not-authorized") throw new Error("legacy product not preserved");
  if (stage === "before-seed" && product.offers.length !== 0) throw new Error("legacy URL silently became Offer");
  if (stage === "after-seed") {
    const seeded = await prisma.offer.findUnique({ where: { id: "seed-amazon-echo-show-11-gra" } });
    if (!seeded || seeded.status !== "paused" || seeded.availability !== "unknown" || seeded.verificationSource !== "legacy_seed_unverified") throw new Error("legacy seed offer is not safely paused");
  }
  console.log(`legacy compatibility ${stage}: ok`);
}

async function verifyOutboundClick() {
  const rows = await prisma.outboundClick.findMany({ where: { offerId: "foundation-offer-valid" } });
  if (rows.length !== 1 || !/^[0-9a-f-]{36}$/i.test(rows[0].attributionId)) throw new Error("outbound click was not recorded exactly once");
  if (Object.hasOwn(rows[0], "fbclid") || Object.hasOwn(rows[0], "gclid")) throw new Error("raw click IDs must not be persisted");
  console.log("outbound click recorded once without raw click IDs: ok");
}

const [command, stage] = process.argv.slice(2);
try {
  if (command === "seed") await seed();
  else if (command === "verify-sqlalchemy") await verifySqlAlchemyWrite();
  else if (command === "verify-legacy") await verifyLegacy(stage);
  else if (command === "verify-outbound-click") await verifyOutboundClick();
  else throw new Error("usage: foundation-fixtures.mjs seed|verify-sqlalchemy|verify-legacy <stage>|verify-outbound-click");
} finally { await prisma.$disconnect(); }
