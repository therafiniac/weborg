export function greetingFor(hour: number): string {
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 22) return "Good evening";
  return "Good night";
}

export function greetingText(hour: number, name: string): string {
  const trimmed = name.trim();
  return trimmed ? `${greetingFor(hour)}, ${trimmed}` : greetingFor(hour);
}
