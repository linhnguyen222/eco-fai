const dynamoose = require("dynamoose");
const dynalite = require("dynalite");
const express = require("express");
const dateFns = require("date-fns");
const fetch = require("node-fetch");
const pf = require("pareto-frontier");
const randomstring = require("randomstring");

// eslint-disable-next-line no-unused-vars
const arrayFlat = require("array-flat-polyfill");
// eslint-disable-next-line no-unused-vars
const objectPolyfill = require("es7-object-polyfill");

const dateMax = dateFns.max;
const dateMin = dateFns.min;

const startUpAndReturnDynamo = async () => {
  const dynaliteServer = dynalite();
  await dynaliteServer.listen(8000);
  return dynaliteServer;
};

const createDynamooseInstance = () => {
  dynamoose.AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
  });
  if (
    !(
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_REGION
    )
  ) {
    dynamoose.local(process.env.DYNAMO_DB_HOST || "http://localhost:8000"); // This defaults to "http://localhost:8000"
  } else {
    dynamoose.ddb();
  }
};

const createModels = () => {
  const Conference = dynamoose.model("Conference", {
    slug: String,
    name: String,
    description: String,
    earliestStartDate: Date,
    latestEndDate: Date,
    days: Number,
    organizer: String,
    locationPreferences: Array,
    airports: Array
  });
  const InterestRegistration = dynamoose.model("InterestRegistration", {
    id: String,
    conferenceSlug: String,
    from: String,
    startDate: Date,
    endDate: Date,
    airports: Array,
    possibleFlightInformation: Array
  });
  const AirportInfo = dynamoose.model("Airport", {
    code: String,
    city: String,
    name: String
  });
  const AirlineInfo = dynamoose.model("AirlineInfo", {
    code: String,
    name: String
  });
  const TravelItinerary = dynamoose.model("TravelItinerary", {
    id: String,
    agony: Number,
    price: Number,
    routing_ids: Array
  });
  const TravelRouting = dynamoose.model("TravelRouting", {
    id: String,
    legs: Array
  });
  const TravelLeg = dynamoose.model("TravelLeg", {
    id: String,
    flight_no: String,
    arrive_iso: Date,
    depart_iso: Date,
    to_code: String,
    from_code: String
  });

  return {
    Conference,
    InterestRegistration,
    AirportInfo,
    AirlineInfo,
    TravelItinerary,
    TravelRouting,
    TravelLeg
  };
};

const slugify = name =>
  name
    .replace(/\s+/g, "-")
    .toLowerCase()
    .slice(0, 20);

const lazyLoadModelsClosure = () => {
  let models = null;

  return async () => {
    if (!models) {
      await startUpAndReturnDynamo();
      createDynamooseInstance();

      models = createModels();
    }
    return models;
  };
};

const WHITELISTED_AIRPORTS = new Set(
  `ATL
  PEK
  LHR
  ORD
  HND
  LAX
  CDG
  DFW
  FRA
  HKG
  DEN
  DXB
  CGK
  AMS
  MAD
  BKK
  JFK
  SIN
  CAN
  LAS
  PVG
  SFO
  PHX
  IAH
  CLT
  MIA
  MUC
  KUL
  FCO
  IST
  SYD
  MCO
  ICN
  DEL
  BCN
  LGW
  EWR
  YYZ
  SHA
  MSP
  SEA
  DTW
  PHL
  BOM
  GRU
  MNL
  CTU
  BOS
  SZX
  MEL
  NRT
  ORY
  MEX
  DME
  AYT
  TPE
  ZRH
  LGA
  FLL
  IAD
  PMI
  CPH
  SVO
  BWI
  KMG
  VIE
  OSL
  JED
  BNE
  SLC
  DUS
  BOG
  MXP
  JNB
  ARN
  MAN
  MDW
  DCA
  BRU
  DUB
  GMP
  DOH
  STN
  HGH
  CJU
  YVR
  TXL
  SAN
  TPA
  CGH
  BSB
  CTS
  XMN
  RUH
  FUK
  GIG
  HEL
  LIS
  ATH
  AKL
  PER
  ADL
  BNE
  GDG
  SXL
`
    .split("\n")
    .map(a => a.trim())
);

