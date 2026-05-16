import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { getSiteUrl } from "@/lib/site-url";

export const revalidate = 300;

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${base}/privacidade`,
      lastModified: new Date("2025-05-01"),
      changeFrequency: "yearly",
      priority: 0.5,
    },
  ];

  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await prisma.product.findMany({
      select: { id: true, createdAt: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });
    productRoutes = products.map((p) => ({
      url: `${base}/p/${p.id}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: now.getTime() - p.createdAt.getTime() < SEVEN_DAYS_MS ? 0.9 : 0.8,
    }));
  } catch {
    // Banco indisponível no build — sitemap ainda lista as rotas estáticas
  }

  return [...staticRoutes, ...productRoutes];
}
