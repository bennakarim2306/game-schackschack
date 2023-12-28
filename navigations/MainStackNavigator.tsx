import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Welcome from "../screens/Welcome";
import Login from "../screens/Login";
import RegisterAccount from "../screens/RegisterAccount";

const Stack = createNativeStackNavigator();

const MainStackNavigator = () => {
    return (
        <NavigationContainer>
                <Stack.Navigator
                    initialRouteName="Welcome"
                    screenOptions={{
                        headerShown: false
                    }}>
                    <Stack.Screen name="Welcome" component={Welcome}/>
                    <Stack.Screen name="Login" component={Login}/>
                    <Stack.Screen name="RegisterAccount" component={RegisterAccount}/>
                </Stack.Navigator>
        </NavigationContainer>
    );
}

export default MainStackNavigator;