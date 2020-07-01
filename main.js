require("dotenv").config()
const Discord = require("discord.js");
const fs = require('fs');
const { Console } = require("console");
const client = new Discord.Client();


//Insert object to add new VotingSystems. Example: {voting: "725669865561653298", result: "725669928723808267"} remove after json file is created
const newVotingSystems= [];

var VotingSystemarray = [];
//time before pinging in ms || 24h = 86400000‬ms
const pingtime = 10000;

var options = JSON.parse(fs.readFileSync("options.json"));

class VotingSystem{
    /**
    * @param {Discord.TextChannel} VotingChannel - Voting Channel
    * @param {Discord.TextChannel} ResultsChannel - Results Channel
    * @param {Array} VoteArray - a Vote Array (optional)
    */
    constructor(VotingChannel, ResultsChannel, VoteArray = []){
        this.VotingChannel = VotingChannel;
        this.ResultsChannel = ResultsChannel;
        this.VoteArray = VoteArray;
    }

    toJSON(){
        const options = {voting: this.VotingChannel.id, result: this.ResultsChannel.id};
        return JSON.stringify(options);
    }

    /**
     * string should look like:                                   
     * "{"voting":"999999999999999999","result":"999999999999999999"}"
     * @param {String} options - string from JSON file
     */
    static fromJSON(options){
        options = JSON.parse(options);
        return new VotingSystem(searchchannel(options.voting), searchchannel(options.result));
    }

    addVote(message){
        message.react('👍');
        message.react('✋');
        message.react('👎');
        this.VoteArray.push(new Vote(message));
        fs.writeFileSync("voting/" + this.VotingChannel.id + ".json", this.toJSON());
    }
}

class Vote{
    /**
     * @param {Discord.Message} message - message
     * @param {VotingSystem} parrent - Voting System that it is part of
     * @param {object} options - Options for this Vote (optonal)
     */
    constructor(message, parrent, options = {votes: [0, 0, 0], voters: []}){
        this.message = message;
        this.parrent = parrent;
        if(options.votes){
            this.votes = {pisitive: options.votes[0], abstains: options.votes[1], negative: options.votes[2]}
        }else{
            this.votes = {pisitive: 0, abstains: 0, negative: 0}
        }
        if(options.votes){
            this.voters = options.voters;
        }else{
            this.voters = [];
        }

        if(Date.now() - message.createdTimestamp <= pingtime){
            setTimeout(() => {this.ping()}, Date.now() - message.createdTimestamp + pingtime);
        }
    }

    ping(){
        this.message.channel.send("Piiiiiiiinnnngggggg!")
        this.updatevotes()
        this.checkforvoters()
    }

    updatevotes(){
        for(var i = 0; i < this.voters.length; i++){

        }
        this.votes = {pisitive: this.message.reactions.resolve('👍').count, abstains: this.message.reactions.resolve('✋').count, negative: this.message.reactions.resolve('👎').count}
    }
    checkforvoters(){
    }
}

class Voter{
    /**
     * @param {Discord.GuildMember} GuildMember - Voter
     * @param {object} options - Options for this Voter (optonal)
     */
    constructor(GuildMember, options = {votes: []}){

    }
}

function checkchannel(id){
    for(var i = 0; i < VotingSystemarray.length; i++){
        if(VotingSystemarray[i].VotingChannel.id == id){
            return ["voting", i];
        }else if(VotingSystemarray[i].ResultsChannel.id == id){
            return ["result", i];
        }else{
            return ["notingfound"]
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
        options.fileids.push(newVotingSystems[i].voting.id);
        fs.writeFileSync("options.json", JSON.stringify(options));
        fs.writeFileSync("voting/" + newVotingSystems[i].voting.id + ".json", VotingSystemarray[VotingSystemarray.length - 1].toJSON());
        newVotingSystems[i].voting.send("Congratulations! Voting Bot joined the server! \n Please do not resist!");
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

    //fixes problem with people using different emojis
    if(checkchannel(msg.channel.id)[0] == "voting"){
        VotingSystemarray[checkchannel(msg.channel.id)[1]].addVote(msg);
    }
});

client.login(process.env.BOT_TOKEN);