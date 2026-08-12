import React from "react";
import { cn } from "../lib/utils";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children, className }) => (
  <div className={cn("route-enter", className)}>{children}</div>
);
