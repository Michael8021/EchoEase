import { View, Text, ScrollView } from "react-native";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { PieChart } from "react-native-gifted-charts";
import { Colors } from "@/constants/Colors";
import ExpenseBlock from "../../components/ExpenseBlock";
import SpendingBlock from "../../components/SpendingBlock";
import {
  getExpenseTypes,
  getSpending,
  client,
  appwriteConfig,
} from "../../lib/appwrite";
import { ExpenseItem, SpendingItem} from "../../type";

type PickerItem = {
  label: string;
  value: string;
  color: string;
};

const Finance = () => {
  //expense type
  const [expensedata, setExpensedata] = useState<ExpenseItem[]>([]);
  const fetchExpenses = async () => {
    try {
      const expenses = await getExpenseTypes();
      const formattedExpenses = expenses.map((expense: any) => ({
        id: expense.$id,
        category: expense.category,
        amount: expense.amount,
        color: expense.color,
      }));
      setExpensedata(formattedExpenses);
    } catch (error) {
      console.error("Error fetching expenses types:", error);
    }
  };

  //spending
  const [spendingdata, setSpendingdata] = useState<SpendingItem[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0.0);
  const formattedAmount = totalAmount.toFixed(2);
  const [whole, decimal] = formattedAmount.split(".");
  const fetchSpending = async () => {
    try {
      const spendings = await getSpending();
      const formattedSpendings = spendings.map((spending: any) => ({
        id: spending.$id,
        name: spending.name,
        amount: spending.amount,
        date: spending.date,
        category: spending.category ? spending.category.category : null,
        historyId: spending.historyId,
      }));
      setSpendingdata(formattedSpendings);
    } catch (error) {
      console.error("Error fetching spending:", error);
    }
  };

  //piedata
  const [pieData, setPieData] = useState<any[]>([]);
  const [maxPercentage,setMaxPercentage]=useState<string>('0.00');
  useEffect(() => {
    if (spendingdata.length > 0 && expensedata.length > 0) {
      // Calculate total amount
      const total = spendingdata.reduce((accumulated, spending) => {
        return accumulated + parseFloat(spending.amount);
      }, 0);
      setTotalAmount(total);

      // Group spendings by category and calculate category totals
      const categoryTotals: { [key: string]: number } = {};
      spendingdata.forEach((spending) => {
        if (categoryTotals[spending.category]) {
          categoryTotals[spending.category] += parseFloat(spending.amount);
        } else {
          categoryTotals[spending.category] = parseFloat(spending.amount);
        }
      });

      // Calculate percentage and match colors for each category
      const categoriesWithPercentage = Object.keys(categoryTotals).map(
        (category) => {
          const categoryTotal = categoryTotals[category];
          const percentage = (categoryTotal / total) * 100;

          // Match color from expensedata
          const matchedExpense = expensedata.find(
            (expense) => expense.category === category
          );
          const color = matchedExpense ? matchedExpense.color : "#ccc"; // Default to gray if no match

          return {
            category,
            totalAmount: categoryTotal,
            percentage: percentage.toFixed(2),
            color,
          };
        }
      );
      const maxCategory = categoriesWithPercentage.reduce(
        (max, current) =>
          parseFloat(current.percentage) > parseFloat(max.percentage) ? current : max,
        { category: "None", percentage: "0.00", totalAmount: 0, color: "#ccc" } 
      );
      setMaxPercentage(maxCategory.percentage)
      
      const updatedCategories = categoriesWithPercentage.map((category) => ({
        ...category,
        focused: category.category === maxCategory.category,
      }));

      setCategoryData(updatedCategories);

      // Prepare pieData
      const computedPieData = categoriesWithPercentage.map((data) => ({
        value: parseFloat(data.percentage),
        color: data.color,
        text: `${data.percentage}%`,
      }));

      setPieData(computedPieData);
    }
    else{
      setTotalAmount(0.0);
      setPieData([]);
      setMaxPercentage('0.00');
    }
  }, [spendingdata, expensedata]);

  useEffect(() => {
    fetchExpenses();
    fetchSpending();

    const unsubscribe_expenses = client.subscribe(
      [
        `databases.${appwriteConfig.databaseId}.collections.${appwriteConfig.expense_typeId}.documents`,
      ],
      (response) => {
        const { events, payload } = response;
        const expense = payload as any;

        if (events.some((event) => event.includes(".create"))) {
          const newExpense = {
            id: expense.$id, 
            category: expense.category,
            amount: expense.amount,
            color: expense.color,
          };
          setExpensedata((prevData) => [...prevData, newExpense]);
        } 
        if (events.some((event) => event.includes(".delete"))) {
          setExpensedata((prevData) =>
            prevData.filter(
              (existingExpense) => existingExpense.category !== expense.category
            )
          );
          fetchSpending();
        }
      }
    );
    const unsubscribe_spendings = client.subscribe(
      [
        `databases.${appwriteConfig.databaseId}.collections.${appwriteConfig.spendingCollectionId}.documents`,
      ],
      (response) => {
        const { events, payload } = response;
        const spending = payload as any;
    
        if (events.some((event) => event.includes(".create"))) {
          const newSpending = {
            id: spending.$id, 
            name: spending.name,
            amount: spending.amount,
            date: spending.date,
            category: spending.category.category,
            historyId: spending.historyId,
          };
          setSpendingdata((prevData) => [...prevData, newSpending]);
        }
    
        if (events.some((event) => event.includes(".delete"))) {
          setSpendingdata((prevData) =>
            prevData.filter((item) => item.id !== spending.$id)
          );
        }
        if (events.some((event) => event.includes(".update"))) {
          setSpendingdata((prevData) =>
            prevData.map((item) =>
              item.id === spending.$id
                ? { ...item, ...spending,category: item.category } 
                : item
            )
          );
        }
      }
    );
    
    return () => {
      unsubscribe_expenses();
      unsubscribe_spendings();
    };
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <View className="flex-row justify-between items-center px-4 py-6 bg-primary">
        <Text className="text-4xl font-pbold text-secondary">Finance</Text>
      </View>
      <View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="mx-5 flex flex-row justify-between items-center">
            <View>
              <Text className="text-yellow-400 text-1.5xl">
                My <Text className="font-bold">Expenses</Text>
              </Text>
              <Text className="text-white my-3 text-4xl font-semibold">
                ${whole}.<Text className="text-2xl font-light">{decimal}</Text>
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
                      <Text className="text-white text-xl font-bold">{maxPercentage}%</Text>
                    </View>
                  );
                }}
              />
            </View>
          </View>
          <View className="my-5">
            <ExpenseBlock
              expensedata={expensedata}
              categoryData={categoryData}
            />
          </View>
          <View className="mx-5">
            <SpendingBlock spendingdata={spendingdata} expensedata={expensedata} />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default Finance;
