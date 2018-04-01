const express = require('express')
const fetch = require('node-fetch')
const {authenticate} = require('pixabay-api')
const fs = require('fs')

const {AUTH_KEY} = require('./config.json')
const PORT = process.env.PORT || 8080
const {searchImages} = authenticate(AUTH_KEY)
const storeURL = require('path').resolve('./data/searches.json')
let SEARCH_STORE = JSON.parse(fs.readFileSync(storeURL))
const app = express()

const filterImages = e => makeImageObject(e.previewURL, e.webformatURL, e.tags, e.pageURL)
const makeImageObject = (thumbnailUrl, webUrl, alt, pictureLocation) => {return new Object({thumbnailUrl, webUrl, alt, pictureLocation})}//I know I can use {{}} but I get weird bugs when I do, so it's staying like this

const updateStorage = (query, arr) => {
  
    if(SEARCH_STORE.hasOwnProperty(query)){
        delete SEARCH_STORE[query]
    }
    
    let newData = {}
    newData[query] = arr
    
    const newStore = Object.assign(newData, SEARCH_STORE)
    SEARCH_STORE = newStore
    fs.writeFile(storeURL, JSON.stringify(SEARCH_STORE), 'utf-8')
    return arr
}

const getCachedResults = (query, offset) => {
    const cachedData = SEARCH_STORE[query]
    if(!cachedData) return false
    updateStorage(query, cachedData)
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
        .catch(err => console.log(err))
    }
})

app.get('/recent/', (req, res) => {
   const keys = Object.keys(SEARCH_STORE)
   
   keys.length <= 10 ? res.send(keys) : res.send(keys.splice(0, 10))
})

app.listen(PORT, () => {
    console.log('Listening on :', PORT)
})

