import * as secp256k1 from "https://esm.sh/@noble/secp256k1@2.2.3";

function generateAuthenticationKeyPair() {
    const privateKey = secp256k1.utils.randomPrivateKey();
    const publicKey = secp256k1.getPublicKey(privateKey, true);
    
    return {
        privateKey: Array.from(privateKey).map(b => b.toString(16).padStart(2, '0')).join(''),
        publicKey: Array.from(publicKey).map(b => b.toString(16).padStart(2, '0')).join(''),
    };
}

async function startAuth() {
    try {
        console.log("Starting auth flow...");
        const { privateKey, publicKey } = generateAuthenticationKeyPair();
        console.log("Generated key pair, publicKey length:", publicKey.length);
        
        const response = await fetch('/auth/init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ privateKey, publicKey })
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log("Redirecting to:", data.redirectUrl);
            window.location.href = data.redirectUrl;
        } else {
            console.error("Failed to initialize auth");
            alert("Failed to connect to HandCash. Please try again.");
        }
    } catch (error) {
        console.error("Auth error:", error);
        alert("Error: " + error.message);
    }
}

document.getElementById("auth-button").addEventListener("click", startAuth);

const images = [
    "assets/1ruth_thedruid.png",
    "assets/2ruthandsirtoshi_knights.png",
    "assets/3diddy_zombie.png",
    "assets/4diddy_banshee.png",
    "assets/5rory_wolfie.png",
    "assets/6korppi_keeperoftheforest.png",
    "assets/7casey_bee.png",
    "assets/8meike_spacecowgirl.png",
    "assets/9rae_trekkie.png",
    "assets/10river_witch.png",
    "assets/11becky_naughtyangel.png",
    "assets/12robin_batwoman.png",
    "assets/13laura_cruella.png",
    "assets/14winnie_nurserekt.png",
    "assets/15eva_masquerademaid.png",
    "assets/16rory_sassywitch.png",
    "assets/17craigandkurt_hulkmeetsironman.png",
    "assets/18alexagut_durothepirate.png",
    "assets/19coinyeezyandrandy_pumpkinandbabyyoda.png",
    "assets/20craigandshadders_samurai.png",
    "assets/21daniel_emperorpalpatine.png",
    "assets/22danielkrawisz_cosmos2.png",
    "assets/23craigandcalvin_princesofdarkness.png",
    "assets/24DrWright_timelord.png",
    "assets/25jackliu_jackskellington.png",
    "assets/26jimmy_sexyvampire.png",
    "assets/27michaelhudson_indiana.png",
    "assets/28satoshi_thedoc.png",
    "assets/30craigandgeorge_forodandgandalf.png",
    "assets/29CSW_grimreaper.png",
    "assets/33DrWright_voldemort.png",
    "assets/31laura_fairy.png",
];

// Keep your existing variable declarations
let gameBoard = document.getElementById("game-board");
let counter = document.getElementById("counter");
let overlay = document.getElementById("overlay");
let message = document.getElementById("message");
let nftMintingPrompt = document.getElementById("nft-minting-prompt");
let cardArray = [];
let firstCard, secondCard;
let hasFlippedCard = false;
let lockBoard = false;
let matchCount = 0;
let mistakes = 0;
const maxMistakes = 10;

// Add global error handler
window.onerror = function (msg, url, lineNo, columnNo, error) {
    console.error("Window error:", {
        message: msg,
        url: url,
        lineNo: lineNo,
        columnNo: columnNo,
        error: error,
    });
    return false;
};

// Game mechanics functions
function flipCard() {
    if (lockBoard) return;
    if (this === firstCard) return;

    this.classList.add("flipped");

    if (!hasFlippedCard) {
        hasFlippedCard = true;
        firstCard = this;
        return;
    }

    secondCard = this;
    checkForMatch();
}

function checkForMatch() {
    let isMatch = firstCard.dataset.image === secondCard.dataset.image;
    isMatch ? disableCards() : unflipCards();
}

