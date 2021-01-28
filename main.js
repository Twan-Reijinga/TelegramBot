const TeleBot = require('telebot');
var mongo = require('mongodb').MongoClient;
var url = 'mongodb://localhost';
var _ = require('underscore');

const bot = new TeleBot({
    token: '1421300797:AAEatXCFUKDi_qnjomiUooRu7qnt8MKh5Yw' // Telegram Bot API token.
});

// TODO - "<item> + (:)<hoeveelheid>" //
//./{Item}
bot.on(/^\/?([a-z0-9!@#$%^&*().,<>{}[\]<>?_=+\-|;:\'\"\/]+) ?([a-z0-9_\-|.]+)?/i, async function (msg, props){
  var usedCommands = require('./variables.js').usedCommands;
  if (!usedCommands.includes(props.match[1].toLowerCase())) {

    let sendUser = msg.from.first_name + "_" + msg.from.last_name;
    let itemName = props.match[1].toLowerCase();
    const listName = await selectList(props.match[2], sendUser);
    lists = await findLists();
    if (!lists.includes(listName)) {
      var message = "The list you are looking for does not exist.\n/add {listName} - create a new list\n/join {listName} - join a existing list\n/lists - view all your lists";
    } else {
      splitItem = itemName.split(":")
      itemName = splitItem[0];
      amount = splitItem[1];

      if (!await findItem(itemName, listName)){ // als item nog niet in de lijst zit
        console.log(itemName + " - " + amount);
        addItem(itemName, listName, "items", sendUser, amount);
        console.log(msg.from.id + " (" + sendUser + "): /addItem " + itemName + " - " + amount + " to " + listName);
        message = itemName + ' successfully added to ' + listName;

      } else { // als item wel in de lijst zit
        itemAndAmount = await findAmount(itemName, listName);
        console.log("f");
        addItem(itemAndAmount, listName, "done");
        removeItem(itemName, listName, sendUser);

        console.log(msg.from.id + " (" + sendUser + "): /removeItem " + itemName + " from " + listName);
        message = itemName.charAt(0).toUpperCase() + itemName.slice(1) + ' successfully removed from ' + listName +
        "\nType /" + itemName + " to add the item back to the list.";
        var ViewList = true;
      }
    };
    bot.sendMessage(msg.from.id, message);
    if (ViewList){
      bot.sendMessage(msg.from.id, await viewList(listName));
    }
  };
});

//./start
bot.on(/^\/?(start|begin|help|info|commands|command|commando|commandos|go|how)/i, function (msg) {
  let sendUser = msg.from.first_name + "_" + msg.from.last_name;
  console.log(msg.from.id + " (" + sendUser + "): " + "/start");
  const commandList = require('./variables.js').commandList;
  return bot.sendMessage(msg.from.id, commandList);
});

//./add
bot.on(/^\/?(add|make|create|build|addList) ?([a-z0-9_\-|.]+)?/i, async function (msg, props) {
  let sendUser = msg.from.first_name + "_" + msg.from.last_name;
  const ListName = props.match[2];
  console.log(msg.from.id + " (" + sendUser + "): " + "/add " + ListName);
  if (!ListName) {
    message = "type /add + the name of the list.";
  } else {
    listName = ListName.toLowerCase();
    lists = await findLists();
    if (lists.includes(listName)) { //! if list is found
      message = "the list named '" + listName + "' already exists. \n\
type /join" + listName.charAt(0).toUpperCase() + listName.slice(1) + " - join this list. \n\
type /add {otherListName} - make a new list.";
    } else { //! if list is not found
      message = makeList(listName, sendUser, msg);
    };
  };
  return bot.sendMessage(msg.from.id, message);
});

//. /join
bot.on(/^\/?(join|connect) ?([a-z0-9_\-|.]+)?/i, async function (msg, props) {
  let sendUser = msg.from.first_name + "_" + msg.from.last_name;
  const ListName = props.match[2];
  console.log(msg.from.id + " (" + sendUser + "): " + "/join " + ListName);
  if (!ListName) {
    message = "type /join + the name of a existing list.";
  } else {
    listName = ListName.toLowerCase();
    lists = await findLists();
    if (lists.includes(listName)) {//! if list is found
      inList = await checkUserInList(sendUser, listName);
      if(!inList) {
        message = addUserToList(sendUser, msg, listName);
      } else {
        message = "Your already in the list named: " + listName
      };
    } else { //! if list not found
      message = "the list '" + listName + "' does not exist.\n\
type /add" + listName.charAt(0).toUpperCase() + listName.slice(1) + " - create this new list. \n\
type /join {existingList} - join other list.";
    };
  };
  return bot.sendMessage(msg.from.id, message);
});

//./leave
bot.on(/^\/?(delete|remove|exit|quit|leave|verwijder|verlaat) ?([a-z0-9_\-|.]+)?/i, async function (msg, props) {
  let sendUser = msg.from.first_name + "_" + msg.from.last_name;
  const ListName = props.match[2];
  console.log(msg.from.id + " (" + sendUser + "): " + "/leave " + ListName);
  if (ListName == null) {
    message = "type /leave + the name of a existing list.";
  } else {
    listName = ListName.toLowerCase();
    lists = await findLists();
    if (lists.includes(listName)) {//! if list is found
      inList = await checkUserInList(sendUser, listName);
      if(!inList) {
        message = "You are not in this list.\n/lists - view all your lists"
      } else {
        removeUserFromList(sendUser, msg, listName);
        message = "you have successfully exited the list called " + listName;
      }
      
    } else {//! if list is not found
      message = "the list '" + listName + "' does not exist.";
    }
  };
  return bot.sendMessage(msg.from.id, message);
});

//./lists
bot.on(/^\/?(lists)/i, async function (msg, props) {
  let sendUser = msg.from.first_name + "_" + msg.from.last_name;
  console.log(msg.from.id + " (" + sendUser + "): " + "/lists");
  lists = await findLists();
  var message = "- ALL YOUR LISTS -\n";
  var i = 0;
  while(i < lists.length){
    inList = await checkUserInList(sendUser, lists[i]);
    if (inList) {
      message += lists[i] + "\n";
    };
    i ++;
  };
  if (message.length == 19) {
    message = "You don't have a list.\n/add {listName} - create a new list\n/join {listName} - join a existing list" 
  }
  return bot.sendMessage(msg.from.id, message);
})


//.users
bot.on(/^\/?(users|user|persons|person|personen|persoon|people|mensen|gebruikers|gebruiker) ?([a-z0-9_\-|.]+)?/i, async function (msg, props){
  let sendUser = msg.from.first_name + "_" + msg.from.last_name;
  console.log(msg.from.id + " (" + sendUser + "): /view");
  const listName = await selectList(props.match[2], sendUser);
  lists = await findLists();
  if (!lists.includes(listName)) {
    var message = "The list you are looking for does not exist.\n/add {listName} - create a new list\n/join {listName} - join a existing list\n/lists - view all your lists";
  } else {
    users = await findItems(listName, "users");
    if (users.length == 0) {
      var message = "There are no users in this list.";
    } else {
      var message = "- ALL USERS IN " + listName.toUpperCase() + " -\n\n";
      for (i = 0; i < users.length; i++) {
        message += users[i].username.replace("_", " ") + "\n";
      };
    };
  }
  return bot.sendMessage(msg.from.id, message);
});

//.history
bot.on(/^\/?(history|geschiedenis) ?(page)? ?([0-9]+)? ?([a-z0-9_\-|.]+)?/i, async function (msg, props){
  let sendUser = msg.from.first_name + "_" + msg.from.last_name;
  console.log(msg.from.id + " (" + sendUser + "): /history");
  var listName = await selectList(props.match[4], sendUser);
  lists = await findLists();
  if (!lists.includes(listName)) {
    var message = "The list you are looking for does not exist.\n/add {listName} - create a new list\n/join {listName} - join a existing list\n/lists - view all your lists";
  } else {
    history = await findItems(listName, "history");
    var pagina = props.match[3];
    if (props.match[2] && props.match[2].toLowerCase() == "page") {
      if(history.length > 18 * pagina) { // not last page
        var message = "- HISTORY OF " + listName.toUpperCase() + " PAGE " + pagina + " -\n\n";
        for (i = 0; i < 18; i++) {
          message += history[(history.length - 18*(pagina-1)-i-1)].text + "\n";
        }
        message += ("-").repeat(50) + "\n/historyPage" + (Number(pagina)+1) + " - view next page."
      } else if(history.length - 18*(pagina-1) > 0) { // last page
        var message = "- HISTORY OF " + listName.toUpperCase() + " LAST PAGE -\n\n";
        for (i = 0; i < history.length - 18*(pagina-1); i++) {
          message += history[(history.length - 18*(pagina-1)-i-1)].text + "\n";
        }
      } else {
        message = "The page you are looking for does not exist."
      }
    } else {
      var message = "- HISTORY OF " + listName.toUpperCase() + " -\n\n";
      if (history.length <= 18) {
        for (i = 0; i < history.length; i++) {
          message += history[(history.length-i-1)].text + "\n";
        };
      } else {
        for (i = 0; i < 18; i++) {
        message += history[(history.length-i-1)].text + "\n";
        };
        message += ("-").repeat(50) + "\n/historyPage2 - view next page."
      }
    }
  };
  return bot.sendMessage(msg.from.id, message);
});

// TODO - "<item> - (:)<hoeveelheid>" //
//.view
bot.on(/^\/?(view|bekijk|zie|see|look|kijk|items) ?([a-z0-9_\-|.]+)?/i, async function (msg, props){
  let sendUser = msg.from.first_name + "_" + msg.from.last_name;
  console.log(msg.from.id + " (" + sendUser + "): /view");
  const listName = await selectList(props.match[2], sendUser);
  lists = await findLists();
  if (!lists.includes(listName)) {
    var message = "The list you are looking for does not exist.\n/add {listName} - create a new list\n/join {listName} - join a existing list\n/lists - view all your lists";
  } else {
    var message = await viewList(listName);
    message += ("-").repeat(50) + "\n/done" + listName.charAt(0).toUpperCase() + listName.slice(1) + " - view the completed items."
  }
  return bot.sendMessage(msg.from.id, message)
});

async function viewList(listName) {
  var items = await sortItems(listName);
  if (items.length == 0) {
    var message = "This list is empty.\n";
  } else {
    var message = "- ALL ITEMS IN " + listName.toUpperCase() + " -\n\n";
    for (i = 0; i < items.length; i++) {
      message += "/" + items[i] + "\n\n";
    };
  };
  return message;
};

//.done
bot.on(/^\/?(done|klaar|checked) ?(page)? ?([0-9]+)? ?([a-z0-9_\-|.]+)?/i, async function (msg, props){
  let sendUser = msg.from.first_name + "_" + msg.from.last_name;
  console.log(msg.from.id + " (" + sendUser + "): /done");
  var listName = await selectList(props.match[4], sendUser);
  lists = await findLists();
  if (!lists.includes(listName)) {
    var message = "The list you are looking for does not exist.\n/add {listName} - create a new list\n/join {listName} - join a existing list\n/lists - view all your lists";
  } else {
    doneItems = await findItems(listName, "done");
    var pagina = props.match[3];
    if (props.match[2] && props.match[2].toLowerCase() == "page") {
      if(doneItems.length > 18 * pagina) { // not last page
        var message = "- DONE ITEMS IN " + listName.toUpperCase() + " PAGE " + pagina + " -\n\n";
        for (i = 0; i < 18; i++) {
          message += "/" + doneItems[(doneItems.length - 18*(pagina-1)-i-1)].item + "\n";
        }
        message += ("-").repeat(50) + "\n/donePage" + (Number(pagina)+1) + " - view next page."
      } else if(doneItems.length - 18*(pagina-1) > 0) { // last page
        var message = "- DONE ITEMS IN " + listName.toUpperCase() + " LAST PAGE -\n\n";
        for (i = 0; i < doneItems.length - 18*(pagina-1); i++) {
          message += "/" + doneItems[(doneItems.length - 18*(pagina-1)-i-1)].item + "\n";
        }
      } else {
        message = "The page you are looking for does not exist."
      }
    } else {
      var message = "- DONE ITEMS IN " + listName.toUpperCase() + " -\n\n";
      if (doneItems.length == 0) {
        message = "no done items were found in this list."
      } else if (doneItems.length <= 18) {
        for (i = 0; i < doneItems.length; i++) {
          message += "/" + doneItems[(doneItems.length-i-1)].item + "\n";
        };
      } else {
        for (i = 0; i < 18; i++) {
        message += "/" + doneItems[(doneItems.length-i-1)].item + "\n";
        };
        message += ("-").repeat(50) + "\n/donePage2 - view next page."
      }
      
    }
  };
  return bot.sendMessage(msg.from.id, message);
});

//.rank
bot.on(/^\/?(rank|level)$/i, async function (msg, props){
  let sendUser = msg.from.first_name + "_" + msg.from.last_name;
  console.log(msg.from.id + " (" + sendUser + "): /rank ");
  var listName = await selectList(null, sendUser);
  rankedItems = await findItems(listName, "rank");
  if (rankedItems.length > 0) {
    var message = "- RANKED ITEMS -\n\n"
    for (i=0; i < rankedItems.length; i++) {
      message += rankedItems[i].item + " in rank " + rankedItems[i].rank + "\n";
    };
  } else {
    var message = "This list has no ranked items.\n/rank {itemName} 0-9 - add a rank to a item."
  };
  return bot.sendMessage(msg.from.id, message);
});

bot.on(/^\/?(rank|level) ?([a-z0-9!@#$%^&*().,<>{}[\]<>?_=+\-|;:\'\"\/]+) ?([0-9]+)? ?([a-z0-9_\-|.]+)?/i, async function (msg, props){
  let sendUser = msg.from.first_name + "_" + msg.from.last_name;
  var item = props.match[2].toLowerCase();
  if (props.match[3]) {
    var rank = props.match[3];
  } else {
    var rank = 1;
  }
  console.log(msg.from.id + " (" + sendUser + "): /rank " + item + " " + rank);

  var listName = await selectList(props.match[4], sendUser); 
  rankedItems = await findItems(listName, "rank");
  // console.log("haan");
  if (rankedItems.length > 0) {
    // console.log("kip");
    var num = 0;
    for(i = 0; i < rankedItems.length; i++) {
      if (rankedItems[i].item == item && rankedItems[i].rank != rank) {
        oldRank = rankedItems[i].rank
        updateRank(item, oldRank, rank, listName);
        // console.log("< 312 " + length)
        i = rankedItems.length;
      } else {
        num ++
      }
    }
    if (num = rankedItems.length) {
      addToRanklist(item, rank, listName);
    }
  } else {
    // console.log("kuiken")
    addToRanklist(item, rank, listName);
  };
  
  return bot.sendMessage(msg.from.id, "you have successfully added " + item + " to rank " + rank + 
  " for the list named '" + listName + "'");
  
});

// ---------- Functions ---------- //
function findLists() {
  let listNames = [];
  return new Promise(resolve => {
    mongo.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, (err, db) => {
      db.db('lists').listCollections().toArray((err, collections) => {
        db.close();
        
        for (i = 0; i < collections.length; i++) {
          listNames.push(collections[i].name);
        };
        resolve(listNames);
      });
    });
  });
}

function findItems(listName, subList) {
  return new Promise(resolve => {
    mongo.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, (err, db) => {
      db.db('lists').collection(listName).findOne({}, function (err, result) {
        db.close();
        resolve(result[subList]);
      });
    });
  });
};

