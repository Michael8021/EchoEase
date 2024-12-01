import {
  FlatList,
  View,
  Text,
  ScrollView,
  ListRenderItem,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { IncomeItem } from "../type";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

const IncomeBlock = ({ incomedata }: { incomedata: IncomeItem[] }) => {
  const { t } = useTranslation();

  const renderItem: ListRenderItem<IncomeItem> = ({ item }) => {
    return (
        <View>
          <Text className="text-white">{item.name}</Text>
        </View>
      );
  };
  return (
    <View>
      <Text className="text-white text-1.5xl">
        {t('finance.myIncome')}
      </Text>
      <FlatList
        data={incomedata}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
      ></FlatList>
    </View>
  );
};
export default IncomeBlock;

const styles = StyleSheet.create({});
