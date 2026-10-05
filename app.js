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
