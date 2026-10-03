/* =========================================================
   TripLog Local Storage
========================================================= */

const STORAGE_KEY =
  "triplog-v2-data";


/* =========================================================
   LOAD
========================================================= */

export function loadData() {

  try {

    const raw =
      localStorage.getItem(
        STORAGE_KEY
      );


    if (!raw) {

      return null;

    }


    return JSON.parse(
      raw
    );

  } catch (error) {

    console.error(
      "TripLog storage read failed:",
      error
    );


    return null;

  }

}


/* =========================================================
   SAVE
========================================================= */

export function saveData(
  data
) {

  try {

    localStorage.setItem(

      STORAGE_KEY,

      JSON.stringify(data)

    );

  } catch (error) {

    console.error(
      "TripLog storage save failed:",
      error
    );


    alert(
      "TripLog could not save your data. Your browser storage may be full."
    );

  }

}


/* =========================================================
   CLEAR
========================================================= */

export function clearData() {

  localStorage.removeItem(
    STORAGE_KEY
  );

}
