import React from "react";
import { View, Text, ImageBackground } from "react-native";

const MyOffersScreen = () => (
    <ImageBackground
        source={require('../assets/20251202_1542_Smiling Fruit Faces_remix_01kbfr2sr9enx805fare783vsa.png')}
        style={{ flex: 1 }}
        resizeMode="cover"
    >
        <View style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.85)' }}>
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <Text style={{ fontSize: 22, fontWeight: "bold" }}>My Offers</Text>
            </View>
        </View>
    </ImageBackground>
);

export default MyOffersScreen;