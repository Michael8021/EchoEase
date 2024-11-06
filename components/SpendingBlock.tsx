import {
  FlatList,
  View,
  Text,
  ScrollView,
  ListRenderItem,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { SpendingItem } from "../type";
import { icons } from "../constants";
import { Feather } from "@expo/vector-icons";

const SpendingBlock = ({ spendingdata }: { spendingdata: SpendingItem[] }) => {
  return (
    <View>
      <View className="flex-row justify-between items-center bg-primary">
        <Text className="text-white text-1.5xl mb-3">
          Nov <Text className="font-bold">Spending</Text>
        </Text>
        <TouchableOpacity onPress={() => {}}>
          <View style={{ backgroundColor: "#333333", borderRadius: 25 }}>
            <Feather name="plus" size={22} color={"#ccc"} />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {spendingdata.map((item) => (
          <View
            key={item.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 10,
              borderBottomColor: "#333333",
              borderBottomWidth: 1,
            }}
          >
            <View
              style={{
                padding: 5,
                borderRadius: 24,
                borderColor: "#ffffff",
                borderWidth: 1,
                marginRight: 15,
              }}
            >
              <Image source={icons.finance} style={{ width: 24, height: 24 }} />
            </View>
            <View style={{ flex: 1 }}>
              <Text className="text-white text-lg font-bold">{item.name}</Text>
              <Text className="text-gray-400">{item.date}</Text>
            </View>
            <View
              style={{
                width: 8, 
                height: 8, 
                backgroundColor: item.color,  
                marginRight: 8, 
              }}
            />
            <Text className="text-gray-400 font-semibold">${item.amount}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};
export default SpendingBlock;

const styles = StyleSheet.create({});
