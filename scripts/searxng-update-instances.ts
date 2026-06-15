import fs from "node:fs/promises";

async function main() {
  const INSTANCES_URL =
    "https://raw.githubusercontent.com/searxng/searx-instances/refs/heads/master/searxinstances/instances.yml";
  const SERPINFO_PATH = "./serpinfo/searxng.yml";

  console.log(`Fetching instances from ${INSTANCES_URL}`);
  const response = await fetch(INSTANCES_URL);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch: ${response.status} ${response.statusText}`,
    );
  }
  const instances = await response.text();
  const matches = instances.split("\n").flatMap((line) => {
    // Extract YAML top-level keys (instance URLs)
    const m = line.match(/^(?!\s)([^:]|:(?!\s|$))+/);
    if (!m) {
      return [];
    }
    try {
      const url = new URL(m[0]);
      return `${url.protocol}//${url.hostname}${url.pathname.replace(/\/$/, "")}/*`;
    } catch {
      throw new Error(`Invalid URL: ${m[0]}`);
    }
  });
  console.log(`Found ${matches.length} instances`);

  const serpInfo = await fs.readFile(SERPINFO_PATH, "utf8");
  const serpInfoLines = serpInfo.split("\n");
  const markerIndex = serpInfoLines.findIndex((line) =>
    line.includes("# DO NOT EDIT: "),
  );
  if (markerIndex === -1) {
    throw new Error(`Marker not found: ${SERPINFO_PATH}`);
  }
  const oldMatchesStartIndex = markerIndex + 1;
  const oldMatchesLength = serpInfoLines
    .slice(oldMatchesStartIndex)
    .findIndex((line) => !line.startsWith("      - "));
  if (oldMatchesLength === -1) {
    throw new Error(`File does not end with newline: ${SERPINFO_PATH}`);
  }
  serpInfoLines.splice(
    oldMatchesStartIndex,
    oldMatchesLength,
    ...matches.map((match) => `      - ${match}`),
  );
  await fs.writeFile(SERPINFO_PATH, serpInfoLines.join("\n"));
  console.log(`Replaced instances in ${SERPINFO_PATH}`);
}

await main();
