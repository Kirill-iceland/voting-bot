# Voting Bot   
This is bot to help manage voting system. Originally it was created for [Hekate](https://discord.gg/sfCkZDA) Technical Minecraft Server.   
## Usage   
1. Put `!vote` in front to create a vote   
2. `!delete id_of_the_message` to delete vote (Only available to **admins**)   
    This command an be used in any channel (So please don´t spam voting channel)   
3. Use :thumbsup: , :thumbsdown:  and :raised_hand:to vote   
4. Bot will ping everyone that has not voted after 24h   
5. The bot will finish the vote if everybody voted or vote of people that have not voted will not change anything    

## Installation   

1. Download ZIP file
2. Unzip the file
3. Open **Comand Prompt** and run `npm install`
4. Put your bot token in **main.js** instead of `YOUR_BOT_TOKEN`
5. Add `{voting: "ID_OF_YOUR_VOTING_CHANNEL", result: "ID_OF_YOUR_RESULT_CHANNEL", Role: "ID_OF_YOUR_ROLE"}` to `newVotingSystems` array
6. Run `npm run start`
7. Wait until console says `Finished adding the new Voting Systems`
8. Stop the node by pressing **Control + C**
9. Delite `{voting: "ID_OF_YOUR_VOTING_CHANNEL", result: "ID_OF_YOUR_RESULT_CHANNEL", Role: "ID_OF_YOUR_ROLE"}`
10. Run `npm run start`   