const findNearbyAirports = async cities => {
  const AIRLABS_API_KEY = process.env.AIRLABS_API_KEY;
  const AIRLABS_URL = `http://airlabs.co/api/v6/autocomplete?api_key=${AIRLABS_API_KEY}`;
  let airports = [];

  for (let city of cities) {
    const { response } = await fetch(`${AIRLABS_URL}&query=${city}`).then(r =>
      r.json()
    );
    Array.prototype.push.apply(
      airports,
      response.airports_by_cities
        .filter(c => WHITELISTED_AIRPORTS.has(c.code))
        .map(c => ({
          ...c,
          city
        }))
    );
  }

  return airports;
};

const formatDateForHipmunk = date => {
  return date.toDateString().slice(4);
};

const encodeQuery = params =>
  Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

const baseBackOff = 500;
const max = 10000;

const handleThroughput = async (
  model,
  method,
  backoff = baseBackOff,
  attempt = 1
) => {
  try {
    await new Promise(res => setTimeout(res, backoff));
    let response = await method(model);
    return response;
  } catch (e) {
    if (e.code === "ProvisionedThroughputExceededException") {
      console.log(e);
      let tempt = Math.min(max, baseBackOff * Math.pow(2, attempt));
      backoff = tempt / 2 + Math.floor(Math.random() * (tempt / 2));
      console.log("Backing off for " + backoff);
      return await handleThroughput(model, method, backoff, ++attempt);
    } else throw e;
  }
};

const batchPut = (m, data) => m.batchPut(data);

const queryFlightsForRegistrant = async (conference, interest) => {
  // In the background, slide the window across the feasible
  // conference dates and work out what the flight options are
  // for the given registrant. We'll just bulk-save the information
  // we get from the API provider.
  //
  // Its horrible, I know.
  //
  // Stop looking at me.

  let startDate = conference.earliestStartDate;
  dateFns.addDays(conference.latestEndDate, 1);

  let promises = [];

  while (
    dateFns.differenceInDays(
      dateFns.addDays(conference.latestEndDate, 1),
      dateFns.addDays(dateFns.addDays(startDate, -1), conference.days)
    ) > 0
  ) {
    // Go through each of the airports on the interest and each
    // of the destination airports, and gather flight data
    for (
      let srcAirportIndex = 0;
      srcAirportIndex < interest.airports.length;
      ++srcAirportIndex
    ) {
      for (
        let dstAirportIndex = 0;
        dstAirportIndex < conference.airports.length;
        ++dstAirportIndex
      ) {
        let srcAirport = interest.airports[srcAirportIndex];
        let dstAirport = conference.airports[dstAirportIndex];
        let parameters = {
          from0: srcAirport.code,
          to0: dstAirport.code,
          date0: formatDateForHipmunk(startDate),
          pax: 1,
          cabin: "Coach",
          country: "US"
        };
        let url = `https://apidojo-hipmunk-v1.p.rapidapi.com/flights/create-session?${encodeQuery(
          parameters
        )}`;
        console.log(url);
        promises.push(
          fetch(url, {
            method: "GET",
            headers: {
              "X-RapidAPI-Host": "apidojo-hipmunk-v1.p.rapidapi.com",
              "X-RapidAPI-Key": process.env.HIPMUNK_API_KEY
            }
          }).then(r =>
            r.text().then(text => {
              try {
                return JSON.parse(text);
              } catch (e) {
                console.error(e);
                console.log(text);
                return {};
              }
            })
          )
        );
      }
    }
    startDate = dateFns.addDays(startDate, 1);
  }

  return (await Promise.all(promises)).filter(p => !p.errors);
};

// Based on https://www.carbonindependent.org/22.html
const CARBON_EMISSIONS_PER_HOUR = 90;
const CARBON_EMISSIONS_PER_MINUTE = CARBON_EMISSIONS_PER_HOUR / 60;

const sum = array => array.reduce((s, e) => s + e, 0);

const computeTotalTimeFromTimestamps = timestampPairs =>
  sum(
    timestampPairs.map(([depart, arrive]) =>
      dateFns.differenceInMinutes(arrive, depart)
    )
  );

const computeParetoOptimalCostEmissionsTradeoff = emissionsPriceTable =>
  pf.getParetoFrontier(emissionsPriceTable, {
    optimize: "bottomLeft"
  });

const fromEntries = arr =>
  Object.assign({}, ...arr.map(([k, v]) => ({ [k]: v })));

const deduplicateKVs = arr => {
  return Object.entries(fromEntries(arr));
};

const splitBatches = arr => {
  let len = 10;
  var chunks = [],
    i = 0,
    n = arr.length;

  while (i < n) {
    chunks.push(arr.slice(i, (i += len)));
  }
  return chunks;
};

