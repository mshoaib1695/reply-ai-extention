
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

document.addEventListener('DOMContentLoaded', async function() {

    const storedTone = await getLocalStorage('tone');
    const storedComment = await getLocalStorage('comment');
    const storedKey = await getLocalStorage('key');
    const storedgenerateOnCommentboxClick = await getLocalStorage('generateOnCommentboxClick');
    const storedEmogis = await getLocalStorage('emogis');
    const storedHashtags = await getLocalStorage('hashtags');

    if (storedTone?.data) {
        document.getElementById('tone').value = storedTone?.data;
    }

    if (storedComment?.data) {
        document.getElementById('comment').value = storedComment?.data;
    }

    if (storedKey?.data) {
        document.getElementById('key').value = storedKey?.data;
    }
    if (storedHashtags?.data) {
        document.getElementById('hashtags').checked = (storedHashtags?.data === 'true');
    }
    if (storedEmogis?.data) {
        document.getElementById('emojis').checked = (storedEmogis?.data === 'true');
    }
    if (storedgenerateOnCommentboxClick?.data) {
        document.getElementById('switch').checked = (storedgenerateOnCommentboxClick?.data === 'true');
    }

    // Set up the save button event listener
    document.getElementById('save').addEventListener('click', async function() {
        const tone = document.getElementById('tone').value;
        const comment = document.getElementById('comment').value;
        const key = document.getElementById('key').value;
        const generateOnCommentboxClick = document.getElementById('switch').checked;
        const emogis = document.getElementById('emojis').checked;
        const hashtags = document.getElementById('hashtags').checked;

        // Store the form data in localStorage
        await setLocalStorage('tone', tone);
        await setLocalStorage('comment', comment);
        await setLocalStorage('key', key);
        await setLocalStorage('generateOnCommentboxClick', generateOnCommentboxClick ? 'true' : 'false');
        await setLocalStorage('emogis', emogis ? 'true' : 'false');
        await setLocalStorage('hashtags', hashtags ? 'true' : 'false');
        await window.close();
    });
});
