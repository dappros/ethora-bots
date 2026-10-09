# Mint Bot

> **Archived historical document.** Preserved from the retired `wiki.ethora.com`.
> It describes the early Ethora engine (then the Dappros Platform) as of 2021 to 2023.
> Endpoints, class names and token standards are historical and will not match the
> current framework in [`packages/`](../packages). Kept as design reference.
> See [historical/README.md](README.md) for context.

Bot that lets end users mint their own tokens from images, sound or video through a conversation.

== About == 

Mint bot allows users to mint NFT (Items) and other types of tokens.

==Usage scenario== 

**Bot**: What would you like to do?
* [ Mint an NFT Item ]
* [ Mint a Coin ]
* [ Leave ]

**Alice**: 
* [ Mint an NFT Item ]

**Bot**: Please enter a name for your Item.

**Alice**:
* Alice's Daisies

**Bot**: Noted, the name will be "Alice's Daisies".

**Bot**: Please choose contract type:
* [ NFT (L2, 1x unique Item) ]
* [ NFT (L2, 3x copies collection) ]
* [ NFT (L2, 5x copies collection) ]
* [ NFT (L2, 10x copies collection) ]
* [ NFMT (L2, 245:100:50:25:5) ]
* [ NFMT (L2, Custom params) ]

**Alice**:
* [ NFMT (L2, 245:100:50:25:5) ]

**Bot**: Please send your art. 

**Alice**:
* [ File attachment ] 

**Bot**: Looking good! 

**Bot:** Now, please set the minimum tier price in Coins (enter a number, for example 100 Coins).

**Alice**:
* 100

**Bot**: Now, how many Beneficiaries would you like to set up? They will be entitled to a share of users donations. You will be able to specify percentages % at the next step. You will also need to specify Ethereum addresses for each of them. 

**Bot**: (You can also set one of the Beneficiaries to be DAO managed during the next steps).

* [ 1 ]
* [ 2 ]
* [ 3 ]

**Alice**: 
* [ 2 ]

**Bot**: Got it, 2x Beneficiaries. Now, what kind of % split would you like?
* [ Equal split, 50% each ]
* [ Custom split ]

**Alice**:
* [ Equal split, 50% each ]

**Bot**: Perfect, now please specify Ethereum addresses for each Beneficiary (alternatively you can have one of them to be DAO controlled).

**Bot**: Please enter an address for Beneficiary 1 (having 50% split) or hit "DAO controlled" button if applicable.

* [ Make Beneficiary 1 DAO controlled ]

**Alice**: 
* 0xb794f5ea0ba39494ce839613fffba74279579268

**Bot**: noted, Beneficiary 1 address is: 0xb794f5ea0ba39494ce839613fffba74279579268

**Bot**: Please enter an address for Beneficiary 2 (having 50% split) or hit "DAO controlled" button if applicable.

* [ Go back & edit Beneficiary 1 ]
* [ Make Beneficiary 2 DAO controlled ]

**Alice**:
* [ Make Beneficiary 2 DAO controlled ]

**Bot**: Great, just to confirm, I'm going to create a collection named "Alice's Daisies" based on "NFMT (L2, 245:100:50:25:5)" contract type (total issuance up to 425 Items) and the following mint prices: 245 free, 100 @ 100 Coins each, 50 @ 200 Coins each, 25 @ 500 Coins each, 5 @ 1,000 Coins each. 

**Bot**: Would you like to go ahead? The operation will cost 50 Coins. After I mint I can send the NFMT to your wallet or drop it in the room. 

* [ Yes, go ahead - send to my wallet ]
* [ Yes, go ahead - drop into the room ]
* [ Change something ]
* [ Leave ]

**Alice**:
* [ Yes, go ahead - send to my wallet ]

**Bot**: Rodger that. Please send me 50 Coins and I will proceed immediately. 

**Alice**:

* (sends 50 Coins to Mint Bot)

**Bot**: Your NFMT has been minted and sent to your wallet. 
Thank you for your business! 

* (sends NFMT to Alice)
