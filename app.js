import {
  initMap,
  searchPlaces,
  flyToPlace,
  clearMarkers,
  addPlaceMarker
} from "./map/map.js";

import {
  loadData,
  saveData
} from "./data/storage.js";


/* =========================================================
   TripLog App
========================================================= */


/* =========================================================
   STATE
========================================================= */

let data = loadData();

let currentTripId = data.currentTripId || null;

let editingMomentId = null;

let editingTripId = null;

let mapInstance = null;

let selectedPhotoData = null;


/* =========================================================
   DEFAULT DATA
========================================================= */

function createDefaultData() {

  const tripId = createId();

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

            id: createId(),

            date: "2026-06-01",

            time: "10:30",

            title: "Arrival in Chiang Mai",

            place: "Chiang Mai International Airport",

            address: "Chiang Mai, Thailand",

            lat: 18.7668,

            lng: 98.9626,

            thoughts:
              "The trip finally begins. Warm air, slow streets, and the feeling that there is nowhere else I need to be.",

            expense: 280,

            currency: "THB",

            photo: ""

          },

          {

            id: createId(),

            date: "2026-06-02",

            time: "09:00",

            title: "Morning in the old city",

            place: "Wat Chedi Luang",

            address: "Phra Pok Klao Road, Chiang Mai, Thailand",

            lat: 18.7868,

            lng: 98.9853,

            thoughts:
              "Quiet morning. Walked without a destination and somehow ended up here.",

            expense: 80,

            currency: "THB",

            photo: ""

          },

          {

            id: createId(),

            date: "2026-06-06",

            time: "16:20",

            title: "Landing in Phuket",

            place: "Phuket International Airport",

            address: "Phuket, Thailand",

            lat: 8.1132,

            lng: 98.3169,

            thoughts:
              "A completely different landscape. The sea is already visible from the road.",

            expense: 420,

            currency: "THB",

            photo: ""

          }

        ]

      }

    ]

  };

}


/* =========================================================
   INIT DATA
========================================================= */

if (
  !data ||
  !Array.isArray(data.trips) ||
  data.trips.length === 0
) {

  data = createDefaultData();

  saveData(data);

}


if (!currentTripId) {

  currentTripId = data.trips[0].id;

}


/* =========================================================
   HELPERS
========================================================= */

function createId() {

  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8)
  );

}


function getCurrentTrip() {

  return data.trips.find(
    trip => trip.id === currentTripId
  );

}


function save() {

  data.currentTripId = currentTripId;

  saveData(data);

}


function escapeHtml(value = "") {

  return String(value)

    .replaceAll("&", "&amp;")

    .replaceAll("<", "&lt;")

    .replaceAll(">", "&gt;")

    .replaceAll('"', "&quot;")

    .replaceAll("'", "&#039;");

}


function formatDate(dateString) {

  if (!dateString) return "";

  const date = new Date(
    `${dateString}T12:00:00`
  );

  return date.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric"
    }
  );

}


function formatShortDate(dateString) {

  if (!dateString) return "";

  const date = new Date(
    `${dateString}T12:00:00`
  );

  return date.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric"
    }
  );

}


function calculateDays(start, end) {

  if (!start || !end) return 0;

  const startDate =
    new Date(`${start}T12:00:00`);

  const endDate =
    new Date(`${end}T12:00:00`);

  const diff =
    endDate.getTime() -
    startDate.getTime();

  return Math.max(
    1,
    Math.round(diff / 86400000) + 1
  );

}


function formatMoney(amount, currency) {

  const symbols = {

    CNY: "¥",

    THB: "฿",

    USD: "$"

  };

  const symbol =
    symbols[currency] || currency;

  return (
    symbol +
    Number(amount || 0).toLocaleString(
      undefined,
      {
        maximumFractionDigits: 2
      }
    )
  );

}


/* =========================================================
   DOM
========================================================= */

const tripTitle =
  document.getElementById("tripTitle");

const tripMeta =
  document.getElementById("tripMeta");

const totalSpend =
  document.getElementById("totalSpend");

const timeline =
  document.getElementById("timeline");

const newTripBtn =
  document.getElementById("newTripBtn");

const editTripBtn =
  document.getElementById("editTripBtn");

const addMomentBtn =
  document.getElementById("addMomentBtn");

const addMomentBottom =
  document.getElementById("addMomentBottom");

const tripModal =
  document.getElementById("tripModal");

const momentModal =
  document.getElementById("momentModal");

const tripForm =
  document.getElementById("tripForm");

