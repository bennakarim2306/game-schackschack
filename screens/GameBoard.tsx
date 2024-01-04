import { useContext, useEffect } from "react";
import { Alert, BackHandler, FlatList, Text, View } from "react-native";
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
        <FlatList
        data = {[1,2,3,4,5]}
        renderItem={(item) => (<View style={{height: 50, width: 50}}><Text>Hi</Text></View>)}
        keyExtractor={(item) => item.toString()}
            >
            <Text>
                here is the new view
            </Text>
        </FlatList>
    );
}

export default GameBoard;