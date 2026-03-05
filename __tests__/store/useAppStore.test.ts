/**
 * Tests for the new store actions added in Phase 4:
 *   - splitField
 *   - batchUpdateCategory
 *   - columnMappings management
 */

import { useAppStore, ValidationField } from '../../src/store/useAppStore';

// Helper to seed the store with fields
function seedFields(fields: ValidationField[]) {
    useAppStore.setState({ validation: { fields, isDirty: false }, columnMappings: [] });
}

describe('useAppStore — splitField', () => {
    beforeEach(() => {
        useAppStore.setState({
            validation: { fields: [], isDirty: false },
            columnMappings: [],
        });
    });

    it('splits a field value at the given index into two new fields', () => {
        const field: ValidationField = {
            id: 'f1',
            label: 'Full Name',
            value: 'John Doe',
            confidence: 0.95,
        };
        seedFields([field]);

        useAppStore.getState().splitField('f1', 4); // "John" | " Doe"

        const { fields } = useAppStore.getState().validation;
        expect(fields).toHaveLength(2);
        expect(fields[0].value).toBe('John');
        expect(fields[1].value).toBe('Doe');
        expect(fields[0].id).toBe('f1_a');
        expect(fields[1].id).toBe('f1_b');
    });

    it('does nothing when id does not exist', () => {
        const field: ValidationField = {
            id: 'f1',
            label: 'Name',
            value: 'Alice',
            confidence: 0.9,
        };
        seedFields([field]);

        useAppStore.getState().splitField('nonexistent', 2);

        const { fields } = useAppStore.getState().validation;
        expect(fields).toHaveLength(1);
    });

    it('does nothing when split would produce an empty part', () => {
        const field: ValidationField = {
            id: 'f2',
            label: 'Code',
            value: 'AB',
            confidence: 0.8,
        };
        seedFields([field]);

        // splitIndex = 0 should clamp to 1 which gives " " / "B" — not empty,
        // but a split at the very end (2) would produce "AB" / "" which is guarded
        useAppStore.getState().splitField('f2', 2);

        const { fields } = useAppStore.getState().validation;
        // Clamped to max(1, min(2, value.length-1)) = max(1, min(2,1)) = 1 → valid
        // "A" / "B"
        expect(fields).toHaveLength(2);
    });

    it('marks validation as dirty after split', () => {
        const field: ValidationField = {
            id: 'f3',
            label: 'Note',
            value: 'Hello World',
            confidence: 0.85,
        };
        seedFields([field]);

        useAppStore.getState().splitField('f3', 5);

        expect(useAppStore.getState().validation.isDirty).toBe(true);
    });
});

describe('useAppStore — batchUpdateCategory', () => {
    beforeEach(() => {
        const fields: ValidationField[] = [
            { id: 'a', label: 'First', value: 'Alice', confidence: 0.9 },
            { id: 'b', label: 'Last', value: 'Bob', confidence: 0.8 },
            { id: 'c', label: 'Age', value: '30', confidence: 0.95 },
        ];
        seedFields(fields);
    });

    it('assigns the same category to all selected ids', () => {
        useAppStore.getState().batchUpdateCategory(['a', 'b'], 'Name');

        const { fields } = useAppStore.getState().validation;
        expect(fields.find((f) => f.id === 'a')?.category).toBe('Name');
        expect(fields.find((f) => f.id === 'b')?.category).toBe('Name');
        expect(fields.find((f) => f.id === 'c')?.category).toBeUndefined();
    });

    it('marks validation as dirty', () => {
        useAppStore.getState().batchUpdateCategory(['c'], 'Misc');
        expect(useAppStore.getState().validation.isDirty).toBe(true);
    });
});

describe('useAppStore — columnMappings', () => {
    beforeEach(() => {
        useAppStore.setState({ columnMappings: [] });
    });

    it('sets column mappings', () => {
        const mappings = [{ columnKey: 'Name', fieldIds: ['a', 'b'] }];
        useAppStore.getState().setColumnMappings(mappings);
        expect(useAppStore.getState().columnMappings).toEqual(mappings);
    });

    it('removes a mapping by column key', () => {
        useAppStore.setState({
            columnMappings: [
                { columnKey: 'Name', fieldIds: ['a'] },
                { columnKey: 'Date', fieldIds: ['b'] },
            ],
        });
        useAppStore.getState().removeColumnMapping('Name');
        const mappings = useAppStore.getState().columnMappings;
        expect(mappings).toHaveLength(1);
        expect(mappings[0].columnKey).toBe('Date');
    });

    it('clears column mappings on resetSession', () => {
        useAppStore.setState({ columnMappings: [{ columnKey: 'Name', fieldIds: ['x'] }] });
        useAppStore.getState().resetSession();
        expect(useAppStore.getState().columnMappings).toHaveLength(0);
    });
});
