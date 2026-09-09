# Bots framework

> **Archived historical document.** Preserved from the retired `wiki.ethora.com`.
> It describes the early Ethora engine (then the Dappros Platform) as of 2021 to 2023.
> Endpoints, class names and token standards are historical and will not match the
> current framework in [`packages/`](../packages). Kept as design reference.
> See [historical/README.md](README.md) for context.

Conventions and rules for third-party developers building bots on the early engine.

Bots are important within Ethora ecosystem as they carry out numerous functions.

3rd party developers are encouraged to create their own Bots.

This document covers best practices and rules to follow when implementing your own chat bots.

All rules and recommendations below apply to all Bots used within Ethora ecosystem, within all chat Room the bots are present at.
### How to create a new Bot
Check out this page when you'd like to create a new bot: Create A New Bot
### State (data persistence)
It is recommended that Bots maintain the following aspects of the State (this of course may extend or vary depending on your use case and implementation).
* Rooms - the list of rooms the bot has been invited to
* User-specific states (stage of the conversation)
### Names
Please have "bot" or "Bot" in the name of your bot. For example, "Merchant Bot" 

This makes it easy for your Bot to react to their name being called, without being triggered when Users mention 

Accordingly, have your Bot react to both keywords, any register for the letters. For example, "merchant bot" and "bOt MerchaNt" should both be fine to call the "Merchant Bot".
### System (Default) responses
#### "bot help", "bot info"
Each bot should respond to "bot help", "bots help", "bot info" and "bots info" requests.

The response should be the following:
 Hi, I'm <Bot's Name>. I was born in <Month> <Year>. 
Note: the month and year are needed so you and others can track the version of the bot deployed.
 < Short one-line description here. E.g. "I can help you to acquire or to sell your digital art." > 

 Just say "<Bot's Name>" and I will guide you. 
#### bot [name] start
Each unless their logic is different, should initiate their sequence with a user when a user writes "bot [name] start", or any other combination of the words "start", "bot" and bot's name.

NOTE: One bot might have multiple names or aliases, but developers and chat room owners/admins should make sure that there aren't bots with the same names present.
#### bot [name] stop (or quit)
Each unless their logic is different, should stop their sequence and/or communication with a user when that user writes "bot [name] stop", or any other combination of the words "stop" (or "quit"), "bot" and bot's name.

It is up to the bot's developer whether to remember the sequence (state) that bot had with the specific user or whether to start it from scratch next time. 

Recommended way to end the conversation from the bot:
 OK, [user name], bye! 👋
#### time out (auto stop)
For most bots it makes sense to time out and stop listening to user responses after 2h - 24h of users inactivity. This can be done similarly to 'bot stop' sequence.
### Response to XMPP invites
Bots should correctly handle invites to join new chat Rooms. 

Upon receiving an invite stanza, a Bot should join the Room. 
### User Experience related
#### **isComposing ("now typing")**
Before sending each message from a bot, send "isComposing" messages briefly so that it looks more organic (as if your Bot was typing). 
#### Delay between messages
Have a brief delay before sending consequent messages by your Bot so it looks more organic (don't throw many messages at the User all at once).
#### Reaction to Users presence
If a user is inactive for 1 minute and starts to post a message or chat after that, presence is triggered and a message is sent to the user.

Also, the presence time is updated if we receive isComposing before the timeout time of 2 minutes if any messages are sent to the user (so we understand that the user is active).

#### Working in crowded rooms
It is recommended that the bots detect the volume of messages in the room and if it is fairly high (e.g. more than 10 messages over last 3 minutes) then use **threads** to respond to the users. This way, messages between the bot and the user will not be seen by other people in the room unless they open the thread. 

### QA
#### Uptime
The Bot should maintain a 99.99% or higher uptime. I.e. it should be responding to messages from an automated status checker - at least responding to the "bot info" request.
#### Throughput
Unless allowed by a specific use case, a Bot should be able to maintain conversations with at least 1,000 Users handling 300 incoming messages per second. This should not cause any deterioration or noticeable slowing down of the service.
