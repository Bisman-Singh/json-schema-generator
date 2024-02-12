import { JsonSchema, JsonValue, GeneratorOptions } from "./types";

function getJsonType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function mergeSchemas(a: JsonSchema, b: JsonSchema): JsonSchema {
  if (a.type === b.type && a.type === "object") {
    const merged: JsonSchema = { type: "object" };
    const allKeys = new Set([
      ...Object.keys(a.properties || {}),
      ...Object.keys(b.properties || {}),
    ]);

    merged.properties = {};
    const aRequired = new Set(a.required || []);
    const bRequired = new Set(b.required || []);
    const mergedRequired: string[] = [];

    for (const key of allKeys) {
      const aProp = a.properties?.[key];
      const bProp = b.properties?.[key];

      if (aProp && bProp) {
        merged.properties[key] = mergeSchemas(aProp, bProp);
        if (aRequired.has(key) && bRequired.has(key)) {
          mergedRequired.push(key);
        }
      } else if (aProp) {
        merged.properties[key] = aProp;
      } else if (bProp) {
        merged.properties[key] = bProp;
      }
    }

    if (mergedRequired.length > 0) {
      merged.required = mergedRequired.sort();
    }

    return merged;
  }

  if (a.type === b.type) {
    return { ...a };
  }

  const types = new Set<string>();
  if (Array.isArray(a.type)) {
    a.type.forEach((t) => types.add(t));
  } else if (a.type) {
    types.add(a.type);
  }
  if (Array.isArray(b.type)) {
    b.type.forEach((t) => types.add(t));
  } else if (b.type) {
    types.add(b.type);
  }

  return { type: Array.from(types) };
}

function inferSchemaFromValue(value: JsonValue): JsonSchema {
  const type = getJsonType(value);

  switch (type) {
    case "string":
      return { type: "string" };

    case "number":
      if (Number.isInteger(value)) {
        return { type: "integer" };
      }
      return { type: "number" };

    case "boolean":
      return { type: "boolean" };

    case "null":
      return { type: "null" };

    case "array": {
      const arr = value as JsonValue[];
      if (arr.length === 0) {
        return { type: "array", items: {} };
      }

      let itemSchema = inferSchemaFromValue(arr[0]);
      for (let i = 1; i < arr.length; i++) {
        const elementSchema = inferSchemaFromValue(arr[i]);
        itemSchema = mergeSchemas(itemSchema, elementSchema);
      }

      return { type: "array", items: itemSchema };
    }

    case "object": {
      const obj = value as Record<string, JsonValue>;
      const properties: Record<string, JsonSchema> = {};
      const required: string[] = [];

      for (const [key, val] of Object.entries(obj)) {
        properties[key] = inferSchemaFromValue(val);
        required.push(key);
      }

      const schema: JsonSchema = { type: "object", properties };
      if (required.length > 0) {
        schema.required = required.sort();
      }

      return schema;
    }

    default:
      return {};
  }
}

export function generateSchema(
  input: JsonValue,
  options: GeneratorOptions = {}
): JsonSchema {
  const schema = inferSchemaFromValue(input);

  const result: JsonSchema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    ...schema,
  };

  if (options.title) {
    result.title = options.title;
  }

  if (options.description) {
    result.description = options.description;
  }

  if (options.includeAdditionalProperties === false && result.type === "object") {
    result.additionalProperties = false;
  }

  if (options.inferRequired === false) {
    deleteRequired(result);
  }

  return result;
}

function deleteRequired(schema: JsonSchema): void {
  delete schema.required;
  if (schema.properties) {
    for (const prop of Object.values(schema.properties)) {
      deleteRequired(prop);
    }
  }
  if (schema.items && typeof schema.items === "object") {
    deleteRequired(schema.items);
  }
}

export function generateSchemaFromMultipleSamples(
  samples: JsonValue[],
  options: GeneratorOptions = {}
): JsonSchema {
  if (samples.length === 0) {
    return { $schema: "http://json-schema.org/draft-07/schema#" };
  }

  let schema = inferSchemaFromValue(samples[0]);

  for (let i = 1; i < samples.length; i++) {
    const sampleSchema = inferSchemaFromValue(samples[i]);
    schema = mergeSchemas(schema, sampleSchema);
  }

  const result: JsonSchema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    ...schema,
  };

  if (options.title) result.title = options.title;
  if (options.description) result.description = options.description;
  if (options.includeAdditionalProperties === false && result.type === "object") {
    result.additionalProperties = false;
  }
  if (options.inferRequired === false) {
    deleteRequired(result);
  }

  return result;
}
