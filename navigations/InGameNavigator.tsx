import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Screen } from "react-native-screens";
import GameBoard from "../screens/GameBoard";


const InGameStackNavigator = createNativeStackNavigator();


const InGameNavigator = () => {
    return (
        <InGameStackNavigator.Navigator>
            <InGameStackNavigator.Screen name="GameBoard" component={GameBoard} />
        </InGameStackNavigator.Navigator>       
    );
}

export default InGameNavigator;