const momentForm =
  document.getElementById("momentForm");

const tripModalTitle =
  document.getElementById("tripModalTitle");

const momentModalTitle =
  document.getElementById("momentModalTitle");

const deleteMomentBtn =
  document.getElementById("deleteMomentBtn");

const photoPreview =
  document.getElementById("photoPreview");

const momentPhoto =
  document.getElementById("momentPhoto");

const placeSearch =
  document.getElementById("placeSearch");

const searchPlaceBtn =
  document.getElementById("searchPlaceBtn");

const searchResults =
  document.getElementById("searchResults");

const momentPlaceSearch =
  document.getElementById("momentPlaceSearch");

const momentPlace =
  document.getElementById("momentPlace");

const momentSearchResults =
  document.getElementById(
    "momentSearchResults"
  );


/* =========================================================
   MAP
========================================================= */

mapInstance = initMap("map");

mapInstance.on(
  "load",
  () => {

    renderMap();

  }
);


/* =========================================================
   RENDER EVERYTHING
========================================================= */

function renderAll() {

  const trip =
    getCurrentTrip();

  if (!trip) return;

  renderHero(trip);

  renderTimeline(trip);

  renderMap();

}


/* =========================================================
   HERO
========================================================= */

function renderHero(trip) {

  tripTitle.textContent =
    trip.name || "Untitled trip";

  const days =
    calculateDays(
      trip.startDate,
      trip.endDate
    );

  const places =
    new Set(
      trip.moments
        .map(moment => moment.place)
        .filter(Boolean)
    ).size;

  tripMeta.textContent =
    `${days} days · ${places} places`;

  renderTotalSpend(trip);

}


function renderTotalSpend(trip) {

  const totals = {};

  trip.moments.forEach(moment => {

    const amount =
      Number(moment.expense || 0);

    const currency =
      moment.currency || "CNY";

    totals[currency] =
      (totals[currency] || 0) +
      amount;

  });


  const currencies =
    Object.keys(totals);


  if (currencies.length === 0) {

    totalSpend.textContent = "—";

    return;

  }


  totalSpend.textContent =
    currencies

      .map(
        currency =>
          formatMoney(
            totals[currency],
            currency
          )
      )

      .join(" · ");

}


/* =========================================================
   TIMELINE
========================================================= */

function renderTimeline(trip) {

  if (!trip.moments.length) {

    timeline.innerHTML = `

      <div class="timeline-empty">

        No moments yet.

        <br>

        Add your first memory.

      </div>

    `;

    return;

  }


  const moments =
    [...trip.moments]

      .sort(
        (a, b) => {

          const dateA =
            `${a.date} ${a.time || "00:00"}`;

          const dateB =
            `${b.date} ${b.time || "00:00"}`;

          return dateA.localeCompare(dateB);

        }
      );


  timeline.innerHTML =
    moments

      .map(moment => {

        const expense =
          Number(moment.expense || 0);


        return `

          <article
            class="moment"
            data-id="${moment.id}"
          >

            <span class="moment-dot"></span>


            <div class="moment-date">

              ${escapeHtml(
                formatShortDate(moment.date)
              )}

              ${
                moment.time
                  ? ` · ${escapeHtml(moment.time)}`
                  : ""
              }

            </div>


            <div class="moment-card">

              <div class="moment-title">

                ${escapeHtml(
                  moment.title
                )}

              </div>


              ${
                moment.place

                  ? `

                    <div class="moment-place">

                      ${escapeHtml(
                        moment.place
                      )}

                    </div>

                  `

                  : ""
              }


              ${
                moment.thoughts

                  ? `

                    <div class="moment-thoughts">

                      ${escapeHtml(
                        moment.thoughts
                      )}

                    </div>

                  `

                  : ""
              }


              ${
                moment.photo

                  ? `

                    <img
                      class="photo-thumb"
                      src="${moment.photo}"
                      alt="${escapeHtml(
                        moment.title
                      )}"
                    >

                  `

                  : ""
              }


              <div class="moment-meta">

                ${
                  expense > 0

                    ? `

                      <span class="meta-chip expense">

                        ${formatMoney(
                          expense,
                          moment.currency
                        )}

                      </span>

                    `

                    : ""
                }


                ${
                  moment.address

                    ? `

                      <span class="meta-chip">

                        Location saved

                      </span>

                    `

                    : ""
                }

              </div>

            </div>

          </article>

        `;

      })

      .join("");


  document
    .querySelectorAll(".moment")
    .forEach(element => {

      element.addEventListener(
        "click",
        () => {

          const id =
            element.dataset.id;

          openMomentModal(id);

        }
      );

    });

}


