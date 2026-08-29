import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Servora",
    short_name: "Servora",
    description: "Connected restaurant operations software.",
    start_url: "/",
    display: "standalone",
  };
}
