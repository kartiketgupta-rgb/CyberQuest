const SYSTEM_PROMPT = `You are CyberShield AI — a cool, knowledgeable cybersecurity expert built into CyberQuest, a cybersecurity learning game.

Your personality: friendly, sharp, slightly witty, never condescending. You talk like someone who genuinely loves security and wants others to get it too.

Rules:
- Keep responses SHORT — 2 to 4 sentences max unless the user asks for more detail.
- Use simple, clear language. Define jargon when you use it.
- Add 1-2 relevant emojis per message to keep it engaging.
- If asked how to attack or hack systems maliciously, redirect to the defensive/learning angle only.
- Topics you cover: phishing, malware, ransomware, passwords, 2FA, VPNs, firewalls, encryption, social engineering, data privacy, safe browsing, network security, and any cybersecurity topic.
- You may reference the CyberQuest game to make things feel cohesive.`;


// ================================
// CHAT HISTORY
// ================================

let chatHistory = [];


// ================================
// WELCOME MESSAGE
// ================================

window.addEventListener("DOMContentLoaded", () => {

    setTimeout(() => {

        appendMessage(
            "ai",
            "Hey! 👋 I'm CyberShield AI — your personal cybersecurity expert. Ask me anything about staying safe online, cyber threats, or how to level up your security game. What's on your mind? 🛡️"
        );

    }, 600);

});


// ================================
// ENTER KEY SUPPORT
// ================================

document.getElementById("chatInput").addEventListener("keydown", (e) => {

    if (e.key === "Enter") {
        sendMessage();
    }

});


// ================================
// SEND MESSAGE
// ================================

async function sendMessage() {

    const input = document.getElementById("chatInput");

    const text = input.value.trim();

    // Don't send empty messages
    if (!text) return;

    // Clear input
    input.value = "";

    // Show user message
    appendMessage("user", text);

    // Hide suggestion chips
    hideChips();

    // Show typing animation
    showTyping();


    try {

        // Send message to Node.js backend
        const res = await fetch("http://localhost:3000/api/chat", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                message: text,

                // Send previous conversation
                history: chatHistory

            })

        });


        const data = await res.json();

        console.log("CyberShield AI:", data);


        // Check backend response
        if (!res.ok) {

            throw new Error(
                data.error || "Gemini request failed"
            );

        }


        // Get AI reply
        const reply =
            data.reply ||
            "Something went wrong. Try again! 🔄";


        // Save user message in history
        chatHistory.push({

            role: "user",

            parts: [
                {
                    text: text
                }
            ]

        });


        // Save AI response in history
        chatHistory.push({

            role: "model",

            parts: [
                {
                    text: reply
                }
            ]

        });


        // Remove typing animation
        hideTyping();


        // Show AI response
        appendMessage("ai", reply);


    } catch (error) {

        console.error("Gemini error:", error);


        // Remove typing animation
        hideTyping();


        // Show error message
        appendMessage(
            "ai",
            "⚠️ Couldn't reach CyberShield AI right now. Make sure the backend is running and try again."
        );

    }

}


// ================================
// SUGGESTION CHIP
// ================================

function sendChip(text) {

    const input = document.getElementById("chatInput");

    input.value = text;

    sendMessage();

}


// ================================
// APPEND MESSAGE
// ================================

function appendMessage(role, text) {

    const container =
        document.getElementById("chatMessages");


    const div = document.createElement("div");


    div.className =
        `chat-bubble ${
            role === "ai"
                ? "bubble-ai"
                : "bubble-user"
        }`;


    // Basic bold markdown support
    text = text.replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>"
    );


    // Convert new lines to <br>
    text = text.replace(/\n/g, "<br>");


    div.innerHTML = text;


    container.appendChild(div);


    // Scroll to latest message
    container.scrollTop =
        container.scrollHeight;

}


// ================================
// TYPING INDICATOR
// ================================

function showTyping() {

    const container =
        document.getElementById("chatMessages");


    // Don't create duplicate typing indicators
    if (document.getElementById("typingIndicator")) {
        return;
    }


    const div = document.createElement("div");


    div.className =
        "chat-bubble bubble-ai typing-indicator";


    div.id = "typingIndicator";


    div.innerHTML = `
        <span></span>
        <span></span>
        <span></span>
    `;


    container.appendChild(div);


    container.scrollTop =
        container.scrollHeight;

}


// ================================
// HIDE TYPING INDICATOR
// ================================

function hideTyping() {

    const indicator =
        document.getElementById("typingIndicator");


    if (indicator) {
        indicator.remove();
    }

}


// ================================
// HIDE SUGGESTION CHIPS
// ================================

function hideChips() {

    const chips =
        document.getElementById("chatChips");


    if (chips) {
        chips.style.display = "none";
    }

}