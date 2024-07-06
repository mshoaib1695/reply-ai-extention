function clearAndTypeText(text, element) {
  element.textContent = ""; // Clear existing text
  element.dispatchEvent(new Event("input", { bubbles: true })); // Trigger input event after clearing to ensure state updates

  let index = 0;
  const delay = 10; // Delay in milliseconds between key presses

  function typeCharacter() {
    if (index < text.length) {
      const char = text.charAt(index);
      element.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: char,
          bubbles: true,
          cancelable: true,
        })
      );
      element.dispatchEvent(
        new KeyboardEvent("keypress", {
          key: char,
          bubbles: true,
          cancelable: true,
        })
      );
      element.dispatchEvent(
        new InputEvent("input", { data: char, bubbles: true })
      );
      element.textContent += char;
      index++;
      if (index < text.length) {
        setTimeout(typeCharacter, delay);
      }
    } else {
      element.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  typeCharacter();
}

function sendMessageAsync(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, function (response) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

async function getLocalStorage(key) {
  try {
    const response = await sendMessageAsync({
      type: "getLocalStorage",
      key: key,
    });
    return response;
  } catch (error) {
    console.error("Error getting value from localStorage:", error);
    return null;
  }
}

async function setLocalStorage(key, value) {
  try {
    await sendMessageAsync({
      type: "setLocalStorage",
      key: key,
      value: value,
    });
    console.log("Value set successfully in localStorage");
  } catch (error) {
    console.error("Error setting value in localStorage:", error);
  }
}

function createReplyButton(postContentElement) {
  const existingButton = postContentElement.querySelector(".reply-bot-button");
  if (existingButton) return;
  const button = document.createElement("button");
  const imgIcon = document.createElement("img");
  imgIcon.src = chrome.runtime.getURL("icon.png");
  imgIcon.style = "height: 24px; margin-top: 3px;";
  button.appendChild(imgIcon);
  button.classList.add("reply-bot-button");

  button.onclick = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    const postContent = postContentElement.querySelector(
      ".feed-shared-update-v2__description-wrapper"
    ).innerText;

    const tone = await getLocalStorage("tone");
    const key = await getLocalStorage("key");
    const comment = await getLocalStorage("comment");
    const emogis = await getLocalStorage("emogis");
    const hashtags = await getLocalStorage("hashtags");

    chrome.runtime.sendMessage(
      {
        type: "fetchReply",
        promptText: postContent,
        tone: tone?.data,
        comment: comment?.data,
        key: key?.data,
        emogis: emogis?.data,
        hashtags: hashtags?.data,
      },
      function (response) {
        if (response && response.reply) {
          clearAndTypeText(
            response.reply,
            postContentElement.querySelector(".ql-container .ql-editor")
          );
        }
      }
    );
  };

  const commentsBox = postContentElement.querySelector(
    ".comments-comment-texteditor .display-flex .mlA"
  );
  if (commentsBox) {
    commentsBox.insertBefore(button, commentsBox.firstChild);
  }
}

document.addEventListener("click", async function (e) {
  const postWrapper = e.target.closest(".feed-shared-update-v2");
  if (postWrapper) {
    createReplyButton(postWrapper);
  }

  if (e.target.matches(".open-modal-button")) {
    checkModalElement();
  }

  const tone = await getLocalStorage("tone");
  const key = await getLocalStorage("key");

  const generateOnCommentboxClick = await getLocalStorage(
    "generateOnCommentboxClick"
  );
  const emogis = await getLocalStorage("emogis");
  const hashtags = await getLocalStorage("hashtags");

  const comment = await getLocalStorage("comment");

  if (e.target.closest(".ql-editor")) {
    if (generateOnCommentboxClick.data != "true") {
      return;
    }
    if (postWrapper) {
      const postContentText = postWrapper.querySelector(
        ".feed-shared-update-v2__description-wrapper"
      ).innerText;

      chrome.runtime.sendMessage(
        {
          type: "fetchReply",
          promptText: postContentText,
          tone: tone?.data,
          comment: comment?.data,
          key: key?.data,
          emogis: emogis?.data,
          hashtags: hashtags?.data,
        },
        function (response) {
          console.log("--- Generated reply ---", response.reply);
          if (response && response.reply) {
            let editorArea = e.target; // Reference to the actual clicked editable area
            clearAndTypeText(response.reply, editorArea);
            console.log("--- Generated Reply Injected ---");
          } else {
            console.log("No reply received or response was empty.");
          }
        }
      );
    }
    const postContentText = e.target
      .closest(".feed-shared-update-detail-viewer__overflow-content")
      .querySelector(".feed-shared-update-v2__description-wrapper").innerText;

    chrome.runtime.sendMessage(
      {
        type: "fetchReply",
        promptText: postContentText,
        tone: tone?.data,
        comment: comment?.data,
        key: key?.data,
        emogis: emogis?.data,
        hashtags: hashtags?.data,
      },
      function (response) {
        console.log("--- Generated reply ---", response.reply);
        if (response && response.reply) {
          let editorArea = e.target; // Reference to the actual clicked editable area
          clearAndTypeText(response.reply, editorArea);
          console.log("--- Generated Reply Injected ---");
        } else {
          console.log("No reply received or response was empty.");
        }
      }
    );
  }
});

