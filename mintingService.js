// mintingService.js

const { HandCashMinter } = require("@handcash/handcash-connect");

function mintNFTToUser(userId) {
  return new Promise(async (resolve, reject) => {
    try {
      // Initialize HandCash Minter with proper credentials, including the access token from Replit secrets
      const handCashMinter = HandCashMinter.fromAppCredentials({
        appId: process.env.HANDCASH_APP_ID,
        appSecret: process.env.HANDCASH_APP_SECRET,
        authToken: process.env.HANDCASH_ACCESS_TOKEN, // Use AccessToken explicitly from Replit secrets
      });

      // Create an array of image URLs to randomly choose from
      const images = [
        "https://bsv-halloween-snap-game.replit.app/assets/1ruth_thedruid.png",
        "https://bsv-halloween-snap-game.replit.app/assets/2ruthandsirtoshi_knights.png",
        "https://bsv-halloween-snap-game.replit.app/assets/3diddy_zombie.png",
        "https://bsv-halloween-snap-game.replit.app/assets/4diddy_banshee.png",
        "https://bsv-halloween-snap-game.replit.app/assets/5rory_wolfie.png",
        "https://bsv-halloween-snap-game.replit.app/assets/6korppi_keeperoftheforest.png",
        "https://bsv-halloween-snap-game.replit.app/assets/7casey_bee.png",
        "https://bsv-halloween-snap-game.replit.app/assets/8meike_spacecowgirl.png",
        "https://bsv-halloween-snap-game.replit.app/assets/9rae_trekkie.png",
        "https://bsv-halloween-snap-game.replit.app/assets/10river_witch.png",
        "https://bsv-halloween-snap-game.replit.app/assets/11becky_naughtyangel.png",
        "https://bsv-halloween-snap-game.replit.app/assets/12robin_batwoman.png",
        "https://bsv-halloween-snap-game.replit.app/assets/13laura_cruella.png",
        "https://bsv-halloween-snap-game.replit.app/assets/14winnie_nurserekt.png",
        "https://bsv-halloween-snap-game.replit.app/assets/15eva_masquerademaid.png",
        "https://bsv-halloween-snap-game.replit.app/assets/16rory_sassywitch.png",
        "https://bsv-halloween-snap-game.replit.app/assets/17craigandkurt_hulkmeetsironman.png",
        "https://bsv-halloween-snap-game.replit.app/assets/18alexagut_durothepirate.png",
        "https://bsv-halloween-snap-game.replit.app/assets/19coinyeezyandrandy_pumpkinandbabyyoda.png",
        "https://bsv-halloween-snap-game.replit.app/assets/20craigandshadders_samurai.png",
        "https://bsv-halloween-snap-game.replit.app/assets/21daniel_emperorpalpatine.png",
        "https://bsv-halloween-snap-game.replit.app/assets/22danielkrawisz_cosmos2.png",
        "https://bsv-halloween-snap-game.replit.app/assets/23craigandcalvin_princesofdarkness.png",
        "https://bsv-halloween-snap-game.replit.app/assets/24DrWright_timelord.png",
        "https://bsv-halloween-snap-game.replit.app/assets/25jackliu_jackskellington.png",
        "https://bsv-halloween-snap-game.replit.app/assets/26jimmy_sexyvampire.png",
        "https://bsv-halloween-snap-game.replit.app/assets/27michaelhudson_indiana.png",
        "https://bsv-halloween-snap-game.replit.app/assets/28satoshi_thedoc.png",
        "https://bsv-halloween-snap-game.replit.app/assets/30craigandgeorge_forodandgandalf.png",
        "https://bsv-halloween-snap-game.replit.app/assets/29CSW_grimreaper.png",
        "https://bsv-halloween-snap-game.replit.app/assets/33DrWright_voldemort.png",
        "https://bsv-halloween-snap-game.replit.app/assets/31laura_fairy.png",
      ];

      // Randomly select an image for the NFT
      const randomImage = images[Math.floor(Math.random() * images.length)];

      // Mint the NFT
      const creationOrder = await handCashMinter.createItemsOrder({
        collectionId: process.env.HANDCASH_COLLECTION_ID, // Use an existing collection ID or create a new one
        items: [
          {
            user: userId,
            name: "Halloween Game Reward",
            rarity: "Rare",
            attributes: [
              { name: "Event", value: "Halloween", displayType: "string" },
              { name: "Year", value: "2024", displayType: "string" },
            ],
            mediaDetails: {
              image: {
                url: randomImage, // Use the randomly selected image
                contentType: "image/png",
              },
            },
            color: "#FF5733",
            quantity: 1,
          },
        ],
      });

      console.log(`NFT minted successfully: ${creationOrder.id}`);
      resolve(creationOrder);
    } catch (error) {
      console.error("Error minting NFT:", error);
      reject(error);
    }
  });
}

module.exports = { mintNFTToUser };
