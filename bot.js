var Discord = require('discord.io');
//var auth = require('./auth.json');

var {MongoClient} = require('mongodb');
var uri = process.env.URI;
var token = process.env.BOT_TOKEN;


// Initialize Discord Bot
var bot = new Discord.Client({
   token: token,
   autorun: true
});
bot.on('ready', function (evt) {
    console.log('launching bot...');
    conCheck();
});

// check connection to db
async function conCheck(){
    try{
        const client = await MongoClient.connect(uri, {useNewUrlParser: true});
        console.log("connection to db ");              
        client.close();
    }catch(e){console.error(e)}
}

//check message is not null
function checkNextMsg(inpMessage, fnc, channelID){
    if (inpMessage != null){
        bot.sendMessage({
            to: channelID,
            message: fnc
        });
        console.log("massage sended");
    } else{
        bot.sendMessage({
            to: channelID,
            message: "something wrong"
        });
    }
};


// matrix actions
async function fOperation(actionName, fColl){
    try{
        const client = await MongoClient.connect(uri, {useNewUrlParser: true})
        .then(console.log("async connected")).then(console.log(actionName));
        
        return new Promise(resolve =>{
            const collection = client.db("SRDB").collection(fColl);   
            collection.find({"Name": actionName}).next(function(err, result){
                if(err) throw err;
                var res = result;
                console.log("close client");
                client.close();
                resolve(res);
            });    
        });

    }catch(e){console.error(e)}
}

async function listOfOperations(fColl){
    try{
        const client = await MongoClient.connect(uri, {useNewUrlParser: true})
        .then(console.log("async connected"));

        return new Promise(resolve =>{
            const collection = client.db("SRDB").collection(fColl);
            collection.find({}).toArray(function(err, result){
                if(err)throw err;
                var res = result;
                console.log("find results and close client");
                client.close();
                resolve(res);
            });
        });
    }catch(e){console.error(e)}
}


bot.on('message', async function (user, userID, channelID, message, evt) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `/`
    if (message.substring(0, 1) == '/') {
        console.log("creating message");
        var args = message.substring(1).split(' ');
        var cmd = args[0];
        var next;

        switch(cmd) {
            //help
            case 'ah':
            bot.sendMessage({
                to: channelID,
                message:createStrings("```css\n Little helper for Shadowrun games.\nType /ar x[y] for simple roll, where x is your dicepool, y - your limit;\nType /ar x for roll without limit, /ar x! for push the limit;\nType /are x[y](z) for extended test, where z is number you need;\nType /ama l for list of matrix actions and /ama x, where x is name of matrix action.```\n", user)
            });
            break;
            //matrix actions
            case 'ama':
                if(args.length >= 2){
                    next = "";
                    for(i=1; i<args.length; i++){
                        if(i != args.length-1){
                            next = next + args[i] + " ";
                        }else{
                            next = next + args[i];
                        }
                    }
                }

                if (next.match(/[l]/)){
                    let msg = await listOfOperations("MatrixActions").then(console.log("msg"));
                    checkNextMsg(msg, createLOfOperations(msg), channelID);
                }else{
                    let msg = await fOperation(next, "MatrixActions").then(console.log("msg"));
                    checkNextMsg(msg, createMatrixActionText(msg), channelID);
                }
            break;
            
           //simple roll
            case 'ar':
                var diceCount;
                var limit;
                var push = false;
                if(args.length == 2){
                    next = args[1];
                    var formDices = next.substring(0).split(/[\[\]]/);
                    if (formDices.length == 1 && Number.isInteger(parseInt(formDices[0]))){
                        if(formDices[0].match(/\!$/)){
                            console.log("explosion time!");
                            push = true;
                        };
                        diceCount = parseInt(formDices[0]);
                        limit = diceCount;
                    }else{
                        if(Number.isInteger(parseInt(formDices[0]))){
                            diceCount = parseInt(formDices[0]);
                        }else{
                            next = null;
                        }
                        if(Number.isInteger(parseInt(formDices[1]))){
                            limit = parseInt(formDices[1]);
                            console.log("limin in: " + limit);
                        }else{
                            next = null;
                        }
                    }
                }
                checkNextMsg(next,createStrings(genDices(diceCount, limit, push), user), channelID);
                               
            break;
              
            //extended roll
            case 'are':
                var diceCount;
                var limit;
                var threshold;
                if(args.length == 2){
                    next = args[1];
                    var formDices = next.substring(0).split(/[\[\]\(\)]/);
                    for(i=0;i<formDices.length;i++){
                        if (formDices[i].length<1){
                            formDices.splice(i,1);
                        }
                    }
                    if(Number.isInteger(parseInt(formDices[0]))){
                        diceCount = parseInt(formDices[0]);
                    }else{
                        next = null;
                    };
                    if(Number.isInteger(parseInt(formDices[1]))){
                        limit = parseInt(formDices[1]);
                    }else{
                        next = null;
                    };
                    if(Number.isInteger(parseInt(formDices[2]))){
                        threshold = parseInt(formDices[2]);
                    }else{
                        next = null;
                    };

                    checkNextMsg(next,genExtDice(diceCount, limit,threshold), channelID);
                }

            break;
            
            // Just add any case commands if you want to..
         }
     }
});

