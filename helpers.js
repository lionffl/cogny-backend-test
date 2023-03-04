const axios = require("axios");

async function fetchPopulation() {
  const url =
    "https://datausa.io/api/data?drilldowns=Nation&measures=Population";
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(error);
  }
}


function getPopulationSum(data) {
  let sum = 0;
  for (let i = 0; i < data.length; i += 1) {
    sum = sum + data[i]["Population"];
  }
  return sum;
}


function filterByPeriod(data, years) {
  const filteredData = data.filter((element) =>
    years.includes(element["ID Year"]),
  );
  return filteredData;
}

const sumPopulationQuery = `
        SELECT SUM((doc_element->>'Population')::integer) AS total_population
        FROM lionffl.api_data, jsonb_array_elements(doc_record->'data') AS doc_element
        WHERE (doc_element->>'Year')::integer = ANY($1)
      `;

module.exports = {
  fetchPopulation,
  getPopulationSum,
  filterByPeriod,
  sumPopulationQuery
};
