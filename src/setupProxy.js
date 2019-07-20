const dynamoose = require("dynamoose");
const dynalite = require("dynalite");
const express = require("express");
const dateFns = require("date-fns");
const fetch = require("node-fetch");
const pf = require("pareto-frontier");
const randomstring = require("randomstring");

const dateMax = dateFns.max;
const dateMin = dateFns.min;

const startUpAndReturnDynamo = async () => {
  const dynaliteServer = dynalite();
  await dynaliteServer.listen(8000);
  return dynaliteServer;
};

const createDynamooseInstance = () => {
  dynamoose.AWS.config.update({
    accessKeyId: "AKID",
    secretAccessKey: "SECRET",
    region: "us-east-1"
  });
  dynamoose.local(process.env.DYNAMO_DB_HOST || "http://localhost:8000"); // This defaults to "http://localhost:8000"
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

const queryFlightsForRegistrant = async (conference, interest) => {
  // In the background, slide the window across the feasible
  // conference dates and work out what the flight options are
  // for the given registrant. We'll just bulk-save the information
  // we get from the API provider.
  //
  // Its horrible, I know.
  //
  // Stop looking at me.
  let possibleFlightInformation = [];

  let startDate = conference.earliestStartDate;
  dateFns.addDays(conference.latestEndDate, 1);

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
        let routes = await fetch(url, {
          method: "GET",
          headers: {
            "X-RapidAPI-Host": "apidojo-hipmunk-v1.p.rapidapi.com",
            "X-RapidAPI-Key": process.env.HIPMUNK_API_KEY
          }
        }).then(r => r.json());

        if (routes.errors) {
          break;
        }

        possibleFlightInformation.push(routes);
        startDate = dateFns.addDays(startDate, 1);
      }
    }

    return possibleFlightInformation;
  }
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

module.exports = app => {
  const lazyLoadModels = lazyLoadModelsClosure();

  const computeFlightTimesAndCostsTableFromItineraries = async (
    possibleFlightInformation,
    airport
  ) => {
    const {
      TravelItinerary,
      TravelRouting,
      TravelLeg
    } = await lazyLoadModels();

    const itineraries = (await Promise.all(
      possibleFlightInformation.map(async itinId =>
        TravelItinerary.queryOne("id")
          .eq(itinId)
          .exec()
      )
    )).filter(i => !!i);
    const routingPrices = await Promise.all(
      itineraries
        .map(itin =>
          itin.routing_ids.map(routingId => ({
            routingId,
            price: itin.price,
            agony: itin.agony
          }))
        )
        .flat()
        .map(async ({ routingId, price, agony }) => ({
          routing: await TravelRouting.queryOne("id")
            .eq(routingId)
            .exec(),
          price,
          agony
        }))
    );
    const filteredRoutingPrices = routingPrices.filter(i => !!i.routing);
    const legsPrice = await Promise.all(
      filteredRoutingPrices.map(async ({ routing, price, agony }) => ({
        legs: (await Promise.all(
          routing.legs.map(legId =>
            TravelLeg.queryOne("id")
              .eq(legId)
              .exec()
          )
        )).filter(i => !!i),
        price,
        agony
      }))
    );
    const filteredLegsPrice = legsPrice.filter(
      ({ legs }) => legs[legs.length - 1].to_code === airport.code
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
  app.post("/api/register-conference", async (req, res) => {
    const { info } = req.body;
    const { Conference } = await lazyLoadModels();
    const airports = await findNearbyAirports(info.locationPreferences);

    const conference = new Conference({
      slug: slugify(info.name),
      name: info.name,
      description: info.description,
      earliestStartDate: new Date(info.earliestStartDate),
      latestEndDate: new Date(info.latestEndDate),
      days: info.days,
      organizer: info.organizer,
      locationPreferences: info.locationPreferences,
      airports: airports
    });
    await conference.save();
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

    const possibleFlightInformation = await queryFlightsForRegistrant(
      conference,
      registration
    );

    const airportInfoPromises = possibleFlightInformation.map(info =>
      Object.entries(info.airports || {}).map(async ([k, v]) => {
        const airports = await AirportInfo.query("code")
          .eq(k)
          .exec();

        if (!airports.length) {
          let info = new AirportInfo({
            code: k,
            city: v.city,
            name: v.name
          });
          await info.save();
        }
      })
    );

    const airlineInfoPromises = possibleFlightInformation.map(info =>
      Object.entries(info.airlines || {}).map(async ([k, v]) => {
        const airlines = await AirlineInfo.query("code")
          .eq(k)
          .exec();

        if (!airlines.length) {
          let info = new AirlineInfo({
            code: k,
            name: v.name
          });
          await info.save();
        }
      })
    );

    const travelItineraryPromises = possibleFlightInformation.map(info =>
      Object.entries(info.itins)
        // Filter out flight itineraries that have no routings
        // that are better than any other routing on any metric
        .filter(
          ([, v]) =>
            v.routing_idens.filter(r => info.routings[r].dominated_by === null)
              .length
        )
        .map(async ([k, v]) => {
          const itins = await TravelItinerary.query("id")
            .eq(k)
            .exec();

          if (!itins.length) {
            let itin = new TravelItinerary({
              id: k,
              agony: v.agony,
              price: v.price,
              routing_ids: v.routing_idens
            });
            await itin.save();
          }
        })
    );

    const travelRoutingPromises = possibleFlightInformation.map(info =>
      // Don't want any routings that are worse on all metrics than any other routing
      Object.entries(info.routings)
        .filter(([, v]) => v.dominated_by === null)
        .map(async ([k, v]) => {
          const routings = await TravelRouting.query("id")
            .eq(k)
            .exec();

          if (!routings.length) {
            let routing = new TravelRouting({
              id: k,
              legs: v.leg_idens
            });
            await routing.save();
          }
        })
    );

    const travelLegPromises = possibleFlightInformation.map(info =>
      Object.entries(info.legs).map(async ([k, v]) => {
        const legs = await TravelLeg.query("id")
          .eq(k)
          .exec();

        if (!legs.length) {
          let leg = new TravelLeg({
            id: k,
            flight_no: v.marketing_num.join(""),
            arrive_iso: new Date(v.arrive_iso),
            depart_iso: new Date(v.depart_iso),
            to_code: v.to_code,
            from_code: v.from_code
          });
          await leg.save();
        }
      })
    );

    await Promise.all(
      [
        airportInfoPromises,
        airlineInfoPromises,
        travelItineraryPromises,
        travelRoutingPromises,
        travelLegPromises
      ].flat()
    );

    registration.possibleFlightInformation = await possibleFlightInformation
      .map(info => Object.keys(info.itins))
      .flat()
      .filter(
        async id =>
          (await TravelItinerary.query("id")
            .eq(id)
            .exec()).length
      );
    await registration.save();
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
        destinations: conference.destinations,
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
              conference.airports.map(async destAirport => ({
                destAirport,
                tradeoff: computeParetoOptimalCostEmissionsTradeoff(
                  (await computeFlightTimesAndCostsTableFromItineraries(
                    r.possibleFlightInformation,
                    destAirport
                  )).map(({ emissions, price }) => [emissions, price])
                ).map(([emissions, price]) => ({ emissions, price }))
              }))
            )
          }))
        )
      }
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
