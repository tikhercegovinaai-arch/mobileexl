import { mmkvStorage } from '../mmkvStorage';

describe('mmkvStorage', () => {
    beforeEach(() => {
        // Clear memory map fallback manually before each test if it were exported. 
        // Since it's private to the module, we'll just test the get/set functionality sequence.
        mmkvStorage.removeItem('test_key');
    });

    it('should set and get an item from storage', () => {
        mmkvStorage.setItem('test_key', 'test_value');
        const val = mmkvStorage.getItem('test_key');
        expect(val).toBe('test_value');
    });

    it('should return null for non-existent items', () => {
        const val = mmkvStorage.getItem('non_existent_key');
        expect(val).toBe(null);
    });

    it('should remove an item correctly', () => {
        mmkvStorage.setItem('test_key2', 'remove_me');
        expect(mmkvStorage.getItem('test_key2')).toBe('remove_me');
        
        mmkvStorage.removeItem('test_key2');
        expect(mmkvStorage.getItem('test_key2')).toBe(null);
    });
});
