# 🍕 Foodopia App

<div align="center">

A comprehensive React Native marketplace application for food trading, featuring real-time chat, order management, and an integrated gaming experience.

[![React Native](https://img.shields.io/badge/React%20Native-0.81.4-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~54.0-000020.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-~5.9-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Scripts](#-scripts)
- [Usage Guide](#-usage-guide)
- [Architecture](#-architecture)
- [Development](#-development)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

Foodopia is a feature-rich mobile application that combines a food marketplace with social features and gamification. Users can buy and sell food items, communicate through real-time chat, manage their orders, and engage in gaming activities. Built with React Native and Expo, the app provides a seamless cross-platform experience.

---

## ✨ Features

### 🛒 Marketplace
- **Food Query System**: Search and filter food items with advanced criteria
- **Create Offers**: List your food items for sale with detailed information
- **Results View**: Browse available food offers with rich item details
- **Real-time Updates**: Live marketplace data synchronization

### 👤 User Profile
- **Profile Management**: Edit user information and preferences
- **Settings**: Customize app behavior and notifications
- **Authentication**: Secure login and registration system
- **Account Management**: Complete profile control and logout functionality

### 💬 Chat System
- **Real-time Messaging**: Powered by Socket.IO for instant communication
- **Contacts List**: Manage and view all your connections
- **Context-based State**: Efficient chat state management with React Context API
- **Message Dispatch**: Dedicated dispatch context for scalable message handling

### 📦 My Space
- **My Orders**: Track and manage your food purchases
- **My Offers**: View and edit your listed items
- **My Sells**: Monitor completed transactions
- **Order History**: Complete transaction records

### 🎮 Gaming Features
- **Game Board**: Interactive gaming interface
- **In-Game Navigation**: Dedicated navigation flow for gaming
- **Game Settings**: Customize gaming experience
- **Game Start Screen**: Onboarding for game features
- **Board Uni**: Unified game board management

### 🗺️ Location Features
- **Interactive Map**: Google Places integration for location services
- **Address Autocomplete**: Easy location selection
- **Geolocation Support**: Location-based features

### 🎨 Navigation
- **Drawer Navigation**: Main app sections accessible via side drawer
- **Bottom Tab Navigation**: Quick access to core features
- **Stack Navigation**: Hierarchical screen flow
- **Material Top Tabs**: Swipeable tab interface for specific sections

---

## 🛠️ Tech Stack

### Core Technologies
- **React Native** (0.81.4) - Cross-platform mobile framework
- **Expo** (~54.0) - Development and build toolchain
- **TypeScript** (~5.9) - Type-safe development
- **React** (19.1.0) - UI library

### Navigation
- **React Navigation** (7.x) - Routing and navigation
  - Native Stack Navigator
  - Drawer Navigator
  - Bottom Tabs Navigator
  - Material Top Tabs Navigator

### State Management
- **Redux Toolkit** (2.0.1) - Global state management
- **React Context API** - Component-level state management

### Backend & Real-time
- **Socket.IO Client** (4.7.4) - Real-time bidirectional communication

### Storage & Security
- **Expo Secure Store** - Encrypted local storage for sensitive data

### Maps & Location
- **React Native Maps** (1.20.1) - Map integration
- **Google Places Autocomplete** - Location search

### UI & Styling
- **React Native Safe Area Context** - Safe area handling
- **React Native Screens** - Native navigation performance
- **Expo Vector Icons** - Icon library

---

## 📁 Project Structure

```
foodopia-app/
├── android/                      # Android native configuration
│   ├── app/
│   │   ├── src/
│   │   │   ├── main/
│   │   │   ├── debug/
│   │   │   └── release/
│   │   └── build.gradle
│   └── build.gradle
│
├── assets/                       # Static assets
│   ├── BottomTabBarIcons/       # Navigation icons
│   ├── missions/                # Game missions
│   ├── mockedItems.json         # Mock data for development
│   └── raw_food_offers.json     # Sample food offers
│
├── config/                      # App configuration
│   └── AppConfig.ts             # Central config file
│
├── Contexts/                    # React Context providers
│   ├── AuthContext.tsx          # Authentication state
│   ├── ChatContext.tsx          # Chat state management
│   ├── ChatDispatchContext.tsx  # Chat action dispatchers
│   ├── ContactsContext.tsx      # Contacts management
│   └── GameContext.tsx          # Game state
│
├── docs/                        # Documentation
│   └── components_diagram.uml   # Architecture diagrams
│
├── navigations/                 # Navigation configuration
│   ├── MainStackNavigator.tsx   # Root navigator
│   ├── LoginStackNavigator.tsx  # Auth flow
│   ├── CoreBusinessNavigator.tsx# Business features
│   ├── GameNavigator.tsx        # Game navigation
│   ├── InGameNavigator.tsx      # In-game screens
│   ├── ChatNavigator.tsx        # Chat flow
│   └── ItemNavigator.tsx        # Item management
│
├── screens/                     # Application screens
│   ├── Welcome.tsx              # Welcome/splash
│   ├── Login.tsx                # Login screen
│   ├── RegisterAccount.tsx      # Registration
│   ├── CoreBusinessScreen.tsx   # Main business hub
│   ├── QueryFoodScreen.tsx      # Food search
│   ├── QueryItems.tsx           # Item query
│   ├── Results.tsx              # Search results
│   ├── AddItemScreen.tsx        # Create offer
│   ├── MySpaceScreen.tsx        # User dashboard
│   ├── MyOffersScreen.tsx       # User's offers
│   ├── MyOrdersScreen.tsx       # User's orders
│   ├── MySellsScreen.tsx        # Sales history
│   ├── Chat.tsx                 # Chat interface
│   ├── ContactsList.tsx         # Contacts view
│   ├── Profile.tsx              # User profile
│   ├── GameBoard.tsx            # Main game board
│   ├── BoardUni.tsx             # Unified board
│   ├── GameStart.tsx            # Game entry
│   ├── GameSettings.tsx         # Game config
│   ├── Map.tsx                  # Map interface
│   └── mockFoodOffers.ts        # Mock data
│
├── services/                    # Business logic & API
│   └── game/
│       └── gameService.ts       # Game-related services
│
├── styles/                      # Style definitions
│   ├── ChatStyles.ts
│   ├── ContactsListStyles.ts
│   ├── GameNavigatorStyles.ts
│   ├── LoginStyles.ts
│   ├── ProfileStyles.ts
│   ├── QueryItemsStyles.ts
│   ├── RegisterAccountStyles.ts
│   └── WelcomeStyles.ts
│
├── App.tsx                      # App entry point (TypeScript)
├── App.js                       # App entry point (JavaScript)
├── app.json                     # Expo configuration
├── eas.json                     # EAS Build configuration
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
├── babel.config.js              # Babel configuration
└── README.md                    # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Expo CLI** (installed globally)
- **Android Studio** (for Android development)
- **Xcode** (for iOS development, macOS only)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/bennakarim2306/foodopia-app.git
   cd foodopia-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   - Configure your backend API endpoints in `config/AppConfig.ts`
   - Set up Socket.IO server URL
   - Configure Google Places API key (if using maps)

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on a platform**
   - **iOS**: Press `i` in the terminal or run `npm run ios`
   - **Android**: Press `a` in the terminal or run `npm run android`
   - **Web**: Press `w` in the terminal or run `npm run web`

---

## 📜 Scripts

```bash
# Start Expo development server
npm start

# Run on Android device/emulator
npm run android

# Run on iOS simulator (macOS only)
npm run ios

# Run in web browser
npm run web
```

---

## 📖 Usage Guide

### 1️⃣ **Authentication**
- Launch the app and navigate through the welcome screen
- Register a new account or log in with existing credentials
- Secure authentication with encrypted storage

### 2️⃣ **Marketplace Navigation**
- Access the marketplace from the drawer menu
- Use **Query Food** to search for specific items
- Browse results and view detailed item information
- Create your own offers through **Add Item**

### 3️⃣ **Order Management**
- Navigate to **My Space** from the drawer
- Switch between tabs:
  - **My Orders**: View purchases
  - **My Offers**: Manage your listings
  - **My Sells**: Track completed sales

### 4️⃣ **Chat & Communication**
- Access **Chat** from the drawer or bottom tabs
- View your contacts list
- Start conversations with other users
- Real-time message synchronization

### 5️⃣ **Profile Settings**
- Open your profile from the drawer
- Edit personal information
- Adjust app settings
- Log out when finished

### 6️⃣ **Gaming**
- Access game features from the main menu
- Configure game settings
- Start playing on the game board
- Track your progress and achievements

---

## 🏗️ Architecture

### Navigation Hierarchy

```
MainStackNavigator (Root)
├── LoginStackNavigator
│   ├── Welcome
│   ├── Login
│   └── RegisterAccount
│
└── DrawerNavigator
    ├── CoreBusinessNavigator
    │   ├── QueryFoodScreen
    │   ├── Results
    │   └── AddItemScreen
    │
    ├── MySpaceScreen (with Bottom Tabs)
    │   ├── MyOrders
    │   ├── MyOffers
    │   └── MySells
    │
    ├── ChatNavigator
    │   ├── ContactsList
    │   └── Chat
    │
    ├── GameNavigator
    │   ├── GameStart
    │   ├── GameBoard
    │   └── GameSettings
    │
    └── Profile
```

### State Management

- **Global State**: Redux Toolkit for app-wide state
- **Context API**: Feature-specific state (Auth, Chat, Game, Contacts)
- **Local State**: Component-level useState/useReducer

### Data Flow

1. **User Actions** → Components
2. **Components** → Context/Redux Actions
3. **Actions** → API Services (via Socket.IO/HTTP)
4. **Services** → Backend Server
5. **Server Response** → State Update
6. **State Update** → UI Re-render

---

## 💻 Development

### Code Style

- **TypeScript** for type safety
- **Functional Components** with hooks
- **Context API** for feature isolation
- **Modular styling** with separate style files

### Key Conventions

- **Screens**: PascalCase, suffix with `Screen` (e.g., `QueryFoodScreen.tsx`)
- **Styles**: Match screen name with `Styles` suffix (e.g., `QueryItemsStyles.ts`)
- **Navigators**: Suffix with `Navigator` (e.g., `ChatNavigator.tsx`)
- **Contexts**: Suffix with `Context` (e.g., `AuthContext.tsx`)

### Adding New Features

1. Create screen component in `/screens`
2. Add corresponding styles in `/styles`
3. Create/update navigator in `/navigations`
4. Add context if needed in `/Contexts`
5. Implement services in `/services`

---

## 🔧 Troubleshooting

### Common Issues

**Navigation Errors**
- Ensure all screen names are unique
- Verify screen references match exact component names
- Check that all navigators are properly nested

**Drawer Toggle Issues**
- Use built-in `DrawerToggleButton` component
- Verify drawer configuration in navigator

**Safe Area Problems**
- Wrap screens with `SafeAreaView`
- Import from `react-native-safe-area-context`

**Build Failures**
- Clear cache: `expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check Android/iOS native dependencies

**Socket Connection Issues**
- Verify backend server is running
- Check Socket.IO server URL in config
- Ensure network permissions in app.json

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📚 Resources

- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation Documentation](https://reactnavigation.org/docs/getting-started)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)

---

<div align="center">

Made with ❤️ by bennakarim2306

**[⬆ Back to Top](#-foodopia-app)**

</div>