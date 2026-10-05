import {
  initMap,
  searchPlaces,
  flyToPlace,
  clearMarkers,
  addPlaceMarker,
  setActiveMarker
} from "./map/map.js";

import {
  loadData,
  saveData
} from "./data/storage.js";


/* =========================================================
   STATE
========================================================= */

let data = loadData();

if (!data || !Array.isArray(data.trips)) {
  data = createDefaultData();
  saveData(data);
}

if (!data.currentTripId && data.trips.length > 0) {
  data.currentTripId = data.trips[0].id;
  saveData(data);
}

let currentTripId = data.currentTripId || null;

let editingMomentId = null;
let editingTripId = null;

let mapInstance = null;

let selectedPhotoData = null;


/* =========================================================
   DOM HELPERS
========================================================= */

function $(id) {
  const aliases = {
    "new-trip": "newTripBtn",
    "edit-trip": "editTripBtn",
    "add-moment": "addMomentBtn",

    "trip-modal": "tripModal",
    "moment-modal": "momentModal",

    "trip-form": "tripForm",
    "moment-form": "momentForm",

    "close-trip-modal": "closeTripModal",
    "close-moment-modal": "closeMomentModal",

    "cancel-trip": "cancelTrip",
    "cancel-moment": "cancelMoment",

    "delete-moment": "deleteMoment",

    "trip-title": "tripTitle",
    "trip-meta": "tripMeta",
    "total-spend": "totalSpend",

    "timeline-list": "timeline",

    "trip-name": "tripName",
    "trip-start": "tripStart",
    "trip-end": "tripEnd",

    "moment-date": "momentDate",
    "moment-time": "momentTime",
    "moment-title": "momentTitle",
    "moment-place": "momentPlace",
    "moment-address": "momentAddress",
    "moment-lat": "momentLat",
    "moment-lng": "momentLng",
    "moment-thoughts": "momentThoughts",
    "moment-expense": "momentExpense",
    "moment-currency": "momentCurrency",
    "moment-photo": "momentPhoto",
    "moment-photo-preview": "momentPhotoPreview",

    "map-search": "mapSearch",
    "map-search-btn": "mapSearchBtn",
    "map-search-results": "mapSearchResults",

    "moment-place-search": "momentPlaceSearch",
    "moment-search": "momentSearch",
    "moment-search-btn": "momentSearchBtn",
    "moment-place-results": "momentPlaceResults",
    "moment-search-results": "momentSearchResults"
  };

  const element =
    document.getElementById(id) ||
    document.getElementById(aliases[id] || "");

  return element || null;
}

function safeElement(id) {
  return $(id) || null;
}


/* =========================================================
   DEFAULT DATA
========================================================= */

function createDefaultData() {
  const tripId = createId("trip");

  const moment1 = createId("moment");
  const moment2 = createId("moment");
  const moment3 = createId("moment");

  return {
    currentTripId: tripId,

    trips: [
      {
        id: tripId,
        name: "Thailand",
        startDate: "2026-06-01",
        endDate: "2026-06-12",

        moments: [
          {
            id: moment1,
            date: "2026-06-01",
            time: "09:30",
            title: "Arrive in Chiang Mai",
            place: "Chiang Mai International Airport",
            address: "",
            lat: 18.7668,
            lng: 98.9626,
            thoughts: "The journey begins.",
            expense: "",
            currency: "CNY",
            photo: ""
          },

          {
            id: moment2,
            date: "2026-06-02",
            time: "14:00",
            title: "Old City",
            place: "Wat Chedi Luang",
            address: "",
            lat: 18.7870,
            lng: 98.9868,
            thoughts: "Walking through the old city.",
            expense: "",
            currency: "CNY",
            photo: ""
          },

          {
            id: moment3,
            date: "2026-06-06",
            time: "17:00",
            title: "Arrive in Phuket",
            place: "Phuket International Airport",
            address: "",
            lat: 8.1132,
            lng: 98.3169,
            thoughts: "A new part of the trip.",
            expense: "",
            currency: "CNY",
            photo: ""
          }
        ]
      }
    ]
  };
}


/* =========================================================
   ID
========================================================= */

function createId(prefix) {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}


/* =========================================================
   DATA HELPERS
========================================================= */

