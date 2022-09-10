"use strict";

const apiEnd = "https://api.rss2json.com/v1/api.json";
const rssParam = "rss_url";

///// Page elements /////

const elDynamicContent = document.getElementById("dynamic-content");

///// Helper functions /////

async function getFeedData(rssUrl) {
  try {
    const response = await fetch(`${apiEnd}?${rssParam}=${rssUrl}`);
    if (response.ok) {
      return response.json();
    } else {
      console.log(await response.text());
    }
  } catch (reason) {
    console.log(reason.message);
  }
}

function getDate(dateString, time = false) {
  const dateObject = new Date(dateString);
  if (time) {
    // Get time only
    const time = dateObject.toLocaleTimeString(window.navigator.language, {
      hour12: true,
      hour: "numeric",
      minute: "2-digit",
    });
    return time;
  } else {
    // Get date only
    const date = dateObject.toLocaleDateString(window.navigator.language);
    return date;
  }
}

function getMachineReadableDate(dateString) {
  const dateObject = new Date(dateString);
  return `${dateObject.getFullYear()}
    -${String(dateObject.getMonth() + 1).padStart(2, "0")}
    -${String(dateObject.getDate()).padStart(2, "0")}
  `;
}

function generateRandomNumId(length = 4) {
  const getRandomDigit = function () {
    return Math.floor(Math.random() * 10);
  };
  const randomId = Array.from({ length }, getRandomDigit);
  return randomId.join("");
}

///// Dynamic content functions /////

function generateArticle(articleData) {
  // Create article element
  const article = document.createElement("article");
  article.className = "carousel-article";

  // Create article sections
  const articleImg = document.createElement("figure");
  articleImg.className = "article-image";
  const articleBody = document.createElement("div");
  articleBody.className = "article-body";
  const articleHeader = document.createElement("header");
  articleHeader.className = "article-header";
  const articleContent = document.createElement("section");
  articleContent.className = "article-content";

  // Populate article sections with content
  articleImg.innerHTML = `
    <img src="${articleData.enclosure.link}" alt="Article Image" />
  `;
  articleHeader.innerHTML = `
    <h3 class="article-title">
      ${articleData.title}
    </h3>
    <div class="article-meta">
      <address>${articleData.author}</address>
      <div class="meta-separator"></div>
      <time datetime="${getMachineReadableDate(articleData.pubDate)}">${getDate(
    articleData.pubDate
  )}</time>
    </div>
  `;
  articleContent.innerHTML = `
    <p>${articleData.description}</p>
  `;

  // Construct article
  articleBody.append(articleHeader, articleContent);
  article.append(articleImg, articleBody);

  return article;
}

function generateFeedCarousel(articlesArr, parentNumId) {
  const carouselId = `carousel${parentNumId}`;

  // Create carousel element
  const carousel = document.createElement("div");
  carousel.setAttribute("id", carouselId);
  carousel.className = "carousel slide";

  // Create carousel inner elements
  const carouselContent = document.createElement("div");
  carouselContent.className = "carousel-inner";
  const carouselButtonPrev = document.createElement("button");
  carouselButtonPrev.className = "carousel-prev carousel-btn";
  carouselButtonPrev.setAttribute("type", "button");
  carouselButtonPrev.setAttribute("data-bs-target", `#${carouselId}`);
  carouselButtonPrev.setAttribute("data-bs-slide", "prev");
  // Hide prev button on page load
  carouselButtonPrev.classList.add("hidden");
  carouselButtonPrev.innerHTML = `
    <span class="carousel-prev-icon" aria-hidden="true"><i class="fa-solid fa-angle-left"></i></span>
    <span class="visually-hidden">Previous</span>
  `;
  const carouselButtonNext = document.createElement("button");
  carouselButtonNext.className = "carousel-next carousel-btn";
  carouselButtonNext.setAttribute("type", "button");
  carouselButtonNext.setAttribute("data-bs-target", `#${carouselId}`);
  carouselButtonNext.setAttribute("data-bs-slide", "next");
  carouselButtonNext.innerHTML = `
    <span class="carousel-next-icon" aria-hidden="true"><i class="fa-solid fa-angle-right"></i></span>
    <span class="visually-hidden">Next</span>
  `;

  // Populate carousel with articles
  articlesArr.forEach((articleData, idx) => {
    const carouselItem = document.createElement("div");
    carouselItem.className =
      idx === 0 ? "carousel-item active" : "carousel-item";

    const articleLink = document.createElement("a");
    articleLink.setAttribute("href", articleData.link);
    articleLink.setAttribute("target", "_blank");

    articleLink.appendChild(generateArticle(articleData));
    carouselItem.appendChild(articleLink);
    carouselContent.appendChild(carouselItem);
  });

  // Construct carousel
  carousel.append(carouselContent, carouselButtonPrev, carouselButtonNext);

  return carousel;
}

