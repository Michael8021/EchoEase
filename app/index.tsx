import { StatusBar } from "expo-status-bar";
import { Text, View, Image } from "react-native";
import { Link, router, Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView } from "react-native";
import { images } from "../constants";
import CustomButton from "../components/CustomButton";
import { useGlobalContext } from "../context/GlobalProvider";
import { useTranslation } from "react-i18next";

export default function Index() {
  const { loading, isLogged } = useGlobalContext();
  const { t } = useTranslation();

  if (!loading && isLogged) return <Redirect href="/home" />;

  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView
        contentContainerStyle={{
          height: "100%",
        }}
      >
        <View className="w-full flex justify-center items-center h-full px-4">
          <Image
            source={images.logoDM}
            className="w-[250px] h-[125]"
            resizeMode="contain"
          />

          <Image
            source={images.cards}
            className="max-w-[380px] w-full h-[298px]"
            resizeMode="contain"
          />

          <View className="relative mt-5">
            <Text className="text-3xl text-white font-bold text-center">
              {t('auth.welcome.title')}{"\n"}
              {t('auth.welcome.withApp')}{" "}
              <Text className="text-secondary-200">EchoEase</Text>
            </Text>
          </View>

          <Text className="text-sm font-pregular text-gray-100 mt-7 text-center">
            {t('auth.welcome.appDescription')}
          </Text>

          <CustomButton
            title={t('auth.welcome.continueWithEmail')}
            handlePress={() => router.push("/sign-in")}
            containerStyles="w-full mt-7"
          />
        </View>
      </ScrollView>

      <StatusBar backgroundColor="#161622" style="light" />
    </SafeAreaView>
  );
}
