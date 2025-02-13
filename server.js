require("dotenv").config();
const express = require("express");
const { HandCashConnect } = require("@handcash/handcash-connect");
const { HandCashMinter } = require("@handcash/handcash-connect");
const path = require("path");
const axios = require("axios");
const app = express();
const port = process.env.PORT || 8080;

// Initialize HandCash Connect
const handCashConnect = new HandCashConnect({
  appId: process.env.HANDCASH_APP_ID,
  appSecret: process.env.HANDCASH_APP_SECRET,
});

// Add error handling middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Authentication route
app.get("/auth", (req, res) => {
  try {
    console.log("Auth request received");
    const redirectUrl = `${req.protocol}://${req.get("host")}/auth/callback`;
    console.log("Redirect URL:", redirectUrl);
    const redirectionLoginUrl = handCashConnect.getRedirectionUrl({
      redirectUrl,
    });
    console.log("Redirecting to:", redirectionLoginUrl);
    res.redirect(redirectionLoginUrl);
  } catch (error) {
    console.error("Auth error:", error);
    res.status(500).send("Authentication failed");
  }
});

// Auth callback
app.get("/auth/callback", async (req, res) => {
  try {
    console.log("Auth callback received");
    const { authToken } = req.query;
    if (!authToken) {
      console.error("No auth token in callback");
      return res.status(400).send("Auth token missing");
    }

    console.log("Auth token received, length:", authToken.length);
    const decodedAuthToken = decodeURIComponent(authToken);
    const account = handCashConnect.getAccountFromAuthToken(decodedAuthToken);

    // Verify the account
    const profile = await account.profile.getCurrentProfile();
    console.log("Profile verified for user:", profile.publicProfileId);

    // Redirect with auth token
    const redirectUrl = `/?authToken=${encodeURIComponent(decodedAuthToken)}`;
    console.log("Redirecting to:", redirectUrl);
    res.redirect(redirectUrl);
  } catch (error) {
    console.error("Auth callback error:", error);
    res.status(500).send("Authentication failed");
  }
});

// Payment request
app.get("/pay", async (req, res) => {
  try {
    console.log("Payment request received");
    const { authToken } = req.query;
    if (!authToken) {
      console.error("No auth token in payment request");
      return res.status(400).send("Auth token missing");
    }

    const baseUrl = `https://bsv-halloween-snap-game.replit.app`;

    const paymentRequestData = {
      receivers: [
        {
          sendAmount: 0.25,
          destination: "womenofbsv@handcash.io",
        },
      ],
      currencyCode: "BSV",
      denominatedIn: "USD",
      expirationType: "onPaymentCompleted",
      product: {
        name: "Halloween NFT Game Reward",
        description: "Mint a Halloween NFT by playing the game!",
        imageUrl:
          "https://bsv-halloween-snap-game.replit.app/assets/32Halloween_2021_NFT_back.png",
      },
      redirectUrl:
        "https://market.handcash.io/items/inventory/6687ef385909cf8822ddc67f",
      notifications: {
        webhook: {
          webhookUrl: `${baseUrl}/payment/webhook`,
          customParameters: {
            gameId: Date.now().toString(),
            authToken: authToken,
          },
        },
      },
    };

    console.log(
      "Creating payment request:",
      JSON.stringify(paymentRequestData, null, 2),
    );

    const response = await axios.post(
      "https://cloud.handcash.io/v3/paymentRequests",
      paymentRequestData,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "App-Id": process.env.HANDCASH_APP_ID,
          "App-Secret": process.env.HANDCASH_APP_SECRET,
        },
      },
    );

    console.log("Payment request created:", response.data);

    if (!response.data || !response.data.paymentRequestUrl) {
      throw new Error("Invalid response from HandCash");
    }

    res.json({ paymentUrl: response.data.paymentRequestUrl });
  } catch (error) {
    console.error("Payment error:", error);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
    res.status(500).send("Failed to create payment request");
  }
});

// Payment success
app.get("/payment/success", (req, res) => {
  console.log("Payment success redirect received");
  res.redirect("/?payment=success");
});

// Payment webhook
app.post("/payment/webhook", async (req, res) => {
  try {
    console.log("\n=== WEBHOOK PROCESS STARTED ===");
    console.log("Webhook received:", JSON.stringify(req.body, null, 2));
    const { appSecret, customParameters, transactionId, userData } = req.body;

    if (appSecret !== process.env.HANDCASH_APP_SECRET) {
      console.error("Invalid app secret in webhook");
      return res.status(401).send("Unauthorized");
    }

    console.log("Webhook authorized, transaction:", transactionId);
    console.log("User data from webhook:", userData);
    const userId = userData.id;
    console.log("Using user ID:", userId);

    const handCashMinter = HandCashMinter.fromAppCredentials({
      appId: process.env.HANDCASH_APP_ID,
      appSecret: process.env.HANDCASH_APP_SECRET,
      authToken: process.env.HANDCASH_ACCESS_TOKEN,
    });

    const randomCard = getRandomGameImage();
    console.log("Selected card:", randomCard);

    const mintResult = await handCashMinter.createItemsOrder({
      collectionId: "671d1674fc997a967bb2186a",
      items: [
        {
          user: userId,
          name: `Halloween NFT - ${randomCard.name}`, // Removed #1
          rarity: "Rare",
          attributes: [
            { name: "Event", value: "Halloween", displayType: "string" },
            { name: "Year", value: "2024", displayType: "string" },
            {
              name: "Character",
              value: randomCard.name,
              displayType: "string",
            },
            {
              name: "Edition",
              value: "1",
              displayType: "number",
            },
            {
              name: "Transaction",
              value: transactionId,
              displayType: "string",
            },
          ],
          mediaDetails: {
            image: {
              url: randomCard.url,
              contentType: "image/png",
            },
          },
          quantity: 1,
        },
      ],
    });

    console.log("Minting result:", mintResult);
    console.log("=== WEBHOOK PROCESS COMPLETED ===\n");
    res.status(200).send("NFT minted successfully");
  } catch (error) {
    console.error("Webhook error:", error);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error(
        "Response data:",
        JSON.stringify(error.response.data, null, 2),
      );
    }
    console.error("Full error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    res.status(500).send("Failed to process payment webhook");
  }
});

