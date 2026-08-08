/**
 * Centralized clipboard utility.
 * Uses the Clipboard API with a fallback to execCommand.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Strategy 1: Modern Clipboard API
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Strategy 2: Legacy fallback
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      textarea.style.pointerEvents = "none";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      return true;
    } catch {
      return false;
    }
  }
}