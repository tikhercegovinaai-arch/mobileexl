import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Svg, { Rect, G, Text as SvgText } from 'react-native-svg';
import { Colors } from '../constants/theme';
import { BoundingBox, ValidationField } from '../store/useAppStore';

interface BoundingBoxOverlayProps {
    imageWidth: number;
    imageHeight: number;
    fields: ValidationField[];
    onFieldPress?: (field: ValidationField) => void;
}

export const BoundingBoxOverlay: React.FC<BoundingBoxOverlayProps> = ({
    imageWidth,
    imageHeight,
    fields,
    onFieldPress
}) => {
    const screenWidth = Dimensions.get('window').width - 32; // LG Spacing on both sides
    const scale = screenWidth / imageWidth;
    const viewHeight = imageHeight * scale;

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.9) return Colors.success;
        if (confidence >= 0.7) return Colors.warning;
        return Colors.error;
    };

    return (
        <View style={[styles.container, { width: screenWidth, height: viewHeight }]}>
            <Svg width={screenWidth} height={viewHeight} viewBox={`0 0 ${screenWidth} ${viewHeight}`}>
                {fields.map((field) => {
                    if (!field.boundingBox) return null;
                    const { x, y, width, height } = field.boundingBox;
                    const color = getConfidenceColor(field.confidence);

                    return (
                        <G key={field.id} onPress={() => onFieldPress?.(field)}>
                            <Rect
                                x={x * scale}
                                y={y * scale}
                                width={width * scale}
                                height={height * scale}
                                stroke={color}
                                strokeWidth="2"
                                fill={`${color}20`} // 20 hex is approx 12% opacity
                                rx="4"
                            />
                            {/* Small confidence indicator tag */}
                            <Rect
                                x={x * scale}
                                y={(y * scale) - 12}
                                width={30}
                                height={12}
                                fill={color}
                                rx="2"
                            />
                            <SvgText
                                x={(x * scale) + 4}
                                y={(y * scale) - 3}
                                fontSize="8"
                                fill="white"
                                fontWeight="bold"
                            >
                                {Math.round(field.confidence * 100)}%
                            </SvgText>
                        </G>
                    );
                })}
            </Svg>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
    },
});