function getCurrentTrip() {
  return data.trips.find(
    (trip) => trip.id === currentTripId
  ) || null;
}

function getMomentById(momentId) {
  const trip = getCurrentTrip();

  if (!trip) {
    return null;
  }

  return trip.moments.find(
    (moment) => moment.id === momentId
  ) || null;
}

function persist() {
  data.currentTripId = currentTripId;
  saveData(data);
}


/* =========================================================
   APP INIT
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  bindEvents();

  try {
    mapInstance = initMap("map");

    if (mapInstance) {
      mapInstance.on("load", () => {
        renderAll();
      });

      // 地图加载失败时，不影响其他 UI
      mapInstance.on("error", (event) => {
        console.warn("Map error:", event?.error || event);
      });
    }
  } catch (error) {
    console.error("Map setup failed:", error);
    mapInstance = null;
  }

  renderAll();
});


/* =========================================================
   EVENT BINDING
========================================================= */

function bindEvents() {
  $("new-trip")?.addEventListener("click", () => {
    openTripModal();
  });

  $("edit-trip")?.addEventListener("click", () => {
    const trip = getCurrentTrip();

    if (trip) {
      openTripModal(trip.id);
    }
  });

  $("add-moment")?.addEventListener("click", () => {
    openMomentModal();
  });

  $("trip-form")?.addEventListener("submit", handleTripSubmit);

  $("moment-form")?.addEventListener(
    "submit",
    handleMomentSubmit
  );

  $("delete-moment")?.addEventListener(
    "click",
    handleDeleteMoment
  );

  $("cancel-trip")?.addEventListener(
    "click",
    closeTripModal
  );

  $("cancel-moment")?.addEventListener(
    "click",
    closeMomentModal
  );

  $("close-trip-modal")?.addEventListener(
    "click",
    closeTripModal
  );

  $("close-moment-modal")?.addEventListener(
    "click",
    closeMomentModal
  );

  $("map-search-btn")?.addEventListener(
    "click",
    handleMapSearch
  );

  $("map-search")?.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleMapSearch();
      }
    }
  );

  $("moment-search-btn")?.addEventListener(
    "click",
    handleMomentPlaceSearch
  );

  $("moment-place-search")?.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleMomentPlaceSearch();
      }
    }
  );

  $("moment-photo")?.addEventListener(
    "change",
    handlePhotoChange
  );

  document.addEventListener(
    "click",
    handleGlobalClick
  );
}


/* =========================================================
   GLOBAL CLICK
========================================================= */

function handleGlobalClick(event) {
  const closeButton = event.target.closest(
    "[data-close-modal]"
  );

  if (closeButton) {
    const modalId = closeButton.dataset.closeModal;

    if (modalId === "trip-modal") {
      closeTripModal();
    }

    if (modalId === "moment-modal") {
      closeMomentModal();
    }
  }

  if (event.target.classList.contains("modal")) {
    event.target.classList.remove("is-open");
  }
}


/* =========================================================
   RENDER ALL
========================================================= */

function renderAll() {
  const trip = getCurrentTrip();

  renderHero(trip);
  renderTimeline(trip);
  renderMap(trip);
}


/* =========================================================
   HERO
========================================================= */

function renderHero(trip) {
  if (!trip) {
    return;
  }

  const title = safeElement("trip-title");
  const meta = safeElement("trip-meta");
  const totalSpend = safeElement("total-spend");

  if (title) {
    title.textContent = trip.name || "Untitled Trip";
  }

  if (meta) {
    const dates = formatDateRange(
      trip.startDate,
      trip.endDate
    );

    meta.textContent = dates;
  }

  if (totalSpend) {
    totalSpend.textContent = formatTripExpense(trip);
  }
}


/* =========================================================
   TIMELINE
========================================================= */

function renderTimeline(trip) {
  const container = safeElement("timeline-list");

  if (!container || !trip) {
    return;
  }

  container.innerHTML = "";

  const moments = [...trip.moments].sort(
    compareMoments
  );

  if (moments.length === 0) {
    const empty = document.createElement("div");

    empty.className = "empty-state";
    empty.textContent =
      "No moments yet. Add the first one.";

    container.appendChild(empty);

    return;
  }

  moments.forEach((moment) => {
    const card = createMomentCard(moment);
    container.appendChild(card);
  });
}


