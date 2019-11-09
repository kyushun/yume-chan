const moment = require('moment');
const Trello = require('trello');
const trello = new Trello(
  process.env.TRELLO_API_KEY,
  process.env.TRELLO_API_TOKEN,
);

const DEFAULT_FORMATS = {
  Expired: { prefix: '😇', priority: 100 },
  Soon: { prefix: '🤯', priority: 10 },
  InProgress: { prefix: '🤗', priority: 5 },
  Todo: { prefix: '🤫', priority: 2 },
  Pending: { prefix: '🤔', priority: 1 },
  Done: { prefix: '😍', priority: 0 },
};

const createFormattedCards = (task, format) => {
  const remainHours = moment(task.due).diff(moment(), 'hours');

  let params;
  if (!task.due || remainHours > 48) {
    params = format;
  } else if (remainHours >= 0) {
    params = DEFAULT_FORMATS.Soon;
  } else {
    params = DEFAULT_FORMATS.Expired;
  }
  const prefix = params.prefix;
  const suffix = task.due ? moment(task.due).format('MM/DD HH:mm') : '';
  const priority = params.priority;

  return {
    name: prefix + ' ' + task.name + `${suffix ? ` (~${suffix})` : ''}`,
    remainHours: task.due ? remainHours : null,
    priority,
  };
};

exports.getTodoCards = async () =>
  await trello.getCardsOnList(process.env.TRELLO_TODO_LIST_ID);
exports.getInProgresCards = async () =>
  await trello.getCardsOnList(process.env.TRELLO_INPROGRESS_LIST_ID);
exports.getPendingCards = async () =>
  await trello.getCardsOnList(process.env.TRELLO_PENDING_LIST_ID);
exports.getDoneCards = async () =>
  await trello.getCardsOnList(process.env.TRELLO_DONE_LIST_ID);

exports.getAllFormattedCards = async () => {
  const todoTasks = await this.getTodoCards();
  const inProgressTasks = await this.getInProgresCards();

  let allTasks = [];
  Array.prototype.push.apply(
    allTasks,
    todoTasks.map(task => createFormattedCards(task, DEFAULT_FORMATS.Todo)),
  );
  Array.prototype.push.apply(
    allTasks,
    inProgressTasks.map(task =>
      createFormattedCards(task, DEFAULT_FORMATS.InProgress),
    ),
  );

  allTasks.sort((a, b) => {
    if (a.priority > b.priority) return -1;
    if (a.priority < b.priority) return 1;
    if (a.remainHours == null) return 1;
    if (b.remainHours == null) return -1;
    if (a.remainHours < b.remainHours) return -1;
    if (a.remainHours > b.remainHours) return 1;
  });

  return allTasks;
};