function findItem (itemName, listName) {
  return new Promise(resolve => {
    mongo.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, db) {
      db.db('lists').collection(listName).findOne({}, function (err, result) {
        db.close();
        var items = result.items;
        var inList = false
        for(i = 0; i < items.length; i++) {
          if (items[i].item == itemName) {
            inList = true;
          }
        }
        resolve(inList);
      });
    });
  });
};

async function findAmount (itemName, listName) {
  return new Promise(resolve => {
    mongo.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, db) {
      db.db('lists').collection(listName).findOne({}, function (err, result) {
        db.close();
        var items = result.items;
        for(i = 0; i < items.length; i++) {
          console.log(items[i].item + " = " + itemName);
          if (items[i].item == itemName) {
            if(items[i].amount){
              resolve(itemName + " - " + items[i].amount);
            } else {
              resolve(itemName);
            };
          };
        };
        // resolve(itemName);
      });
    });
  });
};

async function sortItems(listName) {
  items = await findItems(listName, "items");
  rank = await findItems(listName, "rank");

  var Items = [];
  var specialItems = {};
  for(i=0; i < items.length; i++) {
    if (items[i].amount) {
      specialItems[items[i].item] = items[i].amount;
    } else {
      Items.push(items[i].item);
    }   
  };
  var rankedItems = [];
  for(i=0; i < rank.length; i++) {
    if (Items.includes(rank[i].item)) {
      rankedItems.push([rank[i].item, rank[i].rank]);
    }
  };

  for (const [key, value] of Object.entries(specialItems)) {
    var working = false;
    for (i=0; i < rank.length; i++) { 
      if (key.includes(rank[i].item)) {
        rankedItems.push([key + " - " + value, rank[i].rank]);
        working = true;
      } else {
        Items.push(key + " - " + value);
        working = true;
      }
    } 
    if(!working) {
        Items.push(key + " - " + value);
    }
  }

  if (rankedItems.length > 0) {
    rankedItems.sort(function(first, second) {
      return second[1] - first[1];
    }); 
    for (i = rankedItems.length - 1; i >= 0; i --) {
      Items.splice(0, 0, rankedItems[i][0]);
    };
  };
  
  // console.log(Array.from(new Set(Items)))
  return Array.from(new Set(Items));
}