function disableCards() {
    firstCard.removeEventListener("click", flipCard);
    secondCard.removeEventListener("click", flipCard);
    firstCard.classList.add("matched");
    secondCard.classList.add("matched");
    resetBoard();
    matchCount += 2;
    if (matchCount === cardArray.length) {
        setTimeout(() => {
            if (localStorage.getItem("handcashAuthenticated") === "true") {
                showMintingOption();
            } else {
                showLoginOption();
            }
        }, 500);
    }
}

function unflipCards() {
    lockBoard = true;
    setTimeout(() => {
        firstCard.classList.remove("flipped");
        secondCard.classList.remove("flipped");
        resetBoard();
        mistakes++;
        counter.textContent = `Tries left: ${maxMistakes - mistakes}`;
        if (mistakes >= maxMistakes) {
            setTimeout(() => {
                showMessage("Game Over! You have made too many mistakes.");
            }, 500);
        }
    }, 1000);
}

function resetBoard() {
    [hasFlippedCard, lockBoard] = [false, false];
    [firstCard, secondCard] = [null, null];
}

function initGame() {
    console.log("Initializing game...");
    cardArray = [];
    matchCount = 0;
    mistakes = 0;
    counter.textContent = `Tries left: ${maxMistakes}`;
    gameBoard.innerHTML = "";
    overlay.classList.add("hidden");
    nftMintingPrompt.classList.add("hidden");

    let selectedImages = images.sort(() => 0.5 - Math.random()).slice(0, 9);
    selectedImages = selectedImages
        .concat([...selectedImages])
        .sort(() => 0.5 - Math.random());

    console.log(`Creating ${selectedImages.length} cards`);

    selectedImages.forEach((image, index) => {
        let card = document.createElement("div");
        card.classList.add("card");
        card.innerHTML = `
            <div class="card-inner">
                <div class="card-front"></div>
                <div class="card-back" style="background-image: url(${image});"></div>
            </div>`;
        card.dataset.image = image;
        card.addEventListener("click", flipCard);
        gameBoard.appendChild(card);
        cardArray.push(card);
    });
}

function showMessage(text) {
    message.textContent = text;
    overlay.classList.remove("hidden");
    nftMintingPrompt.classList.add("hidden");
    setTimeout(() => {
        initGame();
    }, 3000);
}

function showMintingOption() {
    console.log("Showing minting option dialog");
    clearOverlay();
    overlay.classList.remove("hidden");
    message.textContent = "Congratulations! You've won!";
    nftMintingPrompt.innerHTML = `
        <div class="victory-container">
            <p class="victory-text">Please proceed to mint your NFT.</p>
            <div class="victory-buttons">
                <button id="mint-nft-button" class="heavy-button">
                    Mint NFT for $0.25
                </button>
                <button id="play-again-button" class="heavy-button">
                    Play Again
                </button>
            </div>
        </div>
    `;
    nftMintingPrompt.classList.remove("hidden");
    console.log("Minting dialog shown, attaching event listeners");
    document
        .getElementById("mint-nft-button")
        .addEventListener("click", mintNFT);
    document
        .getElementById("play-again-button")
        .addEventListener("click", initGame);
}

async function showLoginOption() {
    clearOverlay();
    overlay.classList.remove("hidden");
    message.textContent = "Congratulations! You've won!";
    nftMintingPrompt.innerHTML = `
        <p style="text-align: center; margin-bottom: 20px;">Log in with HandCash to mint your NFT for $0.25.</p>
        <div class="mint-options" style="text-align: center;">
            <div class="login-mint-button-wrapper" style="margin-bottom: 10px;">
                <button id="login-mint-button" class="heavy-button">Log in with HandCash to Mint NFT</button>
            </div>
            <div class="play-again-button-wrapper">
                <button id="play-again-button" class="heavy-button">Play Again</button>
            </div>
        </div>
    `;
    nftMintingPrompt.classList.remove("hidden");

    document
        .getElementById("login-mint-button")
        .addEventListener("click", startAuth);
    document
        .getElementById("play-again-button")
        .addEventListener("click", initGame);
}

function clearOverlay() {
    message.textContent = "";
    nftMintingPrompt.classList.add("hidden");
    overlay.classList.add("hidden");
}

