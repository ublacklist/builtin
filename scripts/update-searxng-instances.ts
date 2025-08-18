import fs from "node:fs/promises";

async function main() {
  const response = await fetch(
    "https://raw.githubusercontent.com/searxng/searx-instances/refs/heads/master/searxinstances/instances.yml",
  );
  if (!response.ok) {
    throw new Error(
      `Failed to fetch instances.yml: ${response.status} ${response.statusText}`,
    );
  }
  const instancesYaml = await response.text();
  const instances = instancesYaml.split("\n").flatMap((line) => {
    const url = /^https?:\/\/[^:]+/.exec(line)?.[0];
    return url && URL.canParse(url) ? url : [];
  });

  const serpInfo = await fs.readFile("./serpinfo/searxng.yml", "utf8");
  const serpInfoLines = serpInfo.split("\n");
  const markerIndex = serpInfoLines.findIndex((line) =>
    line.includes("# DO NOT EDIT: "),
  );
  if (markerIndex === -1) {
    throw new Error("searxng.yml does not have a `matches` entry");
  }
  const matchesLength = serpInfoLines
    .slice(markerIndex + 1)
    .findIndex((line) => !line.startsWith("      - "));
  if (matchesLength === -1) {
    throw new Error("searxng.yml does not end with a newline");
  }
  serpInfoLines.splice(
    markerIndex + 1,
    matchesLength,
    ...instances.map((url) => `      - ${url}/*`),
  );
  await fs.writeFile("./serpinfo/searxng.yml", serpInfoLines.join("\n"));
}

await main();