function createStrings(lineArgs, user){
    console.log("waited for ask");
    line = user + "\n";
    line = line + lineArgs;
    return line;
};

function createMatrixActionText(obj){
    var line = "```css\n";
    if(obj != null){
        var kLength = Object.keys(obj).length;
        for(i=1;i<kLength;i++){
            line = line + "#" + Object.keys(obj)[i] + " : " + Object.values(obj)[i] + "\n";
        };
        line = line + "\n```\n";
    }else{
        line = "wrong name!";
    }
    return line;
};

function createLOfOperations(arr){
    var line = "```css\n";
    for(i=0; i<arr.length; i++){
        line = line + "\n" + arr[i].Name;
    }
    line = line + "\n```\n";
    return line;
};

function genDices(dNum, limit, push){
    var text;
    var sucCount = 0;
    var oneCount = 0;
    var pCount = 0;
    var critCount = false;
    var pushCh = push;
    for(var i = 1; i<=dNum+pCount; i++){
        var num = Math.floor(Math.random()*6)+1;
        if (num < 5){
            if(num == 1){
                oneCount++;
            };
            num = "~~" + num + "~~";
        }else if(!push && sucCount <= limit){
            critCount = true;
            sucCount++;
            num = "**" + num + "**";
        }else if(num >= 5){
            if (pushCh && num == 6){
                pCount++;
            }
            critCount = true;
            sucCount++;
            num = "**" + num + "**";
        }
        
        if(text == null){
            text = num.toString() + " ";
        }else{
            text =text + num + " ";
        }
    }
    text = text + "\n```css\n";
    text = text + "\nSUCCESSES: " + sucCount;
    if (oneCount*2 >= dNum+pCount){
        if(critCount){
            text = text + "\n[GLITCH!]";
        }else{
            text = text + "\n[CRIT GLITCH!]";
        }
    }
    text = text + "\n```\n";
    return text;
};

function genExtDice(dNum, limit, threshold){
    var tCount = dNum;
    var glCount = 0;
    var hCount = 0;
    crGlitch = false;

    var fCount = 0;
    var text = "";
    for(var i = 1; i<= dNum; i++){
        var fLine = genDices(tCount, limit);
        var tLine = fLine.substring(0).split('`');
        var sNumString = fLine.substring(fLine.indexOf("SUCCESSES:")+11, fLine.indexOf("SUCCESSES:")+12); 
        fCount = fCount + parseInt(sNumString);
        text = text + tLine[0] + "\n";
        if(fLine.indexOf("CRIT") > -1){
            crGlitch = true;
        }else if (fLine.indexOf("[") > -1){
            glCount++;
        }
        tCount--;
        hCount++;
        if (fCount >= threshold){
            break;
        }
    }

    text = text + "```css\n";
    if(fCount >= threshold && !crGlitch){
        text = text + "\nYOU WIN!";
        text = text + "\nINTERVALS SPEND: " + hCount;
    }else{
        text = text + "\nYOU LOSE!";
        text = text + "\nINTERVALS SPEND: " + hCount;
    }
    if (crGlitch){
        text = text + "\nCRIT GLITCH!";
    }else if (glCount > 0){
        text = text + "\nGLITHES: " + glCount;
    }
    text = text + "\nSUCCESSES: " + fCount;
    text = text + "\n```\n";
    return text;
}
