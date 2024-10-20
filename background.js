chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
});

chrome.commands.onCommand.addListener((command) => {
    console.log("Command received: ", command);
    if (command === "run-chat") {
      console.log("Running showPopup");
      showPopup();
    } else {
      console.log(`Command ${command} not found`);
    }
  });
  

function showPopup() {
  const query = { active: true, currentWindow: true };
  chrome.tabs.query(query, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      tabTitle: tabs[0].title,
    });
  });
}