/* =========================================================
   MAP
========================================================= */

function renderMap() {

  if (!mapInstance.loaded()) {

    return;

  }


  clearMarkers();


  const trip =
    getCurrentTrip();

  if (!trip) return;


  trip.moments

    .filter(
      moment =>
        moment.lat &&
        moment.lng
    )

    .forEach(moment => {

      addPlaceMarker(

        mapInstance,

        {

          lat: moment.lat,

          lng: moment.lng,

          name: moment.place || moment.title

        },

        `

          <strong>
            ${escapeHtml(
              moment.title
            )}
          </strong>

          ${
            moment.place
              ? `<br>${escapeHtml(
                  moment.place
                )}`
              : ""
          }

        `

      );

    });

}


/* =========================================================
   FOCUS MAP ON MOMENT
========================================================= */

function focusMomentOnMap(moment) {

  if (
    !moment.lat ||
    !moment.lng
  ) {

    return;

  }


  flyToPlace(

    mapInstance,

    {

      lat: moment.lat,

      lng: moment.lng,

      name:
        moment.place ||
        moment.title

    },

    moment.title

  );

}


/* =========================================================
   TRIP MODAL
========================================================= */

function openTripModal(mode = "new") {

  tripModal.classList.remove(
    "hidden"
  );


  if (mode === "edit") {

    const trip =
      getCurrentTrip();

    editingTripId =
      trip.id;

    tripModalTitle.textContent =
      "Edit trip";

    document.getElementById(
      "tripName"
    ).value =
      trip.name || "";

    document.getElementById(
      "tripStart"
    ).value =
      trip.startDate || "";

    document.getElementById(
      "tripEnd"
    ).value =
      trip.endDate || "";

  } else {

    editingTripId = null;

    tripModalTitle.textContent =
      "New trip";

    tripForm.reset();

  }

}


function closeModal(modal) {

  modal.classList.add(
    "hidden"
  );

}


/* =========================================================
   NEW / EDIT TRIP
========================================================= */

newTripBtn.addEventListener(
  "click",
  () => {

    openTripModal("new");

  }
);


editTripBtn.addEventListener(
  "click",
  () => {

    openTripModal("edit");

  }
);


tripForm.addEventListener(
  "submit",
  event => {

    event.preventDefault();


    const name =
      document.getElementById(
        "tripName"
      ).value.trim();

    const startDate =
      document.getElementById(
        "tripStart"
      ).value;

    const endDate =
      document.getElementById(
        "tripEnd"
      ).value;


    if (!name) return;


    if (editingTripId) {

      const trip =
        data.trips.find(
          item =>
            item.id === editingTripId
        );

      if (trip) {

        trip.name = name;

        trip.startDate =
          startDate;

        trip.endDate =
          endDate;

      }

    } else {

      const newTrip = {

        id: createId(),

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


    save();

    closeModal(
      tripModal
    );

    renderAll();

  }
);


/* =========================================================
   MOMENT MODAL
========================================================= */

function openMomentModal(momentId = null) {

  momentModal.classList.remove(
    "hidden"
  );


  editingMomentId =
    momentId;


  selectedPhotoData = null;


  photoPreview.innerHTML =
    "";


  if (momentId) {

    const trip =
      getCurrentTrip();

    const moment =
      trip.moments.find(
        item =>
          item.id === momentId
      );


    if (!moment) return;


    momentModalTitle.textContent =
      "Edit moment";

    deleteMomentBtn.classList.remove(
      "hidden"
    );


    document.getElementById(
      "momentDate"
    ).value =
      moment.date || "";

    document.getElementById(
      "momentTime"
    ).value =
      moment.time || "";

    document.getElementById(
      "momentTitle"
    ).value =
      moment.title || "";

    document.getElementById(
      "momentPlace"
    ).value =
      moment.place || "";

    document.getElementById(
      "momentThoughts"
    ).value =
      moment.thoughts || "";

    document.getElementById(
      "momentExpense"
    ).value =
      moment.expense || "";

    document.getElementById(
      "momentCurrency"
    ).value =
      moment.currency || "CNY";

    document.getElementById(
      "momentLat"
    ).value =
      moment.lat || "";

    document.getElementById(
      "momentLng"
    ).value =
      moment.lng || "";

    document.getElementById(
      "momentAddress"
    ).value =
      moment.address || "";


    if (moment.photo) {

      photoPreview.innerHTML = `

        <img
          src="${moment.photo}"
          alt="Current photo"
        >

      `;

    }

  } else {

    momentModalTitle.textContent =
      "Add moment";

    deleteMomentBtn.classList.add(
      "hidden"
    );

    momentForm.reset();

    document.getElementById(
      "momentDate"
    ).value =
      getCurrentTrip().startDate || "";

    document.getElementById(
      "momentCurrency"
    ).value =
      "CNY";

  }

}


addMomentBtn.addEventListener(
  "click",
  () => {

    openMomentModal();

  }
);


addMomentBottom.addEventListener(
  "click",
  () => {

    openMomentModal();

  }
);


/* =========================================================
   CLOSE MODALS
========================================================= */

document
  .querySelectorAll("[data-close]")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const id =
          button.dataset.close;

        const modal =
          document.getElementById(id);

        closeModal(modal);

      }
    );

  });


