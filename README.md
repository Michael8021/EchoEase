# EchoEase - Your Personal Life Management App 🌟

EchoEase is a comprehensive mobile application built with React Native and Expo that helps you manage various aspects of your life, including mood tracking, scheduling, finance management, and more. With a beautiful dark-themed UI and support for multiple languages, EchoEase makes personal management both efficient and enjoyable.

## 🚀 Quick Start

1. Install dependencies
   ```bash
   npm install
   ```
   ```bash
   npx expo install react-native-appwrite react-native-url-polyfill
   npx expo install react-native-gifted-charts expo-linear-gradient react-native-svg
   npm install nativewind tailwindcss react-native-reanimated react-native-safe-area-context
   npm install @react-native-community/datetimepicker --save
   npm install react-native-input-select
   ```

2. Start the app
   ```bash
   npm start
   ```

   For platform-specific development:
   ```bash
   # iOS
   npm run ios

   # Android
   npm run android
   ```

## 🎯 Key Features

### 1. Mood Tracking & Analysis
- 🎭 Interactive emoji-based mood selection
- 📊 Weekly mood visualization with charts
- 🤖 AI-powered mood insights generation
- 📝 Detailed mood descriptions and history
- 🌍 Multi-language mood analysis

### 2. Financial Management
- 💰 Expense tracking and categorization
- 📈 Visual spending analytics
- 🧾 Receipt scanning and processing
- 📊 Category-wise spending breakdown
- 💸 Monthly budget overview

### 3. Schedule Management
- 📅 Event planning and reminders
- ⏰ Task scheduling
- 📌 Important date tracking
- 📋 Daily agenda view

### 4. Internationalization
- 🌐 Multi-language support (English, Traditional Chinese)
- 🔄 Dynamic content translation
- 💾 Language preference persistence
- 📱 Localized UI elements
- 🎯 Context-aware translations

### 5. User Experience
- 🎨 Modern dark theme UI
- 🔒 Secure authentication system
- 💫 Smooth animations
- 📱 Responsive design
- 🎯 Intuitive navigation

## 🏗 Project Structure

```
EchoEase/
├── app/                    # Main application screens
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main tab screens
│   └── _layout.tsx        # Root layout configuration
├── components/            # Reusable UI components
├── constants/             # App constants and assets
├── context/              # Global state management
├── lib/                  # Utility functions
│   ├── appwrite/         # Backend integration
│   ├── i18n/             # Internationalization
│   └── aiService/        # AI services integration
└── assets/              # Static assets
```

## 🛠 Technical Stack

- **Framework**: React Native + Expo
- **Navigation**: Expo Router
- **Styling**: NativeWind (Tailwind CSS)
- **Backend**: Appwrite
- **State Management**: React Context
- **Charts**: react-native-gifted-charts
- **Internationalization**: react-i18next
- **UI Components**: react-native-paper
- **Type Safety**: TypeScript

## 🔧 Development Notes

### Environment Setup
- Uses Expo managed workflow
- TypeScript for type safety
- Custom fonts loaded in `app/_layout.tsx`
- Environment variables in `lib/appwrite.ts`

### Key Configurations
- Tailwind styles in `tailwind.config.js`
- i18n setup in `lib/i18n/config.ts`
- Navigation in `app/_layout.tsx`

### Adding New Features
1. **Translations**
   - Add keys in `lib/i18n/locales/en.json`
   - Create corresponding translations in other locales
   - Use `useTranslation` hook in components

2. **New Screens**
   - Add screen in appropriate directory under `app/`
   - Update navigation if needed
   - Implement i18n support

3. **Components**
   - Create in `components/` directory
   - Use NativeWind for styling
   - Ensure proper TypeScript typing

## 📚 Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [NativeWind Documentation](https://www.nativewind.dev/)
- [Appwrite Documentation](https://appwrite.io/docs)
- [React i18next Documentation](https://react.i18next.com/)