function createMomentCard(moment) {
  const article = document.createElement("article");

  article.className = "timeline-card";
  article.dataset.momentId = moment.id;

  if (moment.lat != null && moment.lng != null) {
    article.classList.add("has-location");
  }

  const date = document.createElement("div");
  date.className = "timeline-date";
  date.textContent = formatMomentDate(moment);

  const content = document.createElement("div");
  content.className = "timeline-content";

  const title = document.createElement("h3");
  title.textContent =
    moment.title ||
    moment.place ||
    "Untitled moment";

  content.appendChild(title);

  if (moment.place) {
    const place = document.createElement("div");
    place.className = "timeline-place";
    place.textContent = `📍 ${moment.place}`;
    content.appendChild(place);
  }

  if (moment.thoughts) {
    const thoughts = document.createElement("p");
    thoughts.className = "timeline-thoughts";
    thoughts.textContent = moment.thoughts;
    content.appendChild(thoughts);
  }

  if (moment.expense) {
    const expense = document.createElement("div");
    expense.className = "timeline-expense";
    expense.textContent =
      `${moment.currency || "CNY"} ${moment.expense}`;

    content.appendChild(expense);
  }

  if (moment.photo) {
    const image = document.createElement("img");

    image.className = "photo-thumb";
    image.src = moment.photo;
    image.alt = moment.title || "Travel memory";
    image.loading = "lazy";

    content.appendChild(image);
  }

  const edit = document.createElement("button");

  edit.type = "button";
  edit.className = "timeline-edit";
  edit.textContent = "Edit";

  edit.addEventListener("click", (event) => {
    event.stopPropagation();
    openMomentModal(moment.id);
  });

  content.appendChild(edit);

  article.appendChild(date);
  article.appendChild(content);

  article.addEventListener("click", () => {
    focusMomentOnMap(moment.id);

    highlightTimelineMoment(moment.id);
  });

  return article;
}


/* =========================================================
   TIMELINE ↔ MAP
========================================================= */

function focusMomentOnMap(momentId) {
  const moment = getMomentById(momentId);

  if (!moment) {
    return;
  }

  if (
    !mapInstance ||
    !Number.isFinite(Number(moment.lat)) ||
    !Number.isFinite(Number(moment.lng))
  ) {
    openMomentModal(momentId);
    return;
  }

  const marker = flyToPlace(
    mapInstance,
    {
      name: moment.place || moment.title,
      address: moment.address || "",
      lat: Number(moment.lat),
      lng: Number(moment.lng)
    },
    {
      momentId: moment.id,
      zoom: 15
    }
  );

  setActiveMarker(moment.id);

  if (marker) {
    marker.togglePopup();
  }
}


function handleMarkerClick(momentId) {
  if (!momentId) {
    return;
  }

  highlightTimelineMoment(momentId);

  const card = document.querySelector(
    `[data-moment-id="${CSS.escape(momentId)}"]`
  );

  if (card) {
    card.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }

  setActiveMarker(momentId);
}


function highlightTimelineMoment(momentId) {
  document
    .querySelectorAll(".timeline-card")
    .forEach((card) => {
      card.classList.toggle(
        "is-active",
        card.dataset.momentId === momentId
      );
    });
}


/* =========================================================
   MAP RENDER
========================================================= */

function renderMap(trip) {
  if (!mapInstance || !trip) {
    return;
  }

  if (!mapInstance.loaded()) {
    return;
  }

  clearMarkers();

  trip.moments.forEach((moment) => {
    if (
      !Number.isFinite(Number(moment.lat)) ||
      !Number.isFinite(Number(moment.lng))
    ) {
      return;
    }

    addPlaceMarker(
      mapInstance,
      {
        name: moment.place || moment.title,
        address: moment.address || "",
        lat: Number(moment.lat),
        lng: Number(moment.lng)
      },
      {
        momentId: moment.id,
        onClick: () => {
          handleMarkerClick(moment.id);
        }
      }
    );
  });
}


/* =========================================================
   MAP SEARCH
========================================================= */

async function handleMapSearch() {
  const input = $("map-search");

  if (!input) {
    return;
  }

  const query = input.value.trim();

  if (!query) {
    return;
  }

  const button = $("map-search-btn");

  setButtonLoading(button, true);

  const results = await searchPlaces(query);

  setButtonLoading(button, false);

  renderMapSearchResults(results);
}