function makeList(listName, sendUser, msg) {
  const dbTemplate = require('./variables.js').getTemplate(sendUser, msg, listName);
  mongo.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, db) {
    db.db('lists').createCollection(listName, function(err, res) {db.close();}); // make list
  });

  mongo.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, db) {
    db.db('lists').collection(listName).insertOne(dbTemplate, function(err, res) {db.close();}); // add template
  });

  return "the list named '"+ listName +"' has been successfully created.\ntype /remove"+ 
  listName.charAt(0).toUpperCase() + listName.slice(1) +" if this is incorrect."; // return message
};

async function selectList(listName, userName) {
  return new Promise(async resolve => {
    if (!listName || listName.toLowerCase() == "all") {
      var lists = await findLists();
      var i = 0;
      while(i < lists.length){
        inList = await checkUserInList(userName, lists[i]);
        if (inList) {
          resolve(lists[i]);
          break;
        };
        i ++;
      };
      resolve("false");
    } else {
      resolve(listName.toLowerCase());
    };
  });
};

function checkUserInList(userName, listName) {
  return new Promise(resolve => {
    mongo.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, db) {
      db.db('lists').collection(listName).findOne({}, function (err, result) {
        db.close();
        var users = result.users;
        var inList = false
        for(i = 0; i < users.length; i++) {
          if (users[i].username == userName) {
            inList = true;
          }
        }
        resolve(inList);
      });
    });
  });
};

