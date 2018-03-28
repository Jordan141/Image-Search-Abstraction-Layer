const express = require('express')
const fetch = require('node-fetch')
const {authenticate} = require('pixabay-api')
const fs = require('fs')
//const R = require('ramda')

const AUTH_KEY = '4263028-86143d706a6598bf902aee3f6'
const PORT = process.env.PORT || 8080
const {searchImages} = authenticate(AUTH_KEY)
const storeURL = require('path').resolve('./data/searches.json')
const SEARCH_STORE = JSON.parse(fs.readFileSync(storeURL))
const app = express()

const filterImages = e => makeImageObject(e.previewURL, e.webformatURL, e.tags, e.pageURL)
const makeImageObject = (thumbnailUrl, webUrl, alt, pictureLocation) => {
    console.log('Making new image object')
    return new Object({
        thumbnailUrl,
        webUrl,
        alt,
        pictureLocation
    })
}

const updateStorage = (query, arr) => {
    SEARCH_STORE[query] = arr
    fs.writeFile(storeURL, SEARCH_STORE, 'utf-8')
    return arr
}
        
app.get('/', (req, res) => {
    res.send('Hello World')
})
app.get('/api/:query', (req,res) => {
    const query = req.params.query, limit =10
    const result= SEARCH_STORE[query]
    console.log(Object.keys(SEARCH_STORE), query)
    
    if(result){
        console.log('Cached result')
      res.send(result)
    } else {
        console.log('Searching. . .')
     searchImages(query, {per_page: limit})
        .then(r => r.hits.map(filterImages))
        .then(imageArray => updateStorage(query, imageArray))
        .then(imageArray => res.send(imageArray))
    }
})


app.listen(PORT, () => {
    console.log('Listening on :', PORT)
})

