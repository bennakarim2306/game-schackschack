// Centralized import for react-native-maps to avoid duplicate registration
// Import this file instead of requiring react-native-maps directly in components

import { Platform } from 'react-native';

let MapView: any = null;
let Marker: any = null;
let Circle: any = null;

if (Platform.OS !== 'web') {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
    Circle = Maps.Circle;
}

export { MapView, Marker, Circle };