function addUserToList(sendUser, msg, listName) {
  mongo.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, db) {
    db.db('lists').collection(listName).updateOne(
      { "id": listName },
      { $push:
        {"users":
          {
          "username": sendUser,
          "userID": msg.from.id
          }
        }
      }, (err, res) => { db.close(); });
  });
  addHistory(listName, " - " + sendUser.replace("_", " ") + " joined.");
  return "you have been successfully added to the list named '"+ listName +
  "'.\ntype /leave"+ listName.charAt(0).toUpperCase() + listName.slice(1) +" if this is incorrect.";
}; 

function removeUserFromList(sendUser, msg, listName) {
  mongo.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, db) {
    db.db('lists').collection(listName).updateOne(
      { "id": listName },
      { $pull:
        {"users":
          {
          "username": sendUser,
          "userID": msg.from.id
          }
        }
      }, (err, res) => { db.close(); 
    });
  });  
  addHistory(listName, " - " + sendUser.replace("_", " ") + " leaves.");
}

function addToRanklist(itemName, rank, listName) {
  mongo.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, db) {
    db.db('lists').collection(listName).updateOne(
      { "id": listName },
      { $push:
        {"rank":
          {
          "item": itemName,
          "rank": rank
          }
        }
      }, (err, res) => { db.close(); });
  });
}; 

