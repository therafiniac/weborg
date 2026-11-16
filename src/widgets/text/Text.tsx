import type { WidgetProps } from "@/core/widgets/types";

import type { TextData } from ".";
import "./Text.css";

export default function Text({ data }: WidgetProps<TextData>) {
  if (!data.text.trim()) return null;
  return <p className="text-widget">{data.text}</p>;
}
