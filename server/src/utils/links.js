const urlPattern = /\b((?:https?:\/\/|www\.)[^\s<>()]+|mailto:[^\s<>()]+)/gi;

export function extractLinks(text = "") {
  const seen = new Set();

  return [...text.matchAll(urlPattern)]
    .map((match) => match[0].replace(/[.,;:!?]+$/, ""))
    .filter((url) => {
      const key = url.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .map((url) => ({
      url: url.startsWith("www.") ? `https://${url}` : url,
      source: "text",
    }));
}