function generateAccordionItem(feedData, parentId) {
  // Generate random number id to link bootsrap components
  const numId = generateRandomNumId();

  // Create accordion item
  const accordionItem = document.createElement("div");
  accordionItem.className = "accordion-item";

  // Set accordion item inner markup
  accordionItem.innerHTML = `
    <button class="accordion-btn" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${numId}" aria-expanded="true" aria-controls="collapse${numId}">
      <span class="accordion-btn-icon"><i class="fa-solid fa-angle-down"></i></span>
      <h2 class="accordion-header" id="heading${numId}">${feedData.feed.title}</h2>
    </button>
    <div id="collapse${numId}" class="accordion-collapse collapse" aria-labelledby="headingOne" data-bs-parent="#${parentId}">
      <div class="accordion-body"></div>
    </div>
  `;

  // Populate accordion item with articles
  accordionItem
    .querySelector(".accordion-body")
    .appendChild(generateFeedCarousel(feedData.items, numId));

  return accordionItem;
}

function createNewsAccordion(feedsArr) {
  // Create parent accordion element
  const newsAccordion = document.createElement("div");
  newsAccordion.className = "accordion";
  newsAccordion.id = "news-accordion";
  // Populate accordion with feeds
  feedsArr.forEach((feedData) => {
    const accordionItem = generateAccordionItem(feedData, newsAccordion.id);
    newsAccordion.appendChild(accordionItem);
  });

  return newsAccordion;
}

///// Event listeners /////

const hideCarouselBtn = function (e) {
  // If button icon is clicked make target the parent element
  const target = e.target.closest(".carousel-btn");
  if (!target?.classList.contains("carousel-btn")) return;

  const carouselButtons = this.querySelectorAll(".carousel-btn");
  const carouselContent = this.querySelector(".carousel-inner").children;
  const carouselLength = carouselContent.length;

  // Implement hiding logic
  const activeIdx = Array.from(carouselContent).findIndex((el) =>
    el.classList.contains("active")
  );
  if (
    activeIdx === carouselLength - 2 &&
    target.classList.contains("carousel-next")
  ) {
    target.classList.add("hidden");
  } else if (activeIdx === 1 && target.classList.contains("carousel-prev")) {
    target.classList.add("hidden");
  } else {
    carouselButtons.forEach((btn) => btn.classList.remove("hidden"));
  }
};

const animateButton = function (e) {
  const target = e.target.closest(".carousel-btn");
  if (!target?.classList.contains("carousel-btn")) return;

  // Implement animation logic
  if (target.classList.contains("carousel-prev")) {
    target.classList.add("animate-prev");
    target.addEventListener(
      "animationend",
      () => target.classList.remove("animate-prev"),
      { once: true }
    );
  } else if (target.classList.contains("carousel-next")) {
    target.classList.add("animate-next");
    target.addEventListener(
      "animationend",
      () => target.classList.remove("animate-next"),
      { once: true }
    );
  }
};

///// Init functions /////

async function populatePage() {
  // Get feed data in order
  const requests = magazines.map((feed) => getFeedData(feed));
  let data = await Promise.all(requests);

  const newsAccordion = createNewsAccordion(data);
  // Expand first accordion item
  newsAccordion.querySelector(".accordion-collapse").classList.add("show");
  // Assign classes needed for correct behaviour
  const accordionButtons = newsAccordion.querySelectorAll(".accordion-btn");
  accordionButtons.forEach(
    (btn, idx) => idx > 0 && btn.classList.add("collapsed")
  );

  elDynamicContent.appendChild(newsAccordion);
}

function addEventListeners() {
  const carouselElements = document.querySelectorAll(".carousel");
  carouselElements.forEach((carousel) =>
    carousel.addEventListener("click", hideCarouselBtn)
  );

  const carouselButtons = document.querySelectorAll(".carousel-btn");
  carouselButtons.forEach((btn) =>
    btn.addEventListener("click", animateButton)
  );
}

//// Init ////

(async function init() {
  await populatePage();
  addEventListeners();
})();
