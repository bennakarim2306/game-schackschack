import { View, Button, Text, ImageBackground } from "react-native";
import welcomeStyles from '../styles/WelcomeStyles'

const Welcome = ({ navigation }) => {
    return (
        <ImageBackground 
            source={require('../assets/20251202_1118_Grandmother\'s Food Basket_remix_01kbf8znwten2bffvqq35x1zdr.png')}
            style={welcomeStyles.welcomeContainerStyle}
            resizeMode="cover"
        >
            <View>
            <Text style={welcomeStyles.textStyle}></Text>
            <Text style={welcomeStyles.textStyle}></Text>
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