import { defineWidget } from "@/core/widgets/types";

import Links from "./Links";
import LinksSettings from "./LinksSettings";
import {
  defaultLinksData,
  LINKS_DATA_VERSION,
  linksMigrations,
  type LinksData,
} from "./model";

export const linksWidget = defineWidget<LinksData>({
  type: "links",
  name: "Quick Links",
  description: "Your favourite sites as tiles, with folders.",
  defaultData: defaultLinksData(),
  dataVersion: LINKS_DATA_VERSION,
  migrations: linksMigrations,
  Component: Links,
  Settings: LinksSettings,
});
