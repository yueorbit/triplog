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
let editingTripId = null;
let editingMomentId = null;
let selectedPhotoData = null;
let mapInstance = null;


/* =========================================================
   DOM
========================================================= */

function $(id) {
  return document.getElementById(id);
}


/* =========================================================
   DEFAULT DATA
========================================================= */

function createDefaultData() {
  const tripId = createId("trip");

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
            id: createId("moment"),
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
            id: createId("moment"),
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
            id: createId("moment"),
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
   DATA
========================================================= */

function getCurrentTrip() {
  return (
    data.trips.find(
      trip => trip.id === currentTripId
    ) || null
  );
}


function getMomentById(momentId) {
  const trip = getCurrentTrip();

  if (!trip) {
    return null;
  }

  return (
    trip.moments.find(
      moment => moment.id === momentId
    ) || null
  );
}


function persist() {
  data.currentTripId = currentTripId;
  saveData(data);
}


/* =========================================================
   INIT
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  bindEvents();

  try {
    mapInstance = initMap("map");

    if (mapInstance) {
      mapInstance.on("load", () => {
        renderMap(getCurrentTrip());
      });

      mapInstance.on("error", event => {
        console.warn(
          "Map error:",
          event?.error || event
        );
      });
    }
  } catch (error) {
    console.error(
      "Map setup failed:",
      error
    );

    mapInstance = null;
  }

  renderAll();
});


/* =========================================================
   EVENTS
========================================================= */

function bindEvents() {

  // Trip
  $("newTripBtn")?.addEventListener(
    "click",
    () => openTripModal()
  );

  $("editTripBtn")?.addEventListener(
    "click",
    () => {
      if (getCurrentTrip()) {
        openTripModal(currentTripId);
      }
    }
  );


  // Moment
  $("addMomentBtn")?.addEventListener(
    "click",
    () => openMomentModal()
  );

  $("addMomentBottom")?.addEventListener(
    "click",
    () => openMomentModal()
  );


  // Forms
  $("tripForm")?.addEventListener(
    "submit",
    handleTripSubmit
  );

  $("momentForm")?.addEventListener(
    "submit",
    handleMomentSubmit
  );


  // Delete
  $("deleteMomentBtn")?.addEventListener(
    "click",
    handleDeleteMoment
  );


  // Map search
  $("searchPlaceBtn")?.addEventListener(
    "click",
    handleMapSearch
  );

  $("placeSearch")?.addEventListener(
    "keydown",
    event => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleMapSearch();
      }
    }
  );


  // Moment place search
  $("momentPlaceSearch")?.addEventListener(
    "click",
    handleMomentPlaceSearch
  );

  $("momentPlace")?.addEventListener(
    "keydown",
    event => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleMomentPlaceSearch();
      }
    }
  );


  // Photo
  $("momentPhoto")?.addEventListener(
    "change",
    handlePhotoChange
  );


  // Modal close buttons
  document.addEventListener(
    "click",
    handleGlobalClick
  );
}


/* =========================================================
   GLOBAL CLICK
========================================================= */

function handleGlobalClick(event) {

  const closeButton =
    event.target.closest("[data-close]");

  if (closeButton) {
    const modalId =
      closeButton.dataset.close;

    if (modalId === "tripModal") {
      closeTripModal();
    }

    if (modalId === "momentModal") {
      closeMomentModal();
    }

    return;
  }


  // Click modal background to close
  if (
    event.target.classList.contains("modal")
  ) {
    event.target.classList.add("hidden");
  }
}


/* =========================================================
   RENDER
========================================================= */

function renderAll() {
  const trip = getCurrentTrip();

  renderHero(trip);
  renderTimeline(trip);
  renderMap(trip);
}


function renderHero(trip) {
  if (!trip) {
    return;
  }

  $("tripTitle").textContent =
    trip.name || "Untitled Trip";

  $("tripMeta").textContent =
    formatDateRange(
      trip.startDate,
      trip.endDate
    );

  $("totalSpend").textContent =
    formatTripExpense(trip);
}


/* =========================================================
   TIMELINE
========================================================= */

