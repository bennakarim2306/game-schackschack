import React from 'react';
import { ImageBackground, View, StyleSheet } from 'react-native';

interface ScreenBackgroundProps {
    children: React.ReactNode;
    overlayOpacity?: number;
}

const ScreenBackground: React.FC<ScreenBackgroundProps> = ({ 
    children, 
    overlayOpacity = 0.85 
}) => {
    return (
        <ImageBackground
            source={require('../assets/20251202_1542_Smiling Fruit Faces_remix_01kbfr2sr9enx805fare783vsa.png')}
            style={styles.background}
            resizeMode="cover"
        >
            <View style={[styles.overlay, { backgroundColor: `rgba(255, 255, 255, ${overlayOpacity})` }]}>
                {children}
            </View>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    background: {
        flex: 1,
    },
    overlay: {
        flex: 1,
    },
});

export default ScreenBackground;
