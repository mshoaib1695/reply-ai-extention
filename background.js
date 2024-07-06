const API_KEY = "";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const KEY = request.key ? request.key : API_KEY;
  const hashtags = request.hashtags ? " Use hashtags." : " Do not use hashtags";
  const emogis = request.emogis ? "Use emogis." : "Do not use emogis";
  let content = request.comment
    ? request.comment
    : "You are an assistant trained to generate responses that are not only professional and friendly but also engaging and enthusiastic, mimicking a high-quality human interaction on social media. Make sure the reponses are not too long and most cases two liner.";
  content = content + hashtags + emogis;
  console.log("Received message from content script:", request);
  if (request.type === "fetchReply") {
    // sendResponse({
    //   reply: `Apps like video streaming services, online gaming, or social media platforms with auto-play features can quickly consume data. It's essential to monitor data usage regularly and consider using data-saving settings or limiting background data for such apps to avoid exceeding your data plan.`,
    // });

    fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: content,
          },
          { role: "user", content: request.promptText },
        ],
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("API Response:", data);
        sendResponse({ reply: data.choices[0].message.content });
      })
      .catch((error) => console.error("API Error:", error));
  }
  if (request.type === "getLocalStorage") {
    chrome.storage.local.get(request.key, function (result) {
      if (chrome.runtime.lastError) {
        sendResponse({ data: null });
        // console.error(chrome.runtime.lastError);
      } else {
        console.log("result: ", result);
        sendResponse({ data: result[request.key] });
      }
    });
  }
  if (request.type === "setLocalStorage") {
    chrome.storage.local.set({ [request.key]: request.value }, function () {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        sendResponse({
          error: chrome.runtime.lastError,
        });
      } else {
        sendResponse({
          message: "Value set successfully in chrome.storage.local",
        });
        console.log("Value set successfully in chrome.storage.local");
      }
    });
  }

  return true;
});
