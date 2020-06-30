require("dotenv").config()
const Discord = require("discord.js");
const fs = require('fs');
const client = new Discord.Client();


//Insert object to add new VotingSystems. Example: {voting: "725669865561653298", result: "725669928723808267"} remove after json file is created
const newVotingSystems= [];
var VotingSystemarray = [];

var options = JSON.parse(fs.readFileSync("options.json"));

class VotingSystem{
    /**
    * @param {Discord.TextChannel} VotingChannel - Voting Channel
    * @param {Discord.TextChannel} ResultsChannel - Results Channel
    * @param {Array} VoteArray - a Vote Array (optional)
    */
    constructor(VotingChannel, ResultsChannel, VotingArray = []){
        this.VotingChannel = VotingChannel;
        this.ResultsChannel = ResultsChannel;
        this.VotingArray = VotingArray;
    }

    toJSON(){
        const options = {voting: this.VotingChannel.id, result: this.ResultsChannel.id};
        return JSON.stringify(options);
    }

    /**
     * string should look like:                                   
     * "{"voting":"999999999999999999","result":"999999999999999999"}"
     * @param {String} options - string fron JSON file
     */
    static fromJSON(options){
        options = JSON.parse(options);
        return new VotingSystem(searchchannel(options.voting), searchchannel(options.result));
    }
}

class Vote{
    /**
     * @param {Discord.Message} message
     * @param {object} options - Options for this Vote (optonal)
     */
    constructor(message, options = {votes: [0, 0, 0], voters: []}){
        this.message = message;
        if(options.votes){
            this.votes = {pisitive: option.votes[0], abstains: option.votes[1], negative: option.votes[2]}
        }else{
            this.votes = {pisitive: 0, abstains: 0, negative: 0}
        }
        if(options.votes){
            this.voters = options.voters;
        }else{
            this.voters = [];
        }
    }
}

function searchchannel(id){
    var guilds = client.guilds.cache.array();
    for(var i = 0; i < guilds.length; i++){
        var channels = guilds[i].channels;
        try{return channels.resolve(id)}catch{};
    }
}

//adds new VotingSystems
function addVotingSystem(){
    for(var k = 0; k < newVotingSystems.length; k++){
        newVotingSystems[k].voting = searchchannel(newVotingSystems[k].voting);
        newVotingSystems[k].result = searchchannel(newVotingSystems[k].result);
    }

    for(var i = 0; i < newVotingSystems.length; i++){
        VotingSystemarray.push(new VotingSystem(newVotingSystems[i].voting, newVotingSystems[i].result)); 
        options.numberofVotingSystems++;
        // fs.writeFileSync("options.json", JSON.stringify(options));
        // fs.writeFileSync("voting/" + newVotingSystems[i].voting.id + ".json", VotingSystemarray[VotingSystemarray.length - 1].toJSON());
        // newVotingSystems[i].voting.send("Congratulations! Voting Bot joined the server! \n Please do not resist!");
    }
}


client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
    for(var i = 0; i < options.numberofVotingSystems; i++){VotingSystemarray.push(VotingSystem.fromJSON(fs.readFileSync("voting/" + options.fileids[i] + ".json")))}
    if (newVotingSystems.length > 0) addVotingSystem();
})

client.on("message", msg => {
    if(msg.member.user.id == client.user.id) return 0;
    if(msg.content.substring(0, 7) == "NotVote") return 0;
    // console.log(msg.channel);
    msg.channel.send("test");
});

client.login(process.env.BOT_TOKEN);