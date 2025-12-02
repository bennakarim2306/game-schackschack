import { View, Button, Text, ImageBackground } from "react-native";
import welcomeStyles from '../styles/WelcomeStyles'

const Welcome = ({ navigation }) => {
    return (
        <ImageBackground 
            source={require('../assets/backgroun_main.jpeg')}
            style={welcomeStyles.welcomeContainerStyle}
            resizeMode="cover"
        >
            <View>
            <Text style={welcomeStyles.textStyle}>Welcome to</Text>
            <Text style={welcomeStyles.textStyle}>Foodopia</Text>
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
        </ImageBackground>
    );
}

export default Welcome;