const apiKey = ""; // YOUR OPEN AI API KEY
const apiUrl = "https://api.openai.com/v1/chat/completions";

const HISTORY_LENGTH = 10;

const closePopup = () => {
  notification.style.display = "none";
  suggestionsContainer.innerHTML = "";
};

const notification = document.createElement("div");
notification.className = "acho-notification";

// Notification text.
const suggestionsContainer = document.createElement("div");
notification.appendChild(suggestionsContainer);

const closeBtn = document.createElement("button");
closeBtn.textContent = "x";
closeBtn.addEventListener("click", closePopup);
notification.appendChild(closeBtn);

// Add to current page.
document.body.appendChild(notification);

function extractMessages() {
  // Select all message elements
  const messageElements = document.querySelectorAll("div[data-id]");

  // Initialize an empty array to store messages
  const messages = [];

  // Iterate through each message element and extract the sender and message
  messageElements.forEach((element, index) => {
    if (index === HISTORY_LENGTH) return;
    const senderSpan = element.querySelector(
      "div._amk6._amlo span[aria-label]"
    );
    const sender = senderSpan
      ? senderSpan.getAttribute("aria-label").replace(":", "")
      : "Unknown";

    // Get the message content
    const messageSpan = element.querySelector(
      "div.copyable-text ._akbu span.selectable-text"
    );
    const message = messageSpan
      ? messageSpan.textContent.trim()
      : "No message content";

    // Push the message into the array as an object
    messages.push({
      sender: sender,
      message: message,
    });
  });

  return messages;
}
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const notification = document.getElementsByClassName("acho-notification")[0];
  notification.style.display = "flex";

  const suggestionsContainer = notification.getElementsByTagName("div")[0];
  suggestionsContainer.innerHTML = "Generating response...";

  const messages = extractMessages();

  const formattedMessages = messages.map(
    (message) => `[Sender: ${message.sender}#Message: ${message.message}]`
  );

  fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an AI embedded in a chat app. I will pass you a context of the latest messages of the chat labelled by who said it, and you will give me options on how to appropriately respond in the next message, provide 3 options, each option delimited by "###" so that i can parse the options easily. Do not try to be politically correct.
          
          Example (You in this case refers to the device owner i.e me): 
          [Sender: Steve#Message: Yo man],[Sender: You#Message: What's up?],[Sender: You#Message: Nothing much]

          Output: 
          Geez man how about you ask how I'm doing###Cool###Did you see that rocket launch?
          `,
        },
        { role: "user", content: formattedMessages.toString() },
      ],
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      const response = data.choices[0].message.content;
      const suggestions = response.split("###");

      suggestionsContainer.innerHTML = "";

      suggestions.forEach((suggestion) => {
        const suggestionParagraph = document.createElement("p");
        suggestionParagraph.innerHTML = suggestion;
        suggestionParagraph.addEventListener("click", () => {
          navigator.clipboard.writeText(suggestion);
          suggestionsContainer.innerHTML = "";
          suggestionsContainer.innerHTML = "Copied text";
          setTimeout(() => {
            closePopup();
          }, 3000);
        });
        suggestionsContainer.appendChild(suggestionParagraph);
      });
    })
    .catch((error) => console.error(error));

  sendResponse({ message: "Notification shown" });

  return true;
});
