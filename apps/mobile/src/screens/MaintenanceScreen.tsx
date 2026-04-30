import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

// Styling tier: stable. Use NativeWind for layout; move to explicit styles if form UX regresses.
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { useAutoTrack } from '../hooks/useAutoTrack';
import { useAppContext } from '../lib/AppContext';
import { pickImageAsync, uploadReceipt } from '../lib/image';
import { requestNotificationPermission, scheduleMaintenanceReminder } from '../lib/notifications';

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (error && typeof error === 'object') {
    const maybeError = error as { message?: string; details?: string; hint?: string };
    return maybeError.message || maybeError.details || maybeError.hint || 'Please try again.';
  }

  return 'Please try again.';
};

export const MaintenanceScreen = () => {
  const { userId, activeVehicleId } = useAppContext();
  const { tasks, createTask, completeTask } = useAutoTrack(userId, activeVehicleId);

  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueOdometer, setDueOdometer] = useState('');
  const [intervalMiles, setIntervalMiles] = useState('');

  const [completeMileage, setCompleteMileage] = useState('');
  const [completeCost, setCompleteCost] = useState('');
  const [completeNotes, setCompleteNotes] = useState('');
  const [receiptUri, setReceiptUri] = useState<string | undefined>(undefined);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const upcomingTasks = tasks.filter((task) => task.status === 'upcoming');

  const onCreateTask = async () => {
    if (!title) {
      Alert.alert('Missing title', 'Service title is required.');
      return;
    }

    const dueDateIso = dueDate ? new Date(dueDate).toISOString() : undefined;

    await createTask({
      title,
      due_date: dueDateIso,
      due_odometer: dueOdometer ? Number(dueOdometer) : undefined,
      interval_miles: intervalMiles ? Number(intervalMiles) : undefined,
    });

    if (dueDateIso) {
      const canNotify = await requestNotificationPermission();
      if (canNotify) {
        await scheduleMaintenanceReminder(
          title,
          `Upcoming Service: ${title}`,
          'Your maintenance service is coming up.',
          dueDateIso,
        );
      }
    }

    setTitle('');
    setDueDate('');
    setDueOdometer('');
    setIntervalMiles('');
    setShowAddForm(false);
  };

  const onCompleteTask = async (taskId: string) => {
    const task = upcomingTasks.find((item) => item.id === taskId);

    if (!task) {
      return;
    }

    if (!completeMileage || !completeCost) {
      Alert.alert('Missing fields', 'Enter completion mileage and cost first.');
      return;
    }

    setCompletingTaskId(task.id);

    try {
      let photoUrl: string | undefined;

      if (receiptUri) {
        try {
          photoUrl = await uploadReceipt(userId, receiptUri);
        } catch {
          // Attachment is optional, continue completion.
        }
      }

      await completeTask({
        task,
        odometer: Number(completeMileage),
        cost: Number(completeCost),
        notes: completeNotes,
        photo_url: photoUrl,
      });

      setCompleteMileage('');
      setCompleteCost('');
      setCompleteNotes('');
      setReceiptUri(undefined);
    } catch (error) {
      const message = getErrorMessage(error);
      Alert.alert('Could not complete task', message);
    } finally {
      setCompletingTaskId(null);
    }
  };

  const onAttachReceipt = async () => {
    try {
      const image = await pickImageAsync();
      if (image?.uri) {
        setReceiptUri(image.uri);
      }
    } catch {
      Alert.alert('Could not attach receipt', 'Please try again.');
    }
  };

  return (
    <Screen>
      <Text style={styles.title}>Maintenance</Text>
      <Text style={styles.subtitle}>Track upcoming services and auto-log completed work.</Text>

      {/* Tasks list */}
      <View style={styles.taskList}>
        {upcomingTasks.map((task) => (
          <View key={task.id} style={styles.taskCard}>
            <Text style={styles.taskTitle}>{task.title}</Text>
            <Text style={styles.taskMeta}>Status: {task.status}</Text>
            <Text style={styles.taskMeta}>
              Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}
            </Text>
            <Text style={styles.taskMeta}>Due Odometer: {task.due_odometer ?? 'N/A'}</Text>

            <View style={styles.completeAction}>
              <PrimaryButton
                label={completingTaskId === task.id ? 'Marking Complete...' : 'Mark Complete'}
                onPress={() => onCompleteTask(task.id)}
                disabled={Boolean(completingTaskId)}
              />
            </View>
          </View>
        ))}
      </View>

      {/* Complete task inputs — only useful once tasks exist */}
      {upcomingTasks.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Complete a Task</Text>
          <InputField
            label="Completion Odometer"
            value={completeMileage}
            onChangeText={setCompleteMileage}
            keyboardType="numeric"
          />
          <InputField
            label="Completion Cost"
            value={completeCost}
            onChangeText={setCompleteCost}
            keyboardType="numeric"
          />
          <InputField label="Notes (Optional)" value={completeNotes} onChangeText={setCompleteNotes} />
          <PrimaryButton
            label={receiptUri ? 'Receipt Attached ✓' : 'Attach Receipt (Optional)'}
            onPress={onAttachReceipt}
          />
        </View>
      ) : null}

      {showAddForm ? (
        <View style={styles.card}>
          <InputField label="Service Title" value={title} onChangeText={setTitle} placeholder="Oil change" />
          <InputField label="Due Date (YYYY-MM-DD)" value={dueDate} onChangeText={setDueDate} />
          <InputField
            label="Due Odometer"
            value={dueOdometer}
            onChangeText={setDueOdometer}
            keyboardType="numeric"
          />
          <InputField
            label="Mileage Interval"
            value={intervalMiles}
            onChangeText={setIntervalMiles}
            keyboardType="numeric"
          />
          <PrimaryButton label="Save Task" onPress={onCreateTask} />
        </View>
      ) : null}

      {/* Add task toggle + collapsible form */}
      <View style={styles.addHeader}>
        <PrimaryButton
          label={showAddForm ? 'Hide Form' : 'Add Task'}
          onPress={() => setShowAddForm((prev) => !prev)}
        />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 4,
    color: '#a1a1aa',
    fontSize: 15,
  },
  card: {
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    backgroundColor: '#18181b',
    padding: 16,
  },
  sectionLabel: {
    marginBottom: 8,
    color: '#d4d4d8',
    fontSize: 14,
    fontWeight: '600',
  },
  addHeader: {
    marginTop: 16,
  },
  taskList: {
    marginTop: 16,
    rowGap: 12,
  },
  taskCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    backgroundColor: '#18181b',
    padding: 16,
  },
  taskTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  taskMeta: {
    marginTop: 4,
    color: '#a1a1aa',
    fontSize: 14,
  },
  completeAction: {
    marginTop: 12,
  },
});
