import { defineWidget } from "@/core/widgets/types";

import Greeting from "./Greeting";
import GreetingSettings from "./GreetingSettings";

export interface GreetingData {
  name: string;
}

export const greetingWidget = defineWidget<GreetingData>({
  type: "greeting",
  name: "Greeting",
  description: "Good morning, afternoon or evening.",
  defaultData: { name: "" },
  dataVersion: 1,
  Component: Greeting,
  Settings: GreetingSettings,
});
