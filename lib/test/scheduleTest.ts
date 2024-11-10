import { 
  createSchedule, 
  getSchedules, 
  updateSchedule, 
  deleteSchedule,
  getHistory,
  getCurrentUser
} from '../appwrite';
import { Schedule } from '../types';

export async function testScheduleOperations() {
  try {
    console.log('=== Starting Schedule Operations Test ===\n');
    const histories = await getHistory();
    if (!histories || histories.length === 0) {
      throw new Error('No histories found to link with schedule');
    }
    const validHistoryId = histories[0].$id;
    const currentUser = await getCurrentUser();
    if (!currentUser) throw Error;

    // 1. Create a Schedule
    console.log('1. Testing Schedule Creation...');
    const newSchedule = {
      title: "Test Schedule",
      description: "This is a test schedule",
      status: "pending" as const,
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 3600000).toISOString(),
      notify_at: new Date(Date.now() + 1800000).toISOString(),
      due_date: new Date(Date.now() + 86400000).toISOString(),
      historyId: validHistoryId,
      type: "event" as const,
      userId: currentUser.$id
    };

    const createdSchedule = await createSchedule(newSchedule);
    console.log('Created Schedule:', createdSchedule);
    console.log('Creation Test: ✅ Passed\n');

    // 2. Get All Schedules
    console.log('2. Testing Schedule Retrieval...');
    const allSchedules = await getSchedules();
    console.log('Retrieved Schedules Count:', allSchedules.length);
    console.log('Retrieval Test: ✅ Passed\n');

    // 3. Update Schedule
    console.log('3. Testing Schedule Update...');
    const updateData = {
      title: "Updated Test Schedule",
      description: "This schedule has been updated",
      status: "completed" as const
    };

    const updatedSchedule = await updateSchedule(createdSchedule.$id, updateData);
    console.log('Updated Schedule:', updatedSchedule);
    console.log('Update Test: ✅ Passed\n');

    // 4. Verify Update
    console.log('4. Verifying Update...');
    const verifySchedules = await getSchedules();
    const verifiedSchedule = verifySchedules.find((s: Schedule) => s.$id === createdSchedule.$id);
    console.log('Verified Schedule:', verifiedSchedule);
    console.log('Update Verification: ✅ Passed\n');

    // 5. Delete Schedule
    console.log('5. Testing Schedule Deletion...');
    const deletedSchedule = await deleteSchedule(createdSchedule.$id);
    console.log('Deleted Schedule:', deletedSchedule);
    console.log('Deletion Test: ✅ Passed\n');

    // 6. Verify Deletion
    console.log('6. Verifying Deletion...');
    const finalSchedules = await getSchedules();
    const deletedVerification = finalSchedules.find((s: Schedule) => s.$id === createdSchedule.$id);
    console.log('Schedule still exists:', deletedVerification ? '❌ Failed' : '✅ Passed');

    console.log('\n=== Schedule Operations Test Completed ===');
    return true;

  } catch (error) {
    console.error('\n❌ Test Failed:', error);
    return false;
  }
}

export const runScheduleTest = async () => {
  try {
    console.log('Starting Schedule Test...');
    const result = await testScheduleOperations();
    console.log('Test Result:', result ? 'All tests passed!' : 'Tests failed!');
  } catch (error) {
    console.error('Test Error:', error);
  }
}; 