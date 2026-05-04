"use client";

import * as React from "react";
import { DirectionProvider as RadixDirectionProvider } from
  "@radix-ui/react-direction";

export function DirectionProvider({
  children,
  direction = "ltr",
}: {
  children: React.ReactNode;
  direction?: "ltr" | "rtl";
}) {
  return (
    <RadixDirectionProvider dir={direction}>
      {children}
    </RadixDirectionProvider>
  );
}