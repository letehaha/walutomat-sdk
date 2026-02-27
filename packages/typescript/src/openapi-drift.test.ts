import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Drift-detection test: ensures the OpenAPI spec in packages/api-explorer
 * stays in sync with the TypeScript endpoint implementations.
 *
 * Checks:
 * 1. Every endpoint path+method in the source code exists in the spec
 * 2. Every path+method in the spec exists in the source code
 * 3. Schema property names match TypeScript interface fields
 */

const specPath = resolve(__dirname, '../../api-explorer/openapi.json');
const spec = JSON.parse(readFileSync(specPath, 'utf-8'));

// ---------------------------------------------------------------------------
// 1. Collect endpoints declared in source code by scanning endpoint files
// ---------------------------------------------------------------------------

interface SourceEndpoint {
  method: 'GET' | 'POST';
  path: string;
  file: string;
}

function extractEndpointsFromSource(): SourceEndpoint[] {
  const endpointFiles = ['endpoints/account.ts', 'endpoints/transfers.ts', 'endpoints/direct-fx.ts', 'endpoints/market-fx.ts'];

  const endpoints: SourceEndpoint[] = [];
  const getPattern = /http\.get[^(]*\(\{[^}]*endpoint:\s*'([^']+)'/g;
  const postPattern = /http\.post(?:WithDuplicate)?[^(]*\(\{[^}]*endpoint:\s*'([^']+)'/g;

  for (const file of endpointFiles) {
    const content = readFileSync(resolve(__dirname, file), 'utf-8');

    for (const match of content.matchAll(getPattern)) {
      endpoints.push({ method: 'GET', path: match[1]!, file });
    }
    for (const match of content.matchAll(postPattern)) {
      endpoints.push({ method: 'POST', path: match[1]!, file });
    }
  }

  return endpoints;
}

// ---------------------------------------------------------------------------
// 2. Collect endpoints declared in the OpenAPI spec
// ---------------------------------------------------------------------------

interface SpecEndpoint {
  method: string;
  path: string;
  operationId: string;
}

function extractEndpointsFromSpec(): SpecEndpoint[] {
  const endpoints: SpecEndpoint[] = [];
  for (const [path, methods] of Object.entries(spec.paths)) {
    for (const method of ['get', 'post']) {
      if ((methods as Record<string, unknown>)[method]) {
        const op = (methods as Record<string, { operationId: string }>)[method]!;
        endpoints.push({ method: method.toUpperCase(), path, operationId: op.operationId });
      }
    }
  }
  return endpoints;
}

// ---------------------------------------------------------------------------
// 3. Extract property names from TypeScript interfaces
// ---------------------------------------------------------------------------

function extractInterfaceFields(filePath: string, interfaceName: string): string[] {
  const content = readFileSync(resolve(__dirname, filePath), 'utf-8');
  const pattern = new RegExp(`interface\\s+${interfaceName}\\s*(?:extends\\s+[^{]+)?\\{([^}]+)\\}`, 's');
  const match = content.match(pattern);
  if (!match) return [];

  const fields: string[] = [];
  for (const line of match[1]!.split('\n')) {
    const fieldMatch = line.match(/^\s*(?:\/\*\*.*\*\/\s*)?(\w+)[\s?]*:/);
    if (fieldMatch) {
      fields.push(fieldMatch[1]!);
    }
  }
  return fields;
}

