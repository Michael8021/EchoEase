import { View, Text, SafeAreaView, Image, ScrollView, Alert } from 'react-native'
import { images } from "../../constants";
import { useState } from 'react';
import FormField from '../../components/FormField';
import CustomButton from '../../components/CustomButton';
import { Link } from 'expo-router';
import { router } from 'expo-router';
import { getCurrentUser, signIn } from "../../lib/appwrite";
import { useGlobalContext } from "../../context/GlobalProvider";
import { useTranslation } from "react-i18next";

const SignIn = () => {
    const { setUser, setIsLogged } = useGlobalContext();
    const { t } = useTranslation();
    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const submit = async () => {
        if (form.email === "" || form.password === "") {
          Alert.alert("Error", t('auth.errors.fillFields'));
        }
    
        setIsSubmitting(true);
    
        try {
          await signIn(form.email, form.password);
          const result = await getCurrentUser();
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
                        {t('auth.signIn.title')}
                    </Text>

                    <FormField
                        title={t('auth.signIn.email')}
                        value={form.email}
                        handleChangeText={(e) => setForm({ ...form, email: e })}
                        otherStyles="mt-10"
                    />

                    <FormField
                        title={t('auth.signIn.password')}
                        value={form.password}
                        handleChangeText={(e) => setForm({ ...form, password: e })}
                        otherStyles="mt-10"
                    />

                    <CustomButton
                        title={t('auth.signIn.submit')}
                        handlePress={submit}
                        containerStyles="mt-10"
                        isLoading={isSubmitting}
                    />

                    <View className="flex justify-center pt-5 flex-row gap-2">
                        <Text className="text-lg text-gray-100 font-pregular">
                            {t('auth.signIn.noAccount')}
                        </Text>
                        <Link
                            href="/sign-up"
                            className="text-lg font-psemibold text-secondary"
                        >
                            {t('auth.signIn.signUp')}
                        </Link>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default SignIn