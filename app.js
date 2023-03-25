const express = require('express');
const https = require('https');
const Amadeus = require('amadeus');

const app = express();

require('dotenv').config();


const amadeus = new Amadeus({
    clientId: process.env.AMADEUS_CLIENT_ID,
    clientSecret: process.env.AMADEUS_CLIENT_SECRET
});

const countries = require('./countries.json');

let countryCode;

app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html')
})

app.get('/search', (req, res) => {
    const query = req.query.query.toLowerCase();
    for(const [code, name] of Object.entries(countries)){
        if (name.toLowerCase() === query){
            countryCode = code;
            return res.redirect('/covid');
        }
    }

    return res.send('Country not found.');
});

app.get('/covid', (req, res) => {
    amadeus.dutyOfCare.diseases.covid19Report.get({
        countryCode: countryCode
    }).then(response => {
        const { name } = response.data.area
        const { lastUpdate, text } = response.data.summary
        const riskLevelText = response.data.diseaseRiskLevel.text
        const hotspots = response.data.hotspots.text
        const { covidDashboardLink, healthDepartmentSiteLink } = response.data.dataSources
        const entryLastUpdate = response.data.areaAccessRestriction.entry.lastUpdate
        const entryText = response.data.areaAccessRestriction.entry.text
        const { ban, throughDate, referenceLink, exemptions } = response.data.areaAccessRestriction.entry

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

function removeTags(data){
    return data.replace('<p>', '').replace('</p>', '')
}