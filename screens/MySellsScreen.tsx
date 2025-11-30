import React from "react";
import { View, Text } from "react-native";

const MySellsScreen = () => (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
            <Text style={{ fontSize: 22, fontWeight: "bold" }}>My Sells</Text>
            <Text>This is the My Sells screen.</Text>
        </View>
    </View>
);

export default MySellsScreen;