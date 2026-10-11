import React from "react";

interface PageTransitionProps { children: React.ReactNode; className?: string; }
// Opacity-only transitions never create a transformed containing block for fixed
// controls. Motion preference is honored by CSS, including first render.
export const PageTransition: React.FC<PageTransitionProps> = ({children,className}) =>
  <div className={['onod-page-enter',className].filter(Boolean).join(' ')}>{children}</div>;