document
  .querySelectorAll(".modal")
  .forEach(modal => {

    modal.addEventListener(
      "click",
      event => {

        if (
          event.target === modal
        ) {

          closeModal(modal);

        }

      }
    );

  });


/* =========================================================
   PHOTO PROCESSING
========================================================= */

momentPhoto.addEventListener(
  "change",
  async event => {

    const file =
      event.target.files?.[0];

    if (!file) return;


    try {

      selectedPhotoData =
        await resizeImage(file);


      photoPreview.innerHTML = `

        <img
          src="${selectedPhotoData}"
          alt="Photo preview"
        >

      `;

    } catch (error) {

      console.error(
        "Photo processing failed:",
        error
      );

      alert(
        "Could not process this image."
      );

    }

  }
);


function resizeImage(
  file,
  maxSize = 1400,
  quality = 0.82
) {

  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();


      reader.onload = event => {

        const image =
          new Image();


        image.onload = () => {

          let width =
            image.width;

          let height =
            image.height;


          const ratio =
            Math.min(
              1,
              maxSize / Math.max(
                width,
                height
              )
            );


          width =
            Math.round(
              width * ratio
            );

          height =
            Math.round(
              height * ratio
            );


          const canvas =
            document.createElement(
              "canvas"
            );


          canvas.width =
            width;

          canvas.height =
            height;


          const context =
            canvas.getContext(
              "2d"
            );


          context.drawImage(
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


        image.onerror =
          reject;


        image.src =
          event.target.result;

      };


      reader.onerror =
        reject;


      reader.readAsDataURL(
        file
      );

    }
  );

}


/* =========================================================
   SAVE MOMENT
========================================================= */

momentForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    const trip =
      getCurrentTrip();

    if (!trip) return;


    const date =
      document.getElementById(
        "momentDate"
      ).value;

    const time =
      document.getElementById(
        "momentTime"
      ).value;

    const title =
      document.getElementById(
        "momentTitle"
      ).value.trim();

    const place =
      document.getElementById(
        "momentPlace"
      ).value.trim();

    const thoughts =
      document.getElementById(
        "momentThoughts"
      ).value.trim();

    const expense =
      Number(
        document.getElementById(
          "momentExpense"
        ).value || 0
      );

    const currency =
      document.getElementById(
        "momentCurrency"
      ).value;

    const lat =
      Number(
        document.getElementById(
          "momentLat"
        ).value
      ) || null;

    const lng =
      Number(
        document.getElementById(
          "momentLng"
        ).value
      ) || null;

    const address =
      document.getElementById(
        "momentAddress"
      ).value.trim();


    if (!title) {

      alert(
        "Please give this moment a title."
      );

      return;

    }


    let photo = "";


    if (selectedPhotoData) {

      photo =
        selectedPhotoData;

    } else if (editingMomentId) {

      const existing =
        trip.moments.find(
          item =>
            item.id === editingMomentId
        );

      photo =
        existing?.photo || "";

    }


    const momentData = {

      id:
        editingMomentId ||
        createId(),

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

      photo

    };


    if (editingMomentId) {

      const index =
        trip.moments.findIndex(
          item =>
            item.id === editingMomentId
        );


      if (index !== -1) {

        trip.moments[index] =
          momentData;

      }

    } else {

      trip.moments.push(
        momentData
      );

    }


    save();

    closeModal(
      momentModal
    );

    renderAll();

    editingMomentId =
      null;

    selectedPhotoData =
      null;

  }
);


/* =========================================================
   DELETE MOMENT
========================================================= */

