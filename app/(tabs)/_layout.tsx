import { StatusBar } from "expo-status-bar";
import { Redirect, Tabs } from "expo-router";
import { Image, Text, View } from "react-native";
import { ImageSourcePropType } from "react-native";
import { useTranslation } from "react-i18next";

import { icons } from "../../constants";
import Loader from '../../components/Loader';
import { useGlobalContext } from "../../context/GlobalProvider";
import FloatingButton from '../../components/FloatingButton';
import { AppProviders } from '../../context/AppProviders';
import { MoodProvider } from '../../context/MoodContext';

interface TabIconProps {
  icon: ImageSourcePropType;
  color: string;
  name: string;
  focused: boolean;
}

const TabIcon: React.FC<TabIconProps> = ({ icon, color, name, focused }) => {
  return (
    <View className="items-center justify-center w-16 pt-7">
      <Image
        source={icon}
        resizeMode="contain"
        tintColor={color}
        className="w-6 h-6 mb-2"
      />
      <Text
        className={`${focused ? "font-psemibold" : "font-pregular"} text-xs`}
        style={{ color: color }}
        numberOfLines={1}
      >
        {name}
      </Text>
    </View>
  );
};

const TabLayout = () => {
  const { loading, isLogged } = useGlobalContext();
  const { t } = useTranslation();

  if (!loading && !isLogged) return <Redirect href="/sign-in" />;

  return (
    <MoodProvider>
      <AppProviders>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: "#FFA001",
            tabBarInactiveTintColor: "#CDCDE0",
            tabBarShowLabel: false,
            tabBarStyle: {
              backgroundColor: "#161622",
              borderTopWidth: 1,
              borderTopColor: "#232533",
              height: 84,
            },
          }}
        >
          <Tabs.Screen
            name="home"
            options={{
              title: t('tabs.home'),
              headerShown: false,
              tabBarIcon: ({ color, focused }) => (
                <TabIcon
                  icon={icons.home}
                  color={color}
                  name={t('tabs.home')}
                  focused={focused}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="schedule"
            options={{
              title: t('tabs.schedule'),
              headerShown: false,
              tabBarIcon: ({ color, focused }) => (
                <TabIcon
                  icon={icons.schedule}
                  color={color}
                  name={t('tabs.schedule')}
                  focused={focused}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="finance"
            options={{
              title: t('tabs.finance'),
              headerShown: false,
              tabBarIcon: ({ color, focused }) => (
                <TabIcon
                  icon={icons.finance}
                  color={color}
                  name={t('tabs.finance')}
                  focused={focused}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="mood"
            options={{
              title: t('tabs.mood'),
              headerShown: false,
              tabBarIcon: ({ color, focused }) => (
                <TabIcon
                  icon={icons.mood}
                  color={color}
                  name={t('tabs.mood')}
                  focused={focused}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="history"
            options={{
              title: t('tabs.history'),
              headerShown: false,
              tabBarIcon: ({ color, focused }) => (
                <TabIcon
                  icon={icons.history}
                  color={color}
                  name={t('tabs.history')}
                  focused={focused}
                />
              ),
            }}
          />
        </Tabs>

        <Loader isLoading={loading} />
        <FloatingButton />
        <StatusBar backgroundColor="#161622" style="light" />
      </AppProviders>
    </MoodProvider>
  );
};

export default TabLayout;