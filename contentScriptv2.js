console.log("--- Smart Reply Bot Running ---");

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
      ); // Use input event for actual text input
      element.textContent += char; // Directly manipulate textContent for typing effect
      index++;
      if (index < text.length) {
        setTimeout(typeCharacter, delay);
      }
    } else {
      element.dispatchEvent(new Event("input", { bubbles: true })); // Final input event to trigger any bindings
    }
  }

  typeCharacter();
}

document.addEventListener("click", function (e) {
  // Log click events to identify if script is detecting clicks
  // console.log('Click event detected on the page');

  // Check if the clicked element is part of a LinkedIn editor and editable
  if (e.target.closest(".ql-editor")) { 
    console.log("--- Click detected on comment box ---");
    // Icon Code

    // Start by finding the nearest comment container or post container
    let commonAncestor = e.target.closest("article, .feed-shared-update-v2");

    const button = document.createElement("button");
    const imgIcon = document.createElement("img");
    imgIcon.src = chrome.runtime.getURL("icon.png");
    imgIcon.style = "height: 24px; margin-top: 3px;";
    button.appendChild(imgIcon);
    button.style = "margin-right: 10px";
    button.classList.add("reply-bot-button");
    button.id = "reply-bot-button";
    const existingButton = commonAncestor.querySelector(".reply-bot-button");
    const commentsBox = commonAncestor
      .querySelector(".comments-comment-texteditor")
      .querySelector(".display-flex");
    if (commentsBox && !existingButton) {
      commentsBox.appendChild(button);
    }

    // From the common ancestor, find the specific description container.
    let descriptionContainer = commonAncestor
      ? commonAncestor.querySelector(
          ".feed-shared-update-v2__description-wrapper"
        )
      : null;

    // Extract text only if we successfully find the description container
    const postContentText = descriptionContainer
      ? descriptionContainer.innerText.trim()
      : "No content found";
    console.log("--- Post content detected ---");
    console.log(postContentText);
    button.onclick = () => {
      chrome.runtime.sendMessage(
        { type: "fetchReply", promptText: postContentText },
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
    };
    chrome.runtime.sendMessage(
      { type: "fetchReply", promptText: postContentText },
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
