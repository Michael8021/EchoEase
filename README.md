# Welcome to EchoEase 👋

## Get started

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
3. Start the app

   ```bash
   npm start
   ```

   Android:

   ```bash
   npm run android
   ```

   Ios:

   ```bash
   npm run ios
   ```

## Project Structure

### Key Directories

- `/app` - Main application screens using file-based routing
  - `/(auth)` - Authentication screens (sign-in, sign-up)
  - `/(tabs)` - Main tab screens (home, schedule, finance, mood, history)
- `/components` - Reusable UI components
- `/constants` - App constants including colors, icons, and images
- `/context` - Global state management
- `/lib` - Utility functions and API configurations
- `/assets` - Static assets (fonts, images, icons)

### Key Features

1. **Styling**

   - Using NativeWind (Tailwind CSS for React Native)
   - Custom color scheme defined in `tailwind.config.js`
   - Custom Poppins font family integration
2. **Authentication**

   - Appwrite backend integration
   - Email/password authentication
   - User session management
3. **Database Setup**

   - Appwrite database configuration in `lib/appwrite.ts`
   - Collections for users and other data
4. **Navigation**

   - File-based routing with Expo Router
   - Tab-based navigation
   - Stack navigation for auth flow

### Screens

1. **Authentication**

   - Sign In
   - Sign Up
2. **Main Tabs**

   - Home - Dashboard
   - Schedule - Task management
   - Finance - Financial tracking
   - Mood - Mood tracking
   - History - Activity history
3. **Settings**

   - User preferences
   - Logout functionality

### Development Notes

- The project uses TypeScript for type safety
- Custom fonts are loaded in `app/_layout.tsx`
- Global state is managed using Context API
- Tailwind styles can be customized in `tailwind.config.js`
- Environment variables and API keys are in `lib/appwrite.ts`

## Learn more

- [Expo documentation](https://docs.expo.dev/)
- [NativeWind documentation](https://www.nativewind.dev/)
- [Appwrite documentation](https://appwrite.io/docs)

## Join the community

- [Expo on GitHub](https://github.com/expo/expo)
- [Discord community](https://chat.expo.dev)
