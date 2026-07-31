import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

type SwaggerDtoClass = {
  _OPENAPI_METADATA_FACTORY?: () => Record<string, unknown>;
};

type DtoSpec = {
  file: string;
  className: string;
  enumProperties: string[];
};

const dtoSpecs: DtoSpec[] = [
  {
    file: 'update-inspection.dto.js',
    className: 'UpdateInspectionDto',
    enumProperties: ['status'],
  },
  {
    file: 'upsert-inspection-answer.dto.js',
    className: 'UpsertInspectionAnswerDto',
    enumProperties: ['answerValue'],
  },
  {
    file: 'update-inspection-status.dto.js',
    className: 'UpdateInspectionStatusDto',
    enumProperties: ['status'],
  },
  {
    file: 'create-inspection-finding.dto.js',
    className: 'CreateInspectionFindingDto',
    enumProperties: ['severity'],
  },
  {
    file: 'update-inspection-finding.dto.js',
    className: 'UpdateInspectionFindingDto',
    enumProperties: ['severity', 'status'],
  },
  {
    file: 'create-inspection-followup.dto.js',
    className: 'CreateInspectionFollowupDto',
    enumProperties: ['status'],
  },
  {
    file: 'update-inspection-followup.dto.js',
    className: 'UpdateInspectionFollowupDto',
    enumProperties: ['status'],
  },
];

function validateDto(spec: DtoSpec): void {
  const compiledDtoPath = resolve(
    process.cwd(),
    'dist/modules/inspections/dto',
    spec.file,
  );
  const compiledSource = readFileSync(compiledDtoPath, 'utf8');
  assert(
    !compiledSource.includes('packages/contracts/dist'),
    `${spec.className} must not reference the physical contracts build path`,
  );

  const dtoModule = require(compiledDtoPath) as Record<string, SwaggerDtoClass | undefined>;
  const dto = dtoModule[spec.className];
  assert(dto, `Compiled ${spec.className} must be loadable`);

  const metadataFactory = dto._OPENAPI_METADATA_FACTORY;
  assert(metadataFactory, `Swagger metadata factory must exist on ${spec.className}`);

  const metadata = metadataFactory();
  spec.enumProperties.forEach((property) => {
    assert(
      metadata[property] !== undefined,
      `Swagger metadata for ${spec.className} must expose ${property}`,
    );
  });
}

function main(): void {
  dtoSpecs.forEach(validateDto);
  console.log('Swagger portable enum metadata smoke test passed');
}

main();
