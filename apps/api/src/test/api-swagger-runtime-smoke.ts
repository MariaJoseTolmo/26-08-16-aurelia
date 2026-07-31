import { resolve } from 'node:path';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function main(): void {
  const compiledDtoPath = resolve(
    process.cwd(),
    'dist/modules/inspections/dto/create-inspection-finding.dto.js',
  );
  const dtoModule = require(compiledDtoPath) as {
    CreateInspectionFindingDto?: {
      _OPENAPI_METADATA_FACTORY?: () => Record<string, unknown>;
    };
  };

  const dto = dtoModule.CreateInspectionFindingDto;
  assert(dto, 'Compiled CreateInspectionFindingDto must be loadable');

  const metadataFactory = dto._OPENAPI_METADATA_FACTORY;
  assert(metadataFactory, 'Swagger metadata factory must exist on the compiled DTO');

  const metadata = metadataFactory();
  assert(metadata.severity !== undefined, 'Swagger metadata must expose finding severity');

  console.log('Swagger runtime enum metadata smoke test passed');
}

main();
