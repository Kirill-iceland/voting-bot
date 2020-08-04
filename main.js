require("dotenv").config()
const Discord = require("discord.js");
const fs = require('fs');
const { Console, log } = require("console");
const client = new Discord.Client();


//Insert object to add new VotingSystems. Example: {voting: "725669865561653298", result: "725669928723808267", Role: ""} remove after json file is created
const newVotingSystems= [];

var VotingSystemarray = [];
//time before pinging in ms || 24h = 86400000‬ms
const pingtime = 10000;

var options = JSON.parse(fs.readFileSync("options.json"));

class VotingSystem{
    /**
    * @param {Discord.TextChannel} VotingChannel - Voting Channel
    * @param {Discord.TextChannel} ResultsChannel - Results Channel
    * @param {Discord.Role} Role - Voting Role
    * @param {Number} nuberoftheVotingSystem - what is the number in the opton.json
    * @param {Number} UpdateTimestap - time sinse votes were updated
    * @param {Array<Vote>} VoteArray - a Vote Array (optional)
    */
    constructor(VotingChannel, ResultsChannel, Role, nuberoftheVotingSystem, UpdateTimestap = Date.now(), VoteArray = []){
        this.VotingChannel = VotingChannel;
        this.ResultsChannel = ResultsChannel;
        this.Role = Role;
        this.nuberoftheVotingSystem = nuberoftheVotingSystem;
        this.VoteArray = VoteArray;
        this.UpdateTimestap = UpdateTimestap;
    }

    async getVotesfromJSON(){
        for(var i = 0; i < options.Systems.Votes[this.nuberoftheVotingSystem].numberofVotes; i++){this.VoteArray.push(await Vote.fromJSON(fs.readFileSync("Votes/" + options.Systems.Votes[this.nuberoftheVotingSystem].fileids[i] + ".json"), this))}
    }

    /**
     * @param {Discord.Message} message - message with the vote
     */
    getVote(message){
        for(var i = 0; i < this.VoteArray.length; i++){
            if(message == this.VoteArray[i].message){
                return this.VoteArray[i];
            }
        }
        return null;
    }

    async checkforofflinevotes(){
        var messages;
        await this.VotingChannel.messages.fetch({ limit: 10 }).then(cache => {messages = cache.array()}).catch(e => console.error(e))
        for(var i = messages.length - 1; i >= 0; i--){
            if(!messages[i].deleted && messages[i].createdTimestamp > this.UpdateTimestap && messages[i].content.substring(0, 5).toLowerCase() == "!vote"){
                await this.addVote(messages[i])
            }
        }
    }

    toJSON(){
        const options = {voting: this.VotingChannel.id, result: this.ResultsChannel.id, role: this.Role.id, UpdateTimestap: this.UpdateTimestap};
        return JSON.stringify(options);
    }

    /**
     * string should look like:                                   
     * "{"voting":"id","result":"id","role":"id"}"
     * @param {String} options - string from JSON file
     * @param {Number} nuberoftheVotingSystem - what is the number in the opton.json
     */
    static async fromJSON(options, nuberoftheVotingSystem){
        options = JSON.parse(options);
        var thisnewVotingSystem = new VotingSystem(searchchannel(options.voting), searchchannel(options.result), searchrole(options.role), nuberoftheVotingSystem, options.UpdateTimestap);
        await thisnewVotingSystem.getVotesfromJSON();
        await thisnewVotingSystem.checkforofflinevotes();
        return thisnewVotingSystem;
    }