function renderMapSearchResults(results) {
  const container =
    $("map-search-results") ||
    $("map-results");

  if (!container) {
    return;
  }

  container.innerHTML = "";

  if (!results.length) {
    const empty = document.createElement("div");

    empty.className = "search-empty";
    empty.textContent =
      "No matching places found. Try an English or local-language name.";

    container.appendChild(empty);

    return;
  }

  results.forEach((place) => {
    const item = createPlaceSearchResult(
      place,
      (selectedPlace) => {
        if (!mapInstance) {
          return;
        }

        flyToPlace(
          mapInstance,
          selectedPlace,
          {
            zoom: 15
          }
        );
      }
    );

    container.appendChild(item);
  });
}


/* =========================================================
   MOMENT PLACE SEARCH
========================================================= */

async function handleMomentPlaceSearch() {
  const input =
    $("moment-place-search") ||
    $("moment-search");

  const resultsContainer =
    $("moment-place-results") ||
    $("moment-search-results");

  if (!input || !resultsContainer) {
    return;
  }

  const query = input.value.trim();

  if (!query) {
    return;
  }

  const button =
    $("moment-place-search-btn") ||
    $("moment-search-btn");

  setButtonLoading(button, true);

  const results = await searchPlaces(query);

  setButtonLoading(button, false);

  resultsContainer.innerHTML = "";

  if (!results.length) {
    const empty = document.createElement("div");

    empty.className = "search-empty";
    empty.textContent =
      "No matching places found. Try another name or language.";

    resultsContainer.appendChild(empty);

    return;
  }

  results.forEach((place) => {
    const item = createPlaceSearchResult(
      place,
      selectMomentPlace
    );

    resultsContainer.appendChild(item);
  });
}


function createPlaceSearchResult(place, onSelect) {
  const button = document.createElement("button");

  button.type = "button";
  button.className = "place-search-result";

  const name = document.createElement("strong");
  name.textContent = place.name;

  const address = document.createElement("span");
  address.textContent = place.address;

  button.appendChild(name);
  button.appendChild(address);

  button.addEventListener("click", () => {
    onSelect(place);
  });

  return button;
}


function selectMomentPlace(place) {
  const placeInput = $("moment-place");
  const addressInput = $("moment-address");
  const latInput = $("moment-lat");
  const lngInput = $("moment-lng");

  if (placeInput) {
    placeInput.value = place.name || "";
  }

  if (addressInput) {
    addressInput.value = place.address || "";
  }

  if (latInput) {
    latInput.value = String(place.lat);
  }

  if (lngInput) {
    lngInput.value = String(place.lng);
  }

  const results =
    $("moment-place-results") ||
    $("moment-search-results");

  if (results) {
    results.innerHTML = "";
  }

  if (mapInstance) {
    flyToPlace(
      mapInstance,
      place,
      {
        zoom: 15
      }
    );
  }
}


/* =========================================================
   TRIP MODAL
========================================================= */

function openTripModal(tripId = null) {
  const modal = $("trip-modal");

  if (!modal) {
    return;
  }

  editingTripId = tripId;

  const trip = tripId
    ? data.trips.find(
        (item) => item.id === tripId
      )
    : null;

  $("trip-name").value =
    trip?.name || "";

  $("trip-start").value =
    trip?.startDate || "";

  $("trip-end").value =
    trip?.endDate || "";

  modal.classList.add("is-open");
}


function closeTripModal() {
  $("trip-modal")?.classList.remove(
    "is-open"
  );

  editingTripId = null;
}


function handleTripSubmit(event) {
  event.preventDefault();

  const name =
    $("trip-name")?.value.trim();

  const startDate =
    $("trip-start")?.value || "";

  const endDate =
    $("trip-end")?.value || "";

  if (!name) {
    alert("Please enter a trip name.");
    return;
  }

  if (
    startDate &&
    endDate &&
    startDate > endDate
  ) {
    alert("End date cannot be earlier than start date.");
    return;
  }

  if (editingTripId) {
    const trip = data.trips.find(
      (item) => item.id === editingTripId
    );

    if (trip) {
      trip.name = name;
      trip.startDate = startDate;
      trip.endDate = endDate;
    }

    currentTripId = editingTripId;

  } else {
    const newTrip = {
      id: createId("trip"),
      name,
      startDate,
      endDate,
      moments: []
    };

    data.trips.push(newTrip);

    currentTripId = newTrip.id;
  }

  persist();

  closeTripModal();

  renderAll();
}


