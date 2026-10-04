const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

let markers = [];

/**
 * 初始化地图
 */
export function initMap(containerId) {
  if (typeof maplibregl === "undefined") {
    console.warn("MapLibre GL JS is not available.");
    return null;
  }

  const container = document.getElementById(containerId);

  if (!container) {
    console.warn(`Map container #${containerId} was not found.`);
    return null;
  }

  try {
    const map = new maplibregl.Map({
      container: containerId,
      style: MAP_STYLE,
      center: [105.8, 20.8],
      zoom: 4.1,
      attributionControl: true
    });

    map.addControl(
      new maplibregl.NavigationControl(),
      "bottom-right"
    );

    return map;
  } catch (error) {
    console.error("Map initialization failed:", error);
    return null;
  }
}


/**
 * 搜索地点
 *
 * 返回：
 * [
 *   {
 *     name,
 *     address,
 *     lat,
 *     lng,
 *     raw
 *   }
 * ]
 */
export async function searchPlaces(query) {
  const keyword = String(query || "").trim();

  if (!keyword) {
    return [];
  }

  const url = new URL(NOMINATIM_URL);

  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "8");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "zh,en");
  url.searchParams.set("q", keyword);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim HTTP ${response.status}`);
    }

    const results = await response.json();

    return results.map((item) => ({
      name: getPlaceName(item),
      address: item.display_name || "",
      lat: Number(item.lat),
      lng: Number(item.lon),
      raw: item
    })).filter((item) => {
      return Number.isFinite(item.lat) && Number.isFinite(item.lng);
    });

  } catch (error) {
    console.error("Place search failed:", error);
    return [];
  }
}


/**
 * 尽量给地点一个简洁的名称
 */
function getPlaceName(item) {
  const address = item.address || {};

  return (
    item.name ||
    address.hotel ||
    address.tourism ||
    address.amenity ||
    address.shop ||
    address.building ||
    item.display_name?.split(",")[0] ||
    "Unknown place"
  );
}


/**
 * 地图飞到某个地点
 */
export function flyToPlace(map, place, options = {}) {
  if (!map || !place) {
    return null;
  }

  const lng = Number(place.lng);
  const lat = Number(place.lat);

  if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
    return null;
  }

  const zoom = Number.isFinite(options.zoom)
    ? options.zoom
    : 14;

  map.flyTo({
    center: [lng, lat],
    zoom,
    speed: 1.2,
    curve: 1.3,
    essential: true
  });

  return addPlaceMarker(
    map,
    place,
    options
  );
}


/**
 * 添加地点 marker
 *
 * options:
 * - momentId
 * - onClick
 * - popup
 */
export function addPlaceMarker(map, place, options = {}) {
  if (!map || typeof maplibregl === "undefined") {
    return null;
  }

  const lng = Number(place.lng);
  const lat = Number(place.lat);

  if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
    return null;
  }

  const markerElement = document.createElement("button");

  markerElement.type = "button";
  markerElement.className = "triplog-marker";
  markerElement.setAttribute(
    "aria-label",
    place.name || "Travel location"
  );

  if (options.momentId) {
    markerElement.dataset.momentId = options.momentId;
  }

  const marker = new maplibregl.Marker({
    element: markerElement,
    anchor: "bottom"
  })
    .setLngLat([lng, lat])
    .addTo(map);

  if (place.name || place.address || options.popup) {
    const popupContent = document.createElement("div");

    popupContent.className = "triplog-popup";

    if (place.name) {
      const title = document.createElement("strong");
      title.textContent = place.name;
      popupContent.appendChild(title);
    }

    if (place.address) {
      const address = document.createElement("div");
      address.textContent = place.address;
      popupContent.appendChild(address);
    }

    if (options.popup) {
      const extra = document.createElement("div");
      extra.textContent = options.popup;
      popupContent.appendChild(extra);
    }

    const popup = new maplibregl.Popup({
      offset: 24,
      closeButton: false
    }).setDOMContent(popupContent);

    marker.setPopup(popup);
  }

  markerElement.addEventListener("click", () => {
    if (typeof options.onClick === "function") {
      options.onClick(place, marker);
    }
  });

  markers.push({
    marker,
    element: markerElement,
    momentId: options.momentId || null
  });

  return marker;
}


/**
 * 清除所有 TripLog marker
 */
export function clearMarkers() {
  markers.forEach((item) => {
    item.marker.remove();
  });

  markers = [];
}


/**
 * 根据 momentId 找 marker
 */
export function getMarkerByMomentId(momentId) {
  return markers.find(
    (item) => item.momentId === momentId
  ) || null;
}


/**
 * 高亮指定 marker
 */
export function setActiveMarker(momentId) {
  markers.forEach((item) => {
    item.element.classList.toggle(
      "is-active",
      item.momentId === momentId
    );
  });
}
