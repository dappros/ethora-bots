# Hut Hut Bot

> **Archived historical document.** Preserved from the retired `wiki.ethora.com`.
> It describes the early Ethora engine (then the Dappros Platform) as of 2021 to 2023.
> Endpoints, class names and token standards are historical and will not match the
> current framework in [`packages/`](../packages). Kept as design reference.
> See [historical/README.md](README.md) for context.

Bot holding a shared treasure in a chat room, with a paid reveal mechanic.

### Smart contract

Smart contract holds assets on behalf of chat rooms.

The contract should be called with the following parameters:
* roomAddress - address of the chat room 
* visitorAddress - address of the Visitor user (the user who is interacting with the Hut bot)
And a payment of the "visitFee"

#### Constants

* **storeFee** - the number of Coins that the contract takes in order to store an item on behalf of the user. Default value: 10 Coins.

* **collectFee** - the number of Coins that the contract takes in order to admit the user into the Hut and allow to collect an item. Default value: 25 Coins. 

#### Functions

##### Depositing Items
* **storeItem(roomAddress, item)** - deposit something into a Hut. Something could be an ERC20 token (Coin) or ERC-721 token (Item). Works similar to transferring something into a wallet of another user, but specifying roomAddress is compulsory since the Hut works within a context of a room.
This is executed along with sending a storeFee amount of Coins, unless storeFee is zero.

##### Visiting and collecting Items
* **visitAndCollect(roomAddress)** - allows to visit the Hut and collect a random Item. 
Contract verifies the items stored in the Hut against the specific room.
If one or more items are stored, contract will randomly pick one item and send it to the user.
This is executed along with sending a visitFee amount of Coins, unless visitFee is zero.

### Usage Scenario and Messages

#### Visiting the Hut

User:

Turn your back to the forest, hut, hut.

Bot: 

Screeches and creaks are heard from the woods as you approach what looks like a hut on chicken legs. The hut seems to be on alert waiting for what you have to say. 

User:

Turn your front to me, hut, hut.

Bot:

Further blood-curdling screeches and creaks are heard as the hideous Hut spins around. It finally comes to a stop with its door towards you.

Will you dare entering?

* [ Enter and store an Item - 10 Coins ]
* [ Enter and search for Items - 25 Coins ]
* [ Leave ]

##### == Leave the Hut ==
[ Leave ]: 

You leave hastily, hoping to never see the scary Hut again.

#### Depositing or Collecting Items from the Hut

**Enter and store an Item**

[ Enter and store an Item - 10 Coins ]:

The Hut seems empty, no one is here. You can see some old wooden furniture, an ancient stove with a black cat sleeping on it and some herbs, mushrooms and bones here and there.

[ show the send Item menu allowing user to pick one item ]

You carefully hide the [ Item name ] inside the Hut, hoping that you or someone you know will come back later to collect it.

// [ Username ] has left an item in the Hut

There is nothing else to do here so you leave, hoping your item stays safe here.

// [ Username ] has left the Hut

##### == Enter and search for Items ==
[ Enter - 25 Coins ]:  

You enter the Hut. 

// [ Username ] has entered the Hut.

##### The Hut is empty (no Items stored for this room)

The Hut seems empty, no one is here. You can see some old wooden furniture, an ancient stove with a black cat sleeping on it and some herbs, mushrooms and bones here and there.

There is nothing of interest here and you leave the creepy place. 

##### The Hut has 1 or more items stored

You can see some old wooden furniture, an ancient stove with a black cat sleeping on it and some herbs, mushrooms and bones here and there.

After a search, you find an artefact laying about, [ Item Name ].  

Shortly you hear some noice outside seemingly coming from the above which might mean the owner is about to return. 

You grab the artefact and leave in a hurry before it's too late.

// Hut sends [Item] to the [ Username ]

// [ Username ] has left the Hut
