import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Saga Africa",
    short_name: "Saga",
    description: "Lisez et publiez mangas, webtoons et light novels — la plateforme des sagas africaines.",
    start_url: "/",
    display: "standalone",
    background_color: "#13181f",
    theme_color: "#ea5427",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
