import { defineWidget } from "@/core/widgets/types";

import Links from "./Links";
import LinksSettings from "./LinksSettings";
import { defaultLinksData, type LinksData } from "./model";

export const linksWidget = defineWidget<LinksData>({
  type: "links",
  name: "Quick Links",
  description: "Your favourite sites as tiles, with folders.",
  defaultData: defaultLinksData(),
  dataVersion: 1,
  Component: Links,
  Settings: LinksSettings,
});
