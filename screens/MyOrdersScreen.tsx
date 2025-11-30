import React from "react";
import { View, Text } from "react-native";

const MyOrdersScreen = () => (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ fontSize: 22, fontWeight: "bold" }}>My Orders</Text>
        </View>
    </View>
);

export default MyOrdersScreen;