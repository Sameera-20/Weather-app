const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();

app.use(cors());

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running");
});

app.get("/weather/:city", async (req, res) => {

    try {

        const city = req.params.city;

        const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.API_KEY}&units=metric`
        );

        res.json(response.data);

    } catch (error) {

        res.status(500).json({
            message: "Error fetching weather"
        });

    }
});

