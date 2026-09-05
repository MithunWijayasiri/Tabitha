// Falls back to the scheme for about:/chrome:/file: urls, which have no hostname.
export function getDomain(url: string | undefined) {
  if (!url) return "";

  try {
    const { hostname, protocol } = new URL(url);

    if (!hostname) return protocol.replace(":", "");

    return hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