    /**
     * 
     * @param {Discord.Message} _message 
     */
    async addVote(_message){
        var message = await _message.channel.send(_message.content.substring(5)).catch(e => console.error(e));
        _message.delete();
        if(message.deleted)return 0;
        message.react('👍');
        message.react('✋');
        message.react('👎');
        this.VoteArray.push(new Vote(message, this));
        this.UpdateTimestap = Date.now();
        fs.writeFileSync("VotingSystem/" + this.VotingChannel.id + ".json", this.toJSON());
        fs.writeFileSync("Votes/" + this.VoteArray[this.VoteArray.length - 1].message.id + ".json", this.VoteArray[this.VoteArray.length - 1].toJSON());
        options.Systems.Votes[this.nuberoftheVotingSystem].numberofVotes++;
        options.Systems.Votes[this.nuberoftheVotingSystem].fileids.push(this.VoteArray[this.VoteArray.length - 1].message.id);
        fs.writeFileSync("options.json", JSON.stringify(options));
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
        this.memberstoping = [];
        if(options.votes){
            this.votes = {positive: options.votes[0], abstains: options.votes[1], negative: options.votes[2]}
        }else{
            this.votes = {positive: 0, abstains: 0, negative: 0}
        }
        if(options.voters){
            this.voters = options.voters;
        }else{
            this.voters = [];
        }

        if(Date.now() - message.createdTimestamp <= pingtime){
            setTimeout(() => {this.ping()}, pingtime - Date.now() + message.createdTimestamp);
        }
    }

    ping(){
        if(this.updatevotes())return 0;
        var msg = "";
        for(let i = 0; i < this.rolememberstoping.length; i++){
            msg += rolememberstoping[i].toString() + ",\n";
        }
        this.message.channel.send(msg + "pleace vote!");
    }

    updatevotes(){
        this.memberstoping = [];
        var rolemembers = this.VotingSystem.Role.members.array();
        for(let i = 0; i < rolemembers.length; i++){
            try{
                if(this.message.reactions.resolve('👍').users.resolve(rolemembers[i].user.id) || this.message.reactions.resolve('✋').users.resolve(rolemembers[i].user.id) || this.message.reactions.resolve('👎').users.resolve(rolemembers[i].user.id)){
                    var skip = false;
                    for(var j = 0; j < this.voters.length; j++){
                        if(this.voters[j].Member == rolemembers[i]) skip = true;
                    }
                    if(!skip){
                        this.voters.push(new Voter(rolemembers[i]))
                        if(this.message.reactions.resolve('👍').users.resolve(rolemembers[i].user.id)){
                            this.voters[this.voters.length - 1].updatevote(this, 0)
                        }else if(this.message.reactions.resolve('✋').users.resolve(rolemembers[i].user.id)){
                            this.voters[this.voters.length - 1].updatevote(this, 1)
                        }else if(this.message.reactions.resolve('👎').users.resolve(rolemembers[i].user.id)){
                            this.voters[this.voters.length - 1].updatevote(this, 2)
                        }
                    }
                }else{
                    this.memberstoping.push(rolemembers[i])
                }
            }catch{console.error()}
        }
        try{this.votes = {positive: this.message.reactions.resolve('👍').count, abstains: this.message.reactions.resolve('✋').count, negative: this.message.reactions.resolve('👎').count}}catch{}

        if(Date.now() - this.message.createdTimestamp > pingtime){
            const rolemembers = this.VotingSystem.Role.members.array().length;
            if(this.votes.positive > this.votes.negative + (rolemembers - this.voters.length)){
                this.finish(true);
                return true;
            }else if(this.votes.negative >= this.votes.positive + (rolemembers - this.voters.length)){
                this.finish(false);
                return true;
            }
        }
        return false;
    }

