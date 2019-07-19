const dynamoose = require("dynamoose");
const dynalite = require("dynalite");
const express = require("express");
const dateFns = require("date-fns");
const fetch = require("node-fetch");

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
    conferenceSlug: String,
    from: String,
    startDate: Date,
    endDate: Date
  });

  return {
    Conference,
    InterestRegistration
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

const findNearbyAirports = async cities => {
  const AIRLABS_API_KEY = process.env.AIRLABS_API_KEY;
  const AIRLABS_URL = `http://airlabs.co/api/v6/autocomplete?api_key=${AIRLABS_API_KEY}`;
  let airports = [];

  for (let city of cities) {
    console.log(`${AIRLABS_URL}&query=${city}`);
    const { response } = await fetch(`${AIRLABS_URL}&query=${city}`).then(r =>
      r.json()
    );
    //console.log(JSON.stringify(response, null, 4));
    Array.prototype.push.apply(
      airports,
      response.airports_by_cities.map(c => ({
        ...c,
        city
      }))
    );
  }

  return airports;
};

module.exports = app => {
  const lazyLoadModels = lazyLoadModelsClosure();

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
    const { InterestRegistration } = await lazyLoadModels();

    const registration = new InterestRegistration({
      conferenceSlug: info.slug,
      startDate: info.startDate,
      endDate: info.endDate,
      from: info.from
    });
    await registration.save();
    res.json({
      status: "ok"
    });
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
    const registrations = await InterestRegistration.query("conferenceSlug")
      .eq(conference.slug)
      .exec();

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
        }))
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
