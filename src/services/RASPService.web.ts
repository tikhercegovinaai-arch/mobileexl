// ─── Web Stub ─────────────────────────────────────────────────────────────────
// expo-file-system's getInfoAsync is not available on web, and jailbreak/root
// detection is meaningless in a browser context — this stub is intentionally no-op.
export const RASPService = {
    async isDeviceCompromised(): Promise<boolean> {
        return false; // Always safe on web
    },

    async enforceSecurityPolicies(): Promise<void> {
        // No-op on web
    }
};
