const express = require('express')
const fetch = require('node-fetch')
const {authenticate} = require('pixabay-api')
const fs = require('fs')

const AUTH_KEY = process.env.AUTH_KEY
const PORT = process.env.PORT || 8080
const {searchImages} = authenticate(AUTH_KEY)
const storeURL = require('path').resolve('./data/searches.json')
const SEARCH_STORE = JSON.parse(fs.readFileSync(storeURL))
const app = express()

const filterImages = e => makeImageObject(e.previewURL, e.webformatURL, e.tags, e.pageURL)
const makeImageObject = (thumbnailUrl, webUrl, alt, pictureLocation) => {return new Object({thumbnailUrl, webUrl, alt, pictureLocation})}//I know I can use {{}} but I get weird bugs when I do, so it's staying like this

const updateStorage = (query, arr) => {
    SEARCH_STORE[query] = arr
    fs.writeFile(storeURL, JSON.stringify(SEARCH_STORE), 'utf-8')
    return arr
}

const getCachedResults = (query, offset) => {
    const cachedData = SEARCH_STORE[query]
    if(!cachedData) return false
    return paginate(cachedData, offset)
}

const paginate = (cachedData, offset) => {
    const upperLimit = offset, lowerLimit = upperLimit - 10
    if(upperLimit > cachedData.length) return false
    
    return cachedData.slice(lowerLimit, upperLimit)
}
    
app.get('/', (req, res) => {
    res.send('Hello World')
})
app.get('/api/:query/:offset', (req,res) => {
    const {query, offset} = req.params
    const cachedData= getCachedResults(query, offset * 10)
    
    if(cachedData){
        res.send(cachedData)
    } else {
        searchImages(query, {per_page: offset * 10})
        .then(r => r.hits.map(filterImages))
        .then(imageArray => updateStorage(query, imageArray))
        .then(imageArray => res.send(paginate(imageArray, offset * 10)))
    }
})


app.listen(PORT, () => {
    console.log('Listening on :', PORT)
})

