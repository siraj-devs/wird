"use client";

import {
  CalendarBlankIcon,
  ChartBarIcon,
  HouseIcon,
  IconProps,
  NotepadIcon,
  UserCheckIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAVIGATION_ITEMS = [
  {
    href: "/panel/weeks",
    icon: (props: IconProps) => <CalendarBlankIcon {...props} />,
  },
  {
    href: "/panel/stats",
    icon: (props: IconProps) => <ChartBarIcon {...props} />,
  },
  {
    href: "/panel",
    icon: (props: IconProps) => <HouseIcon {...props} />,
  },
  {
    href: "/panel/meeting-attendance",
    icon: (props: IconProps) => <UserCheckIcon {...props} />,
  },
  {
    href: "/panel/feedbacks",
    icon: (props: IconProps) => <NotepadIcon {...props} />,
  },
];

export function PanelNavigation() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-4 left-1/2 flex -translate-x-1/2 gap-2 rounded-full bg-white p-2 shadow-lg">
      {NAVIGATION_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex flex-col items-center rounded-full border p-2 text-xs ${pathname === item.href ? "border-primary-500 text-primary-500" : "border-gray-200 text-gray-500"}`}
        >
          {item.icon({
            size: 20,
            fill: "currentColor",
            weight: pathname === item.href ? "fill" : "regular",
          })}
        </Link>
      ))}
    </div>
  );
}
