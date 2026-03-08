import { useAppStore } from '../useAppStore';

describe('useAppStore Persistence & Migration', () => {
    beforeEach(() => {
        useAppStore.getState().resetSession();
    });

    it('should have initial settings defined', () => {
        const state = useAppStore.getState();
        expect(state.settings).toBeDefined();
        expect(state.settings.themeMode).toBe('dark');
        expect(state.settings.hapticsEnabled).toBe(true);
    });

    it('should update settings correctly', () => {
        useAppStore.getState().updateSettings({ themeMode: 'light' });
        expect(useAppStore.getState().settings.themeMode).toBe('light');
    });

    it('should support migrating from older versions of persisted state', () => {
        // The persist middleware has a migrate function
        const persistOptions = (useAppStore as any).persist.getOptions();
        const migrate = persistOptions.migrate;
        
        // Mock a v0 state
        const v0State = {
            isOnboardingDone: true,
            // v0 missing 'settings'
        };

        const migratedState = migrate(v0State, 0);
        
        // It should add the default settings
        expect(migratedState.settings).toBeDefined();
        expect(migratedState.settings.themeMode).toBe('dark'); // matches initialSettings
        expect(migratedState.isOnboardingDone).toBe(true); // preserved
    });
});
