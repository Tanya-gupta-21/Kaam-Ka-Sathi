export const SERVICE_CATEGORIES = [
  { name: "Teacher / Tutor", icon: "👩‍🏫" },
  { name: "Plumber", icon: "🔧" },
  { name: "Electrician", icon: "💡" },
  { name: "Carpenter", icon: "🪚" },
  { name: "Painter", icon: "🎨" },
  { name: "Tailor", icon: "🧵" },
  { name: "Cook / Tiffin", icon: "🍲" },
  { name: "Driver", icon: "🚗" },
  { name: "Cleaner / Maid", icon: "🧹" },
  { name: "Mechanic", icon: "🛠️" },
  { name: "Other", icon: "🙋" },
];

export function serviceIcon(category: string) {
  return SERVICE_CATEGORIES.find((c) => c.name === category)?.icon ?? "🙋";
}