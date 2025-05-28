type Task = {
	id: number;
	goalId: number;
	taskId?: number | undefined;
	name: string;
	description: string;
	duration?: {
		base: number;
		elapsed: number;
	};
	dueDate?: Date;
	completed: boolean;
};

export default Task;
