import { useStorage } from '@/storage/StorageContext';
import { AgendaItemType, Task } from '@/types/schemas';
import { MarkedDates } from 'react-native-calendars/src/types';
import isEmpty from 'lodash/isEmpty';
import agendaItemType, { AgendaItemData } from '@/types/schemas/agendaItemType';

export const useAgendaItems = () => {
	const storage = useStorage();

	const loadStoredItems = () => {
		const storedItems = storage.getString('agenda');
		if (storedItems) {
			return JSON.parse(storedItems) as AgendaItemType[];
		}
		return [];
	};

	const updateItems = (updatedItems: AgendaItemType[]) => {
		storage.set('agenda', JSON.stringify(updatedItems));
	};
	const addAgendaItem = (newItem: AgendaItemType) => {
		const oldItems = loadStoredItems();
		const index = oldItems.findIndex(item => item.title === newItem.title);
		const updatedItems =
			index !== -1
				? [
						...oldItems.slice(0, index),
						{
							...oldItems[index],
							data: [...oldItems[index].data, ...newItem.data],
						},
						...oldItems.slice(index + 1),
				  ]
				: [...oldItems, newItem];
		updateItems(updatedItems);
	};
	const createAgendaItem = (
		date: Date,
		task: Task,
		duration: number,
		time?: Date,
	) => {
		const title = date.toISOString().split('T')[0];
		const storedId = storage.getNumber('agenda.id');
		const id = storedId || 0;
		const newItem: AgendaItemType = {
			title,
			data: [
				{
					time,
					duration,
					title: task.name,
					id: id + 1,
					key: title,
					taskStorageKey: task.taskId
						? `goals.${task.goalId}.${task.taskId}`
						: `goals.${task.goalId}`,
					taskId: task.id,
					completed: false,
				},
			],
		};
		addAgendaItem(newItem);
		storage.set('agenda.id', id + 1);
	};
	const getMarkedDates = (items: agendaItemType[]) => {
		const marked: MarkedDates = {};

		items.forEach(item => {
			if (item.data && item.data.length > 0 && !isEmpty(item.data[0])) {
				marked[item.title] = { marked: true };
			} else {
				marked[item.title] = { disabled: true };
			}
		});
		return marked;
	};

	const deleteAgendaItem = (item: AgendaItemData): AgendaItemType[] => {
		const agendaItems = loadStoredItems();
		const updatedItems = agendaItems.map(agendaItem => {
			if (agendaItem.title === item.key) {
				return {
					...agendaItem,
					data: agendaItem.data.filter(
						filteredItem => filteredItem.id !== item.id,
					),
				};
			}
			return agendaItem;
		});
		const filteredItems = updatedItems.filter(
			agendaItem => agendaItem.data.length > 0,
		);
		updateItems(filteredItems);
		return filteredItems;
	};

	function updateTaskDuration(
		tasks: Task[],
		task: Task,
		duration: number,
		storageKey: string,
	): void {
		if (task.duration?.elapsed !== undefined) {
			const updatedTaskElapsedTime = task.duration.elapsed
				? task.duration.elapsed + duration
				: duration;
			const updatedTask = {
				...task,
				duration: { ...task.duration, elapsed: updatedTaskElapsedTime },
			};
			storage.set(
				storageKey,
				JSON.stringify(
					tasks.map(current =>
						current.id === task.id ? updatedTask : current,
					),
				),
			);
		}
	}

	const completeAgendaItem = (item: AgendaItemData): AgendaItemType[] => {
		const agendaItems = loadStoredItems();
		const updatedItems = agendaItems.map(agendaItem => {
			return agendaItem.title === item.key
				? {
						...agendaItem,
						data: agendaItem.data.map(currentItem =>
							currentItem.id === item.id
								? { ...item, completed: true }
								: currentItem,
						),
				  }
				: agendaItem;
		});

		const storedTasksString = storage.getString(item.taskStorageKey);
		if (storedTasksString) {
			const tasks = JSON.parse(storedTasksString) as Task[];
			const targetTask = tasks.find(current => current.id === item.taskId);
			if (targetTask) {
				updateTaskDuration(
					tasks,
					targetTask,
					item.duration,
					item.taskStorageKey,
				);
			}
		}

		updateItems(updatedItems);
		return updatedItems;
	};
	return {
		getMarkedDates,
		addAgendaItem,
		deleteAgendaItem,
		loadStoredItems,
		completeAgendaItem,
		createAgendaItem,
	};
};
