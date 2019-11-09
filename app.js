require('dotenv').config();
const request = require('request');
const moment = require('moment');
const Trello = require('./lib/trello');

const DEFAULT_VALUES = {
  Expired: { prefix: '😇', priority: 100 },
  Soon: { prefix: '🤯', priority: 10 },
  InProgress: { prefix: '🤗', priority: 5 },
  Todo: { prefix: '🤫', priority: 2 },
  Pending: { prefix: '🤔', priority: 1 },
  Done: { prefix: '😍', priority: 0 },
};

(async () => {
  const todoTasks = await Trello.getTodoCards();
  const inProgressTasks = await Trello.getInProgresCards();

  allTasks = (() => {
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
        priority
      }
    }
    let allTasks = [];
    Array.prototype.push.apply(allTasks, todoTasks.map(task => buildObj(task, DEFAULT_VALUES.Todo)));
    Array.prototype.push.apply(allTasks, inProgressTasks.map(task => buildObj(task, DEFAULT_VALUES.InProgress)));

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

  output += allTasks.map(task => {
    return task.name + '\n';
  }).join('');

  console.log(output);

  request({
    url: process.env.SLACK_WEBHOOK_URL,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: output
    })
  }, (error, response, body) => {
    if (error) {
      return console.error(error);
    }
  });
})();