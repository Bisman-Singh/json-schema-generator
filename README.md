# json-schema-generator

Takes sample JSON input and infers a JSON Schema (draft-07) from it.

## Features

- Infers JSON Schema from any JSON value (objects, arrays, primitives)
- Handles nested objects and arrays
- Detects mixed types in arrays
- Distinguishes between `integer` and `number`
- Merges schemas from multiple sample objects (array input)
- Outputs JSON Schema draft-07 compliant output
- CLI reads from file or stdin
- Usable as an importable library

## Installation

```bash
npm install
npm run build
```

## CLI Usage

```bash
# From a file
npx json-schema-gen sample.json

# With title and output file
npx json-schema-gen sample.json --title "User Schema" --output schema.json

# From stdin
cat data.json | npx json-schema-gen --stdin

# Compact output, no required fields
npx json-schema-gen sample.json --compact --no-required
```

## Library Usage

```typescript
import { generateSchema } from "json-schema-generator";

const sample = {
  name: "Jane Doe",
  age: 30,
  active: true,
  tags: ["admin", "user"],
  address: {
    street: "123 Main St",
    city: "Anytown"
  }
};

const schema = generateSchema(sample, { title: "User" });
console.log(JSON.stringify(schema, null, 2));
```

## Options

| Option               | CLI Flag           | Description                          |
|----------------------|--------------------|--------------------------------------|
| `title`              | `--title <t>`      | Set schema title                     |
| `description`        | `--desc <d>`       | Set schema description               |
| `inferRequired`      | `--no-required`    | Skip inferring required fields       |
| `includeAdditionalProperties` | `--no-additional` | Set additionalProperties to false |


