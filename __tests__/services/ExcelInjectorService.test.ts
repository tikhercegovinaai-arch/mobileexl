/**
 * Tests for ExcelInjectorService — column-mapping based workbook generation.
 * These are pure logic tests and do not require a device.
 */

jest.mock('xlsx', () => {
    const actualSheetData: Record<string, object[]> = {};
    return {
        utils: {
            json_to_sheet: jest.fn((rows, opts) => {
                const sheet: Record<string, unknown> = { '!ref': 'A1:Z100' };
                // Store rows for assertions
                (sheet as any).__rows = rows;
                (sheet as any).__header = opts?.header;
                return sheet;
            }),
            book_new: jest.fn(() => ({ SheetNames: [], Sheets: {} })),
            book_append_sheet: jest.fn((wb, ws, name) => {
                wb.SheetNames.push(name);
                wb.Sheets[name] = ws;
            }),
            encode_cell: jest.fn(({ r, c }) => `${String.fromCharCode(65 + c)}${r + 1}`),
            sheet_to_csv: jest.fn(() => 'col1,col2\nval1,val2'),
        },
        write: jest.fn(() => 'base64encodeddata'),
    };
});

jest.mock('expo-file-system', () => ({
    Paths: { cache: '/tmp' },
    File: jest.fn().mockImplementation((_dir, name) => ({
        uri: `/tmp/${name}`,
        write: jest.fn().mockResolvedValue(undefined),
    })),
    EncodingType: { Base64: 'base64', UTF8: 'utf8' },
}));

import { ExcelInjectorService, InjectorColumnMapping } from '../../src/services/ExcelInjectorService';
import { ValidationField } from '../../src/store/useAppStore';
import * as XLSX from 'xlsx';

const makeField = (id: string, label: string, value: string, category?: string): ValidationField => ({
    id,
    label,
    value,
    confidence: 0.9,
    category,
});

describe('ExcelInjectorService.injectToExcel', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('creates a workbook and appends a structured sheet', async () => {
        const fields = [
            makeField('f1', 'First Name', 'Alice', 'Name'),
            makeField('f2', 'Date of Birth', '1990-01-01', 'Date'),
        ];
        const mappings: InjectorColumnMapping[] = [
            { columnKey: 'Name', fieldIds: ['f1'] },
            { columnKey: 'Date', fieldIds: ['f2'] },
        ];

        const uri = await ExcelInjectorService.injectToExcel(fields, mappings);

        expect(XLSX.utils.book_new).toHaveBeenCalledTimes(1);
        expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(
            expect.any(Object),
            expect.any(Object),
            'Structured Data',
        );
        expect(typeof uri).toBe('string');
        expect(uri).toContain('.xlsx');
    });

    it('routes unmapped fields to a Misc column', async () => {
        const fields = [
            makeField('f1', 'Name', 'Bob', 'Name'),
            makeField('f2', 'Mystery', 'Unknown'), // no category, not in mappings
        ];
        const mappings: InjectorColumnMapping[] = [
            { columnKey: 'Name', fieldIds: ['f1'] },
        ];

        await ExcelInjectorService.injectToExcel(fields, mappings);

        // Verify json_to_sheet was called with rows containing the Misc column
        const callArgs = (XLSX.utils.json_to_sheet as jest.Mock).mock.calls[0];
        const rows: Record<string, string>[] = callArgs[0];
        const hasMisc = rows.some((r) => Object.keys(r).some((k) => k.includes('Misc')));
        expect(hasMisc).toBe(true);
    });

    it('returns a CSV file when format is csv', async () => {
        const fields = [makeField('f1', 'Name', 'Charlie', 'Name')];
        const mappings: InjectorColumnMapping[] = [{ columnKey: 'Name', fieldIds: ['f1'] }];

        const uri = await ExcelInjectorService.injectToExcel(fields, mappings, { format: 'csv' });

        expect(uri).toContain('.csv');
        expect(XLSX.utils.sheet_to_csv).toHaveBeenCalled();
    });

    it('uses a custom filename when provided', async () => {
        const fields = [makeField('f1', 'Name', 'Diana', 'Name')];
        const mappings: InjectorColumnMapping[] = [{ columnKey: 'Name', fieldIds: ['f1'] }];

        const uri = await ExcelInjectorService.injectToExcel(fields, mappings, { filename: 'MyExport' });

        expect(uri).toContain('MyExport.xlsx');
    });

    it('handles empty fields and mappings gracefully', async () => {
        const uri = await ExcelInjectorService.injectToExcel([], []);
        expect(typeof uri).toBe('string');
    });
});
