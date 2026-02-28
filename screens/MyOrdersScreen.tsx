import React from "react";
import { View, Text } from "react-native";
import ScreenBackground from '../utils/ScreenBackground';

const MyOrdersScreen = () => (
    <ScreenBackground>
        <View style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.85)' }}>
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <Text style={{ fontSize: 22, fontWeight: "bold" }}>My Orders</Text>
            </View>
        </View>
    </ScreenBackground>
);

export default MyOrdersScreen;