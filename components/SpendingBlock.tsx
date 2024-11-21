import {
  FlatList,
  View,
  Text,
  ScrollView,
  ListRenderItem,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Button,
  TextInput,
} from "react-native";
import React, { useState, useEffect } from "react";
import { SpendingItem } from "../type";
import { icons } from "../constants";
import { Feather } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import dayjs, { Dayjs } from "dayjs";
import { getExpenseTypes } from "../lib/appwrite";
import { handleSaveSpending } from "../lib/appwrite";
import Dropdown from "react-native-input-select";

type PickerItem = {
  label: string;
  value: string;
  color: string;
};

const SpendingBlock = ({ spendingdata }: { spendingdata: SpendingItem[]}) => {
  //modal(add spending)
  const [modalVisible, setModalVisible] = useState(false);
  const [newSpending, setNewSpending] = useState({
    name: "",
    amount: "",
    date: dayjs().format("YYYY-MM-DD HH:mm:ss"),
    category: "",
  });

  const handleAddSpending = () => {
    if (newSpending.name && newSpending.amount && newSpending.date) {
      handleSaveSpending(newSpending);
      setModalVisible(false);
      setNewSpending({
        name: "",
        amount: "",
        date: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        category: "",
      });
    } else {
      alert("Please fill in all fields.");
    }
  };

  //date
  const handleDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    if (selectedDate) {
      const formattedDate = dayjs(selectedDate).format("YYYY-MM-DD HH:mm:ss");
      setNewSpending((prev) => ({
        ...prev,
        date: formattedDate,
      }));
    }
  };

  //category
  const [categories, setCategories] = useState<PickerItem[]>([]);
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const expenseTypes = await getExpenseTypes();
        const formattedExpenses: PickerItem[] = expenseTypes.map(
          (expense: any) => ({
            label: expense.category,
            value: expense.category,
            color: expense.color,
          })
        );

        setCategories(formattedExpenses);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const selectedCategory = categories.find(
    (category) => category.value === newSpending.category
  );

  // get color of spendingdata
  const getCategoryColor = (category: string) => {
    const selectedCategory = categories.find((cat) => cat.value === category);
    return selectedCategory?.color;
  };

  return (
    <View>
      <View className="flex-row justify-between items-center bg-primary">
        <Text className="text-white text-1.5xl mb-3">
          Nov <Text className="font-bold">Spending</Text>
        </Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <View style={{ backgroundColor: "#333333", borderRadius: 25 }}>
            <Feather name="plus" size={22} color={"#ccc"} />
          </View>
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }}
        >
          <View
            style={{
              width: "90%",
              padding: 20,
              backgroundColor: "white",
              borderRadius: 10,
            }}
          >
            <Text
              style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}
            >
              Add Spending
            </Text>
            <TextInput
              placeholder="Expense Name"
              value={newSpending.name}
              onChangeText={(text) =>
                setNewSpending((prev) => ({ ...prev, name: text }))
              }
              style={styles.Input}
            />
            <TextInput
              placeholder="Amount"
              keyboardType="numeric"
              value={newSpending.amount}
              onChangeText={(text) => {
                setNewSpending((prev) => ({
                  ...prev,
                  amount: text,
                }));
              }}
              style={styles.Input}
            />
            <Dropdown
              placeholder="Category"
              options={categories}
              selectedValue={newSpending.category}
              onValueChange={(value) =>
                setNewSpending((prev) => ({
                  ...prev,
                  category: value as string,
                }))
              }
              primaryColor={selectedCategory?.color || "green"}
              dropdownStyle={{
                borderColor: "#ccc",
                borderWidth: 1,
                borderRadius: 8,
                flex: 1,
              }}
              dropdownContainerStyle={{
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 5,
                padding: 10,
                width: "100%",
              }}
              dropdownIconStyle={{
                top: 5,
                right: 10,
              }}
              placeholderStyle={{
                color: "#ccc",
              }}
            />
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: -10,
              }}
            >
              <Text>Date:</Text>
              <DateTimePicker
                mode="date"
                value={new Date(newSpending.date)}
                onChange={handleDateChange}
                display="default" // Optional: use 'spinner', 'calendar', etc.
              />
            </View>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Button
                title="Cancel"
                onPress={() => {
                  setModalVisible(false);
                  setNewSpending({
                    name: "",
                    amount: "",
                    date: dayjs().format("YYYY-MM-DD HH:mm:ss"),
                    category: "",
                  });
                }}
              />
              <Button title="Add" onPress={handleAddSpending} />
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false}>
        {spendingdata.map((item, index) => (
          <View
            key={index}
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
                backgroundColor: getCategoryColor(item.category),
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

const styles = StyleSheet.create({
  Input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
});