function renderTimeline(trip) {

  const container = $("timeline");

  if (!container || !trip) {
    return;
  }

  container.innerHTML = "";

  const moments = [...trip.moments].sort(
    compareMoments
  );

  if (moments.length === 0) {
    const empty =
      document.createElement("div");

    empty.className = "timeline-empty";

    empty.textContent =
      "No moments yet. Add the first one.";

    container.appendChild(empty);

    return;
  }

  moments.forEach(moment => {
    container.appendChild(
      createMomentCard(moment)
    );
  });
}


function createMomentCard(moment) {

  /*
    IMPORTANT:
    Use the original CSS structure:
    .moment
      .moment-dot
      .moment-date
      .moment-card

    This keeps the timeline line aligned
    with the dots instead of crossing text.
  */

  const article =
    document.createElement("article");

  article.className = "moment";
  article.dataset.momentId =
    moment.id;


  // Dot
  const dot =
    document.createElement("div");

  dot.className = "moment-dot";

  article.appendChild(dot);


  // Date
  const date =
    document.createElement("div");

  date.className = "moment-date";

  date.textContent =
    formatMomentDate(moment);

  article.appendChild(date);


  // Card
  const card =
    document.createElement("div");

  card.className = "moment-card";


  // Title
  const title =
    document.createElement("div");

  title.className = "moment-title";

  title.textContent =
    moment.title ||
    moment.place ||
    "Untitled moment";

  card.appendChild(title);


  // Place
  if (moment.place) {

    const place =
      document.createElement("div");

    place.className = "moment-place";

    place.textContent =
      `📍 ${moment.place}`;

    card.appendChild(place);
  }


  // Thoughts
  if (moment.thoughts) {

    const thoughts =
      document.createElement("div");

    thoughts.className =
      "moment-thoughts";

    thoughts.textContent =
      moment.thoughts;

    card.appendChild(thoughts);
  }


  // Meta
  const meta =
    document.createElement("div");

  meta.className = "moment-meta";


  if (moment.time) {

    const time =
      document.createElement("span");

    time.className = "meta-chip";

    time.textContent =
      moment.time;

    meta.appendChild(time);
  }


  if (moment.expense) {

    const expense =
      document.createElement("span");

    expense.className =
      "meta-chip expense";

    expense.textContent =
      `${moment.currency || "CNY"} ${moment.expense}`;

    meta.appendChild(expense);
  }


  if (meta.children.length > 0) {
    card.appendChild(meta);
  }


  // Photo
  if (moment.photo) {

    const image =
      document.createElement("img");

    image.className =
      "photo-thumb";

    image.src =
      moment.photo;

    image.alt =
      moment.title ||
      "Travel memory";

    image.loading = "lazy";

    card.appendChild(image);
  }


  // Edit button
  const edit =
    document.createElement("button");

  edit.type = "button";
  edit.className = "timeline-edit";
  edit.textContent = "Edit";

  edit.addEventListener(
    "click",
    event => {
      event.stopPropagation();
      openMomentModal(moment.id);
    }
  );

  card.appendChild(edit);


  article.appendChild(card);


  // Click timeline → map
  article.addEventListener(
    "click",
    () => {
      highlightTimelineMoment(
        moment.id
      );

      focusMomentOnMap(
        moment.id
      );
    }
  );


  return article;
}


/* =========================================================
   TIMELINE ↔ MAP
========================================================= */

function focusMomentOnMap(momentId) {

  const moment =
    getMomentById(momentId);

  if (!moment) {
    return;
  }

  highlightTimelineMoment(
    momentId
  );


  if (
    !mapInstance ||
    !Number.isFinite(
      Number(moment.lat)
    ) ||
    !Number.isFinite(
      Number(moment.lng)
    )
  ) {
    return;
  }


  const marker =
    flyToPlace(
      mapInstance,
      {
        name:
          moment.place ||
          moment.title,

        address:
          moment.address || "",

        lat:
          Number(moment.lat),

        lng:
          Number(moment.lng)
      },
      {
        momentId:
          moment.id,

        zoom: 15
      }
    );


  setActiveMarker(
    moment.id
  );


  if (marker) {
    marker.togglePopup();
  }
}


