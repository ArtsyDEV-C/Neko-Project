document.addEventListener("DOMContentLoaded", function () {
    const chatbox = document.getElementById("chatbox");
    const input = document.getElementById("chat-input");
    const sendButton = document.getElementById("send-btn");

    async function sendMessage() {
        const userMessage = input.value.trim();
        if (userMessage === "") return;

        // Display user message
        chatbox.innerHTML += `<div class="message user">${userMessage}</div>`;

        try {
            // Send request to chatbot API
            const response = await fetch("/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMessage })
            });

            const data = await response.json();
            const botReply = data?.response?.trim()

         // Display chatbot response
            chatbox.innerHTML += `<div class="message bot">${botReply}</div>`;

            // Scroll to bottom
            chatbox.scrollTop = chatbox.scrollHeight;

            // Clear input
            input.value = "";
        } catch (error) {
            console.error("Chatbot Error:", error);
            chatbox.innerHTML += `<div class="message bot">❌ Error: Unable to fetch response.</div>`;
            
        }
    }

    sendButton.addEventListener("click", sendMessage);
});
      // Display chatbot response
      chatbox.innerHTML += `<div class="message bot">${botReply}</div>`;
      
      // Scroll to bottom
      chatbox.scrollTop = chatbox.scrollHeight;
      
      // Clear input
      input.value = "";
    });
  });
  
  