function resolveSchemaProperties(schemaRef: string): string[] {
  const name = schemaRef.replace('#/components/schemas/', '');
  const schema = spec.components.schemas[name];
  if (!schema?.properties) return [];
  return Object.keys(schema.properties);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const sourceEndpoints = extractEndpointsFromSource();
const specEndpoints = extractEndpointsFromSpec();

describe('OpenAPI spec drift detection', () => {
  describe('endpoint coverage', () => {
    it('every source endpoint exists in the spec', () => {
      const specPaths = new Set(specEndpoints.map((e) => `${e.method} ${e.path}`));

      const missing: string[] = [];
      for (const ep of sourceEndpoints) {
        const key = `${ep.method} ${ep.path}`;
        if (!specPaths.has(key)) {
          missing.push(`${key} (from ${ep.file})`);
        }
      }

      expect(missing, `Endpoints in source but missing from OpenAPI spec:\n${missing.join('\n')}`).toEqual([]);
    });

    it('every spec endpoint exists in source', () => {
      const sourcePaths = new Set(sourceEndpoints.map((e) => `${e.method} ${e.path}`));

      const extra: string[] = [];
      for (const ep of specEndpoints) {
        const key = `${ep.method} ${ep.path}`;
        if (!sourcePaths.has(key)) {
          extra.push(`${key} (operationId: ${ep.operationId})`);
        }
      }

      expect(extra, `Endpoints in OpenAPI spec but missing from source:\n${extra.join('\n')}`).toEqual([]);
    });

    it('spec has the expected number of endpoints', () => {
      expect(specEndpoints.length).toBe(sourceEndpoints.length);
    });
  });

  describe('response schema field names match TypeScript types', () => {
    const typeChecks: { specSchema: string; tsFile: string; tsInterface: string }[] = [
      { specSchema: 'WalletBalance', tsFile: 'types/account.ts', tsInterface: 'WalletBalance' },
      { specSchema: 'HistoryItem', tsFile: 'types/account.ts', tsInterface: 'HistoryItem' },
      { specSchema: 'OperationDetail', tsFile: 'types/account.ts', tsInterface: 'OperationDetail' },
      { specSchema: 'TransferDetails', tsFile: 'types/transfers.ts', tsInterface: 'TransferDetails' },
      { specSchema: 'TransferCreationResult', tsFile: 'types/transfers.ts', tsInterface: 'TransferCreationResult' },
      { specSchema: 'ExchangeRate', tsFile: 'types/direct-fx.ts', tsInterface: 'ExchangeRate' },
      { specSchema: 'ExchangeResult', tsFile: 'types/direct-fx.ts', tsInterface: 'ExchangeResult' },
      { specSchema: 'OfferEntry', tsFile: 'types/market-fx.ts', tsInterface: 'OfferEntry' },
      { specSchema: 'BestOffers', tsFile: 'types/market-fx.ts', tsInterface: 'BestOffers' },
      { specSchema: 'DetailedOfferEntry', tsFile: 'types/market-fx.ts', tsInterface: 'DetailedOfferEntry' },
      { specSchema: 'DetailedQuote', tsFile: 'types/market-fx.ts', tsInterface: 'DetailedQuote' },
      { specSchema: 'BestOffersDetailed', tsFile: 'types/market-fx.ts', tsInterface: 'BestOffersDetailed' },
      { specSchema: 'MarketOrder', tsFile: 'types/market-fx.ts', tsInterface: 'MarketOrder' },
      { specSchema: 'SubmitOrderResult', tsFile: 'types/market-fx.ts', tsInterface: 'SubmitOrderResult' },
    ];

    for (const { specSchema, tsFile, tsInterface } of typeChecks) {
      it(`${specSchema} fields match ${tsInterface} in ${tsFile}`, () => {
        const specFields = resolveSchemaProperties(`#/components/schemas/${specSchema}`).sort();
        const tsFields = extractInterfaceFields(tsFile, tsInterface).sort();

        expect(tsFields.length, `Could not parse ${tsInterface} from ${tsFile}`).toBeGreaterThan(0);
        expect(specFields, `Schema ${specSchema} fields don't match ${tsInterface}`).toEqual(tsFields);
      });
    }
  });

  describe('enum values match TypeScript types', () => {
    const enumChecks: { specSchema: string; tsFile: string; tsType: string }[] = [
      { specSchema: 'BuySell', tsFile: 'types/common.ts', tsType: 'BuySell' },
      { specSchema: 'SortOrder', tsFile: 'types/common.ts', tsType: 'SortOrder' },
      { specSchema: 'OperationType', tsFile: 'types/common.ts', tsType: 'OperationType' },
      { specSchema: 'TransferCostInstruction', tsFile: 'types/common.ts', tsType: 'TransferCostInstruction' },
      { specSchema: 'TransferPurpose', tsFile: 'types/common.ts', tsType: 'TransferPurpose' },
      { specSchema: 'SourceOfIncome', tsFile: 'types/common.ts', tsType: 'SourceOfIncome' },
      { specSchema: 'TransferStatus', tsFile: 'types/transfers.ts', tsType: 'TransferStatus' },
      { specSchema: 'OrderStatus', tsFile: 'types/market-fx.ts', tsType: 'OrderStatus' },
      { specSchema: 'NonIbanCountry', tsFile: 'types/transfers.ts', tsType: 'NonIbanCountry' },
      { specSchema: 'CnapsTransactionType', tsFile: 'types/transfers.ts', tsType: 'CnapsTransactionType' },
    ];

    function extractEnumValues(filePath: string, typeName: string): string[] {
      const content = readFileSync(resolve(__dirname, filePath), 'utf-8');
      const pattern = new RegExp(`type\\s+${typeName}\\s*=[^;]+;`, 's');
      const match = content.match(pattern);
      if (!match) return [];

      const values: string[] = [];
      for (const m of match[0].matchAll(/'([^']+)'/g)) {
        values.push(m[1]!);
      }
      return values.sort();
    }

    for (const { specSchema, tsFile, tsType } of enumChecks) {
      it(`${specSchema} enum values match ${tsType} in ${tsFile}`, () => {
        const specValues = [...(spec.components.schemas[specSchema]?.enum ?? [])].sort();
        const tsValues = extractEnumValues(tsFile, tsType);

        expect(tsValues.length, `Could not parse ${tsType} from ${tsFile}`).toBeGreaterThan(0);
        expect(specValues, `Enum ${specSchema} values don't match ${tsType}`).toEqual(tsValues);
      });
    }
  });
});
