require('dotenv').config();
const Trello = require('./lib/trello');
const Slack = require('./lib/slack');

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
  const allTasks = await Trello.getAllFormattedCards();

  let output = 'タスクを報告するよ〜\n';
  output += allTasks.map(task => task.name + '\n').join('');

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
