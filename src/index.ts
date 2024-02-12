#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import chalk from "chalk";
import { generateSchema, generateSchemaFromMultipleSamples } from "./generator";
import { GeneratorOptions, JsonValue } from "./types";

export { generateSchema, generateSchemaFromMultipleSamples } from "./generator";
export { JsonSchema, JsonValue, GeneratorOptions } from "./types";

function printUsage(): void {
  console.log(`
${chalk.bold("json-schema-generator")} - Infer JSON Schema from sample JSON data

${chalk.bold("Usage:")}
  json-schema-gen <file> [options]
  cat data.json | json-schema-gen --stdin [options]

${chalk.bold("Options:")}
  --stdin            Read JSON from stdin
  --title <title>    Set schema title
  --desc <desc>      Set schema description
  --no-required      Do not infer required fields
  --no-additional    Set additionalProperties to false
  --pretty           Pretty-print output (default)
  --compact          Compact JSON output
  --output <file>    Write schema to file instead of stdout
  --help             Show this help message

${chalk.bold("Examples:")}
  json-schema-gen sample.json
  json-schema-gen sample.json --title "User Schema" --output schema.json
  cat data.json | json-schema-gen --stdin
`);
}

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  });
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    printUsage();
    process.exit(0);
  }

  let inputFile: string | null = null;
  let useStdin = false;
  let compact = false;
  let outputFile: string | null = null;
  const options: GeneratorOptions = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--stdin":
        useStdin = true;
        break;
      case "--title":
        options.title = args[++i];
        break;
      case "--desc":
        options.description = args[++i];
        break;
      case "--no-required":
        options.inferRequired = false;
        break;
      case "--no-additional":
        options.includeAdditionalProperties = false;
        break;
      case "--compact":
        compact = true;
        break;
      case "--pretty":
        compact = false;
        break;
      case "--output":
        outputFile = args[++i];
        break;
      default:
        if (!args[i].startsWith("--") && !inputFile) {
          inputFile = args[i];
        }
        break;
    }
  }

  let jsonString: string;

  if (useStdin) {
    if (process.stdin.isTTY) {
      console.error(chalk.red("Error: No input on stdin. Pipe JSON data or use a file argument."));
      process.exit(1);
    }
    jsonString = await readStdin();
  } else if (inputFile) {
    const filePath = path.resolve(inputFile);
    if (!fs.existsSync(filePath)) {
      console.error(chalk.red(`Error: File not found: ${filePath}`));
      process.exit(1);
    }
    jsonString = fs.readFileSync(filePath, "utf-8");
  } else {
    printUsage();
    process.exit(1);
    return;
  }

  let parsed: JsonValue;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    console.error(chalk.red("Error: Invalid JSON input"));
    process.exit(1);
    return;
  }

  let schema;
  if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "object") {
    schema = generateSchemaFromMultipleSamples(parsed, options);
  } else {
    schema = generateSchema(parsed, options);
  }

  const indent = compact ? 0 : 2;
  const output = JSON.stringify(schema, null, indent);

  if (outputFile) {
    const outPath = path.resolve(outputFile);
    fs.writeFileSync(outPath, output + "\n", "utf-8");
    console.error(chalk.green(`Schema written to ${outPath}`));
  } else {
    console.log(output);
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(chalk.red(`Error: ${err instanceof Error ? err.message : String(err)}`));
    process.exit(1);
  });
}
