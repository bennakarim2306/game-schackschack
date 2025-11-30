import { useContext, useEffect, useState } from "react";
import { Alert, BackHandler, FlatList, Image, Text, TouchableOpacity, View } from "react-native";
import GameContext from "../Contexts/GameContext";
import queryItemsStyles from "../styles/QueryItemsStyles";
import configs from "../config/AppConfig";
import * as SecureStore from 'expo-secure-store';
import Logger from "../config/Logger";


const QueryItems = () => {
    const { stopGame } = useContext(GameContext)
    const [items, setItems] = useState([]);
    const [token, setToken] = useState("")

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


      useEffect(() => {
        const fetchItems = async () => {
          const token = await SecureStore.getItemAsync("userToken");
          setToken(token)
          try {
            const url = configs.USER_AUTH_BASE_URL+configs.ITEMS_PATH;
            Logger.info('GAME', 'Fetching item list for game');
            Logger.request(url, 'GET');
            
            const response = await fetch(url, {
              method: 'GET',
              headers: {
                  Accept: 'application/json',
                  'Content-Type': 'application/json',
                  Authorization: 'Bearer ' + token
              },
              body: null,
          });
            const data = await response.json();
            Logger.response(url, response.status, `Received ${data.length} items`);
            Logger.success('GAME', `Items loaded successfully - ${data.length} items`);
            setItems(data);
          } catch (error) {
            Logger.error('GAME', 'Error fetching items', error);
          }
        };

        fetchItems();
      }, []);

      return (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
          <TouchableOpacity>
            <View style={queryItemsStyles.itemContainer}>
            {item.picture && <Image source={{ uri: item.picture }} style={queryItemsStyles.itemImage} />}
            <Text style={queryItemsStyles.itemText}>{item.name}</Text>
            <View style={queryItemsStyles.itemDetails}>
              <Text>Available Quantity: {item.quantityAmount}</Text>
              <Text>Location: {item.location}</Text>
              <Text>Producer: {item.producerId}</Text>
              <Text>Price: ${item.pricePerUnit}</Text>
            </View>
            </View>
          </TouchableOpacity>
          )}
        />
      );
}

export default QueryItems;