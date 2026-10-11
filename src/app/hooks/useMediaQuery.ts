import React from "react";

export function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(() => (
    typeof window !== "undefined" ? window.matchMedia(query).matches : false
  ));

  React.useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);

  return matches;
}
