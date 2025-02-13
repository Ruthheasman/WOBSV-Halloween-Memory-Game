// createCollection.js
require("dotenv").config();
const { HandCashMinter } = require("@handcash/handcash-connect");

async function waitForOrderCompletion(
    handCashMinter,
    orderId,
    maxAttempts = 10,
) {
    console.log(`Waiting for order ${orderId} to complete...`);
    const interval = 3000; // 3 seconds

    for (let i = 0; i < maxAttempts; i++) {
        try {
            console.log(
                `Attempt ${i + 1}/${maxAttempts}: Checking order items...`,
            );
            // Try to get the items directly - this will fail until the order is complete
            const items = await handCashMinter.getOrderItems(orderId);

            if (items && items.length > 0) {
                console.log("Items found:", JSON.stringify(items, null, 2));
                return items[0];
            }

            console.log("No items yet, waiting...");
            await new Promise((resolve) => setTimeout(resolve, interval));
        } catch (error) {
            console.log(`Attempt ${i + 1}/${maxAttempts}: Still processing...`);
            if (error.response) {
                console.log("Status:", error.response.status);
                console.log("Message:", error.response.data);
            }
            await new Promise((resolve) => setTimeout(resolve, interval));
        }
    }
    throw new Error("Order completion timeout");
}

async function createCollection() {
    try {
        console.log("Initializing HandCash Minter...");

        const handCashMinter = HandCashMinter.fromAppCredentials({
            appId: process.env.HANDCASH_APP_ID,
            appSecret: process.env.HANDCASH_APP_SECRET,
            authToken: process.env.HANDCASH_ACCESS_TOKEN,
        });

        console.log("Creating Halloween Game NFT collection...");

        const creationOrder = await handCashMinter.createCollectionOrder({
            name: "Halloween Memory Game Collection",
            description:
                "Unique Halloween-themed NFTs earned by winning the memory game",
            mediaDetails: {
                image: {
                    url: "https://bsv-halloween-snap-game.replit.app/assets/32Halloween_2021_NFT_back.png",
                    contentType: "image/png",
                },
            },
        });

        console.log("Collection order created with ID:", creationOrder.id);

        // Wait for completion and get items in one step
        const completedItem = await waitForOrderCompletion(
            handCashMinter,
            creationOrder.id,
        );

        if (!completedItem || !completedItem.id) {
            throw new Error("No collection ID found in completed order");
        }

        const collectionId = completedItem.id;
        console.log("\nCollection created successfully!");
        console.log("Collection ID:", collectionId);
        console.log("\n==============================================");
        console.log("IMPORTANT: Add this ID to your Replit secrets:");
        console.log("Name: HANDCASH_COLLECTION_ID");
        console.log(`Value: ${collectionId}`);
        console.log("==============================================\n");
    } catch (error) {
        console.error("Error creating collection:");
        console.error("Message:", error.message);
        if (error.response) {
            console.error("Response Status:", error.response.status);
            console.error(
                "Response Data:",
                JSON.stringify(error.response.data, null, 2),
            );
        }
    }
}

// Verify environment variables
console.log("Checking environment variables...");
const requiredVars = [
    "HANDCASH_APP_ID",
    "HANDCASH_APP_SECRET",
    "HANDCASH_ACCESS_TOKEN",
];
for (const varName of requiredVars) {
    const value = process.env[varName];
    if (!value) {
        console.error(`Error: ${varName} is not set in environment variables`);
        process.exit(1);
    }
    console.log(`${varName} length:`, value.length);
}

// Run the creation script
createCollection().catch((error) => {
    console.error("Script failed:", error.message);
    process.exit(1);
});
