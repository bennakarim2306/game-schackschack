import { StatusBar, StyleSheet } from "react-native";

const queryItemsStyles = StyleSheet.create({
  itemContainer: {
    paddingTop: StatusBar.currentHeight ?? 0,
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
    alignItems: 'center',
    height: 100,
  },
  itemImage: {
    width: 100,
    height: 100,
    marginRight: 10,
    resizeMode: 'cover',
  },
  itemDetails: {
    flex: 1,
    flexDirection: 'row',
  },
  itemText: {
    fontWeight: 'bold',
  },
});

export default queryItemsStyles;