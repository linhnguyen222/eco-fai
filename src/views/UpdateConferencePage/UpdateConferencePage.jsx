/*!

=========================================================
* Material Dashboard React - v1.7.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-react
* Copyright 2019 Creative Tim (https://www.creative-tim.com)
* Licensed under MIT (https://github.com/creativetimofficial/material-dashboard-react/blob/master/LICENSE.md)

* Coded by Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/
import React from "react";
// nodejs library to set properties for components
import PropTypes from "prop-types";
// date-io utils
import DateFnsUtils from "@date-io/date-fns";
import { addDays, max as dateMax } from "date-fns";
// @material-ui/core components
import withStyles from "@material-ui/core/styles/withStyles";
import FormControl from "@material-ui/core/FormControl";
import TextField from "@material-ui/core/TextField";
import {
  MuiPickersUtilsProvider,
  KeyboardDatePicker
} from "@material-ui/pickers";
// core components
import GridItem from "components/Grid/GridItem.jsx";
import GridContainer from "components/Grid/GridContainer.jsx";
import CustomInput from "components/CustomInput/CustomInput.jsx";
import Button from "components/CustomButtons/Button.jsx";
import Card from "components/Card/Card.jsx";
import CardHeader from "components/Card/CardHeader.jsx";
import CardBody from "components/Card/CardBody.jsx";
import CardFooter from "components/Card/CardFooter.jsx";
import EnterConferenceSlug from "components/EnterConferenceSlug/EnterConferenceSlug.jsx";

const styles = {
  cardCategoryWhite: {
    color: "rgba(255,255,255,.62)",
    margin: "0",
    fontSize: "14px",
    marginTop: "0",
    marginBottom: "0"
  },
  cardTitleWhite: {
    color: "#FFFFFF",
    marginTop: "0px",
    minHeight: "auto",
    fontWeight: "300",
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    marginBottom: "3px",
    textDecoration: "none"
  }
};

const allSet = args => {
  return args.reduce((value, a) => value && a);
};

function UpdateConferencePage(props) {
  const { classes, match } = props;
  const slug = match.params.slug;

  const [startDate, setStartDate] = React.useState(new Date());
  const [days, setDays] = React.useState(5);
  const [endDate, setEndDate] = React.useState(addDays(startDate, days));
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [organizer, setOrganizer] = React.useState("");
  const [destinations, setDestinations] = React.useState([]);
  const [update, setUpdateSuccess] = React.useState(false);
  const [conferenceInfo, setConferenceInfo] = React.useState("");
  const [fetchState, setFetchState] = React.useState("FETCHING");

  function handleStartDateChange(date) {
    setStartDate(date);
  }

  function handleEndDateChange(date) {
    setEndDate(date);
  }

  function handleDaysChange(event) {
    setDays(Number(event.target.value));
  }

  function handleDescriptionChange(event) {
    setDescription(event.target.value);
  }

  function handleNameChange(event) {
    setName(event.target.value);
  }

  function handleOrganizerChange(event) {
    setOrganizer(event.target.value);
  }

  function handleDestinationsChange(event) {
    setDestinations(
      event.target.value.split(",").map(s => s.replace(/^\s+/, ""))
    );
  }

  function handleCreateNewConferenceSubmission() {
    fetch(`/api/update-conference/${slug}`, {
      url: `/api/update-conference/${slug}`,
      method: "POST",
      headers: {
        "Content-type": "application/json"
      },
      body: JSON.stringify({
        info: {
          name,
          organizer,
          days,
          description,
          earliestStartDate: startDate,
          latestEndDate: endDate,
          locationPreferences: destinations
        }
      })
    })
      .then(r => r.json())
      .then(response => {
        setUpdateSuccess(true);
        setConferenceInfo(response.info);
      })
      .catch(error => {
        alert("Ooops! Something went wrong, can you register again?");
        throw error;
      });
  }

  if (fetchState === "FETCHING") {
    setFetchState("WAITING");
    fetch(`/api/conference-proposal/${slug}`)
      .then(r => r.json())
      .then(res => {
        if (res.status === "err") {
          setFetchState(res.error.code);
        } else {
          setFetchState("FETCHED");
          setName(res.info.conference.name);
          setDescription(res.info.conference.description);
          setOrganizer(res.info.conference.organizer);
          setStartDate(res.info.conference.earliestStartDate);
          setEndDate(res.info.conference.latestEndDate);
          setDays(res.info.conference.days);
          setDestinations(res.info.conference.locationPreferences);
        }
      });
  }

  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      {slug === ":slug" ? (
        <EnterConferenceSlug classes={classes} />
      ) : (
        <GridContainer>
          <GridItem xs={12} sm={12} md={12}>
            {update ? (
              <Card>
                <CardHeader color="success">
                  <h4 className={classes.cardTitleWhite}>
                    Your conference was successfully registered
                  </h4>
                </CardHeader>
                <CardBody>
                  <GridContainer>
                    <GridItem xs={12} sm={12} md={5}>
                      Conference updated! As usual, the conference codeis:{" "}
                      {conferenceInfo.slug}
                      <p>
                        The registration link for your event is
                        <br></br>
                        {window.location.origin +
                          "/admin/register/" +
                          conferenceInfo.slug}
                      </p>
                    </GridItem>
                  </GridContainer>
                </CardBody>
              </Card>
            ) : (
              <Card>
                <CardHeader color="primary">
                  <h4 className={classes.cardTitleWhite}>
                    Update your amazing conference
                  </h4>
                </CardHeader>
                <CardBody>
                  <GridContainer>
                    <GridItem xs={12} sm={12} md={5}>
                      <CustomInput
                        labelText="Conference Name"
                        id="name"
                        formControlProps={{
                          fullWidth: true
                        }}
                        inputProps={{
                          value: name,
                          onChange: handleNameChange
                        }}
                      />
                    </GridItem>
                    <GridItem xs={12} sm={12} md={7}>
                      <CustomInput
                        labelText="Organizer"
                        id="organizer"
                        formControlProps={{
                          fullWidth: true
                        }}
                        inputProps={{
                          value: organizer,
                          onChange: handleOrganizerChange
                        }}
                      />
                    </GridItem>
                  </GridContainer>
                  <GridContainer>
                    <GridItem xs={12} sm={12} md={5}>
                      <FormControl fullWidth>
                        <KeyboardDatePicker
                          id="start-date-picker"
                          label="Earliest Possible Start Date"
                          value={startDate}
                          onChange={handleStartDateChange}
                          KeyboardButtonProps={{
                            "aria-label": "change earliest start date"
                          }}
                        />
                      </FormControl>
                    </GridItem>
                    <GridItem xs={12} sm={12} md={5}>
                      <FormControl fullWidth>
                        <KeyboardDatePicker
                          id="end-date-picker"
                          label="Latest Possible Possible End Date"
                          value={endDate}
                          minDate={dateMax(endDate, addDays(startDate, days))}
                          onChange={handleEndDateChange}
                          KeyboardButtonProps={{
                            "aria-label": "change latest end date"
                          }}
                        />
                      </FormControl>
                    </GridItem>
                    <GridItem xs={12} sm={12} md={2}>
                      <FormControl fullWidth>
                        <TextField
                          id="num-days"
                          label="Duration"
                          value={days}
                          onChange={handleDaysChange}
                        />
                      </FormControl>
                    </GridItem>
                  </GridContainer>
                  <GridContainer>
                    <GridItem xs={12} sm={12} md={12}>
                      <CustomInput
                        labelText="Comma Separated Destinations in Priority Order"
                        id="destinations"
                        formControlProps={{
                          fullWidth: true
                        }}
                        inputProps={{
                          value: destinations.join(", "),
                          onChange: handleDestinationsChange
                        }}
                      />
                    </GridItem>
                  </GridContainer>
                  <GridContainer>
                    <GridItem xs={12} sm={12} md={12}>
                      <CustomInput
                        labelText="Description"
                        id="about-me"
                        formControlProps={{
                          fullWidth: true
                        }}
                        inputProps={{
                          multiline: true,
                          rows: 5,
                          value: description,
                          onChange: handleDescriptionChange
                        }}
                      />
                    </GridItem>
                  </GridContainer>
                </CardBody>
                <CardFooter>
                  <Button
                    color="primary"
                    disabled={
                      !allSet([
                        name,
                        description,
                        organizer,
                        startDate,
                        endDate,
                        days,
                        destinations
                      ])
                    }
                    onClick={handleCreateNewConferenceSubmission}
                  >
                    Update Conference
                  </Button>
                </CardFooter>
              </Card>
            )}
          </GridItem>
        </GridContainer>
      )}
    </MuiPickersUtilsProvider>
  );
}

UpdateConferencePage.propTypes = {
  match: PropTypes.object,
  classes: PropTypes.object
};

export default withStyles(styles)(UpdateConferencePage);
