require("dotenv").config()
const Discord = require("discord.js");
const fs = require('fs');
const { Console } = require("console");
const client = new Discord.Client();


//Insert object to add new VotingSystems. Example: {voting: "725669865561653298", result: "725669928723808267", Role: } remove after json file is created
const newVotingSystems= [];

var VotingSystemarray = [];
//time before pinging in ms || 24h = 86400000‬ms
const pingtime = 5000;

var options = JSON.parse(fs.readFileSync("options.json"));

class VotingSystem{
    /**
    * @param {Discord.TextChannel} VotingChannel - Voting Channel
    * @param {Discord.TextChannel} ResultsChannel - Results Channel
    * @param {Discord.Role} Role - Voting Role
    * @param {Array} VoteArray - a Vote Array (optional)
    */
    constructor(VotingChannel, ResultsChannel, Role, VoteArray = []){
        this.VotingChannel = VotingChannel;
        this.ResultsChannel = ResultsChannel;
        this.Role = Role;
        this.VoteArray = VoteArray;
    }

    toJSON(){
        const options = {voting: this.VotingChannel.id, result: this.ResultsChannel.id, role: this.Role.id};
        return JSON.stringify(options);
    }

    /**
     * string should look like:                                   
     * "{"voting":"id","result":"id","role":"id"}"
     * @param {String} options - string from JSON file
     */
    static fromJSON(options){
        options = JSON.parse(options);
        return new VotingSystem(searchchannel(options.voting), searchchannel(options.result), searchrole(options.role));
    }

    addVote(message){
        message.react('👍');
        message.react('✋');
        message.react('👎');
        this.VoteArray.push(new Vote(message, this));
        fs.writeFileSync("VotingSystem/" + this.VotingChannel.id + ".json", this.toJSON());
    }
}

class Vote{
    /**
     * @param {Discord.Message} message - message
     * @param {VotingSystem} VotingSystem - Voting System that it is part of
     * @param {object} options - Options for this Vote (optonal)
     */
    constructor(message, VotingSystem, options = {votes: [0, 0, 0], voters: []}){
        this.message = message;
        this.VotingSystem = VotingSystem;
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
        this.updatevotes()
        var msg = "";
        var rolemembers = this.VotingSystem.Role.members.array();
        for(let i = 0; i < rolemembers.length; i++){
            var skip = false;
            for(var j = 0; j < this.voters.length; j++){
                if(this.voters[j].Member == rolemembers[i]) skip = true;
            }
            if(!skip){
                msg += rolemembers[i].toString() + ",\n";
            }
        }
        this.message.channel.send(msg + "pleace vote!")
    }

    updatevotes(){
        var rolemembers = this.VotingSystem.Role.members.array();
        for(let i = 0; i < rolemembers.length; i++){
            if(this.message.reactions.resolve('👍').users.resolve(rolemembers[i].user.id) || this.message.reactions.resolve('✋').users.resolve(rolemembers[i].user.id) || this.message.reactions.resolve('👎').users.resolve(rolemembers[i].user.id)){
                var skip = false;
                for(var j = 0; j < this.voters.length; j++){
                    if(this.voters[j].Member == rolemembers[i]) skip = true;
                }
                if(!skip){
                    this.voters.push(new Voter(rolemembers[i]))
                    if(this.message.reactions.resolve('👍').users.resolve(rolemembers[i].user.id)){
                        this.voters[this.voters.length - 1].addVote(this, 0)
                    }else if(this.message.reactions.resolve('✋').users.resolve(rolemembers[i].user.id)){
                        this.voters[this.voters.length - 1].addVote(this, 1)
                    }else if(this.message.reactions.resolve('👎').users.resolve(rolemembers[i].user.id)){
                        this.voters[this.voters.length - 1].addVote(this, 2)
                    }
                }
            }
        }
        this.votes = {pisitive: this.message.reactions.resolve('👍').count, abstains: this.message.reactions.resolve('✋').count, negative: this.message.reactions.resolve('👎').count}
    }
}

class Voter{
    /**
     * @param {Discord.GuildMember} GuildMember - Voter
     * @param {object} options - Options for this Voter (optonal)
     */
    constructor(GuildMember, options = {votes: []}){
        this.Member = GuildMember;
        this.votes = options.votes;
    }

    /**
     * @param {Vote} vote 
     * @param {Number} thisvotersvote - 0 for 👍, 1 for ✋ and 2 for 👎
     */
    addvote(vote, thisvotersvote){
        this.votes.push({vote: vote.message.id, thisvotersvote: thisvotersvote});
    }

    toJSON(){
        const options = {GuildMember: this.Member.id, votes: this.votes};
        return JSON.stringify(options);
    }

    /**
     * string should look like:                                   
     * "{"GuildMember": "id", "votes": "votes"}"
     * @param {String} options - string from JSON file
     */
    static fromJSON(options){
        options = JSON.parse(options);
        return new Voter(searcmember(options.GuildMember), {votes: options.votes});
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

function searcmember(id){
    var guilds = client.guilds.cache.array();
    for(var i = 0; i < guilds.length; i++){
        var members = guilds[i].members;
        try{return members.resolve(id)}catch{};
    }
}

function searchrole(id){
    var guilds = client.guilds.cache.array();
    for(var i = 0; i < guilds.length; i++){
        var roles = guilds[i].roles;
        try{return roles.resolve(id)}catch{};
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
        fs.writeFileSync("VotingSystem/" + newVotingSystems[i].voting.id + ".json", VotingSystemarray[VotingSystemarray.length - 1].toJSON());
        newVotingSystems[i].voting.send("Congratulations! Voting Bot joined the server! \n Please do not resist!");
    }
}


client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
    for(var i = 0; i < options.numberofVotingSystems; i++){VotingSystemarray.push(VotingSystem.fromJSON(fs.readFileSync("VotingSystem/" + options.fileids[i] + ".json")))}
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

client.on("messageReactionAdd", (messageReaction, User) => {

})

client.login(process.env.BOT_TOKEN);