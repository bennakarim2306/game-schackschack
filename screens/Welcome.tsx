import { View, Button, Text } from "react-native";
import welcomeStyles from '../styles/WelcomeStyles'

const Welcome = ({ navigation }) => {
    return (
        <View style={welcomeStyles.welcomeContainerStyle}>
            <View>
            <Text style={welcomeStyles.textStyle}>Welcome to</Text>
            <Text style={welcomeStyles.textStyle}>SchackSchack</Text>
            </View>
            <View style={welcomeStyles.buttonStyle}>
                <Button
                    title="Sign in"
                    onPress={() => navigation.navigate('Login')}
                >
                </Button>
            </View>
            <View style={welcomeStyles.buttonStyle}>
                <Button
                    title="Sign up"
                    onPress={() => navigation.navigate('RegisterAccount')}
                >
                </Button>
            </View>
        </View>
    );
}

export default Welcome;