    /**
     * @param {Boolean} result - true for 👍 and false for 👎
     */
    finish(result){
        const rolemembers = this.VotingSystem.Role.members.array().length;
        if(result){
            this.VotingSystem.ResultsChannel.send(this.message.content + " voted onto the island (" + (this.votes.positive - 1) + "," + (this.votes.abstains - 1) + "," + (this.votes.negative - 1) + ";" + (rolemembers - this.voters.length) + ")")
        }else{
            this.VotingSystem.ResultsChannel.send(this.message.content + " yeeeted of the island (" + (this.votes.positive - 1) + "," + (this.votes.abstains - 1) + "," + (this.votes.negative - 1) + ";" + (rolemembers - this.voters.length) + ")")
        }
        for(var i = 0; i < options.Systems.Votes[this.VotingSystem.nuberoftheVotingSystem].numberofVotes; i++){
            if(options.Systems.Votes[this.VotingSystem.nuberoftheVotingSystem].fileids[i] == this.message.id){
                options.Systems.Votes[this.VotingSystem.nuberoftheVotingSystem].fileids.splice(i, 1);
                options.Systems.Votes[this.VotingSystem.nuberoftheVotingSystem].numberofVotes--;
                fs.writeFileSync("options.json", JSON.stringify(options));
            }
        }
        this.message.delete();
    }

    delete(){
        for(var i = 0; i < options.Systems.Votes[this.VotingSystem.nuberoftheVotingSystem].numberofVotes; i++){
            if(options.Systems.Votes[this.VotingSystem.nuberoftheVotingSystem].fileids[i] == this.message.id){
                options.Systems.Votes[this.VotingSystem.nuberoftheVotingSystem].fileids.splice(i, 1);
                options.Systems.Votes[this.VotingSystem.nuberoftheVotingSystem].numberofVotes--;
                fs.writeFileSync("options.json", JSON.stringify(options));
            }
        }
        this.message.delete();
    }

    toJSON(){
        const options = {message: this.message.id, VotingSystem: this.VotingSystem.VotingChannel.id};
        return JSON.stringify(options);
    }

    /**
     * string should look like:                                   
     * "{"message": "id", "VotingSystem": "id"}"
     * @param {String} options - string from JSON file
     * @param {VotingSystem} VotingSystem - Voting System that has this Vote (optional)
     */
    static async fromJSON(options, VotingSystem = false){
        options = JSON.parse(options);
        if(VotingSystem){
            return new Vote(await searcmessage(options.message), VotingSystem)
        }else{ 
            for(var i = 0; i < VotingSystemarray.length; i++){
                if(VotingSystemarray[i].VotingChannel.id == options.VotingSystem){
                    return new Vote(await searcmessage(options.message), VotingSystemarray[i]);
                }
            }
        }
    }
}
                                                                          
class Voter{
    /**
     * @param {Discord.GuildMember} GuildMember - Voter
     * @param {object} options - Options for this Voter (optonal)
     */
    constructor(GuildMember, options = {fromJSON: false, votes: []}){
        if(options.fromJSON){
            this.Member = GuildMember;
            this.votes = options.votes;
            fs.writeFileSync("Voters/" + this.Member.id + ".json", this.toJSON());
        }else{
            this.Member = GuildMember;
            try{
                var json = JSON.parse(fs.readFileSync("Voters/" + GuildMember.id + ".json"));
                this.votes = json.votes;
            }catch(error){
                fs.writeFileSync("Voters/" + GuildMember.id + ".json", this.toJSON());
                this.votes = options.votes;
            }
        }
    }

    /**
     * @param {Vote} vote 
     * @param {Number} thisvotersvote - 0 for 👍, 1 for ✋ and 2 for 👎
     */
    updatevote(vote, thisvotersvote){
        for(var i = 0; i < this.votes.length; i++){
            if(this.votes[i].vote == vote.message.id){
                this.votes[i].thisvotersvote = thisvotersvote;
                fs.writeFileSync("Voters/" + this.Member.id + ".json", this.toJSON());
                return true;
            }
        }
        this.votes.push({vote: vote.message.id, thisvotersvote: thisvotersvote});
        fs.writeFileSync("Voters/" + this.Member.id + ".json", this.toJSON());
        return false;
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
        return new Voter(searcmember(options.GuildMember), {fromJSON: true, votes: options.votes});
    }
}

