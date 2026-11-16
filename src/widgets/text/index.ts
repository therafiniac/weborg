import { defineWidget } from "@/core/widgets/types";

import Text from "./Text";
import TextSettings from "./TextSettings";

export interface TextData {
  text: string;
}

export const textWidget = defineWidget<TextData>({
  type: "text",
  name: "Text",
  description: "Show any message, quote or reminder.",
  defaultData: { text: "Welcome to Weborg" },
  dataVersion: 1,
  Component: Text,
  Settings: TextSettings,
});
