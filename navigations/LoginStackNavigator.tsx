import Welcome from "../screens/Welcome";
import Login from "../screens/Login";
import RegisterAccount from "../screens/RegisterAccount";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

const LoggedInStackNavigator  = createNativeStackNavigator();

const LoginStackNavigator = ({route, navigation}) => {
    console.log("LoginStackNavigator --- route === " + JSON.stringify(route))
    return (
        <LoggedInStackNavigator.Navigator
        screenOptions={{
            headerShown: false
        }}>
                    <LoggedInStackNavigator.Screen name="Welcome" component={Welcome}/>
                    <LoggedInStackNavigator.Screen name="Login" component={Login}/>
                    <LoggedInStackNavigator.Screen name="RegisterAccount" component={RegisterAccount}/>
        </LoggedInStackNavigator.Navigator>
    );
}

export default LoginStackNavigator;