// Helper function to get random game image and name
function getRandomGameImage() {
  const baseUrl = "https://bsv-halloween-snap-game.replit.app/";
  const cards = [
    { image: "assets/1ruth_thedruid.png", name: "Ruth - The Druid" },
    {
      image: "assets/2ruthandsirtoshi_knights.png",
      name: "Ruth & Sir Toshi - Knights",
    },
    { image: "assets/3diddy_zombie.png", name: "Diddy - Zombie" },
    { image: "assets/4diddy_banshee.png", name: "Diddy - Banshee" },
    { image: "assets/5rory_wolfie.png", name: "Rory - Wolfie" },
    {
      image: "assets/6korppi_keeperoftheforest.png",
      name: "Korppi - Keeper of the Forest",
    },
    { image: "assets/7casey_bee.png", name: "Casey - Queen Bee" },
    { image: "assets/8meike_spacecowgirl.png", name: "Meike - Space Cowgirl" },
    { image: "assets/9rae_trekkie.png", name: "Rae - Trekkie" },
    { image: "assets/10river_witch.png", name: "River - Green Witch" },
    { image: "assets/11becky_naughtyangel.png", name: "Becky - Naughty Angel" },
    { image: "assets/12robin_batwoman.png", name: "Robin - Batwoman" },
    { image: "assets/13laura_cruella.png", name: "Laura - Cruella" },
    { image: "assets/14winnie_nurserekt.png", name: "Winnie - Nurse Rekt" },
    { image: "assets/15eva_masquerademaid.png", name: "Eva - Masquerade Maid" },
    { image: "assets/16rory_sassywitch.png", name: "Rory - Sassy Witch" },
    {
      image: "assets/17craigandkurt_hulkmeetsironman.png",
      name: "Craig & Kurt - Hulk Meets Iron Man",
    },
    {
      image: "assets/18alexagut_durothepirate.png",
      name: "Alexa Gut - Duro the Pirate",
    },
    {
      image: "assets/19coinyeezyandrandy_pumpkinandbabyyoda.png",
      name: "CoinYeezy & Randy - Pumpkin and Baby Yoda",
    },
    {
      image: "assets/20craigandshadders_samurai.png",
      name: "Craig & Shadders - Samurai",
    },
    {
      image: "assets/21daniel_emperorpalpatine.png",
      name: "Daniel - Emperor Palpatine",
    },
    {
      image: "assets/22danielkrawisz_cosmos2.png",
      name: "Daniel Krawisz - Cosmos Stagittarius",
    },
    {
      image: "assets/23craigandcalvin_princesofdarkness.png",
      name: "Craig & Calvin - Princes of Darkness",
    },
    { image: "assets/24DrWright_timelord.png", name: "Dr Wright - Time Lord" },
    {
      image: "assets/25jackliu_jackskellington.png",
      name: "Jack Liu - Jack Skellington",
    },
    { image: "assets/26jimmy_sexyvampire.png", name: "Jimmy - Sexy Vampire" },
    {
      image: "assets/27michaelhudson_indiana.png",
      name: "Michael Hudson - Indiana Jones",
    },
    { image: "assets/28satoshi_thedoc.png", name: "Satoshi - The Doc" },
    {
      image: "assets/30craigandgeorge_forodandgandalf.png",
      name: "Craig & George - Frodo and Gandalf",
    },
    { image: "assets/29CSW_grimreaper.png", name: "CSW - Grim Reaper" },
    { image: "assets/33DrWright_voldemort.png", name: "Dr Wright - Voldemort" },
    { image: "assets/31laura_fairy.png", name: "Laura - Fairy of the Forest" },
  ];

  const randomCard = cards[Math.floor(Math.random() * cards.length)];
  return {
    url: `${baseUrl}${randomCard.image}`,
    name: randomCard.name,
  };
}

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).send("An unexpected error occurred");
});

// Start server with error handling
const server = app.listen(port, (err) => {
  if (err) {
    console.error(`Failed to start server: ${err.message}`);
    return;
  }
  console.log(`Server running at http://localhost:${port}`);
});

// Handle server shutdown gracefully
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  server.close(() => {
    process.exit(1);
  });
});
