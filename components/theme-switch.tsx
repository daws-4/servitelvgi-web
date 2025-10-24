"use client";

import { FC } from "react";
import clsx from "clsx";
import { SunFilledIcon } from "@/components/icons";

export interface ThemeSwitchProps {
  className?: string;
}

// Non-interactive theme indicator. The app is forced to light mode so this
// component only shows the sun icon and does not allow toggling.
export const ThemeSwitch: FC<ThemeSwitchProps> = ({ className }) => {
  return (
    <div
      aria-hidden
      className={clsx(
        "px-px transition-opacity opacity-90",
        className,
      )}
    >
      <SunFilledIcon size={22} />
    </div>
  );
};