/* =========================================================
   MOMENT MODAL
========================================================= */

function openMomentModal(momentId = null) {
  const modal = $("moment-modal");

  if (!modal) {
    return;
  }

  editingMomentId = momentId;
  selectedPhotoData = null;

  const moment = momentId
    ? getMomentById(momentId)
    : null;

  $("moment-date").value =
    moment?.date ||
    getCurrentTrip()?.startDate ||
    "";

  $("moment-time").value =
    moment?.time || "";

  $("moment-title").value =
    moment?.title || "";

  $("moment-place").value =
    moment?.place || "";

  $("moment-address").value =
    moment?.address || "";

  $("moment-lat").value =
    moment?.lat ?? "";

  $("moment-lng").value =
    moment?.lng ?? "";

  $("moment-thoughts").value =
    moment?.thoughts || "";

  $("moment-expense").value =
    moment?.expense || "";

  $("moment-currency").value =
    moment?.currency || "CNY";

  const preview = $("moment-photo-preview");

  if (preview) {
    preview.innerHTML = "";

    if (moment?.photo) {
      const image =
        document.createElement("img");

      image.src = moment.photo;
      image.className = "photo-thumb";
      image.alt = "Travel memory";

      preview.appendChild(image);
    }
  }

  const results =
    $("moment-place-results") ||
    $("moment-search-results");

  if (results) {
    results.innerHTML = "";
  }

  const deleteButton =
    $("delete-moment");

  if (deleteButton) {
    deleteButton.hidden = !momentId;
  }

  modal.classList.add("is-open");
}


function closeMomentModal() {
  $("moment-modal")?.classList.remove(
    "is-open"
  );

  editingMomentId = null;
  selectedPhotoData = null;
}


function handleMomentSubmit(event) {
  event.preventDefault();

  const trip = getCurrentTrip();

  if (!trip) {
    alert("Please create a trip first.");
    return;
  }

  const date =
    $("moment-date")?.value || "";

  const time =
    $("moment-time")?.value || "";

  const title =
    $("moment-title")?.value.trim() || "";

  const place =
    $("moment-place")?.value.trim() || "";

  const address =
    $("moment-address")?.value.trim() || "";

  const latValue =
    $("moment-lat")?.value;

  const lngValue =
    $("moment-lng")?.value;

  const thoughts =
    $("moment-thoughts")?.value.trim() || "";

  const expense =
    $("moment-expense")?.value.trim() || "";

  const currency =
    $("moment-currency")?.value || "CNY";

  const lat =
    latValue === ""
      ? null
      : Number(latValue);

  const lng =
    lngValue === ""
      ? null
      : Number(lngValue);

  if (!date) {
    alert("Please choose a date.");
    return;
  }

  if (!title && !place) {
    alert("Please enter a title or place.");
    return;
  }

  if (
    lat !== null &&
    !Number.isFinite(lat)
  ) {
    alert("Invalid latitude.");
    return;
  }

  if (
    lng !== null &&
    !Number.isFinite(lng)
  ) {
    alert("Invalid longitude.");
    return;
  }

  const existing =
    editingMomentId
      ? getMomentById(editingMomentId)
      : null;

  const moment = {
    id:
      existing?.id ||
      createId("moment"),

    date,
    time,
    title,
    place,
    address,

    lat,
    lng,

    thoughts,
    expense,
    currency,

    photo:
      selectedPhotoData ??
      existing?.photo ??
      ""
  };

  if (existing) {
    Object.assign(
      existing,
      moment
    );
  } else {
    trip.moments.push(moment);
  }

  persist();

  closeMomentModal();

  renderAll();
}


function handleDeleteMoment() {
  if (!editingMomentId) {
    return;
  }

  const trip = getCurrentTrip();

  if (!trip) {
    return;
  }

  const confirmed = window.confirm(
    "Delete this moment?"
  );

  if (!confirmed) {
    return;
  }

  trip.moments =
    trip.moments.filter(
      (moment) =>
        moment.id !== editingMomentId
    );

  persist();

  closeMomentModal();

  renderAll();
}


