const { z } = require("zod");

const termItemSchema = z.object({
  name: z.string().min(1),
  aliases: z.array(z.string().min(1)).default([]),
  acronyms: z.array(z.string().min(1)).default([]),
});

const mappingSchema = z
  .object({
    termId: z.string().min(1),
    sourceSide: z.enum(["nutanix", "vmware"]),
    nutanixTerms: z.array(termItemSchema).min(1),
    vmwareTerms: z.array(termItemSchema).min(1),
    equivalenceType: z.enum(["direct", "partial", "closest", "none"]),
    explanation: z.string().min(1),
    definition: z.string().min(1),
    sourceRef: z.string().min(1).optional(),
    tags: z.array(z.string()).default([]),
    lastReviewedAt: z.string().min(1),
    owner: z.string().min(1),
  });

const lifecycleStateSchema = z.enum(["draft", "review", "approved"]);

const sourceRefSchema = z.object({
  path: z.string().min(1),
  startLine: z.number().int().positive().optional(),
  endLine: z.number().int().positive().optional(),
});

const sourceRecordSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  sourceSide: z.enum(["nutanix", "vmware"]),
  state: lifecycleStateSchema,
  nutanixTerms: z.array(termItemSchema).min(1),
  vmwareTerms: z.array(termItemSchema).min(1),
  equivalenceType: z.enum(["direct", "partial", "closest", "none"]),
  explanation: z.string().min(1),
  definition: z.string().min(1),
  tags: z.array(z.string()).default([]),
  sourceRefs: z.array(sourceRefSchema).default([]),
  owner: z.string().min(1).default("unassigned"),
  review: z
    .object({
      reviewedBy: z.string().min(1).optional(),
      reviewedAt: z.string().min(1).optional(),
      notes: z.string().optional(),
    })
    .optional(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  version: z.number().int().positive().default(1),
});

const sourceRecordsFileSchema = z.object({
  version: z.string().min(1),
  generatedAt: z.string().min(1),
  records: z.array(sourceRecordSchema),
});

const compiledByIdFileSchema = z.object({
  version: z.string().min(1),
  generatedAt: z.string().min(1),
  count: z.number().int().nonnegative(),
  byId: z.record(z.string(), mappingSchema),
});

const compiledSearchDocSchema = z.object({
  id: z.string().min(1),
  termBlob: z.string(),
  nutanixBlob: z.string(),
  vmwareBlob: z.string(),
  mapping: mappingSchema,
});

const compiledSearchFileSchema = z.object({
  version: z.string().min(1),
  generatedAt: z.string().min(1),
  count: z.number().int().nonnegative(),
  docs: z.array(compiledSearchDocSchema),
});

const mappingsFileSchema = z.object({
  version: z.string().min(1),
  generatedAt: z.string().min(1),
  mappings: z.array(mappingSchema),
});

function validateMappingsFile(input) {
  return mappingsFileSchema.parse(input);
}

function validateSourceRecordsFile(input) {
  return sourceRecordsFileSchema.parse(input);
}

function validateCompiledByIdFile(input) {
  return compiledByIdFileSchema.parse(input);
}

function validateCompiledSearchFile(input) {
  return compiledSearchFileSchema.parse(input);
}

module.exports = {
  termItemSchema,
  mappingSchema,
  mappingsFileSchema,
  sourceRecordSchema,
  sourceRecordsFileSchema,
  lifecycleStateSchema,
  sourceRefSchema,
  compiledByIdFileSchema,
  compiledSearchFileSchema,
  compiledSearchDocSchema,
  validateMappingsFile,
  validateSourceRecordsFile,
  validateCompiledByIdFile,
  validateCompiledSearchFile,
};
