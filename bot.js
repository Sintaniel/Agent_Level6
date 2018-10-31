const Discord = require('discord.io');
const token = process.env.BOT_TOKEN;

// Initialize Discord Bot
const bot = new Discord.Client({
   token,
   autorun: true
});

bot.on('ready', function (evt) {
    console.log('I am ready!');
});


bot.on('message', function (user, userID, channelID, message, evt) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `/`
    if (message.substring(0, 1) == '/') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];
        var next;
        if(args.length == 2){
            next = args[1];
        }

        
        var diceSplit;
        var diceCount;
        var limitLine;
        var limitSize;
        var trshLine;
        var trshSize;

        if(next != null){
            diceSplit = next.substring(0).split('[');
            if(diceSplit.length == 2){
                diceCount = diceSplit[0];
                limitLine = diceSplit[1].substring(0).split(']');
                limitSize = limitLine[0];
                trshLine = next.substring(0).split('(');
                if(trshLine.length == 2){
                    var trshNum = trshLine[1].substring(0).split(')');
                    trshSize = trshNum[0];
                }   
            }else{
                next = null;
            }
        }
        
        switch(cmd) {
            case 'ar':
                if (next != null){
                    bot.sendMessage({
                        to: channelID,
                        message: createStrings(genDices(diceCount, limitSize), user)
                    });
                }else{
                    bot.sendMessage({
                        to: channelID,
                        message: "wrong number"
                    });
                }
            break;
            case 'are':
                if (trshSize != null){
                    bot.sendMessage({
                        to: channelID,
                        message:createStrings(genExtDice(diceCount, limitSize, trshSize), user)
                    });
                }else{
                    bot.sendMessage({
                        to: channelID,
                        message: "wrong threshold"
                    });
                }
            break;
            case 'ah':
            bot.sendMessage({
                to: channelID,
                message:createStrings("```css\n Little helper for Shadowrun games.\nType x[y] for simple roll, where x is your dicepool, y - your limit;\nType x[y](z) for extended test, where z is number you need.\n```\n", user)
            });
            break;
            // Just add any case commands if you want to..
         }
     }
});

function createStrings(lineArgs, user){
    var line = user + "\n";
    line = line + lineArgs;
    return line;
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
    if(fCount >= threshold){
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

function genDices(dNum, limit){
    var text;
    var sucCount = 0;
    var oneCount = 0;
    var critCount = false;
    for(var i = 1; i<=dNum; i++){
        var num = Math.floor(Math.random()*6)+1;
        if (num < 5){
            if(num == 1){
                oneCount++;
            };
            num = "~~" + num + "~~";
        }else if(sucCount < limit){
            critCount = true;
            sucCount++;
            num = "**" + num + "**";
        };
        if(text == null){
            text = num.toString() + " ";
        }else{
            text =text + num + " ";
        }
    }
    text = text + "\n```css\n";
    text = text + "\nSUCCESSES: " + sucCount;
    if (oneCount*2 >= dNum){
        if(critCount){
            text = text + "\n[GLITCH!]";
        }else{
            text = text + "\n[CRIT GLITCH!]";
        }
    }
    text = text + "\n```\n";
    return text;
};
