import React from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';

// Conditionally import MapView only on native platforms
let MapView: any, Marker: any;
if (Platform.OS !== 'web') {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
}

const Map = () => {

    const styles = StyleSheet.create({
        container: {
          ...StyleSheet.absoluteFillObject,
          justifyContent: 'flex-end',
          alignItems: 'center',
        },
        map: {
            minHeight: 600,
          ...StyleSheet.absoluteFillObject,
        },
       });
    return (
        <View style={styles.container}>
            {Platform.OS !== 'web' ? (
                <MapView
                    style={styles.map}
                    initialRegion={{
                        latitude: 48.1549958,
                        longitude: 11.4594356,
                        latitudeDelta: 0.2,
                        longitudeDelta: 0.2,
                    }}
                >
                    <Marker
                        coordinate={{ latitude: 48.1549958, longitude: 11.4594356 }}
                        title={"Marker Title"}
                        description={"Marker Description"}
                        icon={require('../assets/missions/rocket-lunch.png')}
                    />
                </MapView>
            ) : (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#e0e0e0' }}>
                    <Text>Map not available on web</Text>
                    <Text style={{ fontSize: 12, marginTop: 8 }}>Location: 48.1550, 11.4594</Text>
                </View>
            )}
        </View>

    );
};

export default Map;