import { Keyboard, Text, TouchableWithoutFeedback, View } from "react-native";
import ProfileStyles from "../styles/ProfileStyles";
import { SafeAreaView } from "react-native-safe-area-context";

const Profile = () => {
    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <SafeAreaView style={ProfileStyles.profileViewStyle}>
                <Text style={ProfileStyles.profileKeyStyle}>
                    Username
                </Text>
                <Text style={ProfileStyles.profileValueStyle}>
                    myName
                </Text>
                <Text style={ProfileStyles.profileKeyStyle}>
                    Registration date
                </Text>
                <Text style={ProfileStyles.profileValueStyle}>
                    dd/mm/yyyy
                </Text>
                <Text style={ProfileStyles.profileKeyStyle}>
                    Password
                </Text>
                <Text style={ProfileStyles.profileValueStyle}>
                    *******
                </Text>
            </SafeAreaView>
        </TouchableWithoutFeedback>
    );
}

export default Profile;