// Centralized import for react-native-maps to avoid duplicate registration
// Import this file instead of requiring react-native-maps directly in components

import { Platform } from 'react-native';

let MapView: any = null;
let Marker: any = null;
let Circle: any = null;

let PROVIDER_GOOGLE: any = null;

if (Platform.OS !== 'web') {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
    Circle = Maps.Circle;
    PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
}

export { MapView, Marker, Circle, PROVIDER_GOOGLE };
