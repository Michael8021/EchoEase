import { View, Text, SafeAreaView, Image, ScrollView, Alert } from 'react-native'
import { images } from "../../constants";
import { useState } from 'react';
import FormField from '../../components/FormField';
import CustomButton from '../../components/CustomButton';
import { Link } from 'expo-router';
import { router } from 'expo-router';
import { getCurrentUser, signIn } from "../../lib/appwrite";
import { useGlobalContext } from "../../context/GlobalProvider";

const SignIn = () => {
    const { setUser, setIsLogged } = useGlobalContext();
    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const submit = async () => {
        if (form.email === "" || form.password === "") {
          Alert.alert("Error", "Please fill in all fields");
        }
    
        setIsSubmitting(true);
    
        try {
          await signIn(form.email, form.password);
          const result = await getCurrentUser();
          setUser(result);
          setIsLogged(true);
    
          Alert.alert("Success", "User signed in successfully");
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

                    <Text className="text-2xl text-white text-semibold mt-10 font-psemibold">Log in to EchoEase</Text>


                    <FormField
                        title="Email"
                        value={form.email}
                        handleChangeText={(e) => setForm({ ...form, email: e })}
                        otherStyles="mt-10"
                    />

                    <FormField
                        title="Password"
                        value={form.password}
                        handleChangeText={(e) => setForm({ ...form, password: e })}
                        otherStyles="mt-10"
                    />

                    <CustomButton
                        title="Sign In"
                        handlePress={submit}
                        containerStyles="mt-10"
                        isLoading={isSubmitting}
                    />

                    <View className="flex justify-center pt-5 flex-row gap-2">
                        <Text className="text-lg text-gray-100 font-pregular">
                            Don't have an account?
                        </Text>
                        <Link
                            href="/sign-up"
                            className="text-lg font-psemibold text-secondary"
                        >
                            Signup
                        </Link>
                    </View>
                </View>



            </ScrollView>
        </SafeAreaView>
    )
}

export default SignIn