// document.addEventListener("DOMContentLoaded", function () {
//   console.log("DOMContentLoaded event triggered!");
//   console.log(
//     document.querySelector(".msg-form__message-texteditor")
//   )
//   document
//     .querySelectorAll(".feed-shared-update-v2")
//     .forEach(createReplyButton);
// });

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes) {
      mutation.addedNodes.forEach((node) => {
        if (
          node.nodeType === Node.ELEMENT_NODE &&
          node.matches(".feed-shared-update-v2")
        ) {
          createReplyButton(node);
        }
      });
    }
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

let modalElement = null; // Track the modal element

function onArtdecoModalContentLoaded(element) {
  createReplyButton(element);
}

function checkModalElement() {
  modalElement = document.querySelector(".artdeco-modal__content");
  if (modalElement) {
    onArtdecoModalContentLoaded(modalElement);
  }
}

const modalObserver = new MutationObserver(function (mutationsList, observer) {
  mutationsList.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1 && node.matches(".artdeco-modal__content")) {
        modalElement = node;
        onArtdecoModalContentLoaded(modalElement);
      }
      if (
        node.nodeType === 1 &&
        node.matches(".msg-form__message-texteditor")
      ) {
        const postContentElement = document.querySelector(".msg-form__footer");
        const existingButton =
          postContentElement.querySelector(".reply-bot-button");
        if (existingButton) return;

        const button = document.createElement("button");
        const imgIcon = document.createElement("img");
        imgIcon.src = chrome.runtime.getURL("icon.png");
        imgIcon.style = "height: 24px; margin-top: 3px;";
        button.appendChild(imgIcon);
        button.classList.add("reply-bot-button");

        button.onclick = async (event) => {
          event.preventDefault();
          event.stopPropagation();

          let chatListElements = document.querySelectorAll(
            "li.msg-s-message-list__event"
          );
          console.log("chatListElements", chatListElements);
          const postContent = chatListElements[
            chatListElements.length - 1
          ].querySelector(".msg-s-event__content").innerText;
          console.log("chatListElements", postContent);

          const tone = await getLocalStorage("tone");
          const key = await getLocalStorage("key");
          const comment = await getLocalStorage("comment");
          const emogis = await getLocalStorage("emogis");
          const hashtags = await getLocalStorage("hashtags");

          chrome.runtime.sendMessage(
            {
              type: "fetchReply",
              promptText: postContent,
              tone: tone?.data,
              comment: comment?.data,
              key: key?.data,
              emogis: emogis?.data,
              hashtags: hashtags?.data,
            },
            function (response) {
              if (response && response.reply) {
                let messageInput = document.querySelector(
                  ".msg-form__contenteditable"
                );
                messageInput.focus();
                // clearAndTypeText(
                //   response.reply,
                //   messageInput
                // );
                document.execCommand("insertText", false, response.reply);
              }
            }
          );
        };

        const commentsBox = postContentElement.children[0];

        if (commentsBox) {
          // commentsBox.insertBefore(button);
          commentsBox.insertBefore(button, commentsBox.firstChild);
        }
      }
    });
  });
});

modalObserver.observe(document.body, { childList: true, subtree: true });

checkModalElement();

let textEditorElement = document.querySelector(".msg-form__message-texteditor");

function checkChatElement() {
  textEditorElement = document.querySelector(".msg-form__message-texteditor");
  if (textEditorElement) {
    console.log("textEditorElement 1", textEditorElement);
  }
}

checkChatElement();
