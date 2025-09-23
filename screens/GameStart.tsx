import { Button, Text, TouchableOpacity, View } from "react-native";
import GameContext from '../Contexts/GameContext'
import { useContext } from "react";
import Map from './Map'
const GameStart = ({route, navigation}) => {
    const { startGame } = useContext(GameContext)
    return (
        <View>
            <Map>
            </Map>
            <Button
                title="Start new game"
                onPress={() => startGame({gameId: 'someID'})}
                disabled={false} />
        </View>
    );
}

export default GameStart;