(async function () {
	const formatDate = (date) => Math.floor(date.getTime() / 1000);
  
	const streamerDataCache = new Map();
	const oneWeekAgo = formatDate(new Date(new Date() - 7 * 24 * 60 * 60 * 1000));
  
	function getStreamerName(imgSrc) {
	  const regex = /\/fantastreamer-cards\/(.*?)\//;
	  const match = imgSrc.match(regex);
	  console.log(match);
	  return match && match[1];
	}
  
	async function fetchStreamerData(streamerName) {
	  if (!streamerDataCache.has(streamerName)) {
		const response = await fetch(
		  `https://fanta.playerself.com/streamer?startDate=${oneWeekAgo}&name=${streamerName}`
		);
		const data = await response.json();
		streamerDataCache.set(streamerName, data[0]);
	  }
	  return streamerDataCache.get(streamerName);
	}
  
	function updateStreamerComponent(streamerComponent, streamerData) {
	  const img = streamerComponent.querySelector("img");
	  const scoreLine = document.createElement("div");
	  const hourLine = document.createElement("div");
  
	  if (streamerData) {
		scoreLine.textContent = `S: ${streamerData.score.toFixed(1)}`;
		hourLine.textContent = `H: ${streamerData.streams.hour_streamed.toFixed(
		  1
		)}`;
		streamerComponent.setAttribute("data-score", streamerData.score);
	  } else {
		scoreLine.textContent = `S: 0`;
		hourLine.textContent = `H: 0`;
		streamerComponent.setAttribute("data-score", 0);
	  }
  
	  streamerComponent.appendChild(scoreLine);
	  streamerComponent.appendChild(hourLine);
	}
  
	function sortStreamerComponents() {
	  const firstStreamerComponent = document.querySelector(".relative");
	  if (!firstStreamerComponent) return;
	  const container = firstStreamerComponent.parentElement;
	  const streamerComponents = Array.from(
		container.querySelectorAll(".relative")
	  );
  
	  streamerComponents.sort((a, b) => {
		const scoreA = parseFloat(a.getAttribute("data-score"));
		const scoreB = parseFloat(b.getAttribute("data-score"));
		return scoreB - scoreA;
	  });
  
	  streamerComponents.forEach((component) => container.appendChild(component));
	}
  
	async function main() {
	  const streamerComponents = document.querySelectorAll(".relative");
	  const promises = [];
  
	  for (const streamerComponent of streamerComponents) {
		const img = streamerComponent.querySelector("img:nth-of-type(2)");
		const streamerName = getStreamerName(img.src);
		  promises.push(fetchStreamerData(streamerName).then((data) => {
			  updateStreamerComponent(streamerComponent, data);
			  sortStreamerComponents();
		  }));
	  }
	}
  
	main();
  
	const observer = new MutationObserver((mutations) => {
	  mutations.forEach((mutation) => {
		if (mutation.type === "attributes" && mutation.attributeName === "src") {
		  main();
		}
	  });
	});
  
	const images = document.querySelectorAll(".relative img:nth-of-type(2)");
	images.forEach((img) => observer.observe(img, { attributes: true }));
  })();
  