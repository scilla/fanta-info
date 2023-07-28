(async function () {
  const formatDate = (date) => Math.floor(date.getTime() / 1000);
  const someWeeksAgo = (n) => someDaysAgo(n * 7);
  const someDaysAgo = (n) =>
    formatDate(new Date(new Date() - n * 24 * 60 * 60 * 1000));
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

  async function fetchStreamerData(streamerName, days) {
    const cacheKey = `${streamerName}_${days}`;
    if (!streamerDataCache.has(cacheKey)) {
      try {
        const response = await fetch(
          `https://fanta.playerself.com/streamer?startDate=${someDaysAgo(
            days
          )}&name=${streamerName}`
        );
        const data = await response.json();
        streamerDataCache.set(cacheKey, data[0]);
      } catch (error) {
        console.error(`Error fetching data for ${streamerName}:`, error);
        return null;
      }
    }
    return streamerDataCache.get(cacheKey);
  }

  function updateStreamerComponent(
    streamerComponent,
    streamerData3Days,
    streamerData7Days,
    rarity
  ) {
    const img = streamerComponent.querySelector("img");
    const infoWrapper =
      streamerComponent.querySelector(".info-wrapper") ||
      document.createElement("div");
    const scoreLine = document.createElement("div");
    const scorePreviousLine = document.createElement("div");
    const hourLine = document.createElement("div");
    const trendLine = document.createElement("div");

    infoWrapper.innerHTML = "";
    infoWrapper.classList.add("info-wrapper");

    if (streamerData3Days && streamerData7Days) {
      const multiplier = rarityMultipliers[rarity] || 1;
      const score3Days = streamerData3Days.score * multiplier;
      const score7Days = streamerData7Days.score * multiplier;
      const scorePrevious = (score7Days * 7 - score3Days * 3) / 4;

      scoreLine.textContent = `S: ${score3Days.toFixed(1)}`;
      scorePreviousLine.textContent = `Δ: ${scorePrevious.toFixed(1)}`;
      hourLine.textContent = `H: ${streamerData3Days.streams.hour_streamed.toFixed(
        1
      )}`;
      const followerIncreasePercentage = (
        (streamerData3Days.streams.followers_gained /
          streamerData3Days.followers) *
        10000
      ).toFixed(2);
      trendLine.textContent = `T: ${followerIncreasePercentage}%`;

      streamerComponent.setAttribute("data-score", score3Days);
      streamerComponent.setAttribute("data-score-previous", scorePrevious);
      streamerComponent.setAttribute(
        "data-follower-increase",
        followerIncreasePercentage
      );
    } else {
      scoreLine.textContent = `S: 0`;
      scorePreviousLine.textContent = `Δ: 0`;
      hourLine.textContent = `H: 0`;
      trendLine.textContent = `T: 0%`;

      streamerComponent.setAttribute("data-score", 0);
      streamerComponent.setAttribute("data-score-previous", 0);
      streamerComponent.setAttribute("data-follower-increase", 0);
    }

    infoWrapper.appendChild(scoreLine);
    infoWrapper.appendChild(scorePreviousLine);
    infoWrapper.appendChild(hourLine);
    infoWrapper.appendChild(trendLine);
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
    const firstStreamerComponent = document.querySelector(
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

    let promises = [];
    for (const streamerComponent of streamerComponents) {
      const img =
        streamerComponent.querySelector("img:nth-of-type(2)") ||
        streamerComponent.querySelector("img:nth-of-type(1)");
      const streamerName = getStreamerName(img.src);
      const rarity = getRarity(img.src);

      let job = Promise.all([
        fetchStreamerData(streamerName, 3),
        fetchStreamerData(streamerName, 7),
      ]).then(([streamerData3Days, streamerData7Days]) => {
        updateStreamerComponent(
          streamerComponent,
          streamerData3Days,
          streamerData7Days,
          rarity
        );
        streamerComponent.setAttribute("data-streamer", streamerName);
      });
      promises.push(job);
    }
    await Promise.all(promises);

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
