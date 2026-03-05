import React, { useRef, useState, useCallback } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Text,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { CameraView, CameraType, FlashMode } from 'expo-camera';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CaptureResult {
    uri: string;
    width: number;
    height: number;
    base64?: string;
}

interface CameraScreenProps {
    onCapture: (result: CaptureResult) => void;
    onCancel: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
// Document guide: A4 aspect ratio overlay (√2 : 1 ≈ 1.414)
const GUIDE_WIDTH = SCREEN_WIDTH * 0.88;
const GUIDE_HEIGHT = GUIDE_WIDTH * 1.414;

// ─── Component ────────────────────────────────────────────────────────────────

export default function CameraScreen({ onCapture, onCancel }: CameraScreenProps) {
    const cameraRef = useRef<CameraView>(null);
    const [facing] = useState<CameraType>('back');
    const [flash, setFlash] = useState<FlashMode>('off');
    const [isCapturing, setIsCapturing] = useState(false);
    const [zoom, setZoom] = useState(0);

    const toggleFlash = useCallback(() => {
        setFlash((prev) => (prev === 'off' ? 'on' : 'off'));
    }, []);

    const handleCapture = useCallback(async () => {
        if (!cameraRef.current || isCapturing) return;

        setIsCapturing(true);
        try {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.95,           // 95% JPEG quality
                skipProcessing: false,   // Apply lens distortion correction
                exif: true,              // Preserve device metadata
            });

            if (!photo) throw new Error('Camera returned no photo data');

            // Guard: reject images that are too small for useful OCR
            if (photo.width < 1920 || photo.height < 1920) {
                console.warn('[Camera] Captured image below minimum resolution threshold');
            }

            onCapture({
                uri: photo.uri,
                width: photo.width,
                height: photo.height,
            });
        } catch (err) {
            console.error('[CameraScreen] Capture failed:', err);
        } finally {
            setIsCapturing(false);
        }
    }, [cameraRef, isCapturing, onCapture]);

    return (
        <View style={styles.container}>
            {/* ── Camera Preview ──────────────────────────────────── */}
            <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                facing={facing}
                flash={flash}
                zoom={zoom}
            />

            {/* ── Document guide overlay ──────────────────────────── */}
            <View style={styles.overlay} pointerEvents="none">
                {/* Dark corners outside the guide */}
                <View style={styles.overlayTop} />
                <View style={styles.overlayMiddleRow}>
                    <View style={styles.overlaySide} />
                    {/* The transparent "window" showing the document area */}
                    <View style={styles.guideWindow}>
                        {/* Corner markers */}
                        <View style={[styles.corner, styles.cornerTL]} />
                        <View style={[styles.corner, styles.cornerTR]} />
                        <View style={[styles.corner, styles.cornerBL]} />
                        <View style={[styles.corner, styles.cornerBR]} />
                    </View>
                    <View style={styles.overlaySide} />
                </View>
                <View style={styles.overlayBottom} />
            </View>

            {/* ── Guide label ─────────────────────────────────────── */}
            <View style={styles.guideLabel} pointerEvents="none">
                <Text style={styles.guideLabelText}>
                    Align document within the frame
                </Text>
            </View>

            {/* ── Top Controls ────────────────────────────────────── */}
            <View style={styles.topControls}>
                <TouchableOpacity style={styles.iconButton} onPress={onCancel}>
                    <Text style={styles.iconButtonText}>✕</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.iconButton} onPress={toggleFlash}>
                    <Text style={styles.iconButtonText}>
                        {flash === 'off' ? '⚡' : '⚡✓'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* ── Zoom Controls ───────────────────────────────────── */}
            <View style={styles.zoomControls}>
                {[0, 0.1, 0.25].map((z) => (
                    <TouchableOpacity
                        key={z}
                        style={[styles.zoomButton, zoom === z && styles.zoomButtonActive]}
                        onPress={() => setZoom(z)}
                    >
                        <Text style={styles.zoomButtonText}>
                            {z === 0 ? '1×' : z === 0.1 ? '2×' : '3×'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* ── Capture Button ──────────────────────────────────── */}
            <View style={styles.captureRow}>
                <TouchableOpacity
                    style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
                    onPress={handleCapture}
                    disabled={isCapturing}
                    activeOpacity={0.8}
                >
                    {isCapturing ? (
                        <ActivityIndicator color={Colors.primary} size="large" />
                    ) : (
                        <View style={styles.captureInner} />
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const OVERLAY_COLOR = 'rgba(0,0,0,0.58)';
const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },

    // ── Document Guide Overlay ──
    overlay: {
        ...StyleSheet.absoluteFillObject,
        flexDirection: 'column',
    },
    overlayTop: {
        flex: 1,
        backgroundColor: OVERLAY_COLOR,
    },
    overlayMiddleRow: {
        flexDirection: 'row',
        height: GUIDE_HEIGHT,
    },
    overlaySide: {
        flex: 1,
        backgroundColor: OVERLAY_COLOR,
    },
    overlayBottom: {
        flex: 1,
        backgroundColor: OVERLAY_COLOR,
    },
    guideWindow: {
        width: GUIDE_WIDTH,
        height: GUIDE_HEIGHT,
    },

    // Corner marker helpers
    corner: {
        position: 'absolute',
        width: CORNER_SIZE,
        height: CORNER_SIZE,
        borderColor: Colors.primary,
    },
    cornerTL: {
        top: 0,
        left: 0,
        borderTopWidth: CORNER_THICKNESS,
        borderLeftWidth: CORNER_THICKNESS,
        borderTopLeftRadius: 3,
    },
    cornerTR: {
        top: 0,
        right: 0,
        borderTopWidth: CORNER_THICKNESS,
        borderRightWidth: CORNER_THICKNESS,
        borderTopRightRadius: 3,
    },
    cornerBL: {
        bottom: 0,
        left: 0,
        borderBottomWidth: CORNER_THICKNESS,
        borderLeftWidth: CORNER_THICKNESS,
        borderBottomLeftRadius: 3,
    },
    cornerBR: {
        bottom: 0,
        right: 0,
        borderBottomWidth: CORNER_THICKNESS,
        borderRightWidth: CORNER_THICKNESS,
        borderBottomRightRadius: 3,
    },

    // ── Guide label ──
    guideLabel: {
        position: 'absolute',
        bottom: SCREEN_HEIGHT / 2 - GUIDE_HEIGHT / 2 - 40,
        alignSelf: 'center',
    },
    guideLabelText: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: Typography.fontSizeSM,
        textAlign: 'center',
        letterSpacing: 0.3,
    },

    // ── Top Controls ──
    topControls: {
        position: 'absolute',
        top: 56,
        left: Spacing.lg,
        right: Spacing.lg,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.full,
        backgroundColor: 'rgba(0,0,0,0.45)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconButtonText: {
        fontSize: Typography.fontSizeLG,
        color: Colors.textPrimary,
    },

    // ── Zoom Controls ──
    zoomControls: {
        position: 'absolute',
        bottom: 120,
        alignSelf: 'center',
        flexDirection: 'row',
        gap: Spacing.sm,
        backgroundColor: 'rgba(0,0,0,0.45)',
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
    },
    zoomButton: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.full,
    },
    zoomButtonActive: {
        backgroundColor: Colors.primary,
    },
    zoomButtonText: {
        color: Colors.textPrimary,
        fontSize: Typography.fontSizeSM,
        fontWeight: Typography.fontWeightSemiBold,
    },

    // ── Capture Button ──
    captureRow: {
        position: 'absolute',
        bottom: 40,
        alignSelf: 'center',
    },
    captureButton: {
        width: 76,
        height: 76,
        borderRadius: 38,
        borderWidth: 4,
        borderColor: Colors.textPrimary,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    captureButtonDisabled: {
        borderColor: Colors.textMuted,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    captureInner: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: Colors.textPrimary,
    },
});
