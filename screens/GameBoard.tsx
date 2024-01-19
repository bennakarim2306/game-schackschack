import { useContext, useEffect } from "react";
import { Alert, BackHandler, FlatList, Text, TouchableOpacity, View } from "react-native";
import GameContext from "../Contexts/GameContext";


const GameBoard = () => {
    const { stopGame } = useContext(GameContext)
    useEffect(() => {
        const backAction = () => {
          Alert.alert('Hold on!', 'Are you sure you want to leave the game', [
            {
              text: 'Cancel',
              onPress: () => null,
              style: 'cancel',
            },
            {text: 'YES', onPress: () => stopGame()},
          ]);
          return true;
        };
    
        const backHandler = BackHandler.addEventListener(
          'hardwareBackPress',
          backAction,
        );
    
        return () => backHandler.remove();
      }, []);
    return (
      <TouchableOpacity>
            <Text>
                here is the new view
            </Text>
      </TouchableOpacity>
    );
}

export default GameBoard;