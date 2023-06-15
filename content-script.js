(async function () {
  const formatDate = (date) => Math.floor(date.getTime() / 1000);
  const someWeeksAgo = formatDate(
    new Date(new Date() - 2 * 7 * 24 * 60 * 60 * 1000)
  );

  const streamerDataCache = new Map();
  const rarityMultipliers = {
    common: 1,
    uncommon: 1.2,
    rare: 1.4,
    epic: 1.6,
    legendary: 1.8,
  };

  function getStreamerName(imgSrc) {
    const regex = /\/fantastreamer-cards\/(.*?)\//;
    const match = imgSrc.match(regex);
    return match && match[1];
  }

  function getRarity(imgSrc) {
    const regex = /\/(common|uncommon|rare|epic|legendary)\//;
    const match = imgSrc.match(regex);
    return match && match[1];
  }

  async function fetchStreamerData(streamerName) {
    if (!streamerDataCache.has(streamerName)) {
      try {
        const response = await fetch(
          `https://fanta.playerself.com/streamer?startDate=${someWeeksAgo}&name=${streamerName}`
        );
        const data = await response.json();
        streamerDataCache.set(streamerName, data[0]);
      } catch (error) {
        console.error(`Error fetching data for ${streamerName}:`, error);
        return null;
      }
    }
    return streamerDataCache.get(streamerName);
  }

  function updateStreamerComponent(streamerComponent, streamerData, rarity) {
    const img = streamerComponent.querySelector("img");
    const infoWrapper =
      streamerComponent.querySelector(".info-wrapper") ||
      document.createElement("div");
    const scoreLine = document.createElement("div");
    const hourLine = document.createElement("div");

    infoWrapper.innerHTML = "";
    infoWrapper.classList.add("info-wrapper");

    if (streamerData) {
      const multiplier = rarityMultipliers[rarity] || 1;
      const score = streamerData.score * multiplier;
      scoreLine.textContent = `S: ${score.toFixed(1)}`;
      hourLine.textContent = `H: ${streamerData.streams.hour_streamed.toFixed(
        1
      )}`;
      streamerComponent.setAttribute("data-score", score);
    } else {
      scoreLine.textContent = `S: 0`;
      hourLine.textContent = `H: 0`;
      streamerComponent.setAttribute("data-score", 0);
    }

    infoWrapper.appendChild(scoreLine);
    infoWrapper.appendChild(hourLine);
    streamerComponent.appendChild(infoWrapper);
  }

  function createMaxScoreText() {
    const container = document.querySelector(".grid");
    const maxScoreText = document.createElement("h2");
    maxScoreText.id = "max-score-text";
    maxScoreText.style.textAlign = "center";
    maxScoreText.style.gridRow = "1";
    maxScoreText.style.gridColumn = "span 5";
    container.prepend(maxScoreText);
  }

  function updateMaxScoreText() {
    const maxScoreText = document.querySelector("#max-score-text");
    const streamerComponents = Array.from(
      document.querySelectorAll(".relative:not(.group)")
    );
    const uniqueStreamers = new Set(
      streamerComponents.map((c) =>
        getStreamerName(
          (
            c.querySelector("img:nth-of-type(2)") ||
            c.querySelector("img:nth-of-type(1)")
          ).src
        )
      )
    );
    const scores = Array.from(uniqueStreamers)
      .map((streamer) =>
        parseFloat(
          document
            .querySelector(`.relative[data-streamer="${streamer}"]`)
            .getAttribute("data-score")
        )
      )
      .sort((a, b) => b - a);
    const sumTop5 = scores.slice(0, 5).reduce((a, b) => a + b, 0);
    maxScoreText.textContent = `Current max: ${sumTop5.toFixed(1)}`;
  }

  function sortStreamerComponents() {
    const firstStreamerComponent = document.querySelectorAll(
      ".relative:not(.group)"
    );
    if (!firstStreamerComponent) return;
    const container = firstStreamerComponent.parentElement;
    const streamerComponents = Array.from(
      container.querySelectorAll(".relative:not(.group)")
    );

    streamerComponents.sort((a, b) => {
      const scoreA = parseFloat(a.getAttribute("data-score"));
      const scoreB = parseFloat(b.getAttribute("data-score"));
      return scoreB - scoreA;
    });

    streamerComponents.forEach((component) => container.appendChild(component));
  }

  async function main() {
    createMaxScoreText();

    const streamerComponents = document.querySelectorAll(
      ".relative:not(.group)"
    );

    for (const streamerComponent of streamerComponents) {
      const img =
        streamerComponent.querySelector("img:nth-of-type(2)") ||
        streamerComponent.querySelector("img:nth-of-type(1)");
      const streamerName = getStreamerName(img.src);
      const rarity = getRarity(img.src);

      if (streamerName) {
        const streamerData = await fetchStreamerData(streamerName);
        updateStreamerComponent(streamerComponent, streamerData, rarity);
        streamerComponent.setAttribute("data-streamer", streamerName);
      }
    }

    sortStreamerComponents();
    updateMaxScoreText();
  }

  window.addEventListener("load", main);
  main();

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "attributes" && mutation.attributeName === "src") {
        main();
      }
    });
  });
  const images =
    document.querySelectorAll(".relative:not(.group) img:nth-of-type(2)") ||
    document.querySelectorAll(".relative:not(.group) img:nth-of-type(1)");
  images.forEach((img) => observer.observe(img, { attributes: true }));
})();
