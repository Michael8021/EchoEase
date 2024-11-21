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
} from "react-native";
import React, { useState } from "react";
import { ExpenseItem } from "../type";
import { Feather } from "@expo/vector-icons";
import { handleSaveExpenseType } from "../lib/appwrite";


const colors = ["#5e16f8", "#2ac7e7", "#4498f7", "#FFA5BA"];

const ExpenseBlock = ({
  expensedata,
  categoryData
}: {
  expensedata: ExpenseItem[];
  categoryData: { category: string; percentage: string; totalAmount: number }[];
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const renderItem: ListRenderItem<ExpenseItem> = ({ item, index }) => {
    if (index == 0) {
      return (
        <>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <View
              style={{
                flex: 1,
                borderWidth: 2,
                height:110,
                borderColor: "#666",
                borderStyle: "dashed",
                borderRadius: 10,
                marginHorizontal:20,
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
            <View style={styles.modalBackground}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Add Expense Type</Text>

                <TextInput
                  placeholder="Expense category"
                  style={styles.input}
                  value={expenseCategory}
                  onChangeText={setExpenseCategory}
                />

                <Text style={styles.colorPickerLabel}>Select Color:</Text>
                <View style={styles.colorOptionsContainer}>
                  {colors.map((color, index) => (
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

                <View style={styles.buttonContainer}>
                  <Button
                    title="Cancel"
                    onPress={() => {
                      setModalVisible(false);
                      setExpenseCategory("");
                      setSelectedColor("");
                    }}
                  />
                  <Button
                    title="Save"
                    onPress={() => {
                      handleSaveExpenseType(expenseCategory, selectedColor);
                      setModalVisible(false);
                      setExpenseCategory("");
                      setSelectedColor("");
                    }}
                  />
                </View>
              </View>
            </View>
          </Modal>
        </>
      );
    }
    let amount = item.amount?.split(".");
    const category = categoryData.find((cat) => cat.category === item.category);
    const categoryPercentage = category ? category.percentage : '0.00';
    const categoryTotalAmount = category ? category.totalAmount : 0;
    const formattedAmount = categoryTotalAmount.toFixed(2);
    const [whole, decimal] = formattedAmount.split(".");
    
    return (
      <View style={[styles.expenseBlock, { backgroundColor: item.color }]}>
        <Text className="text-white">{item.category}</Text>
        <Text className="text-white" style={styles.expenseBlockTxt2}>
          ${whole}.
          <Text style={styles.expenseBlockTxt2Span}>{decimal}</Text>
        </Text>
        <View style={styles.expenseBlockTxt3View}>
          <Text className="text-white">{categoryPercentage}%</Text>
        </View>
      </View>
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
    height:110,
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
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    flex: 1,
    borderWidth: 2,
    borderColor: "#666",
    borderStyle: "dashed",
    borderRadius: 10,
    marginRight: 20,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  colorPickerLabel: {
    fontSize: 16,
    marginVertical: 10,
  },
  colorOptionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderColor: "#000",
    marginHorizontal: 5,
  },
});
