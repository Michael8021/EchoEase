import { View, Text, SafeAreaView, Image, ScrollView, Alert } from 'react-native'
import { images } from "../../constants";
import { useState } from 'react';
import FormField from '../../components/FormField';
import CustomButton from '../../components/CustomButton';
import { Link } from 'expo-router';
import { createUser } from '../../lib/appwrite';
import { useGlobalContext } from "../../context/GlobalProvider";
import { router } from 'expo-router';
import { useTranslation } from "react-i18next";

const SignUp = () => {
  const { setUser, setIsLogged } = useGlobalContext();
  const { t } = useTranslation();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const submit = async () => {
    if (form.username === "" || form.email === "" || form.password === "") {
      Alert.alert("Error", t('auth.errors.fillFields'));
    }

    setIsSubmitting(true);
    try {
      const result = await createUser(form.email, form.password, form.username);
      setUser(result);
      setIsLogged(true);

      router.replace("/home");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView>
        <View className="w-full flex justify-center h-full px-4 my-6">
          <View className="flex justify-center items-center">
            <Image source={images.logoDM}
              className="w-[250px] h-[125]"
              resizeMode="contain"
            />
          </View>

          <Text className="text-2xl text-white text-semibold mt-10 font-psemibold">
            {t('auth.signUp.title')}
          </Text>

          <FormField
            title={t('auth.signUp.username')}
            value={form.username}
            handleChangeText={(e) => setForm({ ...form, username: e })}
            otherStyles="mt-7"
          />

          <FormField
            title={t('auth.signUp.email')}
            value={form.email}
            handleChangeText={(e) => setForm({ ...form, email: e })}
            otherStyles="mt-7"
          />

          <FormField
            title={t('auth.signUp.password')}
            value={form.password}
            handleChangeText={(e) => setForm({ ...form, password: e })}
            otherStyles="mt-7"
          />

          <CustomButton
            title={t('auth.signUp.submit')}
            handlePress={submit}
            containerStyles="mt-10"
            isLoading={isSubmitting}
          />

          <View className="flex justify-center pt-5 flex-row gap-2">
            <Text className="text-lg text-gray-100 font-pregular">
              {t('auth.signUp.haveAccount')}
            </Text>
            <Link
              href="/sign-in"
              className="text-lg font-psemibold text-secondary"
            >
              {t('auth.signUp.signIn')}
            </Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default SignUp;