function handleMarkerClick(
  momentId
) {

  if (!momentId) {
    return;
  }

  highlightTimelineMoment(
    momentId
  );

  const card =
    document.querySelector(
      `[data-moment-id="${CSS.escape(
        momentId
      )}"]`
    );

  if (card) {
    card.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }

  setActiveMarker(
    momentId
  );
}


function highlightTimelineMoment(
  momentId
) {

  document
    .querySelectorAll(
      ".moment"
    )
    .forEach(card => {

      card.classList.toggle(
        "is-active",
        card.dataset.momentId ===
          momentId
      );
    });
}


/* =========================================================
   MAP
========================================================= */

function renderMap(trip) {

  if (
    !mapInstance ||
    !trip
  ) {
    return;
  }

  if (
    typeof mapInstance.loaded ===
    "function" &&
    !mapInstance.loaded()
  ) {
    return;
  }


  clearMarkers();


  trip.moments.forEach(
    moment => {

      if (
        !Number.isFinite(
          Number(moment.lat)
        ) ||
        !Number.isFinite(
          Number(moment.lng)
        )
      ) {
        return;
      }


      addPlaceMarker(
        mapInstance,
        {
          name:
            moment.place ||
            moment.title,

          address:
            moment.address || "",

          lat:
            Number(moment.lat),

          lng:
            Number(moment.lng)
        },
        {
          momentId:
            moment.id,

          onClick: () => {
            handleMarkerClick(
              moment.id
            );
          }
        }
      );
    }
  );
}


/* =========================================================
   MAP SEARCH
========================================================= */

async function handleMapSearch() {

  const input =
    $("placeSearch");

  if (!input) {
    return;
  }

  const query =
    input.value.trim();

  if (!query) {
    return;
  }


  const button =
    $("searchPlaceBtn");

  setButtonLoading(
    button,
    true
  );


  try {

    const results =
      await searchPlaces(
        query
      );

    renderMapSearchResults(
      results
    );

  } catch (error) {

    console.error(
      "Map search failed:",
      error
    );

    renderMapSearchResults(
      []
    );

  } finally {

    setButtonLoading(
      button,
      false
    );
  }
}


