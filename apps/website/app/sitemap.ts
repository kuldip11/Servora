import type { MetadataRoute } from "next";
import { modules } from "@/content/modules";
export default function sitemap(): MetadataRoute.Sitemap { const base=process.env.NEXT_PUBLIC_SITE_URL ?? "https://servora.example"; const routes=["/","/product","/apps","/pricing","/book-a-demo","/contact","/login","/legal/privacy","/legal/terms","/legal/cookies",...modules.map(m=>`/product/${m.slug}`)]; return routes.map(path=>({url:`${base}${path}`,lastModified:"2026-08-28",changeFrequency:path==="/"?"weekly":"monthly",priority:path==="/"?1:path.startsWith("/product") ? .7 : .6})); }
