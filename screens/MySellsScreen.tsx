import React from "react";
import { View, Text } from "react-native";
import ScreenBackground from '../utils/ScreenBackground';

const MySellsScreen = () => (
    <ScreenBackground>
        <View style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.85)' }}>
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
                <Text style={{ fontSize: 22, fontWeight: "bold" }}>My Sells</Text>
                <Text>This is the My Sells screen.</Text>
            </View>
        </View>
    </ScreenBackground>
);

export default MySellsScreen;