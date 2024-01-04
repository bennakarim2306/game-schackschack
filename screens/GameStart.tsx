import { Button, Text, TouchableOpacity, View } from "react-native";
import GameContext from '../Contexts/GameContext'
import { useContext } from "react";

const GameStart = ({route, navigation}) => {
    const { startGame } = useContext(GameContext)
    return (
        <TouchableOpacity>
            <Button
                title="Start new game"
                onPress={() => startGame({gameId: 'someID'})}
                disabled={false} />
        </TouchableOpacity>
    );
}

export default GameStart;