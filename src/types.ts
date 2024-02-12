export interface JsonSchema {
  $schema?: string;
  title?: string;
  description?: string;
  type?: string | string[];
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
  enum?: unknown[];
  additionalProperties?: boolean;
  minItems?: number;
  maxItems?: number;
}

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface GeneratorOptions {
  title?: string;
  description?: string;
  includeAdditionalProperties?: boolean;
  inferRequired?: boolean;
}
