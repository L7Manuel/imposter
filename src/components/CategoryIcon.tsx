import React from "react";
import {
  Dices,
  Utensils,
  MapPin,
  PawPrint,
  Package,
  Briefcase,
  Film,
  Trophy,
  Gamepad2,
  Music2,
  Globe2,
  Flame,
} from "lucide-react";

export function CategoryIcon({
  category,
  size = 18,
  className = "",
}: {
  category: string;
  size?: number;
  className?: string;
}) {
  switch (category) {
    case "Aleatoria":
      return <Dices size={size} className={className} />;
    case "Comida":
      return <Utensils size={size} className={className} />;
    case "Lugares":
      return <MapPin size={size} className={className} />;
    case "Animales":
      return <PawPrint size={size} className={className} />;
    case "Objetos":
      return <Package size={size} className={className} />;
    case "Profesiones":
      return <Briefcase size={size} className={className} />;
    case "Cine y Series":
      return <Film size={size} className={className} />;
    case "Deportes":
      return <Trophy size={size} className={className} />;
    case "Videojuegos y Geek":
      return <Gamepad2 size={size} className={className} />;
    case "Música y Artistas":
      return <Music2 size={size} className={className} />;
    case "Países y Maravillas":
      return <Globe2 size={size} className={className} />;
    case "Fiesta +18":
    case "🔞 Fiesta +18":
      return <Flame size={size} className={`text-rose-400 ${className}`} />;
    default:
      return <Package size={size} className={className} />;
  }
}
