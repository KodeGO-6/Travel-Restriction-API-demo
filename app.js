const express = require('express');
const Amadeus = require('amadeus');

const app = express();

require('dotenv').config();     // this is used to load Environment Variables from a .env file

// Initialize the AMADEUS APP API KEY
const amadeus = new Amadeus({
    clientId: process.env.AMADEUS_CLIENT_ID,
    clientSecret: process.env.AMADEUS_CLIENT_SECRET
});

const countries = require('./countries.json');

var countryCode;    // Stores the country code of the searched country from the countries.json file

app.set('view engine', 'ejs')       // this is used to generate dynamic HTML with javaScript
app.use(express.static('public'))

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html')       // view the homepage
})

app.get('/search', (req, res) => {
    // Search for the name of the country 
    const query = req.query.query.toLowerCase();    // convert the search query to lower case
    for(const [code, name] of Object.entries(countries)){   
        if (name.toLowerCase() === query){          // checks if the country name inside 'countries.json' file is strictly equal to the search query
            countryCode = code;                     // store the country code to a variable that will be used later
            return res.redirect('/covid');          // redirect the page to the '/covid' page
        }
    }

    return res.send('Country not found.');      // return if no match is found
});

app.get('/covid', (req, res) => {
    // Making API CALL that returns a Promise that either resolves or rejects
    amadeus.dutyOfCare.diseases.covid19Report.get({
        countryCode: countryCode    // pass the countryCode variable here
    }).then(response => {
        // Store the respone in their own variables
        const { name } = response.data.area;
        const { lastUpdate, text } = response.data.summary;
        const riskLevelText = response.data.diseaseRiskLevel.text;
        const hotspots = response.data.hotspots.text;
        const { covidDashboardLink, healthDepartmentSiteLink } = response.data.dataSources;
        const entryLastUpdate = response.data.areaAccessRestriction.entry.lastUpdate;
        const entryText = response.data.areaAccessRestriction.entry.text;
        const { ban, throughDate, referenceLink, exemptions } = response.data.areaAccessRestriction.entry;

        // this will render the response into HTML elements
        res.render('index', {
            name: name,
            lastUpdate: lastUpdate,
            text: text,
            riskLevelText: riskLevelText,
            hotspots: removeTags(hotspots),
            covidDashboardLink: covidDashboardLink,
            healthDepartmentSiteLink: healthDepartmentSiteLink,
            entryLastUpdate: entryLastUpdate,
            entryText: entryText,
            ban: ban,
            throughDate: throughDate,
            referenceLink: referenceLink,
            exemptions: exemptions
        });

    }).catch(error => {
        console.log(error)
    })
})

app.listen(process.env.PORT || 5000, () => {
    console.log('Server is running on port 5000')
})

// this will just remove any unwanted <p> tags in the response
function removeTags(data){
    return data.replace('<p>', '').replace('</p>', '')
}