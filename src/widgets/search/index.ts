import { defineWidget } from "@/core/widgets/types";

import type { EngineId } from "./engines";
import Search from "./Search";
import SearchSettings from "./SearchSettings";

export interface SearchData {
  engine: EngineId;
  /** Used when engine is "custom"; must contain {query}. */
  customUrl: string;
  openInNewTab: boolean;
}

export const searchWidget = defineWidget<SearchData>({
  type: "search",
  name: "Search",
  description: "Search the web with the engine you choose.",
  defaultData: { engine: "duckduckgo", customUrl: "", openInNewTab: false },
  dataVersion: 1,
  Component: Search,
  Settings: SearchSettings,
});