function renderMapSearchResults(
  results
) {

  const container =
    $("searchResults");

  if (!container) {
    return;
  }

  container.innerHTML = "";

  container.classList.remove(
    "hidden"
  );


  if (!results.length) {

    const empty =
      document.createElement(
        "div"
      );

    empty.className =
      "search-empty";

    empty.textContent =
      "No matching places found. Try an English or local-language name.";

    container.appendChild(
      empty
    );

    return;
  }


  results.forEach(place => {

    const item =
      createPlaceSearchResult(
        place,
        selectedPlace => {

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

    container.appendChild(
      item
    );
  });
}


/* =========================================================
   MOMENT PLACE SEARCH
========================================================= */

async function handleMomentPlaceSearch() {

  const input =
    $("momentPlace");

  const resultsContainer =
    $("momentSearchResults");

  if (
    !input ||
    !resultsContainer
  ) {
    return;
  }


  const query =
    input.value.trim();

  if (!query) {
    return;
  }


  const button =
    $("momentPlaceSearch");

  setButtonLoading(
    button,
    true
  );


  try {

    const results =
      await searchPlaces(
        query
      );

    resultsContainer.innerHTML =
      "";

    resultsContainer.classList.remove(
      "hidden"
    );


    if (!results.length) {

      const empty =
        document.createElement(
          "div"
        );

      empty.className =
        "search-empty";

      empty.textContent =
        "No matching places found. Try another name or language.";

      resultsContainer.appendChild(
        empty
      );

      return;
    }


    results.forEach(place => {

      resultsContainer.appendChild(
        createPlaceSearchResult(
          place,
          selectMomentPlace
        )
      );
    });

  } catch (error) {

    console.error(
      "Moment place search failed:",
      error
    );

  } finally {

    setButtonLoading(
      button,
      false
    );
  }
}


function createPlaceSearchResult(
  place,
  onSelect
) {

  const button =
    document.createElement(
      "button"
    );

  button.type = "button";

  button.className =
    "place-search-result";


  const name =
    document.createElement(
      "strong"
    );

  name.textContent =
    place.name ||
    "Unknown place";


  const address =
    document.createElement(
      "span"
    );

  address.textContent =
    place.address || "";


  button.appendChild(
    name
  );

  button.appendChild(
    address
  );


  button.addEventListener(
    "click",
    () => {
      onSelect(place);
    }
  );


  return button;
}


function selectMomentPlace(
  place
) {

  $("momentPlace").value =
    place.name || "";

  $("momentAddress").value =
    place.address || "";

  $("momentLat").value =
    String(place.lat);

  $("momentLng").value =
    String(place.lng);


  $("momentSearchResults")
    ?.classList.add("hidden");

  $("momentSearchResults")
    ?.replaceChildren();


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

function openTripModal(
  tripId = null
) {

  const modal =
    $("tripModal");

  if (!modal) {
    return;
  }


  editingTripId =
    tripId;


  const trip =
    tripId
      ? data.trips.find(
          item =>
            item.id ===
            tripId
        )
      : null;


  $("tripName").value =
    trip?.name || "";

  $("tripStart").value =
    trip?.startDate || "";

  $("tripEnd").value =
    trip?.endDate || "";


  $("tripModalTitle").textContent =
    trip
      ? "Edit trip"
      : "New trip";


  modal.classList.remove(
    "hidden"
  );
}


function closeTripModal() {

  $("tripModal")
    ?.classList.add(
      "hidden"
    );

  editingTripId =
    null;
}


function handleTripSubmit(
  event
) {

  event.preventDefault();


  const name =
    $("tripName")
      ?.value
      .trim() || "";

  const startDate =
    $("tripStart")
      ?.value || "";

  const endDate =
    $("tripEnd")
      ?.value || "";


  if (!name) {
    alert(
      "Please enter a trip name."
    );
    return;
  }


  if (
    startDate &&
    endDate &&
    startDate > endDate
  ) {
    alert(
      "End date cannot be earlier than start date."
    );
    return;
  }


  if (editingTripId) {

    const trip =
      data.trips.find(
        item =>
          item.id ===
          editingTripId
      );

    if (!trip) {
      return;
    }

    trip.name =
      name;

    trip.startDate =
      startDate;

    trip.endDate =
      endDate;

    currentTripId =
      editingTripId;

  } else {

    const newTrip = {
      id:
        createId("trip"),

      name,

      startDate,

      endDate,

      moments: []
    };

    data.trips.push(
      newTrip
    );

    currentTripId =
      newTrip.id;
  }


  persist();

  closeTripModal();

  renderAll();
}


/* =========================================================
   MOMENT MODAL
========================================================= */

function openMomentModal(
  momentId = null
) {

  const modal =
    $("momentModal");

  if (!modal) {
    return;
  }


  editingMomentId =
    momentId;

  selectedPhotoData =
    null;


  const moment =
    momentId
      ? getMomentById(
          momentId
        )
      : null;


  $("momentDate").value =
    moment?.date ||
    getCurrentTrip()?.startDate ||
    "";

  $("momentTime").value =
    moment?.time || "";

  $("momentTitle").value =
    moment?.title || "";

  $("momentPlace").value =
    moment?.place || "";

  $("momentAddress").value =
    moment?.address || "";

  $("momentLat").value =
    moment?.lat ?? "";

  $("momentLng").value =
    moment?.lng ?? "";

  $("momentThoughts").value =
    moment?.thoughts || "";

  $("momentExpense").value =
    moment?.expense || "";

  $("momentCurrency").value =
    moment?.currency ||
    "CNY";


  $("momentModalTitle").textContent =
    moment
      ? "Edit moment"
      : "Add moment";


  const preview =
    $("photoPreview");

  preview.innerHTML = "";


  if (moment?.photo) {

    const image =
      document.createElement(
        "img"
      );

    image.src =
      moment.photo;

    image.className =
      "photo-thumb";

    image.alt =
      "Travel memory";

    preview.appendChild(
      image
    );
  }


  const results =
    $("momentSearchResults");

  results.innerHTML = "";

  results.classList.add(
    "hidden"
  );


  const deleteButton =
    $("deleteMomentBtn");

  deleteButton.classList.toggle(
    "hidden",
    !momentId
  );


  modal.classList.remove(
    "hidden"
  );
}


function closeMomentModal() {

  $("momentModal")
    ?.classList.add(
      "hidden"
    );

  editingMomentId =
    null;

  selectedPhotoData =
    null;
}


/* =========================================================
   MOMENT SUBMIT
========================================================= */

function handleMomentSubmit(
  event
) {

  event.preventDefault();


  const trip =
    getCurrentTrip();

  if (!trip) {
    alert(
      "Please create a trip first."
    );
    return;
  }


  const date =
    $("momentDate")
      ?.value || "";

  const time =
    $("momentTime")
      ?.value || "";

  const title =
    $("momentTitle")
      ?.value
      .trim() || "";

  const place =
    $("momentPlace")
      ?.value
      .trim() || "";

  const address =
    $("momentAddress")
      ?.value
      .trim() || "";

  const latValue =
    $("momentLat")
      ?.value || "";

  const lngValue =
    $("momentLng")
      ?.value || "";

  const thoughts =
    $("momentThoughts")
      ?.value
      .trim() || "";

  const expense =
    $("momentExpense")
      ?.value
      .trim() || "";

  const currency =
    $("momentCurrency")
      ?.value || "CNY";


  const lat =
    latValue === ""
      ? null
      : Number(latValue);

  const lng =
    lngValue === ""
      ? null
      : Number(lngValue);


  if (!date) {
    alert(
      "Please choose a date."
    );
    return;
  }


  if (!title && !place) {
    alert(
      "Please enter a title or place."
    );
    return;
  }


  if (
    lat !== null &&
    !Number.isFinite(lat)
  ) {
    alert(
      "Invalid latitude."
    );
    return;
  }


  if (
    lng !== null &&
    !Number.isFinite(lng)
  ) {
    alert(
      "Invalid longitude."
    );
    return;
  }


  const existing =
    editingMomentId
      ? getMomentById(
          editingMomentId
        )
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

    trip.moments.push(
      moment
    );
  }


  persist();

  closeMomentModal();

  renderAll();
}


/* =========================================================
   DELETE MOMENT
========================================================= */

function handleDeleteMoment() {

  if (!editingMomentId) {
    return;
  }


  const trip =
    getCurrentTrip();

  if (!trip) {
    return;
  }


  if (
    !window.confirm(
      "Delete this moment?"
    )
  ) {
    return;
  }


  trip.moments =
    trip.moments.filter(
      moment =>
        moment.id !==
        editingMomentId
    );


  persist();

  closeMomentModal();

  renderAll();
}


/* =========================================================
   PHOTO
========================================================= */

async function handlePhotoChange(
  event
) {

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
      $("photoPreview");

    preview.innerHTML = "";


    const image =
      document.createElement(
        "img"
      );

    image.src =
      selectedPhotoData;

    image.className =
      "photo-thumb";

    image.alt =
      "Selected travel photo";


    preview.appendChild(
      image
    );

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


      reader.readAsDataURL(
        file
      );
    }
  );
}


