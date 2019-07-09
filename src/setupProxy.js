const dynamoose = require("dynamoose");
const dynalite = require("dynalite");
const express = require("express");

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
  dynamoose.local(); // This defaults to "http://localhost:8000"
};

const createModels = () => {
  const Conference = dynamoose.model("Conference", {
    slug: String,
    name: String,
    description: String,
    earliestStartDate: Date,
    latestEndDate: Date,
    days: Number,
    organizer: String
  });

  return {
    Conference
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

module.exports = app => {
  const lazyLoadModels = lazyLoadModelsClosure();

  app.use(express.json());
  app.post("/api/register-conference", async (req, res) => {
    const { info } = req.body;
    const { Conference } = await lazyLoadModels();

    const conference = new Conference({
      slug: slugify(info.name),
      name: info.name,
      description: info.description,
      earliestStartDate: new Date(info.earliestStartDate),
      latestEndDate: new Date(info.latestEndDate),
      days: info.days,
      organizer: info.organizer
    });
    await conference.save();
    res.json({
      status: "ok",
      info: {
        slug: conference.slug
      }
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
