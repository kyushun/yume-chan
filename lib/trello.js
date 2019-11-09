const Trello = require('trello');
const trello = new Trello(process.env.TRELLO_API_KEY, process.env.TRELLO_API_TOKEN);

exports.getTodoCards = async () => await trello.getCardsOnList(process.env.TRELLO_TODO_LIST_ID);
exports.getInProgresCards = async () => await trello.getCardsOnList(process.env.TRELLO_INPROGRESS_LIST_ID);
exports.getPendingCards = async () => await trello.getCardsOnList(process.env.TRELLO_PENDING_LIST_ID);
exports.getDoneCards = async () => await trello.getCardsOnList(process.env.TRELLO_DONE_LIST_ID);
