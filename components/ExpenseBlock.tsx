import {
  FlatList,
  View,
  Text,
  ScrollView,
  ListRenderItem,
  StyleSheet,
} from "react-native";
import { ExpenseItem } from "../type";

const ExpenseBlock = ({ expensedata }: { expensedata: ExpenseItem[] }) => {
  const renderItem: ListRenderItem<ExpenseItem> = ({ item }) => {
    let amount = item.amount?.split(".");
    return (
      <View style={[styles.expenseBlock, { backgroundColor: item.color }]}>
        <Text className="text-white">
          {item.name}
        </Text>
        <Text className="text-white" style={styles.expenseBlockTxt2}>
          ${amount[0]}.
          <Text style={styles.expenseBlockTxt2Span}>{amount[1]}</Text>
        </Text>
        <View style={styles.expenseBlockTxt3View}>
          <Text className="text-white">{item.percentage}%</Text>
        </View>
      </View>
    );
  };
//   const static = {name:"add item"};

  return (
    <View>
      <FlatList
        data={expensedata}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
      ></FlatList>
    </View>
  );
};
export default ExpenseBlock;

const styles = StyleSheet.create({
  expenseBlock: {
    width: 95,
    padding: 15,
    borderRadius: 15,
    marginRight: 20,
    gap: 8,
    alignItems:'flex-start',
    justifyContent:'space-between',
  },
  expenseBlockTxt2: {
    fontSize: 16,
    fontWeight: "600",
  },
  expenseBlockTxt2Span: {
    fontSize: 12,
    fontWeight: "400",
  },
  expenseBlockTxt3View: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 10,
  },
});
