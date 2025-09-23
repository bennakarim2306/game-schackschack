import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

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
        <View>
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
        </View>

    );
};

export default Map;