var express = require("express"),
  app = express(),
  bodyParser  = require("body-parser"),
  methodOverride = require("method-override");

var cors = require('cors')
const axios = require('axios').default;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(cors())

var router = express.Router();

const instance = axios.create({
  baseURL: 'https://api.mercadolibre.com/'
});

router.get('/api/items', async function (req, res) {

  let query = ''
  if (req.query.q) query = req.query.q

  await instance.get(encodeURI(`sites/MLA/search`), {
      params: {
        q: query
      }
    })
    .then((response) => {
    res.json(
      {
        "author": {
          "name": "",
          "lastname": ""
        },
        "categories": getCategories(response.data.filters),
        "items": response.data.results.map(item => {
          return {
            "id": item.id,
            "title": item.title,
            "price": {
              "currency": item.currency_id,
              "amount": item.price,
              "decimals": item.sold_quantity
            },
            "picture": item.thumbnail,
            "condition": item.condition,
            "free_shipping": item.shipping.free_shipping
          }
        })
      }
    );
  })
    .catch((e) => {
      res.status(500).json({
        message: 'error interno del servidor'
      })
  })

  function getCategories(filters) {
    if (filters[0])
      if (filters[0].values[0])
        if (filters[0].values[0].path_from_root)
          return filters[0].values[0].path_from_root.map(category => {
            if (category.name) return category.name
            else return '';
          })
    return []
  }

});

router.get('/api/items/:id', async function (req, res) {

  let item_id = ''
  if (req.params.id) item_id = req.params.id

  await instance.get(encodeURI(`items/${item_id}`))
    .then((response) => {
      getDescription(item_id)
        .then((response_description) => {
          res.json(
            {
              "author": {
                "name": "",
                "lastname": ""
              },
              "item": {
                "id": response.data.id,
                "title": response.data.title,
                "price": {
                  "currency": response.data.currency_id,
                  "amount": response.data.price,
                  "decimals": response.data.sold_quantity
                },
                "sold_quantity": response.data.sold_quantity,
                "picture": getFirstPicture(response.data.pictures),
                "condition": response.data.condition,
                "free_shipping": response.data.shipping.free_shipping,
                "description": response_description.data.plain_text
              }
            }
          )

        }).catch((e) => {
          console.log(e)
          res.status(500).json({
            message: 'Error interno del servidor'
          })
      })
      
      
      
      function getFirstPicture(pictures) {
        if (pictures)
          if (pictures[0])
            if (pictures[0].url)
              return pictures[0].url
        return '';
      }
      
      function getDescription(product_id) {
        return instance.get(encodeURI(`items/${product_id}/description`))
      }

    }
  ).catch(e => {
    console.log(e)
      res.status(500).json({
        error: 'Error interno del servidor'
      })
    });

});

app.use(router);

app.listen(3200, function() {
  console.log("Node server running on http://localhost:3200");
});