export interface RoundEvent {
  icon: string;
  title: string;
  description: string;
}

export const ROUND_EVENTS: RoundEvent[] = [
  {
    icon: "🤫",
    title: "Ronda de Mímica",
    description:
      "En la primera vuelta está prohibido hablar: cada jugador debe dar su pista solo con gestos.",
  },
  {
    icon: "✌️",
    title: "Doble Pista",
    description:
      "Cada jugador debe decir exactamente 2 palabras seguidas en su turno en lugar de una.",
  },
  {
    icon: "👉",
    title: "Interrogatorio Cruzado",
    description:
      "No hay orden en círculo: quien termina su pista señala directamente quién habla después.",
  },
  {
    icon: "😐",
    title: "Rostro de Póker",
    description:
      "Prohibido reírse al dar tu pista. Quien se ría recibe automáticamente sospecha del grupo.",
  },
  {
    icon: "⚡",
    title: "Pista Relámpago",
    description:
      "Nadie puede tardar más de 3 segundos pensando su palabra cuando le toca el turno.",
  },
  {
    icon: "🚫",
    title: "Inicial Prohibida",
    description:
      "Está prohibido decir pistas que empiecen con la misma letra inicial de la palabra secreta.",
  },
];

export const PLAYER_PALETTE = [
  { bg: "bg-sky-500/20", text: "text-sky-400", border: "border-sky-500/50" },
  { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/50" },
  { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/50" },
  { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/50" },
  { bg: "bg-pink-500/20", text: "text-pink-400", border: "border-pink-500/50" },
  { bg: "bg-teal-500/20", text: "text-teal-400", border: "border-teal-500/50" },
  { bg: "bg-rose-500/20", text: "text-rose-400", border: "border-rose-500/50" },
  { bg: "bg-indigo-500/20", text: "text-indigo-400", border: "border-indigo-500/50" },
  { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/50" },
  { bg: "bg-cyan-500/20", text: "text-cyan-400", border: "border-cyan-500/50" },
];

export function getPlayerBadge(index: number) {
  return PLAYER_PALETTE[index % PLAYER_PALETTE.length]!;
}
