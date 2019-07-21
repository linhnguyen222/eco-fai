/* eslint-disable */
const data = {
  "status": "ok",
  "info": {
    "destinations": [
      "Melbourne",
      "London",
      "San Francisco"
    ],
    "earliestStartDate": "2019-07-21T21:51:00.000Z",
    "latestEndDate": "2019-07-26T21:51:00.000Z",
    "scheduling": [{
      "from": "Helsinki",
      "startDate": "2019-07-21T21:51:00.000Z",
      "endDate": "2019-07-26T21:51:00.000Z"
    }],
    "destinationOptimality": [{
      "from": "Helsinki",
      "destinationFrontier": [{
          "destination": "Melbourne",
          "tradeoff": [{
              "emissions": 2025,
              "price": 5025
            },
            {
              "emissions": 2100,
              "price": 1878
            }
          ]
        },
        {
          "destination": "London",
          "tradeoff": [{
            "emissions": 277.5,
            "price": 110
          }]
        },
        {
          "destination": "San Francisco",
          "tradeoff": [{
              "emissions": 990,
              "price": 2240
            },
            {
              "emissions": 1215,
              "price": 1851
            }
          ]
        }
      ]
    }]
  }
}
export default data;