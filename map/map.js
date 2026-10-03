const MAP_STYLE =
  "https://tiles.openfreemap.org/styles/liberty";


const NOMINATIM_URL =
  "https://nominatim.openstreetmap.org/search";


let markers = [];


/* =========================================================
   INIT MAP
========================================================= */

export function initMap(containerId) {

  const map =
    new maplibregl.Map({

      container: containerId,

      style: MAP_STYLE,

      center: [
        105.8,
        20.8
      ],

      zoom: 4.1,

      attributionControl: true

    });


  map.addControl(
    new maplibregl.NavigationControl(),
    "bottom-right"
  );


  return map;

}


/* =========================================================
   SEARCH PLACES
   Nominatim / OpenStreetMap
========================================================= */

export async function searchPlaces(
  query
) {

  const url =
    new URL(
      NOMINATIM_URL
    );


  url.searchParams.set(
    "format",
    "jsonv2"
  );

  url.searchParams.set(
    "limit",
    "8"
  );

  url.searchParams.set(
    "accept-language",
    "en,zh"
  );

  url.searchParams.set(
    "q",
    query
  );


  const response =
    await fetch(
      url.toString()
    );


  if (!response.ok) {

    throw new Error(
      `Nominatim error: ${response.status}`
    );

  }


  const results =
    await response.json();


  return results.map(
    item => ({

      id:
        item.place_id,

      name:
        item.name ||
        item.display_name
          ?.split(",")[0] ||
        "Unknown place",

      address:
        item.display_name ||
        "",

      lat:
        Number(item.lat),

      lng:
        Number(item.lon)

    })
  );

}


/* =========================================================
   FLY TO PLACE
========================================================= */

export function flyToPlace(
  map,
  place,
  popupText = ""
) {

  if (
    !place ||
    !place.lat ||
    !place.lng
  ) {

    return;

  }


  map.flyTo({

    center: [
      Number(place.lng),
      Number(place.lat)
    ],

    zoom: 14,

    speed: 1.2,

    curve: 1.4,

    essential: true

  });


  addPlaceMarker(
    map,
    place,
    popupText
  );

}


/* =========================================================
   ADD MARKER
========================================================= */

export function addPlaceMarker(
  map,
  place,
  popupText = ""
) {

  if (
    !place ||
    !place.lat ||
    !place.lng
  ) {

    return null;

  }


  const element =
    document.createElement(
      "div"
    );


  element.className =
    "triplog-marker";


  const marker =
    new maplibregl.Marker({
      element
    })

      .setLngLat([
        Number(place.lng),
        Number(place.lat)
      ]);


  if (popupText) {

    const popup =
      new maplibregl.Popup({
        offset: 14
      })

        .setHTML(
          popupText
        );


    marker.setPopup(
      popup
    );

  }


  marker.addTo(map);


  markers.push(
    marker
  );


  return marker;

}


/* =========================================================
   CLEAR MARKERS
========================================================= */

export function clearMarkers() {

  markers.forEach(
    marker => {

      marker.remove();

    }
  );


  markers = [];

}