function mintNFT() {
    const isAuthenticated = localStorage.getItem("handcashAuthenticated");
    if (isAuthenticated !== "true") {
        console.error("User not authenticated");
        alert("You need to log in with HandCash first.");
        return;
    }

    console.log("Starting NFT minting process...");

    fetch('/pay', { credentials: 'include' })
        .then((response) => {
            console.log("Pay endpoint response status:", response.status);
            if (!response.ok) {
                throw new Error(
                    `Server responded with status: ${response.status}`,
                );
            }
            return response.json();
        })
        .then((data) => {
            console.log("Payment request data received:", data);
            if (data.paymentUrl) {
                console.log("Redirecting to payment URL:", data.paymentUrl);
                window.location.href = data.paymentUrl;
            } else {
                throw new Error("No payment URL provided");
            }
        })
        .catch((error) => {
            console.error("Error during payment process:", error);
            console.error("Error details:", {
                message: error.message,
                stack: error.stack,
            });
            alert("An error occurred during payment. Please try again later.");
        });
}

function handleHandCashRedirect() {
    console.log("Checking for HandCash redirect...");
    const urlParams = new URLSearchParams(window.location.search);
    const authenticated = urlParams.get("authenticated");

    if (authenticated === "true") {
        console.log("User authenticated via HandCash");
        localStorage.setItem("handcashAuthenticated", "true");
        window.history.replaceState({}, document.title, "/");
        updateLoginButtonState();

        if (matchCount === cardArray.length) {
            console.log("Game won, showing minting option");
            showMintingOption();
        }
    }
}

function updateLoginButtonState() {
    const authButton = document.getElementById("auth-button");
    if (authButton) {
        const isAuthenticated = localStorage.getItem("handcashAuthenticated");
        if (isAuthenticated === "true") {
            authButton.textContent = "Logged in";
            authButton.disabled = true;
            authButton.style.backgroundColor = "#4CAF50";
        }
    }
}

// Initialize game and handle redirects
initGame();
handleHandCashRedirect();

// Music Player initialization
const tracks = [
    {
        name: "Haunted Frequencies",
        file: "/assets/audio/Haunted Frequencies.mp3",
    },
    { name: "Haunted Jam", file: "/assets/audio/Haunted Jam.mp3" },
    {
        name: "Shadows in the Dark",
        file: "/assets/audio/Shadows in the Dark.mp3",
    },
    {
        name: "Whispers in the Dark",
        file: "/assets/audio/Whispers in the Dark.mp3",
    },
];

let currentTrackIndex = 0;
let audio = null;
let isPlaying = false;

function initMusicPlayer() {
    const toggleButton = document.getElementById("toggle-player");
    const nextButton = document.getElementById("next-track");
    const trackInfo = document.getElementById("current-track");

    // Initial track setup
    audio = new Audio(tracks[0].file);
    trackInfo.textContent = tracks[0].name;

    function togglePlay() {
        if (isPlaying) {
            audio.pause();
            toggleButton.classList.remove("playing");
        } else {
            audio.play().catch((error) => {
                console.log("Error playing audio:", error);
            });
            toggleButton.classList.add("playing");
        }
        isPlaying = !isPlaying;
    }

    function nextTrack() {
        // Stop current track
        audio.pause();
        isPlaying = false;
        toggleButton.classList.remove("playing");

        // Move to next track
        currentTrackIndex = (currentTrackIndex + 1) % tracks.length;

        // Set up new track
        audio.src = tracks[currentTrackIndex].file;
        trackInfo.textContent = tracks[currentTrackIndex].name;
    }

    // Event Listeners
    toggleButton.addEventListener("click", togglePlay);
    nextButton.addEventListener("click", nextTrack);

    // Handle track ending
    audio.addEventListener("ended", nextTrack);
}

// Initialize Lucide icons and music player when document is ready
document.addEventListener("DOMContentLoaded", () => {
    if (window.lucide) {
        window.lucide.createIcons();
    }
    initMusicPlayer();
    updateLoginButtonState(); // Add this line to check login state on page load
});