/* =========================================================
   PHOTO
========================================================= */

async function handlePhotoChange(event) {
  const file =
    event.target.files?.[0];

  if (!file) {
    return;
  }

  try {
    selectedPhotoData =
      await resizeImage(
        file,
        1600,
        0.82
      );

    const preview =
      $("moment-photo-preview");

    if (preview) {
      preview.innerHTML = "";

      const image =
        document.createElement("img");

      image.src =
        selectedPhotoData;

      image.className =
        "photo-thumb";

      image.alt =
        "Selected travel photo";

      preview.appendChild(image);
    }

  } catch (error) {
    console.error(
      "Photo processing failed:",
      error
    );

    alert(
      "The photo could not be processed."
    );
  }
}


function resizeImage(
  file,
  maxSize = 1600,
  quality = 0.82
) {
  return new Promise(
    (resolve, reject) => {
      const reader =
        new FileReader();

      reader.onerror = () => {
        reject(
          new Error(
            "Could not read image."
          )
        );
      };

      reader.onload = () => {
        const image =
          new Image();

        image.onerror = () => {
          reject(
            new Error(
              "Could not decode image."
            )
          );
        };

        image.onload = () => {
          let width =
            image.naturalWidth;

          let height =
            image.naturalHeight;

          const scale =
            Math.min(
              1,
              maxSize /
                Math.max(
                  width,
                  height
                )
            );

          width =
            Math.round(
              width * scale
            );

          height =
            Math.round(
              height * scale
            );

          const canvas =
            document.createElement(
              "canvas"
            );

          canvas.width =
            width;

          canvas.height =
            height;

          const ctx =
            canvas.getContext(
              "2d"
            );

          if (!ctx) {
            reject(
              new Error(
                "Canvas is unavailable."
              )
            );

            return;
          }

          ctx.drawImage(
            image,
            0,
            0,
            width,
            height
          );

          resolve(
            canvas.toDataURL(
              "image/jpeg",
              quality
            )
          );
        };

        image.src =
          reader.result;
      };

      reader.readAsDataURL(file);
    }
  );
}


/* =========================================================
   FORMATTING
========================================================= */

function compareMoments(a, b) {
  const aKey =
    `${a.date || ""} ${a.time || ""}`;

  const bKey =
    `${b.date || ""} ${b.time || ""}`;

  return aKey.localeCompare(
    bKey
  );
}


function formatMomentDate(moment) {
  const date =
    formatDate(moment.date);

  return moment.time
    ? `${date} · ${moment.time}`
    : date;
}


function formatDate(dateString) {
  if (!dateString) {
    return "";
  }

  const date =
    new Date(
      `${dateString}T00:00:00`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return dateString;
  }

  return date.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric"
    }
  );
}


function formatDateRange(
  start,
  end
) {
  if (!start && !end) {
    return "No dates set";
  }

  if (!end) {
    return formatDate(start);
  }

  if (!start) {
    return formatDate(end);
  }

  return `${formatDate(start)} — ${formatDate(end)}`;
}


function formatTripExpense(trip) {
  const totals = {};

  trip.moments.forEach(
    (moment) => {
      const amount =
        Number(
          String(
            moment.expense || ""
          ).replace(/,/g, "")
        );

      if (
        !Number.isFinite(
          amount
        ) ||
        amount === 0
      ) {
        return;
      }

      const currency =
        moment.currency ||
        "CNY";

      totals[currency] =
        (totals[currency] || 0) +
        amount;
    }
  );

  const entries =
    Object.entries(totals);

  if (!entries.length) {
    return "0";
  }

  return entries
    .map(
      ([currency, amount]) =>
        `${currency} ${amount.toFixed(2)}`
    )
    .join(" · ");
}


/* =========================================================
   UI HELPERS
========================================================= */

function setButtonLoading(
  button,
  loading
) {
  if (!button) {
    return;
  }

  if (loading) {
    button.dataset.originalText =
      button.textContent;

    button.disabled = true;
    button.textContent =
      "Searching…";
  } else {
    button.disabled = false;

    button.textContent =
      button.dataset.originalText ||
      "Search";
  }
}
