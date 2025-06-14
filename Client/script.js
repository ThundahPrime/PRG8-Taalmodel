const form = document.getElementById("chatForm");
const chatbox = document.getElementById("chatbox");
const field = document.getElementById("chatfield");
const docMode = document.getElementById("docMode");

const messages = [];

form.addEventListener("submit", askQuestion);

async function askQuestion(e) {
  e.preventDefault();

  const userMessage = field.value.trim();
  if (!userMessage) return;

  addMessageToChat("You", userMessage);
  field.value = "";
  field.disabled = true;
  form.querySelector("button").disabled = true;

  const aiBubble = document.createElement("div");
  aiBubble.className = "bubble ai";
  aiBubble.innerHTML = "<strong>AI ❤️:</strong> <span class='stream'></span>";
  chatbox.appendChild(aiBubble);
  const streamSpan = aiBubble.querySelector(".stream");

  try {
    if (docMode.checked) {
      // Ask about the document
      const response = await fetch("http://localhost:3000/ask-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMessage }),
      });

      const text = await response.text();
      streamSpan.textContent = text;
    } else {
      // Regular romantic AI chat
      messages.push(["human", userMessage]);

      const options = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      };

      const response = await fetch("http://localhost:3000/ask", options);

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let aiText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        aiText += chunk;
        streamSpan.textContent = aiText;
        chatbox.scrollTop = chatbox.scrollHeight;
        await new Promise((resolve) => setTimeout(resolve, 750));
      }

      messages.push(["ai", aiText]);
    }
  } catch (err) {
    console.error(err);
    streamSpan.textContent = "Sorry, something went wrong.";
  } finally {
    field.disabled = false;
    form.querySelector("button").disabled = false;
    field.focus();
  }
}

function addMessageToChat(sender, text) {
  const bubble = document.createElement("div");
  bubble.className = sender === "You" ? "bubble human" : "bubble ai";
  bubble.innerHTML = `<strong>${sender}:</strong> ${text}`;
  chatbox.appendChild(bubble);
  chatbox.scrollTop = chatbox.scrollHeight;
}