/* =========================================================
   FORMATTING
========================================================= */

function compareMoments(
  a,
  b
) {

  const aKey =
    `${a.date || ""} ${a.time || ""}`;

  const bKey =
    `${b.date || ""} ${b.time || ""}`;

  return aKey.localeCompare(
    bKey
  );
}


function formatMomentDate(
  moment
) {

  const date =
    formatDate(
      moment.date
    );

  return moment.time
    ? `${date} · ${moment.time}`
    : date;
}


function formatDate(
  dateString
) {

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

  return (
    `${formatDate(start)} — ${formatDate(end)}`
  );
}


function formatTripExpense(
  trip
) {

  const totals = {};


  trip.moments.forEach(
    moment => {

      const amount =
        Number(
          String(
            moment.expense || ""
          ).replace(
            /,/g,
            ""
          )
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
    Object.entries(
      totals
    );


  if (!entries.length) {
    return "¥0";
  }


  return entries
    .map(
      ([currency, amount]) =>
        `${currency} ${amount.toFixed(2)}`
    )
    .join(" · ");
}


/* =========================================================
   UI
========================================================= */

function setButtonLoading(
  button,
  loading
) {

  if (!button) {
    return;
  }


  if (loading) {

    if (
      !button.dataset.originalText
    ) {
      button.dataset.originalText =
        button.textContent;
    }

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
