import { View, Text, ScrollView } from "react-native";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { PieChart } from "react-native-gifted-charts";
import { Colors } from "@/constants/Colors";
import ExpenseBlock from "../../components/ExpenseBlock";
import SpendingBlock from "../../components/SpendingBlock";
import { getExpenseTypes, client, appwriteConfig } from "../../lib/appwrite";
import { ExpenseItem } from "../../type";

const Finance = () => {
  const pieData = [
    {
      value: 47,
      color: "#2ac7e7",
      focused: true,
      text: "47%",
    },
    { value: 40, color: "#5e16f8", text: "40%" },
    { value: 10, color: "#4498f7", text: "10%" },
    { value: 3, color: "#FFA5BA", gradientCenterColor: "#FF7F97" },
  ];
  // const expensedata = [
  //   {
  //     category: "housing",
  //     amount: "955.75",
  //     color: "#5e16f8",
  //   },
  //   {
  //     category: "food",
  //     amount: "200.50",
  //     color: "#2ac7e7",
  //   },
  //   {
  //     category: "saving",
  //     amount: "150.25",
  //     color: "#4498f7",
  //   },
  //   {
  //     category: "utilities",
  //     amount: "95.00",
  //     color: "#FFA5BA",
  //   },
  // ];
  const [expensedata, setExpensedata] = useState<ExpenseItem[]>([]);
  const fetchExpenses = async () => {
    try {
      const expenses = await getExpenseTypes();
      const formattedExpenses = expenses.map((expense: any) => ({
        category: expense.category,
        amount: expense.amount,
        color: expense.color,
      }));
      setExpensedata(formattedExpenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    }
  };

  // // Setup Realtime Listener
  // const setupRealtime = () => {
  //   const subscription = client.subscribe(
  //     [`databases.${appwriteConfig.databaseId}.collections.${appwriteConfig.financeId}.documents`],
  //     (response) => {
  //       const { events, payload } = response;
  //       const expense = payload as ExpenseItem;

  //       if (events.some((event) => event.includes(".create"))) {
  //         const newExpense = {
  //           category: expense.category,
  //           amount: expense.amount,
  //           percentage: expense.percentage,
  //           color: expense.color,
  //         };
  //         setExpensedata((prevData) => [...prevData, newExpense]);
  //       } else if (events.some((event) => event.includes(".delete"))) {
  //         setExpensedata((prevData) =>
  //           prevData.filter((expense) => expense.category !== expense.category)
  //         );
  //       }
  //     }
  //   );
  // };

  useEffect(() => {
    fetchExpenses();

    const unsubscribe = client.subscribe(
      [
        `databases.${appwriteConfig.databaseId}.collections.${appwriteConfig.expense_typeId}.documents`,
      ],
      (response) => {
        const { events, payload } = response;
        const expense = payload as ExpenseItem;

        if (events.some((event) => event.includes(".create"))) {
          const newExpense = {
            category: expense.category,
            amount: expense.amount,
            color: expense.color,
          };
          setExpensedata((prevData) => [...prevData, newExpense]);
        } else if (events.some((event) => event.includes(".delete"))) {
          setExpensedata((prevData) =>
            prevData.filter(
              (existingExpense) => existingExpense.category !== expense.category
            )
          );
        }
      }
    );
    return () => {
      unsubscribe();
    };
  }, []);

  const spendingdata = [
    {
      id: 1,
      name: "Groceries",
      amount: "150.00",
      date: "2024-11-01",
      color: "#2ac7e7",
    },
    {
      id: 2,
      name: "Transportation",
      amount: "50.00",
      date: "2024-11-02",
      color: "#FFA5BA",
    },
    {
      id: 3,
      name: "Dining Out",
      amount: "80.00",
      date: "2024-11-03",
      color: "#2ac7e7",
    },
    {
      id: 4,
      name: "Utilities",
      amount: "120.00",
      date: "2024-11-04",
      color: "#5e16f8",
    },
    {
      id: 5,
      name: "Entertainment",
      amount: "60.00",
      date: "2024-11-05",
      color: "#5e16f8",
    },
    {
      id: 6,
      name: "Healthcare",
      amount: "200.00",
      date: "2024-11-06",
      color: "#4498f7",
    },
    {
      id: 7,
      name: "Shopping",
      amount: "75.00",
      date: "2024-11-07",
      color: "#4498f7",
    },
    {
      id: 8,
      name: "Subscription",
      amount: "15.00",
      date: "2024-11-08",
      color: "#FFA5BA",
    },
    {
      id: 9,
      name: "Education",
      amount: "500.00",
      date: "2024-11-09",
      color: "#4498f7",
    },
    {
      id: 10,
      name: "Miscellaneous",
      amount: "30.00",
      date: "2024-11-10",
      color: "#FFA5BA",
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <View className="flex-row justify-between items-center px-4 py-6 bg-primary">
        <Text className="text-3xl font-psemibold text-secondary">Finance</Text>
      </View>
      <View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="mx-5 flex flex-row justify-between items-center">
            <View>
              <Text className="text-white text-1.5xl">
                My <Text className="font-bold">Expenses</Text>
              </Text>
              <Text className="text-white my-3 text-4xl font-semibold">
                $1475.<Text className="text-2xl font-light">00</Text>
              </Text>
            </View>
            <View>
              <PieChart
                data={pieData}
                donut
                showGradient
                sectionAutoFocus
                focusOnPress
                semiCircle
                radius={70}
                innerRadius={50}
                innerCircleColor={"#232B5D"}
                centerLabelComponent={() => {
                  return (
                    <View className="justify-center items-center">
                      <Text className="text-white text-2xl font-bold">47%</Text>
                    </View>
                  );
                }}
              />
            </View>
          </View>
          <View className="my-5">
            <ExpenseBlock expensedata={expensedata} />
          </View>
          <View className="mx-5">
            <SpendingBlock spendingdata={spendingdata} />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default Finance;