function checkchannel(id){
    for(var i = 0; i < VotingSystemarray.length; i++){
        if(VotingSystemarray[i].VotingChannel.id == id){
            return ["voting", i];
        }else if(VotingSystemarray[i].ResultsChannel.id == id){
            return ["result", i];
        }
    }
    return ["notingfound"];
}

function searcmember(id){
    var guilds = client.guilds.cache.array();
    for(var i = 0; i < guilds.length; i++){
        var members = guilds[i].members;
        var member = members.resolve(id);
        try{if(member){return member}}catch(error){};
    }
    return {id: id};
}


async function searcmessage(id){
    var guilds = client.guilds.cache.array();
    for(var i = 0; i < guilds.length; i++){
        var channels = guilds[i].channels.cache.array();
        for(var j = 0; j < channels.length; j++){
            if(channels[j].type == "text"){
                var messages = channels[j].messages;
                var _message;
                try{await messages.fetch(id).then(message => {_message = message})}catch(error){};
                if(_message){
                    return _message;
                }
            }   
        }
    }
}

function searchrole(id){
    var guilds = client.guilds.cache.array();
    for(var i = 0; i < guilds.length; i++){
        var roles = guilds[i].roles;
        var role = roles.resolve(id);
        try{if(role){return role}}catch(error){};
    }
}

function searchchannel(id){
    var guilds = client.guilds.cache.array();
    for(var i = 0; i < guilds.length; i++){
        var channels = guilds[i].channels;
        var channel = channels.resolve(id);
        try{if(channel){return channel}}catch(error){};
    }
}

//adds new VotingSystems
function addVotingSystem(){
    for(var k = 0; k < newVotingSystems.length; k++){
        newVotingSystems[k].voting = searchchannel(newVotingSystems[k].voting);
        newVotingSystems[k].result = searchchannel(newVotingSystems[k].result);
        newVotingSystems[k].role = searchrole(newVotingSystems[k].role);
    }

    for(var i = 0; i < newVotingSystems.length; i++){
        VotingSystemarray.push(new VotingSystem(newVotingSystems[i].voting, newVotingSystems[i].result, newVotingSystems[i].role, options.Systems.numberofVotingSystems)); 
        options.Systems.numberofVotingSystems++;
        options.Systems.fileids.push(newVotingSystems[i].voting.id);
        options.Systems.Votes.push({numberofVotes:0, fileids:[]});
        fs.writeFileSync("options.json", JSON.stringify(options));
        fs.writeFileSync("VotingSystem/" + newVotingSystems[i].voting.id + ".json", VotingSystemarray[VotingSystemarray.length - 1].toJSON());
        newVotingSystems[i].voting.send("Congratulations! Voting Bot joined the server! \n Please do not resist!");
    }
    console.log("Finished adding the new Voting Systems");
}


client.on("ready", async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    for(var i = 0; i < options.Systems.numberofVotingSystems; i++){VotingSystemarray.push(await VotingSystem.fromJSON(fs.readFileSync("VotingSystem/" + options.Systems.fileids[i] + ".json"), i))}
    if (newVotingSystems.length > 0) addVotingSystem();
});

client.on("message", msg => {
    if(msg.member.user.id == client.user.id) return 0;
    if(msg.content.substring(0, 5).toLowerCase() != "!vote") return 0;
    if(msg.content.substring(0, 7).toLowerCase() == "notvote") return 0;
    // console.log(msg.channel);

    //fixes problem with people using different emojis
    if(checkchannel(msg.channel.id)[0] == "voting"){
        VotingSystemarray[checkchannel(msg.channel.id)[1]].addVote(msg);
    }
});

client.on("messageReactionAdd", (messageReaction, User) => {
    if(User == client.user)return 0;
    for(var i = 0; i < VotingSystemarray.length; i ++){
        var Vote = VotingSystemarray[i].getVote(messageReaction.message);
        if(Vote){
            Vote.updatevotes()
        }
    }
})

client.login(process.env.BOT_TOKEN);
