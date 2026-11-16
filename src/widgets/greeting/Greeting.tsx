import { useTime } from "@/core/time/useTime";
import type { WidgetProps } from "@/core/widgets/types";

import type { GreetingData } from ".";
import { greetingText } from "./greeting";

export default function Greeting({ data }: WidgetProps<GreetingData>) {
  const now = useTime("minute");
  return (
    <p className="greeting" style={{ margin: 0, fontSize: "2em" }}>
      {greetingText(now.getHours(), data.name)}
    </p>
  );
}