const sendEmailUsingSendgrind = contents => {
  return fetch(`https://api.sendgrid.com/v3/mail/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`
    },
    body: JSON.stringify(contents)
  }).catch(e => console.error(e));
};

module.exports = app => {
  const lazyLoadModels = lazyLoadModelsClosure();

  const computeFlightTimesAndCostsTableFromItineraries = async (
    possibleFlightInformation,
    destinationCity
  ) => {
    const {
      AirportInfo,
      TravelItinerary,
      TravelRouting,
      TravelLeg
    } = await lazyLoadModels();

    const destinationAirports = await AirportInfo.scan("city")
      .eq(destinationCity)
      .exec();
    const destinationAirportCodes = new Set(
      destinationAirports.map(({ code }) => code)
    );

    // Early return if possibleFlightInformation is empty, just return
    // an empty list so that Dynamoose doesn't get upset.
    if (possibleFlightInformation.length === 0) {
      return [];
    }

    const itineraries = (await TravelItinerary.scan({
      FilterExpression: "contains(:ids, id)",
      ExpressionAttributeValues: {
        ":ids": possibleFlightInformation
      }
    }).exec())
      .filter(i => !!i)
      // Work around an odd bug in Dynamoose
      .map(({ routing_ids, ...rest }) => ({
        routing_ids: JSON.parse(routing_ids),
        ...rest
      }));
    const routingIdsAndPrices = fromEntries(
      itineraries
        .map(itin =>
          itin.routing_ids.map(routingId => ({
            routingId,
            price: itin.price,
            agony: itin.agony
          }))
        )
        .flat()
        .map(({ routingId, price, agony }) => [routingId, { price, agony }])
    );
    const routings = (await TravelRouting.scan({
      FilterExpression: "contains(:ids, id)",
      ExpressionAttributeValues: {
        ":ids": Object.keys(routingIdsAndPrices)
      }
    }).exec())
      // Work around an odd bug in Dynamoose
      .map(({ legs, ...rest }) => ({
        legs: JSON.parse(legs),
        ...rest
      }));
    const routingPrices = routings.map(routing => ({
      ...routingIdsAndPrices[routing.id],
      routing: routing
    }));
    const filteredRoutingPrices = routingPrices.filter(i => !!i.routing);
    const legs = fromEntries(
      (await TravelLeg.scan({
        FilterExpression: "contains(:ids, id)",
        ExpressionAttributeValues: {
          ":ids": filteredRoutingPrices
            .map(({ routing }) => routing.legs)
            .flat()
        }
      }).exec()).map(leg => [leg.id, leg])
    );
    const legsPrice = filteredRoutingPrices.map(
      ({ routing, price, agony }) => ({
        legs: routing.legs.map(legId => legs[legId]).filter(i => !!i),
        price,
        agony
      })
    );
    const filteredLegsPrice = legsPrice.filter(({ legs }) =>
      destinationAirportCodes.has(legs[legs.length - 1].to_code)
    );
    return filteredLegsPrice.map(({ legs, price, agony }) => ({
      emissions:
        computeTotalTimeFromTimestamps(
          legs.map(leg => [leg.depart_iso, leg.arrive_iso])
        ) * CARBON_EMISSIONS_PER_MINUTE,
      price,
      agony
    }));
  };

  app.use(express.json());
  app.get("/api/quote", async (req, res) => {
    const response = await fetch(
      "https://yusufnb-quotes-v1.p.rapidapi.com/widget/~environment.json",
      {
        method: "GET",
        headers: {
          "X-RapidAPI-Host": "yusufnb-quotes-v1.p.rapidapi.com",
          "X-RapidAPI-Key": "8224ef5cb2msh077533f86811bbdp10c86cjsna516eb53f619"
        }
      }
    ).then(r => r.json());

    res.json({
      status: "ok",
      info: {
        quote: response.quote,
        by: response.by
      }
    });
  });
  app.post("/api/register-conference", async (req, res) => {
    const { info } = req.body;
    const { Conference } = await lazyLoadModels();
    const airports = await findNearbyAirports(info.locationPreferences);
    const slug = slugify(info.name);

    const conference = new Conference({
      slug,
      name: info.name,
      description: info.description,
      earliestStartDate: new Date(info.earliestStartDate),
      latestEndDate: new Date(info.latestEndDate),
      days: info.days,
      organizer: info.organizer,
      locationPreferences: info.locationPreferences,
      airports: airports,
      urlOrigin: info.urlOrigin
    });
    await conference.save();
    await sendEmailUsingSendgrind({
      personalizations: [
        {
          to: [
            {
              email: info.email
            }
          ],
          subject: "The planet ♥️ your conference"
        }
      ],
      from: {
        email: "noreply@ecof.ai"
      },
      content: [
        {
          type: "text/html",
          value: [
            "<html>",
            "<body>",
            `Thanks for doing your bit to save on CO2 emissions `,
            `by planning your Conference on ecofai!<br />`,
            `Get people to register for your conference at ${info.urlOrigin}/admin/update/${conference.slug}.<br />`,
            `You can edit your conference at ${info.urlOrigin}/admin/update/${conference.slug}.<br/></br>`,
            `View a location that is better on both the environment and the wallets of your attendees at any time, at ${info.urlOrigin}/admin/destinations/${conference.slug}.`,
            "</body>",
            "</html>"
          ].join("")
        }
      ]
    });
    res.json({
      status: "ok",
      info: {
        slug: conference.slug
      }
    });
  });
  app.post("/api/update-conference/:slug", async (req, res) => {
    const { slug } = req.params;
    const { info } = req.body;
    const { Conference } = await lazyLoadModels();

    const conferences = await Conference.query("slug")
      .eq(slug)
      .exec();

    if (!conferences.length) {
      res.json({
        status: "err",
        error: {
          code: "NO_SUCH_CONFERENCE",
          msg: `No such conference ${req.params.slug}`
        }
      });
      return;
    }
    const conference = conferences[0];

    await Conference.update(
      { slug },
      {
        name: info.name || conference.name,
        description: info.description || conference.description,
        earliestStartDate:
          new Date(info.earliestStartDate) || conference.earliestStartDate,
        latestEndDate: new Date(info.latestEndDate) || conference.latestEndDate,
        days: info.days || conference.days,
        organizer: info.organizer || conference.organizer,
        locationPreferences:
          info.locationPreferences || conference.locationPreferences,
        airports: await findNearbyAirports(
          info.locationPreferences || conference.locationPreferences
        )
      }
    );
    res.json({
      status: "ok",
      info: {
        slug: conference.slug
      }
    });
  });
  app.post("/api/register-conference-interest", async (req, res) => {
    const { info } = req.body;
    const {
      Conference,
      InterestRegistration,
      AirportInfo,
      AirlineInfo,
      TravelItinerary,
      TravelRouting,
      TravelLeg
    } = await lazyLoadModels();

    const conferences = await Conference.query("slug")
      .eq(info.slug)
      .exec();

    if (!conferences.length) {
      res.json({
        status: "err",
        error: {
          code: "NO_SUCH_CONFERENCE",
          msg: `No such conference ${req.params.slug}`
        }
      });
      return;
    }

    const conference = conferences[0];
    const airports = await findNearbyAirports([info.from]);

    const registration = new InterestRegistration({
      id: randomstring.generate(),
      conferenceSlug: info.slug,
      startDate: info.startDate,
      endDate: info.endDate,
      from: info.from,
      airports: airports
    });
    await registration.save();

    // Send response now, we'll query flights in the background
    res.json({
      status: "ok"
    });

    const possibleFlightInformation =
      (await queryFlightsForRegistrant(conference, registration)) || [];

    const airportInfoPromises = splitBatches(
      deduplicateKVs(
        possibleFlightInformation
          .filter(info => info && info.airports)
          .map(info => {
            return Object.entries(info.airports || {});
          })
          .flat()
      ).map(([code, { city, name }]) => ({
        code,
        city,
        name
      }))
    ).map(a => handleThroughput(AirportInfo, m => batchPut(m, a)));

    const airlineInfoPromises = splitBatches(
      deduplicateKVs(
        possibleFlightInformation
          .map(info => Object.entries(info.airlines || {}))
          .flat()
      ).map(([code, { name }]) => ({ code, name }))
    ).map(a => handleThroughput(AirlineInfo, m => batchPut(m, a)));

    // Keep track of feasible itineraries here, we'll need them later
    const feasibleItineraries = [];

    const travelItineraryPromises = splitBatches(
      deduplicateKVs(
        possibleFlightInformation
          .map(info =>
            Object.entries(info.itins)
              // Filter out flight itineraries that have no routings
              // that are better than any other routing on any metric
              .filter(([, v]) => {
                return v.routing_idens.filter(
                  r => info.routings[r].dominated_by === null
                ).length;
              })
          )
          .flat()
          .map(([id, v]) => {
            feasibleItineraries.push(id);
            return [id, v];
          })
      ).map(([id, { agony, price, routing_idens }]) => ({
        id,
        agony,
        price,
        routing_ids: routing_idens
      }))
    ).map(a => handleThroughput(TravelItinerary, m => batchPut(m, a)));

    const travelRoutingPromises = splitBatches(
      deduplicateKVs(
        possibleFlightInformation
          .map(info =>
            // Don't want any routings that are worse on all metrics than any other routing
            Object.entries(info.routings).filter(
              ([, v]) => v.dominated_by === null
            )
          )
          .flat()
      ).map(([id, { leg_idens }]) => ({
        id,
        legs: leg_idens
      }))
    ).map(a => handleThroughput(TravelRouting, m => batchPut(m, a)));

    const travelLegPromises = splitBatches(
      deduplicateKVs(
        possibleFlightInformation.map(info => Object.entries(info.legs)).flat()
      ).map(
        ([
          id,
          { marketing_num, arrive_iso, depart_iso, to_code, from_code }
        ]) => ({
          id,
          flight_no: marketing_num.join(""),
          arrive_iso: new Date(arrive_iso),
          depart_iso: new Date(depart_iso),
          to_code: to_code,
          from_code: from_code
        })
      )
    ).map(a => handleThroughput(TravelLeg, m => batchPut(m, a)));

    await Promise.all(
      [
        airportInfoPromises,
        airlineInfoPromises,
        travelItineraryPromises,
        travelRoutingPromises,
        travelLegPromises
      ].flat()
    );

    registration.possibleFlightInformation = feasibleItineraries;
    await registration.save();
    console.log(`Finished registering participant from ${info.from}`);
  });
  app.get("/api/conferences", async (req, res) => {
    const { Conference } = await lazyLoadModels();
    const conferences = await Conference.scan().exec();

    res.json({
      status: "ok",
      info: {
        conferences: conferences.map(c => c.slug)
      }
    });
  });
  app.get("/api/conference-interest/:slug", async (req, res) => {
    const { Conference, InterestRegistration } = await lazyLoadModels();
    const conferences = await Conference.query("slug")
      .eq(req.params.slug)
      .exec();

    if (!conferences.length) {
      res.json({
        status: "err",
        error: {
          code: "NO_SUCH_CONFERENCE",
          msg: `No such conference ${req.params.slug}`
        }
      });
      return;
    }

    const conference = conferences[0];
    const registrations = await InterestRegistration.scan({
      conferenceSlug: {
        eq: req.params.slug
      }
    }).exec();

    res.json({
      status: "ok",
      info: {
        destinations: conference.locationPreferences,
        earliestStartDate: dateMin(registrations.map(r => r.startDate)),
        latestEndDate: dateMax(registrations.map(r => r.endDate)),
        scheduling: registrations.map(r => ({
          from: r.from,
          startDate: r.startDate,
          endDate: r.endDate
        })),
        destinationOptimality: await Promise.all(
          registrations.map(async r => ({
            from: r.from,
            destinationFrontier: await Promise.all(
              conference.locationPreferences.map(async destination => ({
                destination,
                tradeoff: computeParetoOptimalCostEmissionsTradeoff(
                  (await computeFlightTimesAndCostsTableFromItineraries(
                    r.possibleFlightInformation || [],
                    destination
                  ))
                    .filter(value => {
                      // console.log("filtering", value);
                      return value;
                      // return emissions && price;
                    })
                    .map(({ emissions, price }) => [emissions, price])
                ).map(([emissions, price]) => ({ emissions, price }))
              }))
            )
          }))
        )
      }
    });
  });
  app.get("/api/conference-exists/:slug", async (req, res) => {
    const { Conference } = await lazyLoadModels();
    const conferences = await Conference.query("slug")
      .eq(req.params.slug)
      .exec();

    if (!conferences.length) {
      res.json({
        status: "err",
        error: {
          code: "NO_SUCH_CONFERENCE",
          msg: `No such conference ${req.params.slug}`
        }
      });
      return;
    }

    res.json({
      status: "ok"
    });
  });
  app.get("/api/conference-proposal/:slug", async (req, res) => {
    const { Conference } = await lazyLoadModels();
    const conferences = await Conference.query("slug")
      .eq(req.params.slug)
      .exec();

    if (!conferences.length) {
      res.json({
        status: "err",
        error: {
          code: "NO_SUCH_CONFERENCE",
          msg: `No such conference ${req.params.slug}`
        }
      });
      return;
    }

    res.json({
      status: "ok",
      info: {
        conference: conferences[0]
      }
    });
  });
};
