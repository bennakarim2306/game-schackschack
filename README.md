# Game App

A React Native marketplace and chat application.

## Features

- **Marketplace:** Query for food, create offers, view results.
- **Profile:** Edit user profile, change settings, logout.
- **Chat:** Contact list and chat functionality.
- **My Space:** Manage your orders and offers.
- **Navigation:** Drawer navigation for main sections, bottom tab navigation for sub-sections.

## Project Structure

```
/screens
    AddItemScreen.tsx
    Chat.tsx
    ContactsList.tsx
    MyOffersScreen.tsx
    MyOrdersScreen.tsx
    MySpaceScreen.tsx
    Profile.tsx
    QueryFoodScreen.tsx
    Results.tsx
/styles
    ChatStyles.ts
    ContactsListStyles.ts
    ProfileStyles.ts
/navigations
    ChatNavigator.tsx
    CoreBusinessNavigator.tsx
    GameNavigator.tsx
    MainStackNavigator.tsx
/assets
    BottomTabBarIcons/
        chat.png
        food.png
        profile.png
        ...
mockedItems.json
```

## Installation

1. **Clone the repository:**
   ```sh
   git clone <your-repo-url>
   cd Game
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Install required navigation packages:**
   ```sh
   npm install @react-navigation/native @react-navigation/drawer @react-navigation/native-stack @react-navigation/bottom-tabs @react-native-picker/picker
   npm install react-native-safe-area-context react-native-screens
   npm install @expo/vector-icons
   ```

4. **If using Expo, start the app:**
   ```sh
   npm start
   ```

## Usage

- **Login/Register:** Start with authentication.
- **Drawer Navigation:** Access Profile, My Space, Market place, and Chat from the side drawer.
- **Marketplace:** Search for food, create offers.
- **My Space:** Switch between "My orders" and "My offers" using bottom tabs.
- **Chat:** View contacts and chat with users.
- **Profile:** Edit your profile and logout.

## Customization

- **Icons:** Place your tab and drawer icons in `/assets/BottomTabBarIcons/`.
- **Mock Data:** Update `mockedItems.json` for demo items.
- **Styles:** Edit files in `/styles` for custom look and feel.

## Troubleshooting

- **Navigation errors:** Ensure all screen names are unique and match their references.
- **Drawer toggle:** Uses the built-in `DrawerToggleButton` for reliability.
- **Safe area:** Use `SafeAreaView` for proper spacing on all devices.

## License

MIT

---

**For further help, see [React Navigation documentation](https://reactnavigation.org/docs/getting-started/).**