function updateRank(itemName, oldRank, newRank, listName) {
  mongo.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, db) {
    db.db('lists').collection(listName).updateOne(
      { "id": listName },
      { $pull:
        {"rank":
          {
          "item": itemName,
          "rank": oldRank
          }
        }
      }, (err, res) => { db.close(); });
  });
  addToRanklist(itemName, newRank, listName);
}; 

function addItem(itemName, listName, subList, sendUser, amount) {
  mongo.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, db) {
    if (amount) {
      db.db('lists').collection(listName).updateOne(
        { "id": listName },
        { $push:
          {[subList]: {
            "item": itemName,
            "amount": amount
          }
        }
      }, (err, res) => { db.close(); });
    } else {
      db.db('lists').collection(listName).updateOne(
        { "id": listName },
        { $push:
          {[subList]: {
            "item": itemName
          }
        }
      }, (err, res) => { db.close(); });
    }
    if (subList == "items") {
      addHistory(listName, " - " + sendUser.replace("_", " ") + " added " + itemName);
    }
  });
};

function removeItem(itemName, listName, sendUser) {
  mongo.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, db) {
    db.db('lists').collection(listName).updateOne(
      { "id": listName },
      { $pull:
        {"items": 
          {
          "item": itemName
          }
        }
      }, (err, res) => { db.close(); 
    });
  });
  addHistory(listName, " - " + sendUser.replace("_", " ") + " removes  " + itemName);
}

function addHistory(listName, message) {
  var time = require('./variables.js').getTime();
  mongo.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, db) {
    db.db('lists').collection(listName).updateOne(
      { "id": listName },
      { $push:
        {"history":
          {
          "text": time + message
          }
        }
      }, (err, res) => { db.close(); 
    });
  });
};

bot.start();

//. TODO
//. rankList


//! <LN> = ListName * <NLN> = NewListName * <UN> = UserName
/*  *if LN empty: use last list 
/add list <LN> +(/undo)           @make @create @build
/join (list) <LN>                 @connect
/delete list <LN>* (/undo)        @remove @exit @quit @exit @leave
/edit list <LN>* <NLN> +(/undo)   @rename
/lists                            @view list @viewList @view all 
/alert (list) <LN>*               @ping @notify
/hirtory (Done) (from) <LN>*
/users (in) <LN>* 
/invite <UN>
*/

//! <IN> = ItemName ([to, in, from] LN) * <NIN> = NewItemName
/*
/<IN>         #/add if not existed; #/delete if existed;
/add <IN>     #move to TODO                             @make @set
/delete <IN>      +(/undo)  #move to DONE               @remove
/edit <IN> <NIN>  +(/undo)  #/delete <oldName> && /add  @rename
*/

