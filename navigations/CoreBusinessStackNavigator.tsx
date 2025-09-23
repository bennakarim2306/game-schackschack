import { createNativeStackNavigator } from "@react-navigation/native-stack";
import QueryFoodScreen from "../screens/QueryFoodScreen";
import Results from "../screens/Results";

const Stack = createNativeStackNavigator();

const CoreBusinessStackNavigator = () => (
    <Stack.Navigator>
        <Stack.Screen name="QueryFood" component={QueryFoodScreen} />
        <Stack.Screen name="Results" component={Results} />
    </Stack.Navigator>
);

export default CoreBusinessStackNavigator;