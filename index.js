require('dotenv').config();
const moment = require('moment');
const Trello = require('./lib/trello');
const Slack = require('./lib/slack');

const DEFAULT_VALUES = {
  Expired: { prefix: '😇', priority: 100 },
  Soon: { prefix: '🤯', priority: 10 },
  InProgress: { prefix: '🤗', priority: 5 },
  Todo: { prefix: '🤫', priority: 2 },
  Pending: { prefix: '🤔', priority: 1 },
  Done: { prefix: '😍', priority: 0 },
};

const isProduction = process.env.NODE_ENV == 'production';

if (
  !process.env.TRELLO_TODO_LIST_ID ||
  !process.env.TRELLO_INPROGRESS_LIST_ID ||
  !process.env.TRELLO_PENDING_LIST_ID ||
  !process.env.TRELLO_DONE_LIST_ID ||
  !process.env.TRELLO_API_KEY ||
  !process.env.TRELLO_API_TOKEN
) {
  return console.error(new Error('環境変数設定が不十分です'));
}

exports.postTasksToSlack = async (req, res) => {
  const todoTasks = await Trello.getTodoCards();
  const inProgressTasks = await Trello.getInProgresCards();

  const allTasks = (() => {
    const buildObj = (task, defaultValues) => {
      const remainHours = moment(task.due).diff(moment(), 'hours');

      let params;
      if (!task.due || remainHours > 48) {
        params = defaultValues;
      } else if (remainHours >= 0) {
        params = DEFAULT_VALUES.Soon;
      } else {
        params = DEFAULT_VALUES.Expired;
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

    let allTasks = [];
    Array.prototype.push.apply(
      allTasks,
      todoTasks.map(task => buildObj(task, DEFAULT_VALUES.Todo)),
    );
    Array.prototype.push.apply(
      allTasks,
      inProgressTasks.map(task => buildObj(task, DEFAULT_VALUES.InProgress)),
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
  })();

  let output = 'タスクを報告するよ〜\n';

  output += allTasks
    .map(task => {
      return task.name + '\n';
    })
    .join('');

  let statusCode;
  Slack.postMessage(output)
    .then(response => {
      statusCode = response.statusCode;
    })
    .catch(error => {
      statusCode = 500;
      console.error(error);
    });
  if (isProduction) res.status(statusCode).end();
};

if (!isProduction) {
  this.postTasksToSlack();
}
