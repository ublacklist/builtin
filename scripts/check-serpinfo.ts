import fs from "node:fs/promises";
import { parse } from "@ublacklist/serpinfo";

async function main() {
  for await (const path of fs.glob("./serpinfo/*.yml")) {
    const input = await fs.readFile(path, "utf8");
    const result = parse(input, { strict: true, multilineError: true });
    if (!result.success) {
      console.error(`${path}:\n${result.error}`);
      process.exitCode = 1;
    }
  }
}

await main();