deleteMomentBtn.addEventListener(
  "click",
  () => {

    if (!editingMomentId) return;


    const confirmed =
      window.confirm(
        "Delete this moment?"
      );


    if (!confirmed) return;


    const trip =
      getCurrentTrip();


    trip.moments =
      trip.moments.filter(
        moment =>
          moment.id !==
          editingMomentId
      );


    save();

    closeModal(
      momentModal
    );

    editingMomentId =
      null;

    renderAll();

  }
);


/* =========================================================
   MAP SEARCH
========================================================= */

searchPlaceBtn.addEventListener(
  "click",
  performMapSearch
);


placeSearch.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Enter"
    ) {

      event.preventDefault();

      performMapSearch();

    }

  }
);


async function performMapSearch() {

  const query =
    placeSearch.value.trim();

  if (!query) return;


  searchResults.classList.remove(
    "hidden"
  );


  searchResults.innerHTML = `

    <div class="search-result">

      Searching...

    </div>

  `;


  try {

    const results =
      await searchPlaces(
        query
      );


    if (!results.length) {

      searchResults.innerHTML = `

        <div class="search-result">

          No places found.

        </div>

      `;

      return;

    }


    searchResults.innerHTML =
      results

        .map(
          place => `

            <div
              class="search-result"
              data-place-id="${place.id}"
            >

              <div
                class="search-result-name"
              >

                ${escapeHtml(
                  place.name
                )}

              </div>


              <div
                class="search-result-address"
              >

                ${escapeHtml(
                  place.address
                )}

              </div>

            </div>

          `
        )

        .join("");


    searchResults
      .querySelectorAll(
        ".search-result"
      )
      .forEach(
        (element, index) => {

          element.addEventListener(
            "click",
            () => {

              const place =
                results[index];


              flyToPlace(

                mapInstance,

                place,

                place.name

              );


              searchResults.classList.add(
                "hidden"
              );

            }
          );

        }
      );

  } catch (error) {

    console.error(
      "Place search failed:",
      error
    );


    searchResults.innerHTML = `

      <div class="search-result">

        Search failed. Please try again.

      </div>

    `;

  }

}


/* =========================================================
   PLACE SEARCH INSIDE MOMENT MODAL
========================================================= */

momentPlaceSearch.addEventListener(
  "click",
  performMomentPlaceSearch
);


momentPlace.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Enter"
    ) {

      event.preventDefault();

      performMomentPlaceSearch();

    }

  }
);


async function performMomentPlaceSearch() {

  const query =
    momentPlace.value.trim();

  if (!query) return;


  momentSearchResults.classList.remove(
    "hidden"
  );


  momentSearchResults.innerHTML = `

    <div class="search-result">

      Searching...

    </div>

  `;


  try {

    const results =
      await searchPlaces(
        query
      );


    if (!results.length) {

      momentSearchResults.innerHTML = `

        <div class="search-result">

          No places found.

        </div>

      `;

      return;

    }


    momentSearchResults.innerHTML =
      results

        .map(
          place => `

            <div
              class="search-result"
              data-place-id="${place.id}"
            >

              <div
                class="search-result-name"
              >

                ${escapeHtml(
                  place.name
                )}

              </div>


              <div
                class="search-result-address"
              >

                ${escapeHtml(
                  place.address
                )}

              </div>

            </div>

          `
        )

        .join("");


    momentSearchResults
      .querySelectorAll(
        ".search-result"
      )
      .forEach(
        (element, index) => {

          element.addEventListener(
            "click",
            () => {

              const place =
                results[index];


              momentPlace.value =
                place.name;

              document.getElementById(
                "momentAddress"
              ).value =
                place.address;

              document.getElementById(
                "momentLat"
              ).value =
                place.lat;

              document.getElementById(
                "momentLng"
              ).value =
                place.lng;


              momentSearchResults.classList.add(
                "hidden"
              );


              flyToPlace(

                mapInstance,

                place,

                place.name

              );

            }
          );

        }
      );

  } catch (error) {

    console.error(
      "Moment place search failed:",
      error
    );


    momentSearchResults.innerHTML = `

      <div class="search-result">

        Search failed. Please try again.

      </div>

    `;

  }

}


/* =========================================================
   ESC KEY
========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key !== "Escape"
    ) return;


    document
      .querySelectorAll(
        ".modal"
      )
      .forEach(
        modal => {

          closeModal(modal);

        }
      );

  }
);


/* =========================================================
   INITIAL RENDER
========================================================= */

renderAll();
