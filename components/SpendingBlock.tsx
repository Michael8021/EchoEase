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
import { SpendingItem, ExpenseItem } from "../type";
import { icons } from "../constants";
import { Feather } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import dayjs, { Dayjs } from "dayjs";
import { updateSpending } from "../lib/appwrite";
import { addSpending, deleteSpending } from "../lib/appwrite";
import Dropdown from "react-native-input-select";
import { useTranslation } from "react-i18next";

type PickerItem = {
  label: string;
  value: string;
  color: string;
};
const convertToPickerItems = (expensedata: ExpenseItem[]): PickerItem[] => {
  return expensedata.map((expense) => ({
    label: expense.category, // Map category to label
    value: expense.category, // Use category as the value
    color: expense.color, // Directly use the color
  }));
};

const SpendingBlock = ({
  spendingdata,
  expensedata,
}: {
  spendingdata: SpendingItem[];
  expensedata: ExpenseItem[];
}) => {
  const { t } = useTranslation();
  //modal(add spending)
  const [modalVisible, setModalVisible] = useState(false);
  const [newSpending, setNewSpending] = useState({
    id: "",
    name: "",
    amount: "",
    date: dayjs().format("YYYY-MM-DD HH:mm:ss"),
    category: "",
  });

  const handleAddSpending = () => {
    if (newSpending.name && newSpending.amount && newSpending.date) {
      addSpending(newSpending);
      setModalVisible(false);
      setNewSpending({
        id: "",
        name: "",
        amount: "",
        date: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        category: "",
      });
    } else {
      alert(t("finance.alerts.fillAllFields"));
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
  const categories: PickerItem[] = convertToPickerItems(expensedata);

  const selectedCategory = categories.find(
    (category) => category.value === newSpending.category
  );

  // get color of spendingdata
  const getCategoryColor = (category: string) => {
    const selectedCategory = categories.find((cat) => cat.value === category);
    return selectedCategory?.color;
  };

  //spending details
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedSpending, setSelectedSpending] = useState({
    id: "",
    name: "",
    amount: "",
    date: dayjs().format("YYYY-MM-DD HH:mm:ss"),
    category: "",
  });

  const handleItemPress = (item: SpendingItem) => {
    setSelectedSpending(item);
    setDetailModalVisible(true);
  };

  return (
    <View className="rounded-2xl p-4 mb-6 shadow-lg border bg-[#2D243B26] border-[rgba(138, 157, 176, 0.2)]">
      <View className="flex-row justify-between items-center mb-4">
        {/* Title Section */}
        <View className="flex-row items-center">
          <View className="w-1 h-6 bg-yellow-400 rounded-full mr-3" />
          <Text className="text-xl font-semibold text-yellow-400">
            {t("finance.spending")}
          </Text>
        </View>

        {/* Button Section */}
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <View className="bg-[#333333] rounded-full p-2">
            <Feather name="plus" size={22} color="#ccc" />
          </View>
        </TouchableOpacity>
      </View>
      {/* add spending modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-[rgba(0,0,0,0.5)]">
          <View className="w-[90%] p-5 bg-primary rounded-lg border-white">
            <Text className="text-[18px] font-bold mb-2.5 text-secondary">
              {t("finance.addSpending")}
            </Text>
            <TextInput
              placeholder={t("finance.expenseName")}
              value={newSpending.name}
              onChangeText={(text) =>
                setNewSpending((prev) => ({ ...prev, name: text }))
              }
              style={styles.Input}
              placeholderTextColor="#888"
            />
            <TextInput
              placeholder={t("finance.amount")}
              keyboardType="numeric"
              value={newSpending.amount}
              onChangeText={(text) => {
                setNewSpending((prev) => ({
                  ...prev,
                  amount: text,
                }));
              }}
              style={styles.Input}
              placeholderTextColor="#888"
            />
            <Dropdown
              placeholder={t("finance.category")}
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
                color: "#888",
              }}
              selectedItemStyle={{
                color: "#FFFFFF",
              }}
            />
            <View className="flex-row items-center mt-[-10]">
              <Text className="text-white">{t("finance.date")}:</Text>
              <DateTimePicker
                mode="date"
                value={new Date(newSpending.date)}
                onChange={handleDateChange}
                display="spinner"
                textColor="white"
              />
            </View>
            <View className="flex-row justify-between mt-3">
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setNewSpending({
                    id: "",
                    name: "",
                    amount: "",
                    date: dayjs().format("YYYY-MM-DD HH:mm:ss"),
                    category: "",
                  });
                }}
                className="bg-primary px-4 py-2 rounded-md"
              >
                <Text className="text-white text-center">
                  {t("finance.cancel")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAddSpending}
                className="bg-secondary px-4 py-2 rounded-md"
              >
                <Text className="text-black text-center">
                  {t("finance.save")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* details modal */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-[rgba(0,0,0,0.5)]">
          <View className="w-[90%] p-5 bg-primary rounded-lg border-white">
            <Text className="text-[18px] font-bold mb-2.5 text-secondary">
              {t("finance.editSpending")}
            </Text>
            {selectedSpending && (
              <>
                <TextInput
                  placeholder={t("finance.expenseName")}
                  value={selectedSpending.name}
                  onChangeText={(text) =>
                    setSelectedSpending((prev) => ({ ...prev, name: text }))
                  }
                  style={styles.Input}
                  placeholderTextColor="#888"
                />
                <TextInput
                  placeholder={t("finance.amount")}
                  keyboardType="numeric"
                  value={selectedSpending.amount}
                  onChangeText={(text) =>
                    setSelectedSpending((prev) => ({ ...prev, amount: text }))
                  }
                  style={styles.Input}
                  placeholderTextColor="#888"
                />
                <Dropdown
                  placeholder={t("finance.category")}
                  options={categories}
                  selectedValue={selectedSpending.category}
                  onValueChange={(value) =>
                    setSelectedSpending((prev) => ({
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
                    color: "#888",
                  }}
                  selectedItemStyle={{
                    color: "#FFFFFF",
                  }}
                />
                <View className="flex-row items-center mt-[-10]">
                  <Text className="text-white">{t("finance.date")}:</Text>
                  <DateTimePicker
                    mode="date"
                    value={new Date(selectedSpending.date)}
                    onChange={(event, selectedDate) => {
                      if (selectedDate) {
                        setSelectedSpending((prev) => ({
                          ...prev,
                          date: selectedDate.toISOString(),
                        }));
                      }
                    }}
                    display="spinner"
                    textColor="white"
                  />
                </View>
              </>
            )}
            <View className="flex-row justify-between mt-3">
              <TouchableOpacity
                onPress={() => setDetailModalVisible(false)}
                className="bg-primary px-4 py-2 rounded-md"
              >
                <Text className="text-white text-center">
                  {t("finance.cancel")}
                </Text>
              </TouchableOpacity>

              <View className="flex-row space-x-2">
                {/* Delete Button */}
                <TouchableOpacity
                  onPress={async () => {
                    try {
                      await deleteSpending(selectedSpending);
                      setDetailModalVisible(false);
                    } catch (error) {
                      console.error("Failed to delete spending:", error);
                    }
                  }}
                  className="bg-red-500 px-4 py-2 rounded-md mx-5"
                >
                  <Text className="text-white text-center">
                    {t("finance.delete")}
                  </Text>
                </TouchableOpacity>

                {/* Save Button */}
                <TouchableOpacity
                  onPress={async () => {
                    try {
                      await updateSpending(selectedSpending);
                      setDetailModalVisible(false);
                    } catch (error) {
                      console.error("Failed to update spending:", error);
                    }
                  }}
                  className="bg-secondary px-4 py-2 rounded-md"
                >
                  <Text className="text-black text-center">
                    {t("finance.save")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false}>
        {spendingdata.map((item, index) => (
          <TouchableOpacity
            key={index}
            className="flex-row items-center py-3 border-b border-[#333333]"
            onPress={() => handleItemPress(item)}
          >
            <View className="p-1.5 rounded-full border border-white mr-3.5">
              <Image source={icons.finance} style={{ width: 24, height: 24 }} />
            </View>
            <View className="flex-1">
              <Text className="text-white text-lg font-bold">{item.name}</Text>
              <Text className="text-gray-400">
                {dayjs(item.date).format("YYYY-MM-DD HH:mm:ss")}
              </Text>
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
          </TouchableOpacity>
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
    color: "#ffffff",
  },
});
