// var sentUser = msg.from.id + " (" + msg.from.first_name + " " + msg.from.last_name + "): ";
function getTime() {
  var date = new Date();
  var time = date.getHours() +":"+ ('0' + date.getMinutes()).slice(-2) + " " +
  date.getDate() + "/" +  (date.getMonth() + 1);
  return time;
}


let commandList = "\
- INFO MENU -\n\
/add {listName} - create a new list\n\
/join {listName} - join a existing list\n\
/leave {listName} - exit a list\n\
/lists - view all your lists\n\
/history {listName} - see all changes in list\n\
/users {listName} - see all users in list\n\n\
type the name of a item to add it to the list\n\
type the name of a existing item to remove it\n\
/view {listName} - see all items in list\n\
/done {listName} - see the completed items\n\
/rank {itemName} 0-9 - move item up in list\
  ";

let usedCommands = [
  "start","begin","help","info","commands","command","commando", "commandos", "go", "how",
  "add","make","create","build","addlist",
  "join","connect",
  "delete", "remove", "exit", "quit", "leave","verwijder","verlaat",
  "lists",
  "users", "user", "persons", "person", "personen", "persoon", "people", "mensen", "gebruikers", "gebruiker", 
  "view", "bekijk", "see", "zie", "look", "kijk", "items", 
  "done", "klaar", "checked", 
  "history", "geschiedenis", "his",
  "rank", "level"
];

function createTemplate(sendUser, msg, listName) {
  time = getTime();
  let dbTemplate = {
    "id" : listName,
    "users": [
      {
        "username": sendUser,
        "userID": msg.from.id
      } 
    ], 
    "items": [],
    "done": [],
    "history": [{"text": time + " - " + sendUser.replace("_", " ") + " created this list."}],
    "rank": []
  };
  return dbTemplate;
};

module.exports = {
  commandList,
  usedCommands,
  getTemplate: (sendUser, msg, listName) => dbTemplate = createTemplate(sendUser, msg, listName),
  getTime
};
// module.exports = {listTemplate};