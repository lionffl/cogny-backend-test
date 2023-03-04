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

module.exports = {
  fetchPopulation,
};
