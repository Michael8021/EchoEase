import {
  FlatList,
  View,
  Text,
  ScrollView,
  ListRenderItem,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Button,
  Alert,
} from "react-native";
import React, { useState } from "react";
import { ExpenseItem } from "../type";
import { Feather } from "@expo/vector-icons";
import { addExpenseType, deleteExpenseTypes } from "../lib/appwrite";
import { expenseTypeColors } from "../constants/Colors";

const ExpenseBlock = ({
  expensedata,
  categoryData,
}: {
  expensedata: ExpenseItem[];
  categoryData: { category: string; percentage: string; totalAmount: number }[];
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState("");
  const [selectedColor, setSelectedColor] = useState("");

  const handleDelete = async (expenseTypeId: string) => {
    // Alert.alert(
    //   "Delete Expense",
    //   "Are you sure you want to delete this expense?",
    //   [
    //     {
    //       text: "Cancel",
    //       style: "cancel",
    //     },
    //     {
    //       text: "Delete",
    //       onPress: async () => {
    //         try {
    //           await deleteExpenseTypes(expenseTypeId);
    //           setData((prevData) => prevData.filter((item) => item.id !== expenseTypeId));
    //         } catch (error) {
    //           console.error("Failed to delete expense type:", error);
    //           alert("Failed to delete expense type. Please try again.");
    //         }
    //       },
    //       style: "destructive",
    //     },
    //   ]
    // );
  };

  const renderItem: ListRenderItem<ExpenseItem> = ({ item, index }) => {
    if (index == 0) {
      return (
        <>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <View
              style={{
                flex: 1,
                borderWidth: 2,
                height: 110,
                borderColor: "#666",
                borderStyle: "dashed",
                borderRadius: 10,
                marginHorizontal: 20,
                padding: 20,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Feather name="plus" size={22} color={"#ccc"} />
            </View>
          </TouchableOpacity>
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View className="flex-1 justify-center items-center bg-[rgba(0,0,0,0.5)]">
              <View className="w-[90%] p-5 bg-primary rounded-lg border-white">
                <Text className="text-[18px] font-bold mb-2.5 text-secondary">
                  Add Expense Type
                </Text>

                <TextInput
                  placeholder="Expense category"
                  style={styles.input}
                  value={expenseCategory}
                  onChangeText={setExpenseCategory}
                  placeholderTextColor="#888"
                />

                <Text className="text-white mb-3 ">Select Color:</Text>
                <View className="flex-row justify-around mb-5">
                  {expenseTypeColors.map((color, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setSelectedColor(color)}
                      style={[
                        styles.colorOption,
                        {
                          backgroundColor: color,
                          borderWidth: selectedColor === color ? 2 : 0,
                        },
                      ]}
                    />
                  ))}
                </View>

                <View className="flex-row justify-between w-full">
                  <TouchableOpacity
                    onPress={() => {
                      setModalVisible(false);
                      setExpenseCategory("");
                      setSelectedColor("");
                    }}
                    className="bg-primary px-4 py-2 rounded-md"
                  >
                    <Text className="text-white text-center">Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      addExpenseType(expenseCategory, selectedColor);
                      setModalVisible(false);
                      setExpenseCategory("");
                      setSelectedColor("");
                    }}
                    className="bg-secondary px-4 py-2 rounded-md"
                  >
                    <Text className="text-black text-center">Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </>
      );
    }
    const category = categoryData.find((cat) => cat.category === item.category);
    const categoryPercentage = category ? category.percentage : "0.00";
    const categoryTotalAmount = category ? category.totalAmount : 0;
    const formattedAmount = categoryTotalAmount.toFixed(2);
    const [whole, decimal] = formattedAmount.split(".");

    return (
      <TouchableOpacity
        onLongPress={() => { handleDelete(item.category)}}>
        <View style={[styles.expenseBlock, { backgroundColor: item.color }]}>
          <Text className="text-white">{item.category}</Text>
          <Text className="text-white" style={styles.expenseBlockTxt2}>
            ${whole}.<Text style={styles.expenseBlockTxt2Span}>{decimal}</Text>
          </Text>
          <View style={styles.expenseBlockTxt3View}>
            <Text className="text-white">{categoryPercentage}%</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  const staticitem = [
    {
      category: "add item",
      amount: "0.0",
      color: "",
    },
  ];

  return (
    <View>
      <FlatList
        data={staticitem.concat(expensedata)}
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
    width: 100,
    height: 110,
    padding: 15,
    borderRadius: 15,
    marginRight: 20,
    gap: 8,
    alignItems: "flex-start",
    justifyContent: "space-between",
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
  input: {
    width: "100%",
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
    color: "#ffffff",
  },

  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderColor: "#FFFFFF",
    marginHorizontal: 3,
  },
});
