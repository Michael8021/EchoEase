import { StatusBar } from "expo-status-bar";
import { Redirect, Tabs } from "expo-router";
import { Image, Text, View } from "react-native";
import { ImageSourcePropType } from "react-native";
import { useTranslation } from 'react-i18next';

import { icons } from "../../constants";
import Loader from '../../components/Loader';
import { useGlobalContext } from "../../context/GlobalProvider";
import FloatingButton from '../../components/FloatingButton';
import { AppProviders } from '../../context/AppProviders';

interface TabIconProps {
  icon: ImageSourcePropType;
  color: string;
  translationKey: string;
  focused: boolean;
}

const TabIcon: React.FC<TabIconProps> = ({ icon, color, translationKey, focused }) => {
  const { t } = useTranslation();
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
        {t(`common.${translationKey}`)}
      </Text>
    </View>
  );
};

const TabLayout = () => {
  const { loading, isLogged } = useGlobalContext();
  const { t } = useTranslation();

  if (!loading && !isLogged) return <Redirect href="/sign-in" />;

  return (
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
            title: t('common.home'),
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon={icons.home}
                color={color}
                translationKey="home"
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="schedule"
          options={{
            title: t('common.schedule'),
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon={icons.schedule}
                color={color}
                translationKey="schedule"
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="finance"
          options={{
            title: t('common.finance'),
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon={icons.finance}
                color={color}
                translationKey="finance"
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="mood"
          options={{
            title: t('common.mood'),
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon={icons.mood}
                color={color}
                translationKey="mood"
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: t('common.history'),
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon={icons.history}
                color={color}
                translationKey="history"
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
  );
};

export default TabLayout;