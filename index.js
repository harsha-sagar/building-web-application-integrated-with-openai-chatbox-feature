// configure here API_KEY, referring to your openai account
const API_URL = "https://api.openai.com/v1/chat/completions";

const promptInput = document.getElementById("promptInput");
const generateBtn = document.getElementById("generateBtn");
const stopBtn = document.getElementById("stopBtn");
const resultText = document.getElementById("resultText");

let controller = null;

const generate = async () => {
  if (!promptInput.value) {
    alert("enter the prompt");
    return;
  }

  generateBtn.disabled = true;
  resultText.innerHTML = "generating...";

  stopBtn.disabled = false;

  controller = new AbortController();
  const signal = controller.signal;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: promptInput.value }],
        stream: true,
      }),
      signal,
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    resultText.innerHTML = "";

    while (true) {
      const chunk = await reader.read();
      const { done, value } = chunk;

      const decodedValue = decoder.decode(value);
      const lines = decodedValue.split("\n");
      const parsedLines = lines
        .map((line) => line.replace(/^data: /, "").trim())
        .filter((line) => line !== "" && line !== "[DONE]")
        .map((line) => JSON.parse(line));
      for (const parsedLine of parsedLines) {
        const { choices } = parsedLine;
        const { delta } = choices[0];
        const { content } = delta;
        if (content) {
          resultText.innerHTML += content;
        }
      }

      if (done) {
        break;
      }
    }
  } catch (error) {
    if (signal.aborted) {
      resultText.innerHTML = "request aborted...";
    } else {
      resultText.innerHTML = "error occured...";
      console.error("error: ", error);
    }
  } finally {
    generateBtn.disabled = false;
    stopBtn.disabled = true;
    controller = null;
  }
};

const stop = () => {
  if (controller) {
    controller.abort();
    controller = null;
  }
};

generateBtn.addEventListener("click", generate);
promptInput.addEventListener("keyup", (event) => {
  if (event.key === "Enter") {
    generate();
  }
});

stopBtn.addEventListener("click", stop);
